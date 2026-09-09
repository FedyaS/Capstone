'use client';

import { useEffect } from 'react';

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="card mt-8 p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-semibold text-slate-100">Could not load your data</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-400">
        This is usually the GitHub connection: a token that expired, the wrong{' '}
        <code className="font-mono text-cyan-400">GITHUB_OWNER</code>/
        <code className="font-mono text-cyan-400">GITHUB_REPO</code>, or a rate limit.
      </p>
      <pre className="mt-4 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-rose-300">
        {error.message}
      </pre>
      <button type="button" onClick={reset} className="btn-primary mt-5">
        Try again
      </button>
    </div>
  );
}
