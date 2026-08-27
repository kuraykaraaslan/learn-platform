import { describe, expect, it } from 'vitest';
import { useProgressStore, partializeProgress, mistakeKey, lessonKey } from './progress.store';

describe('useProgressStore', () => {
  it('persists exactly {mistake, expandAll} — adding a third field (e.g. "completed") must fail this test', () => {
    const persisted = partializeProgress(useProgressStore.getState());
    expect(Object.keys(persisted).sort()).toEqual(['expandAll', 'mistake']);
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
});
