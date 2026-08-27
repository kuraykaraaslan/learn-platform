import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createQuotaSafeStorage } from './quota';

export type MistakeAssessment = 'knew' | 'partial' | 'missed';

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

type PersistedProgress = {
  mistake: Record<string, MistakeAssessment>;
  expandAll: Record<string, boolean>;
  /** ui/widgets/TemplateFormCard.tsx field values, keyed by widgetFieldKey(). */
  templateValues: Record<string, string>;
  /** ui/widgets/ChecklistCard.tsx (and a template's own checkbox lines) item
   *  state, keyed by widgetFieldKey(). */
  checklistChecked: Record<string, boolean>;
};

type ProgressState = PersistedProgress & {
  setMistakeAssessment: (key: string, value: MistakeAssessment) => void;
  setExpandAll: (key: string, value: boolean) => void;
  setTemplateValue: (key: string, value: string) => void;
  setChecklistChecked: (key: string, value: boolean) => void;
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

// Actions are never persisted, only these four data maps — and that's
// exactly what progress.store.test.ts pins: the persisted key set is
// {checklistChecked, expandAll, mistake, templateValues}. Deliberately no
// completed/streak/percentage field — see docs/phases/README.md's
// invariants. Exported (rather than left inline in the persist() call below)
// so the test can call it directly with a real type, instead of fighting
// zustand's persist generics through `.persist.getOptions()`.
export function partializeProgress(state: ProgressState): PersistedProgress {
  return {
    mistake: state.mistake,
    expandAll: state.expandAll,
    templateValues: state.templateValues,
    checklistChecked: state.checklistChecked,
  };
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      mistake: {},
      expandAll: {},
      templateValues: {},
      checklistChecked: {},
      setMistakeAssessment: (key, value) => set((state) => ({ mistake: touch(state.mistake, key, value) })),
      setExpandAll: (key, value) => set((state) => ({ expandAll: touch(state.expandAll, key, value) })),
      setTemplateValue: (key, value) => set((state) => ({ templateValues: touch(state.templateValues, key, value) })),
      setChecklistChecked: (key, value) =>
        set((state) => ({ checklistChecked: touch(state.checklistChecked, key, value) })),
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
