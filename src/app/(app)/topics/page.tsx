import { TopicManager } from '@/components/TopicManager';
import { loadTopics } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function TopicsPage() {
  const topics = await loadTopics();
  return <TopicManager initial={topics} />;
}
