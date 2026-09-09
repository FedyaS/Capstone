'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { PatternLock } from '@/components/PatternLock';
import { login } from '@/app/actions';

export function LoginForm({ next }: { next: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [clearToken, setClearToken] = useState(0);

  function handleComplete(pattern: string) {
    setError('');
    startTransition(async () => {
      const result = await login(pattern);

      if (!result.ok) {
        setError(result.message);
        // Let the red state land before wiping the drawing.
        window.setTimeout(() => setClearToken((token) => token + 1), 450);
        return;
      }

      setUnlocked(true);
      router.replace(next);
      router.refresh();
    });
  }

  return (
    <div className="w-full max-w-sm">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl border border-cyan-400/30 bg-cyan-500/10">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="#22d3ee"
            strokeWidth="1.6"
            strokeLinecap="round"
            className="h-6 w-6"
          >
            <rect x="4" y="10" width="16" height="10" rx="2" />
            <path d="M8 10V7a4 4 0 1 1 8 0v3" />
          </svg>
        </div>
        <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">
          Capstone Console
        </h1>
        <p className="mt-2 text-sm text-slate-500">Draw your pattern to unlock.</p>
      </div>

      <PatternLock
        onComplete={handleComplete}
        busy={pending || unlocked}
        clearToken={clearToken}
        invalid={Boolean(error)}
      />

      <div className="mt-8 flex h-12 items-center justify-center px-4 text-center">
        {unlocked ? (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-400">Unlocked</p>
        ) : pending ? (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-400">Checking…</p>
        ) : error ? (
          <p className="text-sm text-rose-400">{error}</p>
        ) : (
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-slate-600">
            Minimum four dots
          </p>
        )}
      </div>
    </div>
  );
}
