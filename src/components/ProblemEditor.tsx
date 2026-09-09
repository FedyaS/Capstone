'use client';

import { useEffect, useState, useTransition } from 'react';

import { saveProblemStatement } from '@/app/actions';
import { CopyButton, PasteButton } from '@/components/Clipboard';
import { Markdown } from '@/components/Markdown';
import { toast } from '@/components/Toast';
import { buildContextBundle } from '@/lib/context-bundle';
import type { Article, Phase, Topic } from '@/lib/types';

const TEMPLATE = `# Problem Statement

## Context
_What is the setting, and why does it matter?_

## The problem
_One or two sentences. Be specific about who suffers and how._

## Research question
_What exactly are you answering?_

## Scope
**In scope:**
-

**Out of scope:**
-

## Success criteria
_How will you know this worked? Make it measurable._
`;

interface ProblemEditorProps {
  initial: string;
  articles: Article[];
  topics: Topic[];
  notes: string;
  phases: Phase[];
}

export function ProblemEditor({ initial, articles, topics, notes, phases }: ProblemEditorProps) {
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [mode, setMode] = useState<'write' | 'preview'>(initial.trim() ? 'preview' : 'write');
  const [pending, startTransition] = useTransition();

  const dirty = value !== saved;

  function save() {
    if (!dirty || pending) return;
    const snapshot = value;
    startTransition(async () => {
      const result = await saveProblemStatement(snapshot);
      if (result.ok) {
        setSaved(snapshot);
        toast(result.message);
      } else {
        toast(result.message, 'error');
      }
    });
  }

  // Warn before losing unsaved edits.
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [dirty]);

  // Ctrl/Cmd+S saves.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        save();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-xl bg-slate-900 p-1 ring-1 ring-inset ring-slate-800">
          {(['write', 'preview'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setMode(tab)}
              className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                mode === tab
                  ? 'bg-cyan-900/40 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
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

        <div className="ml-auto flex items-center gap-2">
          <PasteButton
            label="Paste"
            onPaste={(text) => {
              setValue((current) => (current.trim() ? `${current.trimEnd()}\n\n${text}` : text));
              setMode('write');
            }}
            title="Append the clipboard to the end of the document"
          />
          <button type="button" onClick={save} disabled={!dirty || pending} className="btn-primary">
            Save
          </button>
        </div>
      </div>

      {mode === 'write' ? (
        <div className="space-y-3">
          <textarea
            value={value}
            onChange={(event) => setValue(event.target.value)}
            spellCheck
            placeholder="Write your problem statement in Markdown. LaTeX works too: $E = mc^2$"
            className="field min-h-[420px] resize-y font-mono text-[13px] leading-relaxed md:min-h-[520px]"
          />
          {!value.trim() && (
            <button
              type="button"
              onClick={() => setValue(TEMPLATE)}
              className="btn-ghost w-full sm:w-auto"
            >
              Insert starter template
            </button>
          )}
        </div>
      ) : (
        <div className="card p-5 sm:p-8">
          <Markdown empty="Nothing written yet — switch to Write.">{value}</Markdown>
        </div>
      )}

      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <div className="font-serif text-base font-semibold text-slate-100">Export context</div>
          <p className="mt-0.5 text-sm text-slate-500">
            Copies the statement, topics, sources and notes as one block to paste into an LLM.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <CopyButton
            label="Copy statement"
            getText={() => value}
            className="btn-ghost flex-1 sm:flex-none"
          />
          <CopyButton
            label="Export context"
            copiedLabel="Copied pack"
            getText={() =>
              buildContextBundle({
                problemStatement: value,
                articles,
                topics,
                notes,
                phases,
              })
            }
            className="btn-primary flex-1 sm:flex-none"
          />
        </div>
      </div>
    </div>
  );
}
