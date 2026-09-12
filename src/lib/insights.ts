/**
 * Schema + parser for the AI-managed Insights board (data/insights.json).
 *
 * This file must stay dependency-free and use only erasable TypeScript syntax
 * (no enums, no namespaces, type-only imports) so that `npm run insights:check`
 * can run it directly with Node's type stripping. The editor-side mirror of
 * these rules is data/insights.schema.json — keep the two in sync.
 */

export const ACCENTS = ['cyan', 'emerald', 'amber', 'purple', 'sky', 'rose', 'slate'] as const;
export type Accent = (typeof ACCENTS)[number];

export const LEVELS = ['high', 'medium', 'low'] as const;
export type Level = (typeof LEVELS)[number];

export const CALLOUT_TONES = ['insight', 'info', 'success', 'warning', 'danger'] as const;
export type CalloutTone = (typeof CALLOUT_TONES)[number];

export const ACTION_KINDS = ['todo', 'question', 'risk'] as const;
export type ActionKind = (typeof ACTION_KINDS)[number];

export const BLOCK_TYPES = [
  'stats',
  'takeaways',
  'pipeline',
  'compare',
  'timeline',
  'bars',
  'concepts',
  'callout',
  'actions',
  'sources',
  'markdown',
] as const;
export type BlockType = (typeof BLOCK_TYPES)[number];

interface BlockBase {
  id: string;
  title: string;
  subtitle: string;
  /** `half` blocks pair up side by side on wide screens. */
  span: 'full' | 'half';
  accent: Accent;
}

export interface StatItem {
  value: string;
  label: string;
  hint: string;
  accent: Accent | null;
}

export interface TakeawayItem {
  title: string;
  /** Markdown. */
  body: string;
  importance: Level;
  /** 0-100, or null when not stated. */
  confidence: number | null;
  sources: string[];
  tags: string[];
}

export interface PipelineStep {
  label: string;
  detail: string;
}

export interface CompareRow {
  label: string;
  values: string[];
}

export interface TimelineEvent {
  date: string;
  title: string;
  detail: string;
}

export interface BarItem {
  label: string;
  value: number;
  note: string;
}

export interface ConceptItem {
  term: string;
  definition: string;
}

export interface ActionItem {
  text: string;
  detail: string;
  kind: ActionKind;
  priority: Level;
  done: boolean;
}

export interface SourceItem {
  ref: string;
  takeaway: string;
  /** 0-10, or null when not stated. */
  relevance: number | null;
}

export type Block =
  | (BlockBase & { type: 'stats'; items: StatItem[] })
  | (BlockBase & { type: 'takeaways'; items: TakeawayItem[] })
  | (BlockBase & { type: 'pipeline'; steps: PipelineStep[] })
  | (BlockBase & { type: 'compare'; columns: string[]; rows: CompareRow[]; highlight: number | null })
  | (BlockBase & { type: 'timeline'; events: TimelineEvent[] })
  | (BlockBase & { type: 'bars'; items: BarItem[]; unit: string; max: number | null })
  | (BlockBase & { type: 'concepts'; items: ConceptItem[] })
  | (BlockBase & { type: 'callout'; tone: CalloutTone; body: string })
  | (BlockBase & { type: 'actions'; items: ActionItem[] })
  | (BlockBase & { type: 'sources'; items: SourceItem[] })
  | (BlockBase & { type: 'markdown'; body: string });

export interface ChangeEntry {
  date: string;
  note: string;
}

export interface InsightsDoc {
  updatedAt: string;
  headline: string;
  summary: string;
  focus: string[];
  blocks: Block[];
  changelog: ChangeEntry[];
}

export interface ParseResult {
  doc: InsightsDoc;
  /** Human-readable problems. Invalid blocks/items are skipped, never fatal. */
  issues: string[];
}

export interface KnownRefs {
  articleIds?: Iterable<string>;
  topicIds?: Iterable<string>;
}

export const EMPTY_INSIGHTS: InsightsDoc = {
  updatedAt: '',
  headline: '',
  summary: '',
  focus: [],
  blocks: [],
  changelog: [],
};

/** Refs that always resolve, besides article/topic ids and http(s) URLs. */
export const BUILTIN_REFS = ['scratchpad', 'problem'] as const;

// --------------------------------------------------------------------------- //

type Obj = Record<string, unknown>;

const isObj = (value: unknown): value is Obj =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const text = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';

const strings = (value: unknown): string[] =>
  Array.isArray(value) ? value.map(text).filter(Boolean) : [];

function oneOf<T extends string>(allowed: readonly T[], value: unknown, fallback: T): T {
  const v = text(value).toLowerCase();
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function num(value: unknown, min: number, max: number): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.min(max, Math.max(min, n));
}

/**
 * Validates and normalises raw JSON. Lenient by design: anything salvageable is
 * kept, anything broken is skipped and reported in `issues` so the UI and the
 * check script can point at it.
 */
export function parseInsights(raw: unknown, known: KnownRefs = {}): ParseResult {
  const issues: string[] = [];

  if (raw === null || raw === undefined) return { doc: EMPTY_INSIGHTS, issues };
  if (!isObj(raw)) {
    return { doc: EMPTY_INSIGHTS, issues: ['Top level must be a JSON object.'] };
  }

  const articleIds = new Set(known.articleIds ?? []);
  const topicIds = new Set(known.topicIds ?? []);
  const checkRefs = articleIds.size > 0 || topicIds.size > 0;

  const checkRef = (ref: string, where: string) => {
    if (!checkRefs) return;
    if (/^https?:\/\//i.test(ref)) return;
    if ((BUILTIN_REFS as readonly string[]).includes(ref)) return;
    if (articleIds.has(ref) || topicIds.has(ref)) return;
    issues.push(`${where}: source "${ref}" is not an article id, topic id, URL, "scratchpad" or "problem".`);
  };

  const seenIds = new Set<string>();
  const blocks: Block[] = [];

  const rawBlocks = Array.isArray(raw.blocks) ? raw.blocks : [];
  if (raw.blocks !== undefined && !Array.isArray(raw.blocks)) issues.push('"blocks" must be an array.');

  rawBlocks.forEach((entry, index) => {
    const where = `blocks[${index}]`;
    if (!isObj(entry)) {
      issues.push(`${where}: must be an object.`);
      return;
    }

    const type = text(entry.type) as BlockType;
    if (!(BLOCK_TYPES as readonly string[]).includes(type)) {
      issues.push(`${where}: unknown type "${text(entry.type)}". Use one of: ${BLOCK_TYPES.join(', ')}.`);
      return;
    }

    let id = text(entry.id) || `${type}-${index}`;
    if (seenIds.has(id)) {
      issues.push(`${where}: duplicate id "${id}".`);
      id = `${id}-${index}`;
    }
    seenIds.add(id);

    const label = `${where} (${type} "${id}")`;
    const base: BlockBase = {
      id,
      title: text(entry.title),
      subtitle: text(entry.subtitle),
      span: text(entry.span) === 'half' ? 'half' : 'full',
      accent: oneOf(ACCENTS, entry.accent, 'cyan'),
    };

    /** Maps an array field, dropping entries that fail `pick` and reporting them. */
    function list<T>(field: string, pick: (item: Obj, at: string) => T | null): T[] {
      const value = entry[field];
      if (!Array.isArray(value)) {
        issues.push(`${label}: "${field}" must be an array.`);
        return [];
      }
      const out: T[] = [];
      value.forEach((item, i) => {
        const at = `${label}.${field}[${i}]`;
        const picked = isObj(item) ? pick(item, at) : null;
        if (picked === null) issues.push(`${at}: skipped — missing required fields.`);
        else out.push(picked);
      });
      return out;
    }

    const requireSome = (count: number, field: string) => {
      if (count > 0) return true;
      issues.push(`${label}: skipped — "${field}" has no valid entries.`);
      return false;
    };

    switch (type) {
      case 'stats': {
        const items = list('items', (item) => {
          const value = text(item.value);
          const itemLabel = text(item.label);
          if (!value || !itemLabel) return null;
          const accent = text(item.accent) ? oneOf(ACCENTS, item.accent, base.accent) : null;
          return { value, label: itemLabel, hint: text(item.hint), accent };
        });
        if (requireSome(items.length, 'items')) blocks.push({ ...base, type, items });
        break;
      }

      case 'takeaways': {
        const items = list('items', (item, at) => {
          const title = text(item.title);
          if (!title) return null;
          const sources = strings(item.sources);
          sources.forEach((ref) => checkRef(ref, at));
          return {
            title,
            body: text(item.body),
            importance: oneOf(LEVELS, item.importance, 'medium'),
            confidence: num(item.confidence, 0, 100),
            sources,
            tags: strings(item.tags),
          };
        });
        if (requireSome(items.length, 'items')) blocks.push({ ...base, type, items });
        break;
      }

      case 'pipeline': {
        const steps = list('steps', (item) => {
          const stepLabel = text(item.label);
          return stepLabel ? { label: stepLabel, detail: text(item.detail) } : null;
        });
        if (requireSome(steps.length, 'steps')) blocks.push({ ...base, type, steps });
        break;
      }

      case 'compare': {
        const columns = strings(entry.columns);
        if (columns.length < 2) {
          issues.push(`${label}: skipped — "columns" needs at least 2 names.`);
          break;
        }
        const rows = list('rows', (item, at) => {
          const rowLabel = text(item.label);
          if (!rowLabel || !Array.isArray(item.values)) return null;
          const values = item.values.map(text);
          if (values.length !== columns.length) {
            issues.push(`${at}: has ${values.length} values but there are ${columns.length} columns.`);
          }
          return { label: rowLabel, values: columns.map((_, c) => values[c] ?? '') };
        });
        const highlight = num(entry.highlight, 0, columns.length - 1);
        if (requireSome(rows.length, 'rows')) {
          blocks.push({
            ...base,
            type,
            columns,
            rows,
            highlight: highlight === null ? null : Math.round(highlight),
          });
        }
        break;
      }

      case 'timeline': {
        const events = list('events', (item) => {
          const date = text(item.date);
          const title = text(item.title);
          return date && title ? { date, title, detail: text(item.detail) } : null;
        });
        if (requireSome(events.length, 'events')) blocks.push({ ...base, type, events });
        break;
      }

      case 'bars': {
        const items = list('items', (item) => {
          const barLabel = text(item.label);
          const value = num(item.value, 0, Number.MAX_SAFE_INTEGER);
          return barLabel && value !== null ? { label: barLabel, value, note: text(item.note) } : null;
        });
        if (requireSome(items.length, 'items')) {
          blocks.push({
            ...base,
            type,
            items,
            unit: text(entry.unit),
            max: num(entry.max, 0, Number.MAX_SAFE_INTEGER),
          });
        }
        break;
      }

      case 'concepts': {
        const items = list('items', (item) => {
          const term = text(item.term);
          const definition = text(item.definition);
          return term && definition ? { term, definition } : null;
        });
        if (requireSome(items.length, 'items')) blocks.push({ ...base, type, items });
        break;
      }

      case 'callout': {
        const body = text(entry.body);
        if (!body) {
          issues.push(`${label}: skipped — "body" is empty.`);
          break;
        }
        blocks.push({ ...base, type, tone: oneOf(CALLOUT_TONES, entry.tone, 'insight'), body });
        break;
      }

      case 'actions': {
        const items = list('items', (item) => {
          const actionText = text(item.text);
          if (!actionText) return null;
          return {
            text: actionText,
            detail: text(item.detail),
            kind: oneOf(ACTION_KINDS, item.kind, 'todo'),
            priority: oneOf(LEVELS, item.priority, 'medium'),
            done: item.done === true,
          };
        });
        if (requireSome(items.length, 'items')) blocks.push({ ...base, type, items });
        break;
      }

      case 'sources': {
        const items = list('items', (item, at) => {
          const ref = text(item.ref);
          if (!ref) return null;
          checkRef(ref, at);
          return { ref, takeaway: text(item.takeaway), relevance: num(item.relevance, 0, 10) };
        });
        if (requireSome(items.length, 'items')) blocks.push({ ...base, type, items });
        break;
      }

      case 'markdown': {
        const body = text(entry.body);
        if (!body) {
          issues.push(`${label}: skipped — "body" is empty.`);
          break;
        }
        blocks.push({ ...base, type, body });
        break;
      }
    }
  });

  const changelog = (Array.isArray(raw.changelog) ? raw.changelog : [])
    .filter(isObj)
    .map((entry) => ({ date: text(entry.date), note: text(entry.note) }))
    .filter((entry) => entry.note);

  const updatedAt = text(raw.updatedAt);
  if (updatedAt && Number.isNaN(Date.parse(updatedAt))) {
    issues.push(`"updatedAt" is not a valid ISO date: "${updatedAt}".`);
  }

  return {
    doc: {
      updatedAt,
      headline: text(raw.headline),
      summary: text(raw.summary),
      focus: strings(raw.focus),
      blocks,
      changelog,
    },
    issues,
  };
}
