import 'server-only';

import { readFile } from '@/lib/storage';
import {
  ARTICLE_STATUSES,
  DEFAULT_PHASES,
  PATHS,
  PHASE_STATUSES,
  TOPIC_STATUSES,
  type Article,
  type Phase,
  type Topic,
} from '@/lib/types';

/**
 * Every loader below is total: a missing file, empty file or malformed JSON all
 * collapse into a sensible empty state instead of a 500. The UI then renders an
 * empty state and the first save creates the file.
 */

async function readJson<T>(path: string, fallback: T): Promise<T> {
  const file = await readFile(path);
  if (!file || !file.content.trim()) return fallback;
  try {
    return JSON.parse(file.content) as T;
  } catch {
    console.warn(`[data] ${path} is not valid JSON — falling back to empty state.`);
    return fallback;
  }
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function score(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(0, Math.round(n)));
}

function tags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((t): t is string => typeof t === 'string');
}

function id(value: unknown): string {
  return str(value) || `id_${Math.random().toString(36).slice(2, 10)}`;
}

export async function loadArticles(): Promise<Article[]> {
  const raw = await readJson<unknown>(PATHS.articles, []);
  if (!Array.isArray(raw)) return [];

  return raw.map((entry): Article => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const status = str(item.status).toUpperCase();
    return {
      id: id(item.id),
      url: str(item.url),
      title: str(item.title) || str(item.url) || 'Untitled',
      status: (ARTICLE_STATUSES as readonly string[]).includes(status)
        ? (status as Article['status'])
        : 'NEW',
      usefulness: score(item.usefulness),
      tags: tags(item.tags),
      notes: str(item.notes),
      createdAt: str(item.createdAt, new Date(0).toISOString()),
      updatedAt: str(item.updatedAt, str(item.createdAt, new Date(0).toISOString())),
    };
  });
}

export async function loadTopics(): Promise<Topic[]> {
  const raw = await readJson<unknown>(PATHS.topics, []);
  if (!Array.isArray(raw)) return [];

  return raw.map((entry): Topic => {
    const item = (entry ?? {}) as Record<string, unknown>;
    const status = str(item.status).toUpperCase();
    return {
      id: id(item.id),
      name: str(item.name) || 'Untitled topic',
      status: (TOPIC_STATUSES as readonly string[]).includes(status)
        ? (status as Topic['status'])
        : 'DONT_UNDERSTAND',
      usefulness: score(item.usefulness),
      tags: tags(item.tags),
      notes: str(item.notes),
      createdAt: str(item.createdAt, new Date(0).toISOString()),
      updatedAt: str(item.updatedAt, str(item.createdAt, new Date(0).toISOString())),
    };
  });
}

export async function loadTimeline(): Promise<Phase[]> {
  const raw = await readJson<unknown>(PATHS.timeline, null);
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_PHASES;

  // Keep the canonical phase list authoritative; only statuses are user data.
  const saved = new Map(
    raw
      .filter((entry): entry is Record<string, unknown> => typeof entry === 'object' && entry !== null)
      .map((entry) => [str(entry.id), entry]),
  );

  return DEFAULT_PHASES.map((phase) => {
    const match = saved.get(phase.id);
    const status = str(match?.status).toUpperCase();
    return {
      ...phase,
      status: (PHASE_STATUSES as readonly string[]).includes(status)
        ? (status as Phase['status'])
        : phase.status,
      updatedAt: str(match?.updatedAt),
    };
  });
}

export async function loadProblemStatement(): Promise<string> {
  const file = await readFile(PATHS.problem);
  return file?.content ?? '';
}

export async function loadNotes(): Promise<string> {
  const file = await readFile(PATHS.notes);
  return file?.content ?? '';
}
