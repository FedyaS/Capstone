'use client';

import { useEffect, useRef, useState, useTransition } from 'react';

import { saveNotes } from '@/app/actions';
import { CopyButton, PasteButton } from '@/components/Clipboard';
import { Markdown } from '@/components/Markdown';
import { toast } from '@/components/Toast';

function timestampHeading(): string {
  const now = new Date();
  const date = now.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
  const time = now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `## ${date} · ${time}`;
}

export function ScratchpadEditor({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const [pending, startTransition] = useTransition();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = value !== saved;

  function save(next = value) {
    if (pending) return;
    startTransition(async () => {
      const result = await saveNotes(next);
      if (result.ok) {
        setSaved(next);
        toast(result.message);
      } else {
        toast(result.message, 'error');
      }
    });
  }

  /**
   * The core flow: copy an AI answer, hit one button, and it lands as a fresh
   * timestamped section at the top with no cursor placement or typing.
   */
  function appendFromClipboard(text: string) {
    const block = `${timestampHeading()}\n\n${text.trim()}\n`;
    const next = value.trim() ? `${block}\n---\n\n${value.trimStart()}` : block;
    setValue(next);
    setMode('write');
    textareaRef.current?.scrollTo({ top: 0 });
    save(next);
  }

  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (dirty) save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const words = value.trim() ? value.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-4">
      {/* The primary action gets its own prominent block. */}
      <div className="card flex flex-col gap-3 border-cyan-500/20 bg-cyan-500/[0.04] p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base font-semibold text-slate-100">Dump an AI answer</div>
          <p className="mt-0.5 text-sm text-slate-500">
            Pastes the clipboard as a new timestamped entry at the top and saves immediately.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <PasteButton
            label="Paste & save"
            onPaste={appendFromClipboard}
            className="btn-primary flex-1 sm:flex-none"
          />
          <CopyButton
            label="Copy all"
            getText={() => value}
            className="btn-ghost flex-1 sm:flex-none"
          />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-slate-900 p-1 ring-1 ring-inset ring-slate-800">
          {(['write', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                mode === tab ? 'bg-cyan-900/40 text-cyan-400' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <span
          className={`font-mono text-[11px] uppercase tracking-wider ${
            pending ? 'text-cyan-400' : dirty ? 'text-amber-400' : 'text-slate-600'
          }`}
        >
          {pending ? 'Saving…' : dirty ? 'Unsaved' : 'Saved'}
        </span>

        <span className="font-mono text-[11px] uppercase tracking-wider text-slate-700">
          {words} words
        </span>

        <button
          type="button"
          onClick={() => save()}
          disabled={!dirty || pending}
          className="btn-primary ml-auto"
        >
          Save
        </button>
      </div>

      {mode === 'write' ? (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          spellCheck={false}
          placeholder={
            'Dump anything worth keeping — prompts that worked, derivations, code, links.\n\nMarkdown, LaTeX ($$\\nabla_\\theta J$$) and fenced code blocks all render in Preview.'
          }
          className="field min-h-[60dvh] resize-y font-mono text-[13px] leading-relaxed"
        />
      ) : (
        <div className="card p-5 sm:p-8">
          <Markdown empty="Nothing dumped yet — paste something in.">{value}</Markdown>
        </div>
      )}
    </div>
  );
}
