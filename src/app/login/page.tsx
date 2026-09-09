import { LoginForm } from '@/components/LoginForm';
import { isConfigured } from '@/lib/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;
  // Only allow same-origin relative paths — never an attacker-supplied URL.
  const requested = params.next ?? '/';
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/';

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <LoginForm next={next} />

      {!isConfigured() && (
        <div className="fixed inset-x-4 bottom-6 mx-auto max-w-md rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-center text-sm text-amber-200">
          <span className="font-mono text-xs uppercase tracking-wider">Setup needed</span>
          <p className="mt-1">
            <code className="font-mono">SECRET_PATTERN</code> is not set. Add it to{' '}
            <code className="font-mono">.env.local</code> and restart the dev server.
          </p>
        </div>
      )}
    </main>
  );
}
