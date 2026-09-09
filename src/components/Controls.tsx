'use client';

import { useEffect } from 'react';

/* -------------------------------------------------------------------------- */
/* Status rail — fat-finger horizontal pills instead of a dropdown            */
/* -------------------------------------------------------------------------- */

export interface RailOption<T extends string> {
  value: T;
  label: string;
  /** Tailwind classes applied when this option is selected. */
  active: string;
  dot?: string;
}

interface StatusRailProps<T extends string> {
  options: RailOption<T>[];
  value: T;
  onChange: (value: T) => void;
  compact?: boolean;
  ariaLabel?: string;
}

export function StatusRail<T extends string>({
  options,
  value,
  onChange,
  compact = false,
  ariaLabel,
}: StatusRailProps<T>) {
  return (
    <div className="rail" role="radiogroup" aria-label={ariaLabel}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={`${selected ? `pill ${option.active}` : 'pill-idle'} ${
              compact ? 'px-3 py-2 text-xs' : ''
            }`}
          >
            {option.dot && (
              <span
                className={`h-1.5 w-1.5 rounded-full ${selected ? option.dot : 'bg-slate-600'}`}
              />
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Usefulness slider                                                          */
/* -------------------------------------------------------------------------- */

interface UsefulnessSliderProps {
  value: number;
  onChange: (value: number) => void;
  /** Fired when the user lets go — the moment worth persisting. */
  onCommit?: (value: number) => void;
  label?: string;
}

export function UsefulnessSlider({
  value,
  onChange,
  onCommit,
  label = 'Usefulness',
}: UsefulnessSliderProps) {
  const tone =
    value >= 8 ? 'text-emerald-400' : value >= 5 ? 'text-cyan-400' : value >= 3 ? 'text-amber-400' : 'text-slate-500';

  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
          {label}
        </span>
        <span className={`font-mono text-sm font-semibold ${tone}`}>{value}/10</span>
      </div>
      <input
        type="range"
        min={0}
        max={10}
        step={1}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        onPointerUp={() => onCommit?.(value)}
        onKeyUp={() => onCommit?.(value)}
        onBlur={() => onCommit?.(value)}
        className="slider"
        aria-label={label}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Bottom sheet (mobile) / centered dialog (desktop)                          */
/* -------------------------------------------------------------------------- */

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export function Sheet({ open, onClose, title, children }: SheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="animate-sheet-up relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl border border-slate-800 bg-slate-900 shadow-2xl sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="font-serif text-lg font-semibold text-slate-100">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              className="h-5 w-5"
            >
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Floating add button — clears the mobile bottom nav                         */
/* -------------------------------------------------------------------------- */

export function FloatingAdd({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-5 z-30 flex h-14 items-center gap-2 rounded-full bg-cyan-500 px-5 font-medium text-slate-950 shadow-[0_8px_30px_-6px_rgba(34,211,238,0.6)] transition active:scale-95 md:bottom-8"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        className="h-5 w-5"
      >
        <path d="M12 5v14M5 12h14" />
      </svg>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                */
/* -------------------------------------------------------------------------- */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="card flex flex-col items-center px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-800 bg-slate-950">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="#475569"
          strokeWidth="1.6"
          strokeLinecap="round"
          className="h-6 w-6"
        >
          <path d="M5 4h9l5 5v11a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
          <path d="M13 4v6h6" />
        </svg>
      </div>
      <h3 className="font-serif text-lg font-semibold text-slate-200">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-slate-500">{body}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
