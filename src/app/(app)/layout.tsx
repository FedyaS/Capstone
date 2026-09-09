import { Shell } from '@/components/Shell';
import { storageMode } from '@/lib/storage';

// The repo is the database, so nothing here may be statically cached.
export const dynamic = 'force-dynamic';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <Shell storage={storageMode()}>{children}</Shell>;
}
