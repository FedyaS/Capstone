'use client';

import { useState } from 'react';

import { toast } from '@/components/Toast';

/* -------------------------------------------------------------------------- */
/* Icons                                                                      */
/* -------------------------------------------------------------------------- */

function PasteIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" strokeLinejoin="round" />
      <path
        d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-4 w-4">
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4"
    >
      <path d="m5 13 4 4L19 7" />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* Read: one-click paste                                                      */
/* -------------------------------------------------------------------------- */

interface PasteButtonProps {
  onPaste: (text: string) => void;
  label?: string;
  className?: string;
  title?: string;
}

/**
 * Pulls the clipboard straight into state. `readText()` is gated behind a
 * permission prompt in Chrome and is entirely unavailable in Firefox and on
 * insecure origins, so every failure mode degrades to a readable hint instead
 * of an exception.
 */
export function PasteButton({ onPaste, label = 'Paste', className, title }: PasteButtonProps) {
  const [done, setDone] = useState(false);

  async function handleClick() {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.readText) {
      toast('Clipboard read unsupported here — long-press the field and paste.', 'info');
      return;
    }

    try {
      const text = await navigator.clipboard.readText();
      if (!text) {
        toast('Clipboard is empty.', 'info');
        return;
      }
      onPaste(text);
      setDone(true);
      window.setTimeout(() => setDone(false), 1400);
    } catch {
      toast('Clipboard permission denied — allow it in the address bar, or paste manually.', 'error');
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title={title ?? 'Paste from clipboard'}
      className={
        className ??
        'btn shrink-0 bg-cyan-500/10 px-3 py-3 text-cyan-300 ring-1 ring-inset ring-cyan-400/30 hover:bg-cyan-500/20'
      }
    >
      {done ? <CheckIcon /> : <PasteIcon />}
      <span className="font-mono text-xs uppercase tracking-wider">{done ? 'Pasted' : label}</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Write: one-click copy                                                      */
/* -------------------------------------------------------------------------- */

interface CopyButtonProps {
  /** Lazy so the caller always copies the latest editor state. */
  getText: () => string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  onCopied?: (text: string) => void;
}

export function CopyButton({
  getText,
  label = 'Copy',
  copiedLabel = 'Copied',
  className,
  onCopied,
}: CopyButtonProps) {
  const [done, setDone] = useState(false);

  async function handleClick() {
    const text = getText();
    if (!text.trim()) {
      toast('Nothing to copy yet.', 'info');
      return;
    }

    const succeeded = await writeClipboard(text);
    if (!succeeded) {
      toast('Could not access the clipboard. Select the text and copy manually.', 'error');
      return;
    }

    setDone(true);
    onCopied?.(text);
    window.setTimeout(() => setDone(false), 1600);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      title="Copy to clipboard"
      className={
        className ??
        'btn shrink-0 bg-cyan-500/10 px-3 py-3 text-cyan-300 ring-1 ring-inset ring-cyan-400/30 hover:bg-cyan-500/20'
      }
    >
      {done ? <CheckIcon /> : <CopyIcon />}
      <span className="font-mono text-xs uppercase tracking-wider">{done ? copiedLabel : label}</span>
    </button>
  );
}

/** Async Clipboard API with a `execCommand` fallback for older iOS Safari. */
export async function writeClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fall through to the legacy path
  }

  try {
    const area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.top = '-1000px';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    area.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}
