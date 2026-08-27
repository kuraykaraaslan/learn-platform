import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RunMount } from './RunMount';
import type { LessonBlock } from '../course_content.blocks';

function codeBlock(overrides: Partial<Extract<LessonBlock, { kind: 'code' }>> = {}): Extract<
  LessonBlock,
  { kind: 'code' }
> {
  return {
    kind: 'code',
    id: 'exampleCode-0',
    lang: 'typescript',
    meta: { run: true, opts: {} },
    source: 'console.log(1 + 1);',
    html: '<pre><code>console.log(1 + 1);</code></pre>',
    ...overrides,
  };
}

describe('RunMount', () => {
  it('shows the editable source and a Run button, without mounting CodeRunner before any click', () => {
    const html = renderToStaticMarkup(
      React.createElement(RunMount, { block: codeBlock(), courseSlug: 'test-course', lessonFile: '01_test.md' })
    );
    expect(html).toContain('console.log(1 + 1);');
    expect(html).toContain('>Run<');
    // CodeRunner's own output markup (the sandbox iframe container) never
    // appears pre-click — restoring a saved buffer must not auto-run it.
    expect(html).not.toContain('Running…');
  });

  it('is a real <textarea>, not a read-only display', () => {
    const html = renderToStaticMarkup(
      React.createElement(RunMount, { block: codeBlock(), courseSlug: 'test-course', lessonFile: '01_test.md' })
    );
    expect(html).toContain('<textarea');
    expect(html).not.toContain('readonly');
  });
});
