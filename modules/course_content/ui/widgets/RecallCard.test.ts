import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { RecallCard } from './RecallCard';
import { parseRecall } from '../../course_content.recall';

const YAML = `
- q: "q0"
  must: ["point a", "point b"]
- q: "q1"
  must: ["point c"]
- q: "q2"
  must: ["point d"]
`;

describe('RecallCard', () => {
  it('renders nothing on an unverified lesson', () => {
    const widget = parseRecall(YAML);
    const html = renderToStaticMarkup(
      React.createElement(RecallCard, { widget, blockId: 'b0', courseSlug: 'c', lessonFile: 'f.md', verified: false })
    );
    expect(html).toBe('');
  });

  it('shows the questions and a textarea, but not the must[] checklist, before any reveal', () => {
    const widget = parseRecall(YAML);
    const html = renderToStaticMarkup(
      React.createElement(RecallCard, { widget, blockId: 'b0', courseSlug: 'c', lessonFile: 'f.md', verified: true })
    );
    expect(html).toContain('q0');
    expect(html).toContain('q1');
    expect(html).not.toContain('point a');
    expect(html).not.toContain('point c');
    // Show button starts disabled — nothing written yet.
    expect(html).toContain('disabled=""');
  });
});
