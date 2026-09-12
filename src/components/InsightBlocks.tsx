import Link from 'next/link';

import { Markdown } from '@/components/Markdown';
import type {
  Accent,
  ActionKind,
  Block,
  CalloutTone,
  Level,
} from '@/lib/insights';

/**
 * One renderer per block type in data/insights.json. Every Tailwind class is
 * spelled out in full (no string building) so the JIT compiler can see it.
 */

// --------------------------------------------------------------------------- //
// Palette

const ACCENT: Record<
  Accent,
  { text: string; soft: string; ring: string; fill: string; glow: string; edge: string }
> = {
  cyan: {
    text: 'text-cyan-300',
    soft: 'bg-cyan-500/10',
    ring: 'ring-cyan-400/40',
    fill: 'bg-cyan-400',
    glow: 'via-cyan-400/60',
    edge: 'border-l-cyan-400/70',
  },
  emerald: {
    text: 'text-emerald-300',
    soft: 'bg-emerald-500/10',
    ring: 'ring-emerald-400/40',
    fill: 'bg-emerald-400',
    glow: 'via-emerald-400/60',
    edge: 'border-l-emerald-400/70',
  },
  amber: {
    text: 'text-amber-300',
    soft: 'bg-amber-500/10',
    ring: 'ring-amber-400/40',
    fill: 'bg-amber-400',
    glow: 'via-amber-400/60',
    edge: 'border-l-amber-400/70',
  },
  purple: {
    text: 'text-purple-300',
    soft: 'bg-purple-500/10',
    ring: 'ring-purple-400/40',
    fill: 'bg-purple-400',
    glow: 'via-purple-400/60',
    edge: 'border-l-purple-400/70',
  },
  sky: {
    text: 'text-sky-300',
    soft: 'bg-sky-500/10',
    ring: 'ring-sky-400/40',
    fill: 'bg-sky-400',
    glow: 'via-sky-400/60',
    edge: 'border-l-sky-400/70',
  },
  rose: {
    text: 'text-rose-300',
    soft: 'bg-rose-500/10',
    ring: 'ring-rose-400/40',
    fill: 'bg-rose-400',
    glow: 'via-rose-400/60',
    edge: 'border-l-rose-400/70',
  },
  slate: {
    text: 'text-slate-300',
    soft: 'bg-slate-500/10',
    ring: 'ring-slate-400/40',
    fill: 'bg-slate-400',
    glow: 'via-slate-400/50',
    edge: 'border-l-slate-400/70',
  },
};

const LEVEL_META: Record<Level, { label: string; pips: number; badge: string }> = {
  high: { label: 'High', pips: 3, badge: 'bg-rose-500/10 text-rose-300 ring-rose-400/30' },
  medium: { label: 'Med', pips: 2, badge: 'bg-amber-500/10 text-amber-300 ring-amber-400/30' },
  low: { label: 'Low', pips: 1, badge: 'bg-slate-500/10 text-slate-400 ring-slate-500/30' },
};

const TONE_META: Record<CalloutTone, { accent: Accent; label: string; box: string }> = {
  insight: { accent: 'cyan', label: 'Insight', box: 'border-cyan-400/25 from-cyan-500/[0.12]' },
  info: { accent: 'sky', label: 'Note', box: 'border-sky-400/25 from-sky-500/[0.12]' },
  success: { accent: 'emerald', label: 'Confirmed', box: 'border-emerald-400/25 from-emerald-500/[0.12]' },
  warning: { accent: 'amber', label: 'Caution', box: 'border-amber-400/25 from-amber-500/[0.12]' },
  danger: { accent: 'rose', label: 'Critical', box: 'border-rose-400/25 from-rose-500/[0.12]' },
};

const ACTION_META: Record<ActionKind, { label: string; color: string }> = {
  todo: { label: 'Next step', color: 'text-cyan-300' },
  question: { label: 'Open question', color: 'text-purple-300' },
  risk: { label: 'Risk', color: 'text-amber-300' },
};

// --------------------------------------------------------------------------- //
// Sources

export interface SourceInfo {
  label: string;
  href: string;
  external: boolean;
  kind: 'article' | 'topic' | 'note' | 'web' | 'unknown';
}

/** Built by the page from articles.json / topics.json, keyed by ref. */
export type SourceIndex = Record<string, SourceInfo>;

export function resolveSource(ref: string, index: SourceIndex): SourceInfo {
  if (index[ref]) return index[ref];
  if (/^https?:\/\//i.test(ref)) {
    let host = ref;
    try {
      host = new URL(ref).hostname.replace(/^www\./, '');
    } catch {
      /* keep the raw ref */
    }
    return { label: host, href: ref, external: true, kind: 'web' };
  }
  return { label: ref, href: '', external: false, kind: 'unknown' };
}

const KIND_GLYPH: Record<SourceInfo['kind'], string> = {
  article: '¶',
  topic: '◆',
  note: '✎',
  web: '↗',
  unknown: '?',
};

function SourceChip({ refId, index }: { refId: string; index: SourceIndex }) {
  const source = resolveSource(refId, index);
  const body = (
    <>
      <span className="text-slate-500">{KIND_GLYPH[source.kind]}</span>
      <span className="max-w-[16rem] truncate">{source.label}</span>
    </>
  );
  const className =
    'inline-flex items-center gap-1.5 rounded-full bg-slate-800/60 px-2.5 py-1 font-mono text-[11px] text-slate-400 ring-1 ring-inset ring-slate-700/70';

  if (!source.href) return <span className={className}>{body}</span>;
  if (source.external) {
    return (
      <a href={source.href} target="_blank" rel="noopener noreferrer" className={`${className} transition hover:text-slate-200`}>
        {body}
      </a>
    );
  }
  return (
    <Link href={source.href} className={`${className} transition hover:text-slate-200`}>
      {body}
    </Link>
  );
}

// --------------------------------------------------------------------------- //
// Shared pieces

function Meter({ value, max, accent }: { value: number; max: number; accent: Accent }) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-slate-800/80">
      <div
        className={`h-full origin-left animate-grow-x rounded-full motion-reduce:animate-none ${ACCENT[accent].fill}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function Pips({ filled, total, accent }: { filled: number; total: number; accent: Accent }) {
  return (
    <span className="inline-flex gap-[2px]" aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={`h-1.5 w-2.5 rounded-sm ${i < filled ? ACCENT[accent].fill : 'bg-slate-700/70'}`}
        />
      ))}
    </span>
  );
}

function BlockHeader({ block, aside }: { block: Block; aside?: React.ReactNode }) {
  if (!block.title && !block.subtitle && !aside) return null;
  return (
    <header className="mb-5 flex items-start justify-between gap-4">
      <div className="min-w-0">
        {block.title && (
          <div className="flex items-center gap-2.5">
            <span className={`h-2 w-2 shrink-0 rounded-full ${ACCENT[block.accent].fill}`} />
            <h2 className="font-serif text-xl font-semibold text-slate-100">{block.title}</h2>
          </div>
        )}
        {block.subtitle && (
          <p className={`mt-1 text-sm text-slate-500 ${block.title ? 'pl-[18px]' : ''}`}>{block.subtitle}</p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}

function Frame({ block, children, aside }: { block: Block; children: React.ReactNode; aside?: React.ReactNode }) {
  return (
    <div className="card relative h-full overflow-hidden p-5 sm:p-6">
      <span
        aria-hidden
        className={`pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent to-transparent ${ACCENT[block.accent].glow}`}
      />
      <BlockHeader block={block} aside={aside} />
      {children}
    </div>
  );
}

// --------------------------------------------------------------------------- //
// Blocks

type Of<T extends Block['type']> = Extract<Block, { type: T }>;

const STAT_COLS: Record<number, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
};

function StatsBlock({ block }: { block: Of<'stats'> }) {
  const cols = block.span === 'half' ? 'sm:grid-cols-2' : STAT_COLS[Math.min(4, block.items.length)];
  return (
    <div>
      {(block.title || block.subtitle) && (
        <div className="mb-3">
          <BlockHeader block={block} />
        </div>
      )}
      <div className={`grid grid-cols-2 gap-3 ${cols}`}>
        {block.items.map((item, i) => {
          const accent = ACCENT[item.accent ?? block.accent];
          return (
            <div key={i} className="card relative overflow-hidden p-4">
              <span aria-hidden className={`absolute inset-x-0 top-0 h-0.5 ${accent.fill}`} />
              <span
                aria-hidden
                className={`pointer-events-none absolute -right-8 -top-8 h-20 w-20 rounded-full blur-2xl ${accent.soft}`}
              />
              <div className="relative">
                <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  {item.label}
                </div>
                <div className="mt-2 break-words text-3xl font-semibold tracking-tight text-slate-50">
                  {item.value}
                </div>
                {item.hint && <div className="mt-1 text-xs leading-snug text-slate-500">{item.hint}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TakeawaysBlock({ block, sources }: { block: Of<'takeaways'>; sources: SourceIndex }) {
  const accent = ACCENT[block.accent];
  return (
    <Frame block={block}>
      <div className={`grid gap-3 ${block.span === 'full' ? 'sm:grid-cols-2' : ''}`}>
        {block.items.map((item, i) => {
          const level = LEVEL_META[item.importance];
          const high = item.importance === 'high';
          return (
            <article
              key={i}
              className={`flex flex-col rounded-xl border border-l-2 border-slate-800 p-4 ${
                high ? `${accent.edge} ${accent.soft}` : 'border-l-slate-700 bg-slate-950/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-serif text-[1.05rem] font-semibold leading-snug text-slate-100">
                  {item.title}
                </h3>
                <span className="mt-1 flex shrink-0 items-center gap-1.5" title={`Importance: ${item.importance}`}>
                  <Pips filled={level.pips} total={3} accent={block.accent} />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                    {level.label}
                  </span>
                </span>
              </div>

              {item.body && (
                <div className="mt-2">
                  <Markdown className="md-compact">{item.body}</Markdown>
                </div>
              )}

              <div className="mt-auto space-y-3 pt-3">
                {item.confidence !== null && (
                  <div>
                    <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-wider text-slate-500">
                      <span>Confidence</span>
                      <span className="text-slate-400">{Math.round(item.confidence)}%</span>
                    </div>
                    <Meter value={item.confidence} max={100} accent={block.accent} />
                  </div>
                )}
                {(item.sources.length > 0 || item.tags.length > 0) && (
                  <div className="flex flex-wrap gap-1.5">
                    {item.sources.map((ref) => (
                      <SourceChip key={ref} refId={ref} index={sources} />
                    ))}
                    {item.tags.map((tag) => (
                      <span key={tag} className={`rounded-full px-2.5 py-1 font-mono text-[11px] ${accent.soft} ${accent.text}`}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </Frame>
  );
}

function PipelineBlock({ block }: { block: Of<'pipeline'> }) {
  const accent = ACCENT[block.accent];
  // Horizontal only when the block has the full row; half blocks stay vertical.
  const horizontal = block.span === 'full' && block.steps.length <= 6;
  const last = block.steps.length - 1;

  return (
    <Frame block={block}>
      <ol className={`grid gap-4 ${horizontal ? 'md:auto-cols-fr md:grid-flow-col md:gap-3' : ''}`}>
        {block.steps.map((step, i) => (
          <li key={i} className={`relative flex gap-3 ${horizontal ? 'md:flex-col' : ''}`}>
            {i < last && (
              <span
                aria-hidden
                className={`absolute -bottom-3 left-4 top-10 w-px bg-gradient-to-b from-slate-600 to-slate-800 ${
                  horizontal
                    ? 'md:-right-2 md:bottom-auto md:left-11 md:top-4 md:h-px md:w-auto md:bg-gradient-to-r'
                    : ''
                }`}
              />
            )}
            <span
              className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-950 font-mono text-xs font-semibold ring-1 ${accent.ring} ${accent.text}`}
            >
              {i + 1}
            </span>
            <div className="min-w-0 pt-1 md:pt-0">
              <div className="text-sm font-semibold text-slate-100">{step.label}</div>
              {step.detail && <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{step.detail}</p>}
            </div>
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function CompareBlock({ block }: { block: Of<'compare'> }) {
  const accent = ACCENT[block.accent];
  const hl = (c: number) => (block.highlight === c ? accent.soft : '');
  return (
    <Frame block={block}>
      <div className="-mx-1 overflow-x-auto px-1">
        <table className="w-full min-w-[28rem] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="w-[28%] border-b border-slate-800 pb-3" />
              {block.columns.map((column, c) => (
                <th
                  key={c}
                  className={`rounded-t-lg border-b border-slate-800 px-3 pb-3 pt-2 text-left align-bottom font-serif text-base font-semibold ${
                    block.highlight === c ? `${accent.text} ${accent.soft}` : 'text-slate-100'
                  }`}
                >
                  {block.highlight === c && (
                    <span className="mb-1 block font-mono text-[9px] font-normal uppercase tracking-[0.16em]">
                      ★ Recommended
                    </span>
                  )}
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, r) => (
              <tr key={r}>
                <th className="border-b border-slate-800/60 py-3 pr-3 text-left align-top font-mono text-[11px] font-normal uppercase tracking-wider text-slate-500">
                  {row.label}
                </th>
                {row.values.map((value, c) => (
                  <td
                    key={c}
                    className={`border-b border-slate-800/60 px-3 py-3 align-top leading-relaxed text-slate-300 ${hl(c)}`}
                  >
                    {value || <span className="text-slate-600">—</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Frame>
  );
}

function TimelineBlock({ block }: { block: Of<'timeline'> }) {
  const accent = ACCENT[block.accent];
  return (
    <Frame block={block}>
      <ol className="ml-1.5 space-y-5 border-l border-slate-800">
        {block.events.map((event, i) => (
          <li key={i} className="relative pl-6">
            <span
              aria-hidden
              className={`absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-slate-900 ${accent.fill}`}
            />
            <div className={`font-mono text-xs font-semibold ${accent.text}`}>{event.date}</div>
            <div className="mt-0.5 text-sm font-semibold text-slate-100">{event.title}</div>
            {event.detail && <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{event.detail}</p>}
          </li>
        ))}
      </ol>
    </Frame>
  );
}

function formatValue(value: number, unit: string, max: number | null): string {
  const v = Number.isInteger(value) ? String(value) : value.toFixed(1);
  if (unit) return unit.startsWith('%') ? `${v}${unit}` : `${v} ${unit}`;
  return max !== null ? `${v}/${max}` : v;
}

function BarsBlock({ block }: { block: Of<'bars'> }) {
  const max = block.max ?? Math.max(...block.items.map((item) => item.value), 0);
  return (
    <Frame block={block}>
      <ul className="space-y-4">
        {block.items.map((item, i) => (
          <li key={i}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="min-w-0 text-slate-300">{item.label}</span>
              <span className="shrink-0 font-mono text-xs tabular-nums text-slate-400">
                {formatValue(item.value, block.unit, block.max)}
              </span>
            </div>
            <Meter value={item.value} max={max} accent={block.accent} />
            {item.note && <p className="mt-1.5 text-xs text-slate-500">{item.note}</p>}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

function ConceptsBlock({ block }: { block: Of<'concepts'> }) {
  const accent = ACCENT[block.accent];
  return (
    <Frame block={block}>
      <dl className={`grid gap-3 ${block.span === 'full' ? 'sm:grid-cols-2 lg:grid-cols-3' : ''}`}>
        {block.items.map((item, i) => (
          <div key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <dt className="flex items-center gap-2 font-serif text-base font-semibold text-slate-100">
              <span className={`text-xs ${accent.text}`}>◆</span>
              {item.term}
            </dt>
            <dd className="mt-1.5">
              <Markdown className="md-compact">{item.definition}</Markdown>
            </dd>
          </div>
        ))}
      </dl>
    </Frame>
  );
}

function ToneIcon({ tone }: { tone: CalloutTone }) {
  const common = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: 'h-5 w-5',
  };
  switch (tone) {
    case 'insight':
      return (
        <svg {...common}>
          <path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8L12 3Z" />
          <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 8h.01" />
        </svg>
      );
    case 'success':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="m8 12.5 2.8 2.8L16 10" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...common}>
          <path d="M12 4 2.8 19.5h18.4L12 4Z" />
          <path d="M12 10v4.5M12 17h.01" />
        </svg>
      );
    case 'danger':
      return (
        <svg {...common}>
          <path d="M8.2 3h7.6L21 8.2v7.6L15.8 21H8.2L3 15.8V8.2L8.2 3Z" />
          <path d="m9.5 9.5 5 5m0-5-5 5" />
        </svg>
      );
  }
}

function CalloutBlock({ block }: { block: Of<'callout'> }) {
  const tone = TONE_META[block.tone];
  const accent = ACCENT[tone.accent];
  return (
    <div
      className={`relative h-full overflow-hidden rounded-2xl border bg-gradient-to-br to-slate-900/70 p-5 sm:p-6 ${tone.box}`}
    >
      <div className="flex gap-4">
        <span
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset ${accent.soft} ${accent.ring} ${accent.text}`}
        >
          <ToneIcon tone={block.tone} />
        </span>
        <div className="min-w-0 flex-1">
          <div className={`font-mono text-[10px] uppercase tracking-[0.16em] ${accent.text}`}>{tone.label}</div>
          {block.title && (
            <h2 className="mt-1 font-serif text-xl font-semibold leading-snug text-slate-50">{block.title}</h2>
          )}
          <div className="mt-2">
            <Markdown className="md-compact md-bright">{block.body}</Markdown>
          </div>
        </div>
      </div>
    </div>
  );
}

function ActionIcon({ kind, done }: { kind: ActionKind; done: boolean }) {
  if (done) {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md bg-emerald-400/90 text-slate-950">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" className="h-3.5 w-3.5">
          <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }
  if (kind === 'question') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-full font-mono text-[11px] font-bold text-purple-300 ring-1 ring-inset ring-purple-400/50">
        ?
      </span>
    );
  }
  if (kind === 'risk') {
    return (
      <span className="flex h-5 w-5 items-center justify-center rounded-md font-mono text-[11px] font-bold text-amber-300 ring-1 ring-inset ring-amber-400/50">
        !
      </span>
    );
  }
  return <span className="block h-5 w-5 rounded-md ring-1 ring-inset ring-cyan-400/50" />;
}

function ActionsBlock({ block }: { block: Of<'actions'> }) {
  const items = [...block.items].sort((a, b) => Number(a.done) - Number(b.done));
  const open = items.filter((item) => !item.done).length;
  return (
    <Frame
      block={block}
      aside={
        <span className="font-mono text-[11px] text-slate-500">
          <span className="text-slate-300">{open}</span> open · {items.length - open} done
        </span>
      }
    >
      <ul className="divide-y divide-slate-800/70">
        {items.map((item, i) => {
          const kind = ACTION_META[item.kind];
          const level = LEVEL_META[item.priority];
          return (
            <li key={i} className={`flex gap-3 py-3 first:pt-0 last:pb-0 ${item.done ? 'opacity-50' : ''}`}>
              <span className="mt-0.5 shrink-0">
                <ActionIcon kind={item.kind} done={item.done} />
              </span>
              <div className="min-w-0 flex-1">
                <div className={`text-sm leading-snug text-slate-200 ${item.done ? 'line-through decoration-slate-600' : ''}`}>
                  {item.text}
                </div>
                {item.detail && <p className="mt-1 text-[13px] leading-relaxed text-slate-500">{item.detail}</p>}
                <div className={`mt-1.5 font-mono text-[10px] uppercase tracking-wider ${kind.color}`}>{kind.label}</div>
              </div>
              {!item.done && (
                <span
                  className={`h-fit shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ring-1 ring-inset ${level.badge}`}
                >
                  {level.label}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

function SourcesBlock({ block, sources }: { block: Of<'sources'>; sources: SourceIndex }) {
  return (
    <Frame block={block}>
      <ul className="space-y-3">
        {block.items.map((item, i) => {
          const source = resolveSource(item.ref, sources);
          const title = (
            <span className="text-sm font-semibold leading-snug text-slate-100">{source.label}</span>
          );
          return (
            <li key={i} className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-mono text-sm ring-1 ring-inset ${ACCENT[block.accent].soft} ${ACCENT[block.accent].ring} ${ACCENT[block.accent].text}`}
                >
                  {KIND_GLYPH[source.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  {source.href ? (
                    source.external ? (
                      <a href={source.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        {title}
                      </a>
                    ) : (
                      <Link href={source.href} className="hover:underline">
                        {title}
                      </Link>
                    )
                  ) : (
                    title
                  )}
                  {item.takeaway && (
                    <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{item.takeaway}</p>
                  )}
                </div>
                {item.relevance !== null && (
                  <div className="shrink-0 text-right" title={`Relevance ${item.relevance}/10`}>
                    <div className="text-lg font-semibold leading-none text-slate-100">
                      {Math.round(item.relevance)}
                      <span className="text-xs font-normal text-slate-500">/10</span>
                    </div>
                    <div className="mt-1.5">
                      <Pips filled={Math.round(item.relevance / 2)} total={5} accent={block.accent} />
                    </div>
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </Frame>
  );
}

function MarkdownBlock({ block }: { block: Of<'markdown'> }) {
  return (
    <Frame block={block}>
      <Markdown>{block.body}</Markdown>
    </Frame>
  );
}

export function InsightBlock({ block, sources }: { block: Block; sources: SourceIndex }) {
  switch (block.type) {
    case 'stats':
      return <StatsBlock block={block} />;
    case 'takeaways':
      return <TakeawaysBlock block={block} sources={sources} />;
    case 'pipeline':
      return <PipelineBlock block={block} />;
    case 'compare':
      return <CompareBlock block={block} />;
    case 'timeline':
      return <TimelineBlock block={block} />;
    case 'bars':
      return <BarsBlock block={block} />;
    case 'concepts':
      return <ConceptsBlock block={block} />;
    case 'callout':
      return <CalloutBlock block={block} />;
    case 'actions':
      return <ActionsBlock block={block} />;
    case 'sources':
      return <SourcesBlock block={block} sources={sources} />;
    case 'markdown':
      return <MarkdownBlock block={block} />;
  }
}
