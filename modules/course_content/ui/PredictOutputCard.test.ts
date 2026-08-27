import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PredictOutputCard } from './PredictOutputCard';
import type { LessonBlock } from '../course_content.blocks';

function proofBlock(): Extract<LessonBlock, { kind: 'code' }> {
  return {
    kind: 'code',
    id: 'exampleCode-0',
    lang: 'proof',
    meta: { run: false, project: false, opts: { sha: 'abc123', at: '2026-08-28', commit: 'eb4085c' } },
    source: '$ bash run.sh\nreal captured output here',
    html: '<pre><code>...</code></pre>',
  };
}

describe('PredictOutputCard', () => {
  it('shows the command and a prediction textarea, but never the real output, before reveal', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictOutputCard, {
        block: proofBlock(),
        courseSlug: 'fundamentals-tools',
        lessonFile: '123_debugging_fundamentals.md',
      })
    );
    expect(html).toContain('$ bash run.sh');
    expect(html).not.toContain('real captured output here');
    expect(html).toContain('What do you expect this to print?');
    expect(html).toContain('disabled=""'); // Show button starts disabled — no prediction typed yet
  });

  it('never renders a Run button — this fence executes nothing', () => {
    const html = renderToStaticMarkup(
      React.createElement(PredictOutputCard, {
        block: proofBlock(),
        courseSlug: 'fundamentals-tools',
        lessonFile: '123_debugging_fundamentals.md',
      })
    );
    expect(html).not.toMatch(/>\s*Run\s*</);
  });
});
