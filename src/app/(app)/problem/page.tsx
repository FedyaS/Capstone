import { ProblemEditor } from '@/components/ProblemEditor';
import { loadArticles, loadNotes, loadProblemStatement, loadTimeline, loadTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ProblemPage() {
  const [problem, articles, topics, notes, phases] = await Promise.all([
    loadProblemStatement(),
    loadArticles(),
    loadTopics(),
    loadNotes(),
    loadTimeline(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">
          Problem statement
        </h1>
        <p className="mt-1.5 font-mono text-xs text-slate-600">data/problem_statement.md</p>
      </div>

      <ProblemEditor
        initial={problem}
        articles={articles}
        topics={topics}
        notes={notes}
        phases={phases}
      />
    </div>
  );
}
