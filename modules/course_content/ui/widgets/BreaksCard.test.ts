import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { BreaksCard } from './BreaksCard';
import { parseBreaks } from '../../course_content.breaks';

const YAML = `
entries:
  - symptom: "A tile that took 20 ms now takes 9 s."
    instinct: "The index went missing."
    look: "EXPLAIN (ANALYZE) SELECT ..."
    see: |-
      ->  Seq Scan on readings (actual rows=60.00 loops=1)
    why: "The filter is on a function of the column."
    knob: "Rewrite it as a half-open range."
`;

describe('BreaksCard', () => {
  it('renders nothing on an unverified lesson', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreaksCard, { widget: parseBreaks(YAML), verified: false })
    );
    expect(html).toBe('');
  });

  it('shows the symptom and the wrong instinct, and hides the answer, before any reveal', () => {
    const html = renderToStaticMarkup(
      React.createElement(BreaksCard, { widget: parseBreaks(YAML), verified: true })
    );
    expect(html).toContain('now takes 9 s');
    expect(html).toContain('The index went missing');
    // The three beats that would give it away are all behind the gate.
    expect(html).not.toContain('Seq Scan');
    expect(html).not.toContain('function of the column');
    expect(html).not.toContain('half-open range');
    // Look button starts disabled — nothing written yet.
    expect(html).toContain('disabled=""');
  });
});
