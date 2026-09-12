import Link from 'next/link';

import { LiveDot, timeAgo } from '@/components/InsightsBoard';
import { Timeline } from '@/components/Timeline';
import {
  loadArticles,
  loadInsights,
  loadProblemStatement,
  loadTimeline,
  loadTopics,
} from '@/lib/data';
import type { InsightsDoc } from '@/lib/insights';
import { ARTICLE_STATUS_META, TOPIC_STATUS_META, type Article } from '@/lib/types';

export const dynamic = 'force-dynamic';

function Stat({
  label,
  value,
  hint,
  accent,
  href,
}: {
  label: string;
  value: string;
  hint: string;
  accent: string;
  href: string;
}) {
  return (
    <Link href={href} className="card p-4 transition hover:border-slate-700 hover:bg-slate-900">
      <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</div>
      <div className={`mt-2 font-serif text-3xl font-semibold ${accent}`}>{value}</div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Link>
  );
}

function BriefingTeaser({ doc }: { doc: InsightsDoc }) {
  const takeaways = doc.blocks
    .flatMap((block) => (block.type === 'takeaways' ? block.items : []))
    .slice(0, 3);
  const ago = timeAgo(doc.updatedAt);

  return (
    <Link
      href="/insights"
      className="card group relative block overflow-hidden p-5 transition hover:border-slate-700 sm:p-6"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl"
      />
      <div className="relative">
        <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.16em]">
          <span className="flex items-center gap-2 text-cyan-300">
            <LiveDot /> AI briefing
          </span>
          <span className="text-slate-500 transition group-hover:text-cyan-300">
            {ago ? `Updated ${ago}` : 'Open'} →
          </span>
        </div>
        {doc.headline ? (
          <>
            <p className="mt-3 font-serif text-xl font-semibold leading-snug text-slate-100">
              {doc.headline}
            </p>
            {takeaways.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {takeaways.map((item) => (
                  <li key={item.title} className="flex items-start gap-2.5 text-sm text-slate-400">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                    {item.title}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="mt-3 text-sm italic text-slate-500">
            No briefing yet — ask Cursor to refresh the insights board.
          </p>
        )}
      </div>
    </Link>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

export default async function DashboardPage() {
  const [phases, articles, topics, problem, { doc: insights }] = await Promise.all([
    loadTimeline(),
    loadArticles(),
    loadTopics(),
    loadProblemStatement(),
    loadInsights(),
  ]);

  const understoodArticles = articles.filter((a) => a.status === 'UNDERSTOOD').length;
  const unreadArticles = articles.filter((a) => a.status === 'NEW' || a.status === 'SKIMMED').length;
  const understoodTopics = topics.filter((t) => t.status === 'UNDERSTAND').length;
  const gaps = topics.filter((t) => t.status !== 'UNDERSTAND');

  const recent = [...articles]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4) as Article[];

  const problemPreview = problem
    .split('\n')
    .filter((line) => line.trim() && !line.trim().startsWith('#'))
    .slice(0, 3)
    .join(' ')
    .slice(0, 260);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">
          Dashboard
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">
          Everything below is committed straight into this repository.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="Sources"
          value={String(articles.length)}
          hint={`${understoodArticles} understood · ${unreadArticles} pending`}
          accent="text-slate-100"
          href="/articles"
        />
        <Stat
          label="Topics"
          value={`${understoodTopics}/${topics.length}`}
          hint={gaps.length ? `${gaps.length} gap${gaps.length === 1 ? '' : 's'} open` : 'All clear'}
          accent={gaps.length ? 'text-amber-400' : 'text-emerald-400'}
          href="/topics"
        />
        <Stat
          label="Top source"
          value={
            articles.length
              ? String(Math.max(...articles.map((a) => a.usefulness)))
              : '—'
          }
          hint="highest usefulness"
          accent="text-cyan-400"
          href="/articles"
        />
        <Stat
          label="Problem"
          value={problem.trim() ? 'Set' : 'Empty'}
          hint={problem.trim() ? `${problem.trim().split(/\s+/).length} words` : 'Write it first'}
          accent={problem.trim() ? 'text-emerald-400' : 'text-purple-400'}
          href="/problem"
        />
      </div>

      <BriefingTeaser doc={insights} />

      <Timeline initialPhases={phases} />

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-slate-100">Problem statement</h2>
            <Link href="/problem" className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              Open
            </Link>
          </div>
          {problemPreview ? (
            <p className="font-serif text-[15px] leading-relaxed text-slate-400">
              {problemPreview}
              {problem.length > 260 ? '…' : ''}
            </p>
          ) : (
            <p className="text-sm italic text-slate-600">
              Not written yet — this is the first thing to lock down.
            </p>
          )}
        </section>

        <section className="card p-5 sm:p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-serif text-xl font-semibold text-slate-100">Knowledge gaps</h2>
            <Link href="/topics" className="font-mono text-xs uppercase tracking-wider text-cyan-400">
              Open
            </Link>
          </div>
          {gaps.length === 0 ? (
            <p className="text-sm italic text-slate-600">
              {topics.length === 0 ? 'No topics logged yet.' : 'No open gaps. Nice.'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {gaps
                .sort((a, b) => b.usefulness - a.usefulness)
                .slice(0, 6)
                .map((topic) => {
                  const meta = TOPIC_STATUS_META[topic.status];
                  return (
                    <li key={topic.id} className="flex items-center gap-3 text-sm">
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                      <span className="min-w-0 flex-1 truncate text-slate-300">{topic.name}</span>
                      <span className="shrink-0 font-mono text-xs text-slate-600">
                        {topic.usefulness}/10
                      </span>
                    </li>
                  );
                })}
            </ul>
          )}
        </section>
      </div>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-serif text-xl font-semibold text-slate-100">Recent sources</h2>
          <Link href="/articles" className="font-mono text-xs uppercase tracking-wider text-cyan-400">
            All
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="text-sm italic text-slate-600">
            No sources logged yet. Add the first one from the Articles tab.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {recent.map((article) => {
              const meta = ARTICLE_STATUS_META[article.status];
              return (
                <li key={article.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.dot}`} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-slate-200">{article.title}</div>
                    {article.url && (
                      <div className="truncate font-mono text-[11px] text-slate-600">
                        {hostOf(article.url)}
                      </div>
                    )}
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${meta.bg} ${meta.text}`}
                  >
                    {meta.label}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
