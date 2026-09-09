import { ArticleManager } from '@/components/ArticleManager';
import { loadArticles } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function ArticlesPage() {
  const articles = await loadArticles();
  return <ArticleManager initial={articles} />;
}
