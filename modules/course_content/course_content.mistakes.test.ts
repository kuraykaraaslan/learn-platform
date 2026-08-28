import { describe, expect, it } from 'vitest';
import { parseMistakes } from './course_content.mistakes';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';
import { splitLessonSections } from './course_content.parser';

describe('parseMistakes', () => {
  it('reads bold-dash: "- **lead** — body"', () => {
    const [m] = parseMistakes('- **Skipping the length check** — leaks timing information.');
    expect(m.form).toBe('bold-dash');
    expect(m.lead).toBe('Skipping the length check');
    expect(m.bodyHtml).toContain('leaks timing information.');
  });

  it('reads bold-colon: "- **lead**: body"', () => {
    const [m] = parseMistakes('- **Skipping the length check**: leaks timing information.');
    expect(m.form).toBe('bold-colon');
    expect(m.lead).toBe('Skipping the length check');
  });

  it('reads bold-space: "- **lead** body"', () => {
    const [m] = parseMistakes('- **Skipping the length check** leaks timing information.');
    expect(m.form).toBe('bold-space');
    expect(m.lead).toBe('Skipping the length check');
  });

  it('reads plain-dash: "- lead — body" (no bold)', () => {
    const [m] = parseMistakes('- Skipping the length check entirely — leaks timing information.');
    expect(m.form).toBe('plain-dash');
    expect(m.lead).toBe('Skipping the length check entirely');
  });

  it('falls back to single for an unstructured sentence, with an empty lead', () => {
    const [m] = parseMistakes('- Just a plain sentence with no structure at all.');
    expect(m.form).toBe('single');
    expect(m.lead).toBe('');
    expect(m.bodyHtml).toContain('Just a plain sentence');
  });

  it('prefers bold-dash over bold-colon when both could match', () => {
    // "**lead**: rest — more" — bold-colon's pattern would also match (lead
    // stops at the first `**`), but bold-dash is checked first.
    const [m] = parseMistakes('- **Rate limiting** — burst allowance is not enforced.');
    expect(m.form).toBe('bold-dash');
  });

  it('joins a wrapped bullet (continuation line with no leading "-") into one item', () => {
    const mistakes = parseMistakes(
      ['- **Skipping the length check** — leaks timing', '  information across requests.'].join('\n')
    );
    expect(mistakes).toHaveLength(1);
    expect(mistakes[0].bodyHtml).toContain('leaks timing information across requests.');
  });

  it('treats a blank line as ending an item, not merging the next bullet into it', () => {
    const mistakes = parseMistakes(['- First item.', '', '- Second item.'].join('\n'));
    expect(mistakes).toHaveLength(2);
  });

  it('ids are stable and lesson-local: "m0", "m1", ...', () => {
    const mistakes = parseMistakes(['- First item.', '- Second item.'].join('\n'));
    expect(mistakes.map((m) => m.id)).toEqual(['m0', 'm1']);
  });

  it('bodyHtml goes through the real markdown pipeline — inline code survives', () => {
    const [m] = parseMistakes('- **Wrong flag** — pass `--strict` instead.');
    expect(m.bodyHtml).toContain('<code>--strict</code>');
  });
});

// The phase spec's own ground-truth counts (1746 total, 705 drillable) were
// measured before several later content-fix commits touched Common Mistakes
// bullets — re-measuring here rather than pinning a now-stale number, per
// docs/phases/README.md's "corpus değiştikçe yeniden ölçün" rule. What's
// worth locking down mechanically: the parser doesn't drop or duplicate
// bullets, and the corpus is still overwhelmingly structured (not 'single').
describe('parseMistakes across the corpus', () => {
  it('accounts for every "- " bullet line under Common Mistakes exactly once, and most are drillable', () => {
    let rawBulletLines = 0;
    let parsedItems = 0;
    let drillable = 0;

    for (const courseSlug of listCourseSlugs()) {
      for (const item of readCourseManifest(courseSlug).items) {
        const raw = readLessonMarkdown(courseSlug, item.file);
        const { sections } = splitLessonSections(raw);
        for (const line of sections.commonMistakes.split('\n')) {
          if (/^-\s+/.test(line)) rawBulletLines++;
        }
        const mistakes = parseMistakes(sections.commonMistakes);
        parsedItems += mistakes.length;
        drillable += mistakes.filter((m) => m.form !== 'single').length;
      }
    }

    expect(parsedItems).toBe(rawBulletLines);
    // Floor only, no ceiling: docs/phases/02-bold-lead-pass.md's entire job
    // is raising this ratio, batch by batch, from an original ~0.41 toward
    // its target (single count corpus-wide down to <=250, i.e. a drillable
    // ratio around 0.86) — an upper bound here would need editing every
    // time that deliberate, ongoing content work landed a batch, the same
    // problem P1/P3 already hit with hardcoded exact counts instead of
    // bounds. The floor still catches a real regression: parseMistakes
    // suddenly classifying almost nothing as drillable.
    expect(drillable / parsedItems).toBeGreaterThan(0.35);
  });
});
