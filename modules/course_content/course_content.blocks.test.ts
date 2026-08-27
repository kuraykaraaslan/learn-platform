import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';
import { markdownToHast, markdownToHtml } from './course_content.markdown';
import { splitBlocks, type LessonBlock } from './course_content.blocks';
import { splitLessonSections, parseLessonBlocks } from './course_content.parser';
import { listFences } from './course_content.fences';
import type { LessonSections } from './course_content.types';
import { LessonSectionCard, PROSE_CLASSES } from './ui/LessonSectionCard';

const SECTION_KEYS: (keyof LessonSections)[] = [
  'whatItIs',
  'keyConcepts',
  'exampleCode',
  'whenToUse',
  'commonMistakes',
  'furtherReading',
];

function isCodeBlock(b: LessonBlock): b is Extract<LessonBlock, { kind: 'code' }> {
  return b.kind === 'code';
}

function eachLesson(): { courseSlug: string; file: string; raw: string }[] {
  const out: { courseSlug: string; file: string; raw: string }[] = [];
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      out.push({ courseSlug, file: item.file, raw: readLessonMarkdown(courseSlug, item.file) });
    }
  }
  return out;
}

describe('splitBlocks', () => {
  it('is equivalent to markdownToHtml when its blocks are joined back together, for every lesson section in the corpus', () => {
    for (const { courseSlug, file, raw } of eachLesson()) {
      const { sections } = splitLessonSections(raw);
      for (const key of SECTION_KEYS) {
        const markdown = sections[key];
        const joined = splitBlocks(markdownToHast(markdown), key)
          .map((b) => b.html)
          .join('');
        expect({ [`${courseSlug}/${file}#${key}`]: joined }).toEqual({
          [`${courseSlug}/${file}#${key}`]: markdownToHtml(markdown),
        });
      }
    }
  });

  it("gives every 'code'/'widget' block a source equal to the fence listFences() extracted for that lesson", () => {
    const fencesByLesson = new Map<string, string[]>();
    for (const fence of listFences()) {
      const key = `${fence.courseSlug}/${fence.file}`;
      const list = fencesByLesson.get(key) ?? [];
      list.push(fence.code);
      fencesByLesson.set(key, list);
    }

    for (const { courseSlug, file, raw } of eachLesson()) {
      const key = `${courseSlug}/${file}`;
      const expectedSources = fencesByLesson.get(key) ?? [];
      const { blocks } = parseLessonBlocks(raw);
      const actualSources = SECTION_KEYS.flatMap((k) => blocks[k])
        .map((b) => (b.kind === 'code' ? b.source : b.kind === 'widget' ? b.widget.raw : null))
        .filter((s): s is string => s !== null);
      expect({ [key]: actualSources }).toEqual({ [key]: expectedSources });
    }
  });
});

describe('markdownToHtml', () => {
  it('treats an arbitrary fence-meta token as free — it never reaches the rendered HTML', () => {
    const withMeta = markdownToHtml('```typescript run\nconst a: number = 1;\n```');
    const withoutMeta = markdownToHtml('```typescript\nconst a: number = 1;\n```');
    expect(withMeta).toBe(withoutMeta);
  });
});

// PROSE_CLASSES on the section wrapper used to be a single div around the
// whole section, so `[&_p:last-child]:mb-0` (a descendant selector) matched
// the last <p> of the WHOLE section only. Splitting introduces one wrapper
// div per block, so that same descendant selector would now match the
// trailing <p> of every html run — i.e. right before every one of the 505
// code blocks in the corpus. `[&>:last-child>:last-child]:mb-0` only reaches
// the outer wrapper's own last child's last child, which restores the
// original "only the section's true final paragraph" behavior. A computed-CSS
// assertion isn't available here (vitest runs in plain node, no Tailwind
// build/browser), so this guards the fix at the two levels that are: the
// selector string itself, and that the corpus shape it protects against is
// real, not hypothetical.
describe('margin regression guard (P0)', () => {
  it('keeps the fixed selector on the section wrapper', () => {
    expect(PROSE_CLASSES).toContain('[&>:last-child>:last-child]:mb-0');
    expect(PROSE_CLASSES).not.toContain('[&_p:last-child]:mb-0');
  });

  it('finds real lessons where an html run ending in <p> sits directly before a code block — the exact shape the old selector over-matched', () => {
    let found = 0;
    outer: for (const { raw } of eachLesson()) {
      const { blocks } = parseLessonBlocks(raw);
      for (const key of SECTION_KEYS) {
        const list = blocks[key];
        for (let i = 0; i < list.length - 1; i++) {
          const block = list[i];
          const next = list[i + 1];
          if (block.kind === 'html' && block.html.trimEnd().endsWith('</p>') && next.kind === 'code') {
            found++;
            if (found >= 5) break outer;
          }
        }
      }
    }
    expect(found).toBeGreaterThanOrEqual(5);
  });

  it('renders a pilot lesson section end-to-end through LessonSectionCard, copy button included', () => {
    const pilot = eachLesson().find(({ raw }) => {
      const { blocks } = parseLessonBlocks(raw);
      return blocks.exampleCode.some(isCodeBlock);
    });
    if (!pilot) throw new Error('expected at least one lesson with a code block in Example Code');

    const { blocks } = parseLessonBlocks(pilot.raw);
    const html = renderToStaticMarkup(
      React.createElement(LessonSectionCard, {
        title: 'Example Code',
        blocks: blocks.exampleCode,
        courseSlug: pilot.courseSlug,
        lessonFile: pilot.file,
      })
    );

    expect(html).toContain('aria-label="Copy code"');
  });
});
