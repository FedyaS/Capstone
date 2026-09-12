/**
 * Validates data/insights.json with the same parser the app uses.
 * Run: npm run insights:check   (exit code 1 when there are problems)
 */
import { readFileSync } from 'node:fs';

import { parseInsights } from '../src/lib/insights.ts';

function readJson(path: string, fallback: unknown): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return fallback;
    throw new Error(`${path}: ${(error as Error).message}`);
  }
}

const ids = (list: unknown): string[] =>
  Array.isArray(list) ? list.map((item) => String((item as { id?: unknown })?.id ?? '')) : [];

let raw: unknown;
try {
  raw = readJson('data/insights.json', null);
} catch (error) {
  console.error(`✖ Invalid JSON — ${(error as Error).message}`);
  process.exit(1);
}

const { doc, issues } = parseInsights(raw, {
  articleIds: ids(readJson('data/articles.json', [])),
  topicIds: ids(readJson('data/topics.json', [])),
});

if (!doc.headline) issues.unshift('"headline" is empty — the hero will not render.');

if (issues.length) {
  console.error(`✖ ${issues.length} problem(s) in data/insights.json:\n`);
  for (const issue of issues) console.error(`  • ${issue}`);
  process.exit(1);
}

const counts = doc.blocks.reduce<Record<string, number>>((acc, block) => {
  acc[block.type] = (acc[block.type] ?? 0) + 1;
  return acc;
}, {});
console.log(
  `✔ data/insights.json is valid — ${doc.blocks.length} blocks (${Object.entries(counts)
    .map(([type, n]) => `${n} ${type}`)
    .join(', ')}).`,
);
