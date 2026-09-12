import type { SourceIndex } from '@/components/InsightBlocks';
import { InsightsBoard } from '@/components/InsightsBoard';
import { loadArticles, loadInsights, loadTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function InsightsPage() {
  const [articles, topics] = await Promise.all([loadArticles(), loadTopics()]);
  const { doc, issues } = await loadInsights({
    articleIds: articles.map((a) => a.id),
    topicIds: topics.map((t) => t.id),
  });

  const sources: SourceIndex = {
    scratchpad: { label: 'AI scratchpad', href: '/scratchpad', external: false, kind: 'note' },
    problem: { label: 'Problem statement', href: '/problem', external: false, kind: 'note' },
  };
  for (const article of articles) {
    sources[article.id] = {
      label: article.title,
      href: article.url || '/articles',
      external: Boolean(article.url),
      kind: 'article',
    };
  }
  for (const topic of topics) {
    sources[topic.id] = { label: topic.name, href: '/topics', external: false, kind: 'topic' };
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">Insights</h1>
        <p className="mt-1.5 font-mono text-xs text-slate-600">
          data/insights.json · maintained by AI
        </p>
      </div>

      <InsightsBoard doc={doc} issues={issues} sources={sources} />
    </div>
  );
}
