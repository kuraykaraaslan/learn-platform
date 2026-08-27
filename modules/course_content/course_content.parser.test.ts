import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildParseSnapshot } from './course_content.snapshot';
import { parseLessonMarkdown } from './course_content.parser';

const SNAPSHOT_PATH = path.join(process.cwd(), 'content', '_reports', 'parse-snapshot.json');

describe('corpus parse snapshot', () => {
  it('renders every lesson exactly as recorded in content/_reports/parse-snapshot.json', () => {
    const recorded = JSON.parse(fs.readFileSync(SNAPSHOT_PATH, 'utf-8'));
    const current = buildParseSnapshot();

    // Compare course-by-course so a failure names the course instead of
    // dumping a 412-lesson diff.
    expect(Object.keys(current.courses).sort()).toEqual(Object.keys(recorded.courses).sort());
    for (const slug of Object.keys(recorded.courses)) {
      expect({ [slug]: current.courses[slug] }).toEqual({ [slug]: recorded.courses[slug] });
    }
    expect(current.lessonCount).toBe(recorded.lessonCount);
  });
});

describe('parseLessonMarkdown', () => {
  it('takes the title from the "# N. Title" line and strips the number', () => {
    const { title } = parseLessonMarkdown('# 41. PostgreSQL MVCC\n\n## What It Is\nbody\n');
    expect(title).toBe('PostgreSQL MVCC');
  });

  it('maps each recognized heading to its own section', () => {
    const { sections } = parseLessonMarkdown(
      ['# 1. T', '', '## What It Is', 'alpha', '', '## Key Concepts', '- beta', ''].join('\n')
    );
    expect(sections.whatItIs).toContain('alpha');
    expect(sections.keyConcepts).toContain('beta');
  });

  it('matches on prefix, so "Example Code or Template" lands in exampleCode', () => {
    const { sections } = parseLessonMarkdown(
      ['# 1. T', '', '## Example Code or Template', 'snippet', ''].join('\n')
    );
    expect(sections.exampleCode).toContain('snippet');
  });

  it('treats an UNRECOGNIZED "##" heading as content of the open section', () => {
    // Verified against the real corpus: process-soft-skills/76_rfc_process.md
    // renders its "## Summary" inside the Example Code card for this reason.
    const { sections } = parseLessonMarkdown(
      ['# 1. T', '', '## Example Code', 'a', '', '## Summary', 'b', ''].join('\n')
    );
    expect(sections.exampleCode).toContain('Summary');
    expect(sections.exampleCode).toContain('b');
  });

  it('ignores a "##"-looking line inside a fenced code block', () => {
    const { sections } = parseLessonMarkdown(
      ['# 1. T', '', '## Example Code', '```md', '## Key Concepts', '```', ''].join('\n')
    );
    expect(sections.keyConcepts).toBe('');
    expect(sections.exampleCode).toContain('Key Concepts');
  });

  it('DROPS everything before the first recognized heading', () => {
    // This is what makes YAML frontmatter safe to add: it never reaches a
    // section. It is also why a new section placed ABOVE "## What It Is"
    // disappears entirely instead of rendering in the wrong card.
    const { sections } = parseLessonMarkdown(
      ['---', 'id: 1', '---', '# 1. T', 'stray prose', '', '## What It Is', 'body', ''].join('\n')
    );
    expect(Object.values(sections).join('')).not.toContain('stray prose');
    expect(Object.values(sections).join('')).not.toContain('id: 1');
    expect(sections.whatItIs).toContain('body');
  });

  it('does not leak a pre-heading fence into the first section', () => {
    // Regression: the fence branch used to push unconditionally, so a fence
    // opened before the first recognized heading both buffered its line and
    // inverted `inFence`, which then swallowed the rest of the document.
    const { sections } = parseLessonMarkdown(
      ['# 1. T', '```', 'pre-heading fence', '```', '', '## What It Is', 'body', ''].join('\n')
    );
    expect(sections.whatItIs).toContain('body');
    expect(sections.whatItIs).not.toContain('pre-heading fence');
  });

  it('survives an ODD number of fence markers before the first heading', () => {
    // Regression: fence state used to be tracked before any section was open,
    // so one unclosed fence up there left `inFence` stuck on, every later
    // "## " was read as fenced content, and the whole lesson rendered blank
    // with no error. This is the shape frontmatter would have introduced.
    const { sections } = parseLessonMarkdown(
      [
        '---',
        'example: |',
        '  ```ts',
        '---',
        '# 1. T',
        '',
        '## What It Is',
        'body that must survive',
        '',
        '## Key Concepts',
        '- bullet',
      ].join('\n')
    );
    expect(sections.whatItIs).toContain('body that must survive');
    expect(sections.keyConcepts).toContain('bullet');
  });

  it('returns an empty string for every section a lesson does not have', () => {
    const { sections } = parseLessonMarkdown('# 1. T\n\n## What It Is\nbody\n');
    expect(sections.furtherReading).toBe('');
    expect(sections.commonMistakes).toBe('');
  });
});
