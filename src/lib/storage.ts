import 'server-only';

import { Octokit } from '@octokit/rest';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { StorageMode } from '@/lib/types';

export interface StoredFile {
  content: string;
  /** null when the local driver is in use (no blob SHAs on disk). */
  sha: string | null;
}

export interface WriteResult {
  ok: boolean;
  message: string;
  ref?: string;
}

const OWNER = process.env.GITHUB_OWNER ?? '';
const REPO = process.env.GITHUB_REPO ?? '';
const BRANCH = process.env.GITHUB_BRANCH || 'main';

/**
 * GitHub when a token + repo coordinates are present, otherwise the local disk.
 * Serverless filesystems are read-only, so production must use GitHub.
 */
export function storageMode(): StorageMode {
  return process.env.GITHUB_TOKEN && OWNER && REPO ? 'github' : 'local';
}

let cachedClient: Octokit | null = null;

function octokit(): Octokit {
  if (!cachedClient) {
    cachedClient = new Octokit({
      auth: process.env.GITHUB_TOKEN,
      userAgent: 'capstone-console',
      request: {
        // Never let a cached response hand us a stale SHA — that causes 409s.
        fetch: (url: string, options: RequestInit) =>
          fetch(url, { ...options, cache: 'no-store' }),
      },
    });
  }
  return cachedClient;
}

function committer() {
  const name = process.env.GIT_COMMITTER_NAME;
  const email = process.env.GIT_COMMITTER_EMAIL;
  if (!name || !email) return undefined;
  return { author: { name, email }, committer: { name, email } };
}

function localPath(repoPath: string): string {
  // Defend against path traversal in case a path ever comes from user input.
  const normalized = path.normalize(repoPath).replace(/^([/\\])+/, '');
  const resolved = path.resolve(process.cwd(), normalized);
  if (!resolved.startsWith(path.resolve(process.cwd()))) {
    throw new Error(`Refusing to touch path outside the repo: ${repoPath}`);
  }
  return resolved;
}

function errorStatus(error: unknown): number | undefined {
  return typeof error === 'object' && error !== null && 'status' in error
    ? (error as { status?: number }).status
    : undefined;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

/**
 * Reads a file. Returns `null` when it does not exist yet — every caller is
 * expected to fall back to an empty state rather than crash.
 */
export async function readFile(repoPath: string): Promise<StoredFile | null> {
  if (storageMode() === 'local') {
    try {
      return { content: await fs.readFile(localPath(repoPath), 'utf8'), sha: null };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  try {
    const response = await octokit().repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: repoPath,
      ref: BRANCH,
    });

    const data = response.data;
    if (Array.isArray(data) || data.type !== 'file' || typeof data.content !== 'string') {
      return null;
    }

    return {
      content: Buffer.from(data.content, 'base64').toString('utf8'),
      sha: data.sha,
    };
  } catch (error) {
    if (errorStatus(error) === 404) return null;
    throw error;
  }
}

/**
 * Creates or updates a file. Fetches the current blob SHA first (GitHub requires
 * it for updates but rejects it for creates), and retries once on a 409/422
 * conflict, which is what you get when the SHA moved under you.
 */
export async function writeFile(
  repoPath: string,
  content: string,
  commitMessage: string,
): Promise<WriteResult> {
  if (storageMode() === 'local') {
    const target = localPath(repoPath);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, content, 'utf8');
    return { ok: true, message: 'Saved to disk', ref: repoPath };
  }

  const attempt = async (): Promise<WriteResult> => {
    const existing = await readFile(repoPath);
    const response = await octokit().repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: repoPath,
      message: commitMessage,
      content: Buffer.from(content, 'utf8').toString('base64'),
      branch: BRANCH,
      ...(existing?.sha ? { sha: existing.sha } : {}),
      ...committer(),
    });
    return {
      ok: true,
      message: 'Committed to GitHub',
      ref: response.data.commit.html_url ?? undefined,
    };
  };

  try {
    return await attempt();
  } catch (error) {
    const status = errorStatus(error);
    if (status === 409 || status === 422) {
      try {
        return await attempt();
      } catch (retryError) {
        return { ok: false, message: `Conflict: ${errorMessage(retryError)}` };
      }
    }
    if (status === 401 || status === 403) {
      return {
        ok: false,
        message: 'GitHub rejected the token. Check the PAT has Contents: Read and write.',
      };
    }
    if (status === 404) {
      return {
        ok: false,
        message: `Repo ${OWNER}/${REPO} (branch ${BRANCH}) not found, or the token cannot see it.`,
      };
    }
    return { ok: false, message: errorMessage(error) };
  }
}
