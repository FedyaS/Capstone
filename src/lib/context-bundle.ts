import {
  ARTICLE_STATUS_META,
  TOPIC_STATUS_META,
  type Article,
  type Phase,
  type Topic,
} from '@/lib/types';

interface BundleInput {
  problemStatement: string;
  articles: Article[];
  topics: Topic[];
  notes?: string;
  phases?: Phase[];
}

/**
 * Flattens the whole knowledge base into one paste-ready block for an LLM.
 * Pure + isomorphic so the client can rebuild it from unsaved editor state.
 */
export function buildContextBundle({
  problemStatement,
  articles,
  topics,
  notes,
  phases,
}: BundleInput): string {
  const lines: string[] = [];

  lines.push('# CAPSTONE CONTEXT PACK');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push('## 1. Problem statement');
  lines.push('');
  lines.push(problemStatement.trim() || '_(not written yet)_');
  lines.push('');

  if (phases?.length) {
    const active = phases.filter((p) => p.status === 'ACTIVE').map((p) => p.title);
    const done = phases.filter((p) => p.status === 'DONE').map((p) => p.title);
    lines.push('## 2. Progress');
    lines.push('');
    lines.push(`- Completed phases: ${done.length ? done.join(', ') : 'none'}`);
    lines.push(`- Currently working on: ${active.length ? active.join(', ') : 'nothing marked active'}`);
    lines.push('');
  }

  lines.push('## 3. Topics I need to understand');
  lines.push('');
  if (topics.length === 0) {
    lines.push('_(none logged yet)_');
  } else {
    const ordered = [...topics].sort((a, b) => b.usefulness - a.usefulness);
    for (const topic of ordered) {
      const meta = TOPIC_STATUS_META[topic.status];
      lines.push(`- **${topic.name}** — ${meta.label} · importance ${topic.usefulness}/10`);
      if (topic.tags.length) lines.push(`  - tags: ${topic.tags.join(', ')}`);
      if (topic.notes.trim()) lines.push(`  - notes: ${topic.notes.trim().replace(/\n+/g, ' ')}`);
    }
    const gaps = ordered.filter((t) => t.status !== 'UNDERSTAND').map((t) => t.name);
    if (gaps.length) {
      lines.push('');
      lines.push(`> Open knowledge gaps: ${gaps.join(', ')}`);
    }
  }
  lines.push('');

  lines.push('## 4. Sources');
  lines.push('');
  if (articles.length === 0) {
    lines.push('_(none logged yet)_');
  } else {
    const ordered = [...articles].sort((a, b) => b.usefulness - a.usefulness);
    for (const article of ordered) {
      const meta = ARTICLE_STATUS_META[article.status];
      lines.push(`- **${article.title}** — ${meta.label} · usefulness ${article.usefulness}/10`);
      if (article.url) lines.push(`  - ${article.url}`);
      if (article.tags.length) lines.push(`  - tags: ${article.tags.join(', ')}`);
      if (article.notes.trim()) lines.push(`  - notes: ${article.notes.trim().replace(/\n+/g, ' ')}`);
    }
  }
  lines.push('');

  if (notes?.trim()) {
    lines.push('## 5. Working notes');
    lines.push('');
    lines.push(notes.trim());
    lines.push('');
  }

  return lines.join('\n');
}
