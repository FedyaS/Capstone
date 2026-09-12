'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTransition } from 'react';

import { logout } from '@/app/actions';
import type { StorageMode } from '@/lib/types';

function IconDashboard({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className={className}>
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  );
}

function IconProblem({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 3h9l5 5v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v6h6M9 13h6M9 17h4" />
    </svg>
  );
}

function IconArticles({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.5 1.5" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.5-1.5" />
    </svg>
  );
}

function IconTopics({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M12 7.5v4M12 11.5 6.8 15.8M12 11.5l5.2 4.3" />
    </svg>
  );
}

function IconScratchpad({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M12 3v3M5.5 5.5l2.1 2.1M3 12h3M18 12h3M16.4 7.6l2.1-2.1" />
      <path d="M9 21h6M9.5 17.5a5.5 5.5 0 1 1 5 0V19a1 1 0 0 1-1 1h-3a1 1 0 0 1-1-1v-1.5Z" />
    </svg>
  );
}

function IconInsights({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M10 3.5l1.9 5.1 5.1 1.9-5.1 1.9L10 17.5l-1.9-5.1L3 10.5l5.1-1.9L10 3.5Z" />
      <path d="M18 14.5l.9 2.1 2.1.9-2.1.9-.9 2.1-.9-2.1-2.1-.9 2.1-.9.9-2.1Z" />
    </svg>
  );
}

const NAV = [
  { href: '/', label: 'Dashboard', Icon: IconDashboard },
  { href: '/insights', label: 'Insights', Icon: IconInsights },
  { href: '/problem', label: 'Problem', Icon: IconProblem },
  { href: '/articles', label: 'Articles', Icon: IconArticles },
  { href: '/topics', label: 'Topics', Icon: IconTopics },
  { href: '/scratchpad', label: 'Scratchpad', Icon: IconScratchpad },
] as const;

const isActive = (pathname: string, href: string) =>
  href === '/' ? pathname === '/' : pathname.startsWith(href);

export function Shell({
  children,
  storage,
}: {
  children: React.ReactNode;
  storage: StorageMode;
}) {
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-40 border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-cyan-400 shadow-phosphor" />
            <span className="font-serif text-lg font-semibold tracking-tight text-slate-100">
              Capstone
            </span>
          </Link>

          <nav className="ml-4 hidden flex-1 items-center gap-1 md:flex">
            {NAV.map(({ href, label, Icon }) => {
              const active = isActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
                    active
                      ? 'bg-cyan-900/30 text-cyan-400 ring-1 ring-inset ring-cyan-400/20'
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span
              title={
                storage === 'github'
                  ? 'Writes are committed to GitHub'
                  : 'Writes go to ./data on this machine'
              }
              className={`hidden rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider ring-1 ring-inset sm:inline-block ${
                storage === 'github'
                  ? 'bg-emerald-500/10 text-emerald-300 ring-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 ring-amber-500/30'
              }`}
            >
              {storage === 'github' ? 'git' : 'local'}
            </span>

            <button
              type="button"
              disabled={pending}
              onClick={() => startTransition(() => void logout())}
              title="Lock"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800/60 hover:text-slate-200 disabled:opacity-40"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                className="h-5 w-5"
              >
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 1 1 8 0v3" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-28 pt-6 sm:px-6 md:pb-16">{children}</main>

      {/* Mobile bottom navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-800 bg-slate-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md md:hidden">
        <div className="flex items-stretch">
          {NAV.map(({ href, label, Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition ${
                  active ? 'text-cyan-400' : 'text-slate-500'
                }`}
              >
                <span
                  className={`flex h-8 w-12 items-center justify-center rounded-full transition ${
                    active ? 'bg-cyan-900/40' : ''
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
