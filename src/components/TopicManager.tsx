'use client';

import { useMemo, useRef, useState, useTransition } from 'react';

import { saveTopics } from '@/app/actions';
import { PasteButton } from '@/components/Clipboard';
import { EmptyState, FloatingAdd, Sheet, StatusRail, UsefulnessSlider, type RailOption } from '@/components/Controls';
import { toast } from '@/components/Toast';
import { TOPIC_STATUSES, TOPIC_STATUS_META, type Topic, type TopicStatus } from '@/lib/types';

const STATUS_OPTIONS: RailOption<TopicStatus>[] = TOPIC_STATUSES.map((status) => {
  const meta = TOPIC_STATUS_META[status];
  return {
    value: status,
    label: meta.short,
    active: `${meta.bg} ${meta.text} ${meta.ring}`,
    dot: meta.dot,
  };
});

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `t_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

interface FormState {
  id: string | null;
  name: string;
  status: TopicStatus;
  usefulness: number;
  tags: string;
  notes: string;
}

const BLANK: FormState = {
  id: null,
  name: '',
  status: 'DONT_UNDERSTAND',
  usefulness: 5,
  tags: '',
  notes: '',
};

export function TopicManager({ initial }: { initial: Topic[] }) {
  const [items, setItems] = useState<Topic[]>(initial);
  const [filter, setFilter] = useState<TopicStatus | 'ALL'>('ALL');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [form, setForm] = useState<FormState>(BLANK);
  const [pending, startTransition] = useTransition();

  const committed = useRef<Topic[]>(initial);
  const debounce = useRef<number | null>(null);

  function persist(next: Topic[], successMessage?: string) {
    setItems(next);
    startTransition(async () => {
      const result = await saveTopics(next);
      if (result.ok) {
        committed.current = next;
        if (successMessage) toast(successMessage);
      } else {
        setItems(committed.current);
        toast(result.message, 'error');
      }
    });
  }

  function persistDebounced(next: Topic[]) {
    setItems(next);
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => persist(next), 500);
  }

  function patch(id: string, changes: Partial<Topic>, immediate = true) {
    const next = items.map((item) =>
      item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item,
    );
    if (immediate) persist(next);
    else persistDebounced(next);
  }

  function remove(topic: Topic) {
    if (!window.confirm(`Delete "${topic.name}"?`)) return;
    persist(
      items.filter((item) => item.id !== topic.id),
      'Deleted',
    );
  }

  function openNew() {
    setForm(BLANK);
    setSheetOpen(true);
  }

  function openEdit(topic: Topic) {
    setForm({
      id: topic.id,
      name: topic.name,
      status: topic.status,
      usefulness: topic.usefulness,
      tags: topic.tags.join(', '),
      notes: topic.notes,
    });
    setSheetOpen(true);
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();

    const name = form.name.trim();
    if (!name) {
      toast('Give the topic a name.', 'error');
      return;
    }

    const tags = form.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const now = new Date().toISOString();

    const next = form.id
      ? items.map((item) =>
          item.id === form.id
            ? {
                ...item,
                name,
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
            name,
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

  const visible = useMemo(
    () =>
      items
        .filter((item) => filter === 'ALL' || item.status === filter)
        // Biggest gaps first: unknown before known, then by importance.
        .sort(
          (a, b) =>
            TOPIC_STATUSES.indexOf(a.status) - TOPIC_STATUSES.indexOf(b.status) ||
            b.usefulness - a.usefulness ||
            a.name.localeCompare(b.name),
        ),
    [items, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<TopicStatus, number>();
    for (const item of items) map.set(item.status, (map.get(item.status) ?? 0) + 1);
    return map;
  }, [items]);

  const understood = counts.get('UNDERSTAND') ?? 0;
  const progress = items.length ? Math.round((understood / items.length) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-slate-100">Topics</h1>
          <p className="mt-1.5 font-mono text-xs text-slate-600">
            data/topics.json · {understood}/{items.length} understood{pending ? ' · saving…' : ''}
          </p>
        </div>
        <button type="button" onClick={openNew} className="btn-primary hidden md:inline-flex">
          Add topic
        </button>
      </div>

      {items.length > 0 && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-800">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      <div className="rail">
        <button
          type="button"
          onClick={() => setFilter('ALL')}
          className={filter === 'ALL' ? 'pill bg-cyan-900/30 text-cyan-400 ring-cyan-400/30' : 'pill-idle'}
        >
          All
          <span className="font-mono text-xs opacity-60">{items.length}</span>
        </button>
        {TOPIC_STATUSES.map((status) => {
          const meta = TOPIC_STATUS_META[status];
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

      {visible.length === 0 ? (
        <EmptyState
          title={items.length === 0 ? 'No topics yet' : 'Nothing matches'}
          body={
            items.length === 0
              ? 'Log every concept the capstone depends on, then mark off the ones you actually understand.'
              : 'Try a different filter.'
          }
          action={
            items.length === 0 ? (
              <button type="button" onClick={openNew} className="btn-primary">
                Add your first topic
              </button>
            ) : null
          }
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((topic) => (
            <li key={topic.id} className="card p-4">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-serif text-[17px] font-semibold leading-snug text-slate-100">
                    {topic.name}
                  </h3>
                  {topic.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {topic.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-slate-800/70 px-2 py-0.5 font-mono text-[10px] text-slate-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(topic)}
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
                    onClick={() => remove(topic)}
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

              {topic.notes && (
                <p className="mt-3 line-clamp-3 font-serif text-sm leading-relaxed text-slate-400">
                  {topic.notes}
                </p>
              )}

              <div className="mt-4">
                <StatusRail
                  options={STATUS_OPTIONS}
                  value={topic.status}
                  onChange={(status) => patch(topic.id, { status })}
                  compact
                  ariaLabel={`Status for ${topic.name}`}
                />
              </div>

              <div className="mt-2">
                <UsefulnessSlider
                  label="Importance"
                  value={topic.usefulness}
                  onChange={(usefulness) => patch(topic.id, { usefulness }, false)}
                  onCommit={(usefulness) => patch(topic.id, { usefulness }, false)}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="md:hidden">
        <FloatingAdd onClick={openNew} label="Add topic" />
      </div>

      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={form.id ? 'Edit topic' : 'Add topic'}
      >
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label className="label" htmlFor="topic-name">
              Topic
            </label>
            <div className="flex gap-2">
              <input
                id="topic-name"
                value={form.name}
                onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))}
                placeholder="Variational inference"
                className="field"
                autoFocus
              />
              <PasteButton
                label=""
                onPaste={(text) => setForm((f) => ({ ...f, name: text.trim().slice(0, 120) }))}
                title="Paste topic name"
              />
            </div>
          </div>

          <div>
            <span className="label">Do you understand it?</span>
            <StatusRail
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(status) => setForm((f) => ({ ...f, status }))}
              ariaLabel="Understanding"
            />
          </div>

          <UsefulnessSlider
            label="Importance to the capstone"
            value={form.usefulness}
            onChange={(usefulness) => setForm((f) => ({ ...f, usefulness }))}
          />

          <div>
            <label className="label" htmlFor="topic-tags">
              Tags (comma separated)
            </label>
            <input
              id="topic-tags"
              value={form.tags}
              onChange={(event) => setForm((f) => ({ ...f, tags: event.target.value }))}
              placeholder="statistics, prerequisite"
              className="field font-mono text-sm"
            />
          </div>

          <div>
            <label className="label" htmlFor="topic-notes">
              Notes
            </label>
            <div className="flex gap-2">
              <textarea
                id="topic-notes"
                value={form.notes}
                onChange={(event) => setForm((f) => ({ ...f, notes: event.target.value }))}
                placeholder="What specifically is unclear? What resource explained it best?"
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
            <button type="button" onClick={() => setSheetOpen(false)} className="btn-ghost flex-1">
              Cancel
            </button>
            <button type="submit" className="btn-primary flex-1">
              {form.id ? 'Save changes' : 'Add topic'}
            </button>
          </div>
        </form>
      </Sheet>
    </div>
  );
}
