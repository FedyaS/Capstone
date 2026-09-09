'use server';

import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

import { storageMode, writeFile } from '@/lib/storage';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  normalizePattern,
  safeEqual,
  verifySessionToken,
} from '@/lib/session';
import { PATHS, type ActionResult, type Article, type Phase, type Topic } from '@/lib/types';

/* -------------------------------------------------------------------------- */
/* Auth                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Server Actions are publicly reachable POST endpoints. Middleware already
 * guards them, but every mutating action re-checks the session so a leaked
 * action id can never be used to write to the repo.
 */
async function requireSession(): Promise<void> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!(await verifySessionToken(token))) {
    throw new Error('Not authenticated');
  }
}

const MAX_ATTEMPTS = 8;
const LOCKOUT_MS = 5 * 60 * 1000;
const attempts = new Map<string, { count: number; firstAt: number }>();

async function clientKey(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get('x-forwarded-for');
  return forwarded?.split(',')[0]?.trim() || headerList.get('x-real-ip') || 'local';
}

export async function login(pattern: string): Promise<ActionResult> {
  const expected = normalizePattern(process.env.SECRET_PATTERN ?? '');
  if (!expected) {
    return { ok: false, message: 'SECRET_PATTERN is not set on the server.' };
  }

  const key = await clientKey();
  const now = Date.now();
  const record = attempts.get(key);

  if (record && now - record.firstAt > LOCKOUT_MS) {
    attempts.delete(key);
  } else if (record && record.count >= MAX_ATTEMPTS) {
    const waitSeconds = Math.ceil((LOCKOUT_MS - (now - record.firstAt)) / 1000);
    return { ok: false, message: `Too many attempts. Try again in ${waitSeconds}s.` };
  }

  const supplied = normalizePattern(pattern);
  if (supplied.length < 7 || !safeEqual(supplied, expected)) {
    const current = attempts.get(key);
    attempts.set(key, {
      count: (current?.count ?? 0) + 1,
      firstAt: current?.firstAt ?? now,
    });
    // Blunt the timing signal a brute-forcer could read off the response.
    await new Promise((resolve) => setTimeout(resolve, 350));
    return { ok: false, message: 'Incorrect pattern.' };
  }

  attempts.delete(key);
  (await cookies()).set(SESSION_COOKIE, await createSessionToken(), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  return { ok: true, message: 'Unlocked' };
}

export async function logout(): Promise<void> {
  (await cookies()).delete(SESSION_COOKIE);
  revalidatePath('/', 'layout');
  // Redirecting from the action makes the client router follow it immediately,
  // instead of leaving a stale authenticated-looking page on screen.
  redirect('/login');
}

/* -------------------------------------------------------------------------- */
/* The one write primitive                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The single door to the "database". Resolves the current SHA for updates,
 * creates the file when it does not exist, and never throws at the caller —
 * failures come back as `{ ok: false, message }` so the UI can surface them.
 */
export async function commitToGitHub(
  path: string,
  content: string,
  commitMessage: string,
): Promise<ActionResult> {
  await requireSession();

  try {
    const result = await writeFile(path, content, commitMessage);
    if (result.ok) {
      revalidatePath('/', 'layout');
    }
    return {
      ok: result.ok,
      message: result.ok
        ? storageMode() === 'github'
          ? 'Committed to GitHub'
          : 'Saved to ./data'
        : result.message,
      ref: result.ref,
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Unknown error while saving',
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Typed wrappers — the forms call these, never `commitToGitHub` directly     */
/* -------------------------------------------------------------------------- */

const stamp = () => new Date().toISOString().replace('T', ' ').slice(0, 16);

export async function saveProblemStatement(markdown: string): Promise<ActionResult> {
  return commitToGitHub(PATHS.problem, markdown, `docs: update problem statement (${stamp()})`);
}

export async function saveNotes(markdown: string): Promise<ActionResult> {
  return commitToGitHub(PATHS.notes, markdown, `notes: update AI scratchpad (${stamp()})`);
}

export async function saveArticles(articles: Article[]): Promise<ActionResult> {
  return commitToGitHub(
    PATHS.articles,
    `${JSON.stringify(articles, null, 2)}\n`,
    `data: update articles (${articles.length} entries)`,
  );
}

export async function saveTopics(topics: Topic[]): Promise<ActionResult> {
  return commitToGitHub(
    PATHS.topics,
    `${JSON.stringify(topics, null, 2)}\n`,
    `data: update topics (${topics.length} entries)`,
  );
}

export async function saveTimeline(phases: Phase[]): Promise<ActionResult> {
  const done = phases.filter((phase) => phase.status === 'DONE').length;
  return commitToGitHub(
    PATHS.timeline,
    `${JSON.stringify(phases, null, 2)}\n`,
    `data: update timeline (${done}/${phases.length} phases done)`,
  );
}
