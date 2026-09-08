import { describe, expect, it } from 'vitest';
import {
  buildCheatSheet,
  cheatSheetBytes,
  MAX_CHEATSHEET_BYTES,
} from './course_content.cheatsheet';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';

const slugs = listCourseSlugs();

describe('buildCheatSheet', () => {
  it('covers every course and keeps the manifest order', () => {
    for (const slug of slugs) {
      const sheet = buildCheatSheet(slug);
      const ids = sheet.lessons.map((l) => l.id);
      expect(ids).toEqual([...ids].sort((a, b) => a - b));
      expect(ids).toHaveLength(readCourseManifest(slug).items.length);
    }
  });

  it('carries at least one bullet for nearly every lesson', () => {
    const empty = slugs.flatMap((slug) =>
      buildCheatSheet(slug).lessons.filter((l) => l.concepts.length === 0 && l.mistakes.length === 0)
    );
    // A lesson can legitimately have neither (a boundary lesson with no
    // Common Mistakes drills, for instance) — but it should be rare enough to
    // notice if it stops being.
    expect(empty.length).toBeLessThanOrEqual(2);
  });
});

// The contract docs/investigate/04-roadmap.md set for this feature: the cheat
// sheet is a mechanical selection, "asla yeniden özetleyen bir AI geçişiyle
// değil". This test is what makes that enforceable rather than aspirational —
// if any string on the page stops being a literal substring of the lesson it
// came from, the page has started summarising and this fails.
describe('the verbatim contract', () => {
  it('prints nothing that is not already in the lesson it names', () => {
    const offenders: string[] = [];

    for (const slug of slugs) {
      const manifest = readCourseManifest(slug);
      const sheet = buildCheatSheet(slug);

      for (const lesson of sheet.lessons) {
        const item = manifest.items.find((i) => i.id === lesson.id)!;
        const raw = readLessonMarkdown(slug, item.file);

        for (const line of [...lesson.concepts, ...lesson.mistakes]) {
          // Bullets that wrap across source lines are rejoined with a single
          // space by splitBulletItems, so compare on collapsed whitespace.
          const collapsed = raw.replace(/\s+/g, ' ');
          if (!collapsed.includes(line.replace(/\s+/g, ' '))) {
            offenders.push(`${slug}/${item.file}: ${line.slice(0, 60)}`);
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it('never carries a mistake body, only its lead', () => {
    // parseMistakes returns bodyHtml too; taking it would turn a reminder into
    // a re-telling, and would put rendered HTML on a page that renders none.
    const source = new URL('./course_content.cheatsheet.ts', import.meta.url);
    const text = require('node:fs').readFileSync(source, 'utf-8');
    expect(text).not.toContain('bodyHtml');
  });
});

describe('size', () => {
  it('keeps every course under the cap, and names the largest', () => {
    const measured = slugs
      .map((slug) => ({ slug, bytes: cheatSheetBytes(buildCheatSheet(slug)) }))
      .sort((a, b) => b.bytes - a.bytes);

    expect(measured[0].bytes).toBeLessThan(MAX_CHEATSHEET_BYTES);
    // Recorded so a future growth spurt is a readable failure rather than a
    // mysterious one: this is the course that will hit the cap first.
    expect(measured[0].slug).toBe('content-seo-personal-brand');
  });
});
