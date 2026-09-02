import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createQuotaSafeStorage } from './quota';

export type MistakeAssessment = 'knew' | 'partial' | 'missed';

/** P12 Return Queue (docs/phases/12-search-and-review-queue.md): 5 boxes,
 *  index 0..4, each named by its own review interval in days — box 0
 *  reviews tomorrow, box 4 (the longest) reviews in two months. No
 *  progress/completion semantics: this is per-item scheduling data for a
 *  spaced-repetition queue, not a metric the reader is shown as a score. */
export const BOX_INTERVAL_DAYS = [1, 3, 7, 21, 60] as const;

export type ReviewBoxEntry = { box: number; nextReviewAt: string };

function todayPlusDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** `missed` always resets to box 0 (review tomorrow) regardless of where it
 *  was — that's the whole mechanism: the Return Queue only exists to
 *  resurface exactly the things you said you missed. `knew` graduates one
 *  box (capped at the last). `partial` neither resets nor graduates — it
 *  stays at its current box, reviewed again at that same box's interval. */
function nextReviewBox(current: ReviewBoxEntry | undefined, assessment: MistakeAssessment): ReviewBoxEntry {
  let box: number;
  if (assessment === 'missed') box = 0;
  else if (assessment === 'knew') box = Math.min((current?.box ?? -1) + 1, BOX_INTERVAL_DAYS.length - 1);
  else box = current?.box ?? 0;
  return { box, nextReviewAt: todayPlusDays(BOX_INTERVAL_DAYS[box]) };
}

/** `<courseSlug>/<lessonFile>#<mistakeId>` — the composite key every
 *  per-mistake self-assessment is stored under. */
export function mistakeKey(courseSlug: string, lessonFile: string, mistakeId: string): string {
  return `${courseSlug}/${lessonFile}#${mistakeId}`;
}

/** `<courseSlug>/<lessonFile>` — the composite key a lesson-scoped (not
 *  block-scoped) preference like "expand all" is stored under. */
export function lessonKey(courseSlug: string, lessonFile: string): string {
  return `${courseSlug}/${lessonFile}`;
}

/** `<courseSlug>/<lessonFile>#<blockId>:<fieldId>` — one template field or
 *  checklist item's value. blockId is included (not just the field/item's
 *  own local id) because a lesson can hold several widget blocks across
 *  different sections, each restarting its own "f0", "c0", ... counter. */
export function widgetFieldKey(courseSlug: string, lessonFile: string, blockId: string, fieldId: string): string {
  return `${courseSlug}/${lessonFile}#${blockId}:${fieldId}`;
}

/** `<courseSlug>/<lessonFile>#<blockId>` — a `run` code block's edited
 *  buffer. Block-scoped, not field-scoped: there's exactly one editable
 *  source per runnable block. */
export function editorKey(courseSlug: string, lessonFile: string, blockId: string): string {
  return `${courseSlug}/${lessonFile}#${blockId}`;
}

type PersistedProgress = {
  mistake: Record<string, MistakeAssessment>;
  /** P12: Leitner box + next review date, keyed identically to `mistake`
   *  (same mistakeKey) — no deck of its own, this is purely the schedule
   *  for replaying `mistake`'s own entries. Written only as a side effect
   *  of setMistakeAssessment, never set directly. */
  reviewBox: Record<string, ReviewBoxEntry>;
  expandAll: Record<string, boolean>;
  /** ui/widgets/TemplateFormCard.tsx and ui/widgets/CalcCard.tsx field
   *  values, keyed by widgetFieldKey(). Shared rather than split: both are
   *  string field values under the same key shape, and quota.ts's LRU
   *  eviction already walks this one map. */
  templateValues: Record<string, string>;
  /** ui/widgets/ChecklistCard.tsx (and a template's own checkbox lines) item
   *  state, keyed by widgetFieldKey(). */
  checklistChecked: Record<string, boolean>;
  /** ui/RunMount.tsx edited source per runnable code block, keyed by
   *  editorKey(). Restoring this buffer on load never auto-runs it — Run is
   *  always an explicit click (docs/phases/08-live-js-runner.md). */
  editors: Record<string, string>;
};

type ProgressState = PersistedProgress & {
  setMistakeAssessment: (key: string, value: MistakeAssessment) => void;
  setExpandAll: (key: string, value: boolean) => void;
  setTemplateValue: (key: string, value: string) => void;
  setChecklistChecked: (key: string, value: boolean) => void;
  setEditorValue: (key: string, value: string) => void;
};

/** Bumps `key` to the end of `map` (most-recently-touched) by deleting and
 *  reinserting it — quota.ts's LRU eviction relies on plain object insertion
 *  order standing in for a touched-at timestamp, so every write goes through
 *  this instead of a bare property assignment. */
function touch<V>(map: Record<string, V>, key: string, value: V): Record<string, V> {
  const next = { ...map };
  delete next[key];
  next[key] = value;
  return next;
}

// Actions are never persisted, only these six data maps — and that's
// exactly what progress.store.test.ts pins: the persisted key set is
// {checklistChecked, editors, expandAll, mistake, reviewBox, templateValues}.
// Deliberately no completed/streak/percentage field — see
// docs/phases/README.md's invariants; reviewBox is per-item spaced-
// repetition scheduling, not a metric, and the pinned test's own comment
// explains why it's not the same kind of field the guard exists to block.
// Exported (rather than left inline in the persist() call below) so the
// test can call it directly with a real type, instead of fighting
// zustand's persist generics through `.persist.getOptions()`.
export function partializeProgress(state: ProgressState): PersistedProgress {
  return {
    mistake: state.mistake,
    reviewBox: state.reviewBox,
    expandAll: state.expandAll,
    templateValues: state.templateValues,
    checklistChecked: state.checklistChecked,
    editors: state.editors,
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      mistake: {},
      reviewBox: {},
      expandAll: {},
      templateValues: {},
      checklistChecked: {},
      editors: {},
      setMistakeAssessment: (key, value) =>
        set((state) => ({
          mistake: touch(state.mistake, key, value),
          reviewBox: touch(state.reviewBox, key, nextReviewBox(state.reviewBox[key], value)),
        })),
      setExpandAll: (key, value) => set((state) => ({ expandAll: touch(state.expandAll, key, value) })),
      setTemplateValue: (key, value) => set((state) => ({ templateValues: touch(state.templateValues, key, value) })),
      setChecklistChecked: (key, value) =>
        set((state) => ({ checklistChecked: touch(state.checklistChecked, key, value) })),
      setEditorValue: (key, value) => set((state) => ({ editors: touch(state.editors, key, value) })),
    }),
    {
      name: 'learn:v1',
      version: 1,
      storage: createJSONStorage(createQuotaSafeStorage),
      // Identity migration for the only version that has ever shipped — in
      // place from day one so a real v2 has somewhere to add a branch,
      // instead of retrofitting migrate() onto a store already in the wild.
      migrate: (persisted) => persisted as PersistedProgress,
      partialize: partializeProgress,
    }
  )
);

const PERSISTED_KEYS = ['mistake', 'reviewBox', 'expandAll', 'templateValues', 'checklistChecked', 'editors'] as const;

/** All of localStorage's actual content, not just an in-app summary — the
 *  Return Queue's box schedule lives only in this store (docs/phases/12
 *  calls JSON export/import "zorunlu" specifically because of that: with
 *  no server and no account, a browser data wipe is otherwise permanent
 *  loss of every self-assessment and its schedule). */
export function exportProgressJson(): string {
  return JSON.stringify(partializeProgress(useProgressStore.getState()), null, 2);
}

export type ImportResult = { ok: true } | { ok: false; error: string };

/** Merges rather than replaces: an imported map's keys overwrite matching
 *  local keys, but a key only present locally survives. Restoring an old
 *  export should never silently erase progress made since that backup was
 *  taken. */
export function importProgressJson(json: string): ImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    return { ok: false, error: 'Not valid JSON.' };
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, error: 'Expected a JSON object.' };
  }

  const incoming = parsed as Record<string, unknown>;
  const patch: Partial<PersistedProgress> = {};
  for (const key of PERSISTED_KEYS) {
    const value = incoming[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      patch[key] = { ...useProgressStore.getState()[key], ...(value as Record<string, never>) } as never;
    }
  }
  if (Object.keys(patch).length === 0) {
    return { ok: false, error: 'No recognized progress fields found in this file.' };
  }

  useProgressStore.setState(patch);
  return { ok: true };
}
