'use client';

import { useHydrated } from '../useHydrated';
import { useProgressStore } from '../progress.store';
import { lessonProgressKey } from '../progress.key';

export type ProgressItem = { key: string; label: string };

function ProgressBar({ items, compact = false }: { items: ProgressItem[]; compact?: boolean }) {
  const hydrated = useHydrated();
  const completed = useProgressStore((state) => state.completedLessons);
  const done = hydrated ? items.filter((item) => completed[item.key]).length : 0;
  const percent = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className={compact ? 'min-w-28' : 'mt-5 rounded-lg border border-border bg-surface-raised p-4'}>
      <div className="flex items-center justify-between gap-3 text-xs text-text-secondary">
        <span>{compact ? 'Progress' : 'Track your progress'}</span>
        <span className="tabular-nums">{done}/{items.length} · {percent}%</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-overlay" role="progressbar" aria-label="Completed lessons" aria-valuemin={0} aria-valuemax={100} aria-valuenow={percent}>
        <div className="h-full rounded-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}

export function ProgressSummary({ items }: { items: ProgressItem[] }) {
  return <ProgressBar items={items} />;
}

export function LessonCompletion({ item }: { item: ProgressItem }) {
  const hydrated = useHydrated();
  const done = useProgressStore((state) => state.completedLessons[item.key] ?? false);
  const setCompleted = useProgressStore((state) => state.setLessonCompleted);

  return (
    <button
      type="button"
      disabled={!hydrated}
      aria-pressed={hydrated && done}
      onClick={() => setCompleted(item.key, !done)}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-1 text-xs text-text-secondary hover:bg-surface-overlay hover:text-text-primary disabled:opacity-60"
    >
      <span aria-hidden="true" className={`flex h-4 w-4 items-center justify-center rounded border ${done ? 'border-primary bg-primary text-white' : 'border-border-strong'}`}>
        {done ? '✓' : ''}
      </span>
      {done ? 'Done' : 'Mark done'}
    </button>
  );
}
