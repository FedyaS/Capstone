'use client';

import { useEffect, useState } from 'react';

type ToastTone = 'ok' | 'error' | 'info';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const EVENT = 'capstone:toast';

/** Fire-and-forget toast. Callable from anywhere in the client tree. */
export function toast(message: string, tone: ToastTone = 'ok') {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent<Omit<ToastItem, 'id'>>(EVENT, { detail: { message, tone } }));
}

const TONE_STYLES: Record<ToastTone, string> = {
  ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  info: 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200',
};

export function Toaster() {
  const [items, setItems] = useState<ToastItem[]>([]);

  useEffect(() => {
    let counter = 0;

    const onToast = (event: Event) => {
      const detail = (event as CustomEvent<Omit<ToastItem, 'id'>>).detail;
      counter += 1;
      const id = counter;
      setItems((current) => [...current, { id, ...detail }]);
      window.setTimeout(() => {
        setItems((current) => current.filter((item) => item.id !== id));
      }, 3200);
    };

    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-4">
      {items.map((item) => (
        <div
          key={item.id}
          role="status"
          className={`animate-fade-up max-w-md rounded-xl border px-4 py-2.5 text-sm font-medium shadow-lg backdrop-blur ${TONE_STYLES[item.tone]}`}
        >
          {item.message}
        </div>
      ))}
    </div>
  );
}
