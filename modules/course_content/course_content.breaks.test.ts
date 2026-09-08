import { describe, expect, it } from 'vitest';
import { listFences } from './course_content.fences';
import { listCourseSlugs, readCourseManifest } from './course_content.manifest';
import { parseBreaks, provableLines, symptomHasNumber } from './course_content.breaks';

const ENTRY = `
entries:
  - symptom: "A query that took 20 ms takes 9 s."
    instinct: "The index is missing."
    look: "EXPLAIN ..."
    see: |-
      ->  Seq Scan on readings (actual rows=60.00 loops=1)
    why: "The predicate is on a function of the column."
    knob: "Rewrite it as a range."
`;

const breaksFences = listFences().filter((f) => f.lang === 'breaks');
const proofsByLesson = new Map<string, Set<string>>();
for (const fence of listFences().filter((f) => f.lang === 'proof')) {
  const key = `${fence.courseSlug}/${fence.file}`;
  const lines = proofsByLesson.get(key) ?? new Set<string>();
  for (const line of fence.code.split('\n')) lines.add(line.trim());
  proofsByLesson.set(key, lines);
}

describe('parseBreaks', () => {
  it('reads the four beats plus the instinct the reader commits against', () => {
    const widget = parseBreaks(ENTRY);
    expect(widget.type).toBe('breaks');
    expect(widget.entries).toHaveLength(1);
    expect(widget.entries[0].knob).toBe('Rewrite it as a range.');
  });

  it('rejects a fourth entry — the roadmap caps a lesson at three', () => {
    const one = ENTRY.slice(ENTRY.indexOf('  - symptom:'));
    expect(() => parseBreaks(`entries:\n${one}${one}${one}${one}`)).toThrow();
  });

  it('rejects an entry missing any beat', () => {
    expect(() =>
      parseBreaks('entries:\n  - symptom: "s"\n    instinct: "i"\n    look: "l"\n    see: "o"\n    why: "w"\n')
    ).toThrow();
  });
});

describe('provableLines', () => {
  it('drops blank lines — a blank line carries no claim to prove', () => {
    expect(provableLines('a\n\n  b  \n')).toEqual(['a', 'b']);
  });
});

describe('symptomHasNumber', () => {
  it('is the difference between "it got slow" and a report you can compare against', () => {
    expect(symptomHasNumber('It got slow.')).toBe(false);
    expect(symptomHasNumber('It went from 20 ms to 9 s.')).toBe(true);
  });
});

describe('every `see` block in the corpus', () => {
  // The same contract breaks/see-not-proven enforces, asserted here as well so
  // the lint rule and the corpus cannot quietly drift apart — and so that a
  // fabricated line fails `npm test`, not only `content:lint`.
  // docs/phases/44-how-it-breaks.md.
  it('is quoted verbatim from a proof fence in its own lesson', () => {
    const offenders: string[] = [];
    for (const fence of breaksFences) {
      const proven = proofsByLesson.get(`${fence.courseSlug}/${fence.file}`) ?? new Set<string>();
      for (const entry of parseBreaks(fence.code).entries) {
        for (const line of provableLines(entry.see)) {
          if (!proven.has(line)) offenders.push(`${fence.courseSlug}/${fence.file}: ${line}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('sits only on verified lessons, and there is at least one to check', () => {
    // Invariant #3, asserted from the manifest rather than the fence: a
    // diagnosis is an exercise, and an exercise inherits the correctness of
    // what it sits on.
    const verified = new Map<string, boolean>();
    for (const slug of listCourseSlugs()) {
      for (const item of readCourseManifest(slug).items) verified.set(`${slug}/${item.file}`, item.verified === true);
    }
    expect(breaksFences.length).toBeGreaterThan(0);
    for (const fence of breaksFences) {
      const key = `${fence.courseSlug}/${fence.file}`;
      expect(verified.get(key), key).toBe(true);
    }
  });
});
