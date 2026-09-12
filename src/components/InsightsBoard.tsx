import { InsightBlock, type SourceIndex } from '@/components/InsightBlocks';
import type { InsightsDoc } from '@/lib/insights';

/** "3h ago" style label; server-rendered, so no hydration mismatch. */
export function timeAgo(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return '';
  const minutes = Math.round((Date.now() - then) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(then).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function LiveDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
    </span>
  );
}

function Issues({ issues }: { issues: string[] }) {
  return (
    <section className="rounded-2xl border border-dashed border-amber-500/40 bg-amber-500/[0.06] p-4 sm:p-5">
      <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-amber-300">
        <span>⚠</span>
        {issues.length} problem{issues.length === 1 ? '' : 's'} in data/insights.json
      </div>
      <ul className="mt-3 space-y-1.5 font-mono text-xs leading-relaxed text-amber-100/80">
        {issues.slice(0, 12).map((issue, i) => (
          <li key={i}>• {issue}</li>
        ))}
        {issues.length > 12 && <li>• …and {issues.length - 12} more</li>}
      </ul>
      <p className="mt-3 text-xs text-slate-500">
        Invalid parts are skipped. Run <code className="text-amber-200">npm run insights:check</code> for
        the full list.
      </p>
    </section>
  );
}

function EmptyState() {
  return (
    <section className="card relative overflow-hidden p-8 text-center sm:p-12">
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-500/15 blur-3xl"
      />
      <div className="relative">
        <div className="mx-auto flex w-fit items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
          <LiveDot /> Waiting for the AI
        </div>
        <h2 className="mt-4 font-serif text-2xl font-semibold text-slate-100">No briefing yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
          This board is written by your AI assistant. In Cursor, ask it to{' '}
          <span className="text-slate-300">“refresh the insights board”</span> and it will distill your
          articles, topics and scratchpad into <code className="font-mono text-cyan-300">data/insights.json</code>.
        </p>
      </div>
    </section>
  );
}

function Hero({ doc }: { doc: InsightsDoc }) {
  const ago = timeAgo(doc.updatedAt);
  return (
    <section className="card relative overflow-hidden p-6 sm:p-8">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-36 -left-20 h-80 w-80 rounded-full bg-purple-500/[0.12] blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgb(148_163_184/0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgb(148_163_184/0.05)_1px,transparent_1px)] bg-[size:28px_28px] [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_70%)]"
      />

      <div className="relative">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="flex items-center gap-2 text-cyan-300">
            <LiveDot /> AI briefing
          </span>
          {ago && <span className="text-slate-500">Updated {ago}</span>}
        </div>

        {doc.headline && (
          <h2 className="mt-4 max-w-3xl font-serif text-[1.7rem] font-semibold leading-tight tracking-tight text-slate-50 sm:text-4xl">
            {doc.headline}
          </h2>
        )}
        {doc.summary && (
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-slate-400">{doc.summary}</p>
        )}

        {doc.focus.length > 0 && (
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-600">Focus</span>
            {doc.focus.map((item) => (
              <span
                key={item}
                className="rounded-full bg-slate-800/70 px-3 py-1 text-xs text-slate-300 ring-1 ring-inset ring-slate-700"
              >
                {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Changelog({ entries }: { entries: InsightsDoc['changelog'] }) {
  return (
    <section className="rounded-2xl border border-slate-800/70 p-5">
      <div className="mb-3 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
        Update log
      </div>
      <ul className="space-y-2">
        {entries.slice(0, 5).map((entry, i) => (
          <li key={i} className="flex gap-3 text-[13px] leading-relaxed">
            <span className="w-24 shrink-0 font-mono text-[11px] leading-[1.6rem] text-slate-600">
              {entry.date ? timeAgo(entry.date) || entry.date : '—'}
            </span>
            <span className="text-slate-400">{entry.note}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function InsightsBoard({
  doc,
  issues,
  sources,
}: {
  doc: InsightsDoc;
  issues: string[];
  sources: SourceIndex;
}) {
  const hasHero = Boolean(doc.headline || doc.summary);
  const navigable = doc.blocks.filter((block) => block.title && block.type !== 'stats');

  return (
    <div className="space-y-6">
      {issues.length > 0 && <Issues issues={issues} />}

      {!hasHero && doc.blocks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {hasHero && <Hero doc={doc} />}

          {navigable.length >= 4 && (
            <nav className="rail" aria-label="Jump to section">
              {navigable.map((block) => (
                <a key={block.id} href={`#${block.id}`} className="pill-idle !py-2 text-xs">
                  {block.title}
                </a>
              ))}
            </nav>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {doc.blocks.map((block, i) => (
              <div
                key={block.id}
                id={block.id}
                className={`scroll-mt-20 animate-fade-up motion-reduce:animate-none ${
                  block.span === 'full' ? 'md:col-span-2' : ''
                }`}
                style={{ animationDelay: `${Math.min(i, 10) * 50}ms` }}
              >
                <InsightBlock block={block} sources={sources} />
              </div>
            ))}
          </div>

          {doc.changelog.length > 0 && <Changelog entries={doc.changelog} />}
        </>
      )}
    </div>
  );
}
