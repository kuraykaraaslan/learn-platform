import { describe, expect, it } from 'vitest';
import {
  useProgressStore,
  partializeProgress,
  mistakeKey,
  lessonKey,
  widgetFieldKey,
  editorKey,
  exportProgressJson,
  importProgressJson,
  BOX_INTERVAL_DAYS,
} from './progress.store';

describe('useProgressStore', () => {
  it('persists exactly {mistake, reviewBox, expandAll, templateValues, checklistChecked, editors} — adding a field like "completed" must fail this test', () => {
    // reviewBox (added for P12's Return Queue) is per-item spaced-repetition
    // scheduling — a box number and a next-review date keyed identically to
    // `mistake` — never rendered as a score, streak, or completion percentage.
    // It is not the kind of field this guard exists to block; everything else
    // added here still fails the same way "completed" always would have.
    const persisted = partializeProgress(useProgressStore.getState());
    expect(Object.keys(persisted).sort()).toEqual([
      'checklistChecked',
      'editors',
      'expandAll',
      'mistake',
      'reviewBox',
      'templateValues',
    ]);
  });

  it('is named "learn:v1", version 1', () => {
    const options = useProgressStore.persist.getOptions();
    expect(options.name).toBe('learn:v1');
    expect(options.version).toBe(1);
  });

  it('mistakeKey composes courseSlug/lessonFile#mistakeId', () => {
    expect(mistakeKey('security', '34_timing_attack.md', 'm2')).toBe('security/34_timing_attack.md#m2');
  });

  it('lessonKey composes courseSlug/lessonFile with no block segment', () => {
    expect(lessonKey('security', '34_timing_attack.md')).toBe('security/34_timing_attack.md');
  });

  it('setMistakeAssessment writes under the given key without touching other keys', () => {
    const key = mistakeKey('security', '34_timing_attack.md', 'm0');
    useProgressStore.getState().setMistakeAssessment(key, 'missed');
    expect(useProgressStore.getState().mistake[key]).toBe('missed');

    useProgressStore.getState().setMistakeAssessment(key, 'knew');
    expect(useProgressStore.getState().mistake[key]).toBe('knew');
    expect(Object.keys(useProgressStore.getState().mistake)).toHaveLength(1);
  });

  it('re-setting a key bumps it to the end (LRU recency — see quota.ts eviction)', () => {
    useProgressStore.setState({ mistake: {}, expandAll: {} });
    const { setMistakeAssessment } = useProgressStore.getState();
    setMistakeAssessment('a', 'knew');
    setMistakeAssessment('b', 'knew');
    setMistakeAssessment('a', 'partial'); // touch 'a' again — should move to the end
    expect(Object.keys(useProgressStore.getState().mistake)).toEqual(['b', 'a']);
  });

  it('setExpandAll is keyed per lesson, independent of the mistake map', () => {
    const key = lessonKey('security', '34_timing_attack.md');
    useProgressStore.getState().setExpandAll(key, true);
    expect(useProgressStore.getState().expandAll[key]).toBe(true);
  });

  it('widgetFieldKey composes courseSlug/lessonFile#blockId:fieldId', () => {
    expect(widgetFieldKey('contracts-pricing-legal', '205_hourly.md', 'exampleCode-1', 'f0')).toBe(
      'contracts-pricing-legal/205_hourly.md#exampleCode-1:f0'
    );
  });

  it('setTemplateValue and setChecklistChecked write independent maps', () => {
    const key = widgetFieldKey('contracts-pricing-legal', '205_hourly.md', 'exampleCode-1', 'f0');
    useProgressStore.getState().setTemplateValue(key, '150');
    expect(useProgressStore.getState().templateValues[key]).toBe('150');

    useProgressStore.getState().setChecklistChecked(key, true);
    expect(useProgressStore.getState().checklistChecked[key]).toBe(true);
    // Setting one never touches the other.
    expect(useProgressStore.getState().templateValues[key]).toBe('150');
  });

  it('editorKey composes courseSlug/lessonFile#blockId, with no field segment', () => {
    expect(editorKey('architecture-design-patterns-testing', '68_big_o_analysis.md', 'exampleCode-0')).toBe(
      'architecture-design-patterns-testing/68_big_o_analysis.md#exampleCode-0'
    );
  });

  it('setEditorValue persists an edited buffer independent of the other maps', () => {
    const key = editorKey('architecture-design-patterns-testing', '68_big_o_analysis.md', 'exampleCode-0');
    useProgressStore.getState().setEditorValue(key, 'console.log("edited");');
    expect(useProgressStore.getState().editors[key]).toBe('console.log("edited");');
  });
});

describe('reviewBox (P12 Return Queue scheduling)', () => {
  function daysFromToday(days: number): string {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  it('"missed" always resets to box 0, reviewed tomorrow', () => {
    const key = mistakeKey('security', '30_sql_injection.md', 'm0');
    useProgressStore.getState().setMistakeAssessment(key, 'knew');
    useProgressStore.getState().setMistakeAssessment(key, 'knew'); // graduate to box 2
    useProgressStore.getState().setMistakeAssessment(key, 'missed'); // reset
    const entry = useProgressStore.getState().reviewBox[key];
    expect(entry.box).toBe(0);
    expect(entry.nextReviewAt).toBe(daysFromToday(BOX_INTERVAL_DAYS[0]));
  });

  it('"knew" graduates one box at a time, capped at the last box', () => {
    const key = mistakeKey('security', '30_sql_injection.md', 'm1');
    const { setMistakeAssessment } = useProgressStore.getState();
    expect(useProgressStore.getState().reviewBox[key]).toBeUndefined();

    setMistakeAssessment(key, 'knew');
    expect(useProgressStore.getState().reviewBox[key].box).toBe(0);
    setMistakeAssessment(key, 'knew');
    expect(useProgressStore.getState().reviewBox[key].box).toBe(1);

    for (let i = 0; i < 10; i++) setMistakeAssessment(key, 'knew');
    expect(useProgressStore.getState().reviewBox[key].box).toBe(BOX_INTERVAL_DAYS.length - 1);
  });

  it('"partial" stays at the current box instead of resetting or graduating', () => {
    const key = mistakeKey('security', '30_sql_injection.md', 'm2');
    const { setMistakeAssessment } = useProgressStore.getState();
    setMistakeAssessment(key, 'knew');
    setMistakeAssessment(key, 'knew'); // box 1
    setMistakeAssessment(key, 'partial');
    expect(useProgressStore.getState().reviewBox[key].box).toBe(1);
  });
});

describe('exportProgressJson / importProgressJson', () => {
  it('round-trips: export, clear, import — the data comes back', () => {
    const key = mistakeKey('security', '30_sql_injection.md', 'm0');
    useProgressStore.getState().setMistakeAssessment(key, 'missed');
    const json = exportProgressJson();

    useProgressStore.setState({ mistake: {}, reviewBox: {} });
    expect(useProgressStore.getState().mistake[key]).toBeUndefined();

    const result = importProgressJson(json);
    expect(result.ok).toBe(true);
    expect(useProgressStore.getState().mistake[key]).toBe('missed');
    expect(useProgressStore.getState().reviewBox[key].box).toBe(0);
  });

  it('merges rather than replaces — a locally-added key not in the import survives', () => {
    useProgressStore.setState({ mistake: {} });
    const otherKey = mistakeKey('security', '31_mass_assignment.md', 'm0');
    useProgressStore.getState().setMistakeAssessment(otherKey, 'knew');

    const json = exportProgressJson(); // captures otherKey
    useProgressStore.getState().setMistakeAssessment(mistakeKey('security', '32_x.md', 'm0'), 'missed'); // added after export

    importProgressJson(json);
    // The key added after the export was taken must still be there — import
    // merges into current state, it doesn't reset to the export's snapshot.
    expect(useProgressStore.getState().mistake[otherKey]).toBe('knew');
    expect(useProgressStore.getState().mistake[mistakeKey('security', '32_x.md', 'm0')]).toBe('missed');
  });

  it('rejects invalid JSON without throwing', () => {
    const result = importProgressJson('not json{');
    expect(result.ok).toBe(false);
  });

  it('rejects a well-formed JSON value that is not an object', () => {
    const result = importProgressJson('[1,2,3]');
    expect(result.ok).toBe(false);
  });

  it('rejects an object with none of the recognized progress fields', () => {
    const result = importProgressJson(JSON.stringify({ someUnrelatedField: 1 }));
    expect(result.ok).toBe(false);
  });
});
