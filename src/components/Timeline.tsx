'use client';

import { useState, useTransition } from 'react';

import { saveTimeline } from '@/app/actions';
import { toast } from '@/components/Toast';
import { PHASE_STATUSES, type Phase, type PhaseStatus } from '@/lib/types';

const PHASE_META: Record<PhaseStatus, { label: string; ring: string; text: string; node: string }> = {
  PENDING: {
    label: 'Pending',
    ring: 'ring-slate-800',
    text: 'text-slate-500',
    node: 'border-slate-700 bg-slate-900',
  },
  ACTIVE: {
    label: 'In progress',
    ring: 'ring-cyan-400/30',
    text: 'text-cyan-400',
    node: 'border-cyan-400 bg-cyan-400 shadow-phosphor',
  },
  DONE: {
    label: 'Done',
    ring: 'ring-emerald-500/25',
    text: 'text-emerald-400',
    node: 'border-emerald-400 bg-emerald-400',
  },
};

/** Tapping a phase walks it forward: Pending → In progress → Done → Pending. */
function nextStatus(status: PhaseStatus): PhaseStatus {
  const index = PHASE_STATUSES.indexOf(status);
  return PHASE_STATUSES[(index + 1) % PHASE_STATUSES.length];
}

export function Timeline({ initialPhases }: { initialPhases: Phase[] }) {
  const [phases, setPhases] = useState(initialPhases);
  const [pending, startTransition] = useTransition();

  function cycle(id: string) {
    const previous = phases;
    const next = phases.map((phase) =>
      phase.id === id
        ? { ...phase, status: nextStatus(phase.status), updatedAt: new Date().toISOString() }
        : phase,
    );

    setPhases(next);
    startTransition(async () => {
      const result = await saveTimeline(next);
      if (!result.ok) {
        setPhases(previous);
        toast(result.message, 'error');
      }
    });
  }

  const done = phases.filter((phase) => phase.status === 'DONE').length;
  const progress = Math.round((done / phases.length) * 100);

  return (
    <section className="card p-5 sm:p-6">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h2 className="font-serif text-xl font-semibold text-slate-100">Lifecycle</h2>
          <p className="mt-1 text-sm text-slate-500">Tap a phase to advance it.</p>
        </div>
        <div className="text-right">
          <div className="font-mono text-2xl font-semibold text-cyan-400">{progress}%</div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-slate-600">
            {done}/{phases.length} done
          </div>
        </div>
      </div>

      <div className="mb-7 h-1.5 overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-cyan-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <ol className={`relative space-y-2 ${pending ? 'opacity-70' : ''}`}>
        {/* The connecting rail behind the nodes. */}
        <span className="absolute bottom-6 left-[11px] top-6 w-px bg-slate-800" aria-hidden="true" />

        {phases.map((phase) => {
          const meta = PHASE_META[phase.status];
          return (
            <li key={phase.id} className="relative">
              <button
                type="button"
                onClick={() => cycle(phase.id)}
                className={`flex w-full items-start gap-4 rounded-xl p-3 text-left ring-1 ring-inset transition hover:bg-slate-800/40 active:scale-[0.995] ${meta.ring}`}
              >
                <span
                  className={`relative z-10 mt-1 h-[11px] w-[11px] shrink-0 rounded-full border-2 transition ${meta.node}`}
                />
                <span className="min-w-0 flex-1">
                  <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="font-serif text-base font-semibold text-slate-100">
                      {phase.title}
                    </span>
                    <span
                      className={`font-mono text-[10px] uppercase tracking-wider ${meta.text}`}
                    >
                      {meta.label}
                    </span>
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-500">
                    {phase.description}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
