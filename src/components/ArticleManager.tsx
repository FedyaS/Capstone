'use client';

import { useMemo, useRef, useState, useTransition } from 'react';

import { saveArticles } from '@/app/actions';
import { PasteButton } from '@/components/Clipboard';
import { EmptyState, FloatingAdd, Sheet, StatusRail, UsefulnessSlider, type RailOption } from '@/components/Controls';
import { toast } from '@/components/Toast';
import { ARTICLE_STATUSES, ARTICLE_STATUS_META, type Article, type ArticleStatus } from '@/lib/types';

const STATUS_OPTIONS: RailOption<ArticleStatus>[] = ARTICLE_STATUSES.map((status) => {
  const meta = ARTICLE_STATUS_META[status];
  return {
    value: status,
    label: meta.label,
    active: `${meta.bg} ${meta.text} ${meta.ring}`,
    dot: meta.dot,
  };
});

type SortKey = 'recent' | 'usefulness' | 'status' | 'title';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'usefulness', label: 'Usefulness' },
  { value: 'status', label: 'Status' },
  { value: 'title', label: 'A–Z' },
];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Best-effort title from a URL so the form is never blocked on typing one. */
function guessTitle(url: string): string {
  try {
    const parsed = new URL(url);
    const slug = parsed.pathname.split('/').filter(Boolean).pop() ?? '';
    const cleaned = decodeURIComponent(slug)
      .replace(/\.(html?|php|aspx?|pdf)$/i, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleaned.length > 3 && !/^\d+$/.test(cleaned)) {
      return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
    }
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `a_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface FormState {
  id: string | null;
  url: string;
  title: string;
  status: ArticleStatus;
  usefulness: number;
  tags: string;
  notes: string;
}

const BLANK: FormState = {
  id: null,
  url: '',
  title: '',
  status: 'NEW',
  usefulness: 5,
  tags: '',
  notes: '',
};

export function ArticleManager({ initial }: { initial: Article[] }) {
  const [items, setItems] = useState<Article[]>(initial);
  const [sort, setSort] = useState<SortKey>('recent');
  const [filter, setFilter] = useState<ArticleStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [pending, startTransition] = useTransition();

  // Last list the server acknowledged — the rollback target.
  const committed = useRef<Article[]>(initial);
  const debounce = useRef<number | null>(null);

  function persist(next: Article[], successMessage?: string) {
    setItems(next);
    startTransition(async () => {
      const result = await saveArticles(next);
      if (result.ok) {
        committed.current = next;
        if (successMessage) toast(successMessage);
      } else {
        setItems(committed.current);
        toast(result.message, 'error');
      }
    });
  }

  /** Sliders fire continuously; only the last position is worth a commit. */
  function persistDebounced(next: Article[]) {
    setItems(next);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => persist(next), 500);
  }

  function patch(id: string, changes: Partial<Article>, immediate = true) {
    const next = items.map((item) =>
      item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item,
    );
    if (immediate) persist(next);
    else persistDebounced(next);
  }

  function remove(article: Article) {
    if (!window.confirm(`Delete "${article.title}"?`)) return;
    persist(
      items.filter((item) => item.id !== article.id),
      'Deleted',
    );
  }

  function openNew() {
    setForm(BLANK);
    setSheetOpen(true);
  }

  function openEdit(article: Article) {
    setForm({
      id: article.id,
      url: article.url,
      title: article.title,
      status: article.status,
      usefulness: article.usefulness,
      tags: article.tags.join(', '),
      notes: article.notes,
    });
    setSheetOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const title = form.title.trim() || guessTitle(form.url) || 'Untitled';
    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const now = new Date().toISOString();

    if (!form.url.trim() && !form.title.trim()) {
      toast('Add a URL or a title.', 'error');
      return;
    }

    const next = form.id
      ? items.map((item) =>
          item.id === form.id
            ? {
                ...item,
                url: form.url.trim(),
                title,
                status: form.status,
                usefulness: form.usefulness,
                tags,
                notes: form.notes.trim(),
                updatedAt: now,
              }
            : item,
        )
      : [
          {
            id: newId(),
            url: form.url.trim(),
            title,
            status: form.status,
            usefulness: form.usefulness,
            tags,
            notes: form.notes.trim(),
            createdAt: now,
            updatedAt: now,
          },
          ...items,
        ];

    persist(next, form.id ? 'Updated' : 'Added');
    setSheetOpen(false);
    setForm(BLANK);
  }

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return items
      .filter((item) => filter === 'ALL' || item.status === filter)
      .filter((item) =>
        needle
          ? `${item.title} ${item.url} ${item.tags.join(' ')} ${item.notes}`
              .toLowerCase()
              .includes(needle)
          : true,
      )
      .sort((a, b) => {
        switch (sort) {
          case 'usefulness':
            return b.usefulness - a.usefulness || a.title.localeCompare(b.title);
          case 'status':
            return (
              ARTICLE_STATUSES.indexOf(a.status) - ARTICLE_STATUSES.indexOf(b.status) ||
              b.usefulness - a.usefulness
            );
          case 'title':
            return a.title.localeCompare(b.title);
          default:
            return b.updatedAt.localeCompare(a.updatedAt);
        }
      });
  }, [items, filter, query, sort]);

  const counts = useMemo(() => {
    const map = new Map<ArticleStatus, number>();
    for (const item of items) map.set(item.status, (map.get(item.status) ?? 0) + 1);
    return map;
  }, [items]);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">
            Sources
          </h1>
          <p className="mt-1.5 font-mono text-xs text-slate-600">
            data/articles.json · {items.length} entr{items.length === 1 ? 'y' : 'ies'}
            {pending ? ' · saving…' : ''}
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary hidden md:inline-flex">
          Add source
        </button>
      </div>

      <div className="space-y-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search title, URL, tags, notes…"
          className="field"
          type="search"
        />

        <div className="rail">
          <button
            type="button"
            onClick={() => setFilter('ALL')}
            className={
              filter === 'ALL'
                ? 'pill bg-cyan-900/30 text-cyan-400 ring-cyan-400/30'
                : 'pill-idle'
            }
          >
            All
            <span className="font-mono text-xs opacity-60">{items.length}</span>
          </button>
          {ARTICLE_STATUSES.map((status) => {
            const meta = ARTICLE_STATUS_META[status];
            const selected = filter === status;
            return (
              <button
                key={status}
                type="button"
                onClick={() => setFilter(status)}
                className={selected ? `pill ${meta.bg} ${meta.text} ${meta.ring}` : 'pill-idle'}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${selected ? meta.dot : 'bg-slate-600'}`} />
                {meta.label}
                <span className="font-mono text-xs opacity-60">{counts.get(status) ?? 0}</span>
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <span className="shrink-0 font-mono text-[11px] uppercase tracking-wider text-slate-600">
            Sort
          </span>
          {SORTS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setSort(option.value)}
              className={`shrink-0 rounded-lg px-3 py-1.5 text-xs transition ${
                sort === option.value
                  ? 'bg-slate-800 text-slate-100'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'No sources yet' : 'Nothing matches'}
          body={
            items.length === 0
              ? 'Add the first paper or article. The file data/articles.json is created on your first save.'
              : 'Try a different filter or search term.'
          }
          action={
            items.length === 0 ? (
              <button type="button" onClick={openNew} className="btn-primary">
                Add your first source
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((article) => {
            const host = hostOf(article.url);
            return (
              <li key={article.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-[17px] font-semibold leading-snug text-slate-100">
                      {article.title}
                    </h3>
                    {article.url && (
                      <a
                        href={article.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[11px] text-cyan-500 hover:text-cyan-400"
                      >
                        {host || article.url}
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="h-3 w-3 shrink-0"
                        >
                          <path d="M7 17 17 7M9 7h8v8" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(article)}
                      aria-label="Edit"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-800 hover:text-slate-200"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3Z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(article)}
                      aria-label="Delete"
                      className="rounded-lg p-2 text-slate-600 transition hover:bg-rose-500/10 hover:text-rose-400"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.7"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-4 w-4"
                      >
                        <path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" />
                      </svg>
                    </button>
                  </div>
                </div>

                {article.notes && (
                  <p className="mt-3 line-clamp-3 font-serif text-sm leading-relaxed text-slate-400">
                    {article.notes}
                  </p>
                )}

                {article.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {article.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-md bg-slate-800/70 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <StatusRail
                    options={STATUS_OPTIONS}
                    value={article.status}
                    onChange={(status) => patch(article.id, { status })}
                    compact
                    ariaLabel={`Status for ${article.title}`}
                  />
                </div>

                <div className="mt-2">
                  <UsefulnessSlider
                    value={article.usefulness}
                    onChange={(usefulness) => patch(article.id, { usefulness }, false)}
                    onCommit={(usefulness) => patch(article.id, { usefulness }, false)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="md:hidden">
        <FloatingAdd onClick={openNew} label="Add source" />
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.id ? 'Edit source' : 'Add source'}
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="article-url">
              URL
            </label>
            <div className="flex gap-2">
              <input
                id="article-url"
                value={form.url}
                onChange={(event) => setForm((f) => ({ ...f, url: event.target.value }))}
                placeholder="https://arxiv.org/abs/…"
                inputMode="url"
                autoComplete="off"
                className="field"
              />
              <PasteButton
                onPaste={(text) => {
                  const url = text.trim();
                  setForm((f) => ({
                    ...f,
                    url,
                    title: f.title.trim() ? f.title : guessTitle(url),
                  }));
                }}
              />
            </div>
            <p className="mt-1.5 text-xs text-slate-600">
              Pasting a URL fills the title automatically if it is still empty.
            </p>
          </div>

          <div>
            <label className="label" htmlFor="article-title">
              Title
            </label>
            <input
              id="article-title"
              value={form.title}
              onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
              placeholder="Attention Is All You Need"
              className="field"
            />
          </div>

          <div>
            <span className="label">Status</span>
            <StatusRail
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(status) => setForm((f) => ({ ...f, status }))}
              ariaLabel="Status"
            />
          </div>

          <UsefulnessSlider
            value={form.usefulness}
            onChange={(usefulness) => setForm((f) => ({ ...f, usefulness }))}
          />

          <div>
            <label className="label" htmlFor="article-tags">
              Tags (comma separated)
            </label>
            <input
              id="article-tags"
              value={form.tags}
              onChange={(event) => setForm((f) => ({ ...f, tags: event.target.value }))}
              placeholder="transformers, survey, baseline"
              className="field font-mono text-sm"
            />
          </div>

          <div>
            <label className="label" htmlFor="article-notes">
              Notes
            </label>
            <div className="flex gap-2">
              <textarea
                id="article-notes"
                value={form.notes}
                onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
                placeholder="Why does this matter to the capstone?"
                rows={4}
                className="field resize-y"
              />
              <PasteButton
                label=""
                onPaste={(text) =>
                  setForm((f) => ({ ...f, notes: f.notes ? `${f.notes}\n${text}` : text }))
                }
                title="Append clipboard to notes"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setSheetOpen(false)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {form.id ? 'Save changes' : 'Add source'}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
