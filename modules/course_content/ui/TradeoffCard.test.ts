import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TradeoffCard } from './TradeoffCard';
import { parseTradeoff } from '../course_content.tradeoff';

const YAML = `
question: "A or B?"
sides:
  - name: "Side A"
    wins_when:
      - signal: "signal for A"
  - name: "Side B"
    wins_when:
      - signal: "signal for B"
`;

describe('TradeoffCard', () => {
  it('shows the question and both side names, but no win conditions, before any pick', () => {
    const widget = parseTradeoff(YAML);
    const html = renderToStaticMarkup(React.createElement(TradeoffCard, { widget }));
    expect(html).toContain('A or B?');
    expect(html).toContain('Side A');
    expect(html).toContain('Side B');
    expect(html).not.toContain('signal for A');
    expect(html).not.toContain('signal for B');
  });

  it('never mentions correctness or a score — no "correct"/"wrong"/"score" anywhere', () => {
    const widget = parseTradeoff(YAML);
    const html = renderToStaticMarkup(React.createElement(TradeoffCard, { widget }));
    expect(html.toLowerCase()).not.toMatch(/correct|wrong|score/);
  });
});
