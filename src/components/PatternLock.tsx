'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Dots are indexed left-to-right, top-to-bottom:
 *   0 1 2
 *   3 4 5
 *   6 7 8
 *
 * Dragging between two dots that are two cells apart in a straight line passes
 * over the dot in between, so — like Android — we snap that middle dot in too.
 */
const MIDPOINTS: Record<string, number> = {
  '0,2': 1,
  '3,5': 4,
  '6,8': 7,
  '0,6': 3,
  '1,7': 4,
  '2,8': 5,
  '0,8': 4,
  '2,6': 4,
};

const CELL = 100 / 3;
const centerOf = (index: number) => ({
  x: CELL / 2 + (index % 3) * CELL,
  y: CELL / 2 + Math.floor(index / 3) * CELL,
});

interface PatternLockProps {
  onComplete: (pattern: string) => void;
  /** Blocks input while the server checks the pattern. */
  busy?: boolean;
  /** Bump this number to wipe the drawing (e.g. after a failed attempt). */
  clearToken?: number;
  /** Triggers the shake animation. */
  invalid?: boolean;
  minDots?: number;
}

export function PatternLock({
  onComplete,
  busy = false,
  clearToken = 0,
  invalid = false,
  minDots = 4,
}: PatternLockProps) {
  const [selected, setSelected] = useState<number[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  // Pointer handlers need the live selection without re-binding listeners.
  const selectedRef = useRef<number[]>([]);

  const setSelection = useCallback((next: number[]) => {
    selectedRef.current = next;
    setSelected(next);
  }, []);

  useEffect(() => {
    setSelection([]);
    setDrawing(false);
    setCursor(null);
  }, [clearToken, setSelection]);

  const addDot = useCallback(
    (index: number) => {
      const current = selectedRef.current;
      if (current.includes(index)) return;

      const previous = current[current.length - 1];
      const next = [...current];

      if (previous !== undefined) {
        const bridge = MIDPOINTS[[previous, index].sort((a, b) => a - b).join(',')];
        if (bridge !== undefined && !next.includes(bridge)) next.push(bridge);
      }

      next.push(index);
      setSelection(next);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.(8);
      }
    },
    [setSelection],
  );

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  /**
   * Touch pointers stay captured by the element they started on, so
   * `onPointerEnter` never fires on the other dots mid-drag. Hit-testing the
   * point under the finger on every move is what makes touch work.
   */
  const hitTest = useCallback(
    (clientX: number, clientY: number) => {
      const element = document.elementFromPoint(clientX, clientY);
      const dot = element?.closest<HTMLElement>('[data-dot]');
      if (dot?.dataset.dot) addDot(Number(dot.dataset.dot));
    },
    [addDot],
  );

  const finish = useCallback(() => {
    setDrawing(false);
    setCursor(null);

    const pattern = selectedRef.current;
    if (pattern.length === 0) return;

    if (pattern.length < minDots) {
      setSelection([]);
      return;
    }

    onComplete(pattern.join('-'));
  }, [minDots, onComplete, setSelection]);

  // Releasing outside the grid must still submit.
  useEffect(() => {
    if (!drawing) return;
    const onUp = () => finish();
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [drawing, finish]);

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (busy) return;
    // Free the implicit touch capture so hit-testing/enter events work.
    const target = event.target as Element;
    if (target.hasPointerCapture?.(event.pointerId)) {
      target.releasePointerCapture(event.pointerId);
    }

    setSelection([]);
    setDrawing(true);
    setCursor(toLocal(event.clientX, event.clientY));
    hitTest(event.clientX, event.clientY);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!drawing || busy) return;
    event.preventDefault();
    setCursor(toLocal(event.clientX, event.clientY));
    hitTest(event.clientX, event.clientY);
  }

  const lastCenter = selected.length ? centerOf(selected[selected.length - 1]) : null;

  return (
    <div
      className={`relative mx-auto aspect-square w-full max-w-[300px] touch-none select-none ${
        invalid ? 'animate-shake' : ''
      }`}
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={finish}
      role="application"
      aria-label="Pattern lock"
    >
      <svg
        viewBox="0 0 100 100"
        className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
        aria-hidden="true"
      >
        {selected.length > 1 && (
          <polyline
            points={selected
              .map((index) => {
                const { x, y } = centerOf(index);
                return `${x},${y}`;
              })
              .join(' ')}
            fill="none"
            stroke={invalid ? '#fb7185' : '#22d3ee'}
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        )}
        {drawing && lastCenter && cursor && (
          <line
            x1={lastCenter.x}
            y1={lastCenter.y}
            x2={cursor.x}
            y2={cursor.y}
            stroke="#22d3ee"
            strokeWidth="1.6"
            strokeLinecap="round"
            opacity="0.45"
          />
        )}
      </svg>

      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
        {Array.from({ length: 9 }, (_, index) => {
          const order = selected.indexOf(index);
          const isActive = order !== -1;

          return (
            <div
              key={index}
              data-dot={index}
              onPointerEnter={() => drawing && !busy && addDot(index)}
              className="flex cursor-pointer items-center justify-center"
              aria-label={`Dot ${index}`}
            >
              <span
                className={`flex items-center justify-center rounded-full transition-all duration-150 ${
                  isActive
                    ? invalid
                      ? 'h-7 w-7 bg-rose-400 shadow-[0_0_18px_-2px_rgba(251,113,133,0.8)]'
                      : 'h-7 w-7 bg-cyan-400 shadow-phosphor'
                    : 'h-4 w-4 bg-slate-700 ring-1 ring-slate-600/60'
                }`}
              >
                {isActive && (
                  <span className="font-mono text-[10px] font-bold text-slate-950">{order + 1}</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
