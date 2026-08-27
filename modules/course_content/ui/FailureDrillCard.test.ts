import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FailureDrillCard } from './FailureDrillCard';
import type { Lesson } from '../course_content.types';
import type { LessonMistake } from '../course_content.mistakes';

function mistake(id: string, form: LessonMistake['form'], lead = 'lead', bodyHtml = '<p>body</p>'): LessonMistake {
  return { id, form, lead, bodyHtml };
}

function baseLesson(overrides: Partial<Lesson> = {}): Lesson {
  return {
    id: 1,
    file: '01_test.md',
    title: 'Test lesson',
    bracket: '0-1',
    category: 'Testing',
    courseSlug: 'test-course',
    lessonSlug: 'test',
    blocks: {
      whatItIs: [],
      keyConcepts: [],
      exampleCode: [],
      whenToUse: [],
      commonMistakes: [],
      furtherReading: [],
    },
    mistakes: [],
    concepts: {},
    ...overrides,
  };
}

describe('FailureDrillCard', () => {
  it('falls back to the plain Common Mistakes card when the lesson is not verified', () => {
    const lesson = baseLesson({ mistakes: [mistake('m0', 'bold-dash'), mistake('m1', 'bold-colon')] });
    const html = renderToStaticMarkup(React.createElement(FailureDrillCard, { lesson, blocks: [] }));
    expect(html).not.toContain('aria-expanded');
    expect(html).not.toContain('Expand all');
  });

  it('falls back when verified but fewer than two drillable mistakes', () => {
    const lesson = baseLesson({ verified: true, mistakes: [mistake('m0', 'bold-dash'), mistake('m1', 'single')] });
    const html = renderToStaticMarkup(React.createElement(FailureDrillCard, { lesson, blocks: [] }));
    expect(html).not.toContain('aria-expanded');
  });

  it('falls back when interactive is explicitly off, even if verified', () => {
    const lesson = baseLesson({
      verified: true,
      interactive: 'off',
      mistakes: [mistake('m0', 'bold-dash'), mistake('m1', 'bold-colon')],
    });
    const html = renderToStaticMarkup(React.createElement(FailureDrillCard, { lesson, blocks: [] }));
    expect(html).not.toContain('aria-expanded');
  });

  it('opens the drill UI when verified, interactive, and >=2 drillable mistakes', () => {
    const lesson = baseLesson({
      verified: true,
      mistakes: [
        mistake('m0', 'bold-dash', 'First lead'),
        mistake('m1', 'bold-colon', 'Second lead'),
        mistake('m2', 'single'),
      ],
    });
    const html = renderToStaticMarkup(React.createElement(FailureDrillCard, { lesson, blocks: [] }));
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('First lead');
    expect(html).toContain('Second lead');
    expect(html).toContain('Expand all');
  });

  it('renders single-form mistakes as a plain list — no button for them, even in drill mode', () => {
    const lesson = baseLesson({
      verified: true,
      mistakes: [
        mistake('m0', 'bold-dash', 'First lead'),
        mistake('m1', 'bold-colon', 'Second lead'),
        mistake('m2', 'single', '', '<p>An unstructured sentence.</p>'),
      ],
    });
    const html = renderToStaticMarkup(React.createElement(FailureDrillCard, { lesson, blocks: [] }));
    expect(html).toContain('An unstructured sentence.');
    // 2 drillable leads + 1 "expand all" toggle = 3 buttons; the single item
    // contributes none.
    expect(html.match(/<button/g)).toHaveLength(3);
  });
});
