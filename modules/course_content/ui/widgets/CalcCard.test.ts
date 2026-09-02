import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CalcCard } from './CalcCard';
import { parseCalc } from '../../course_content.calc';

const YAML = `
inputs:
  - { id: rate,  label: "Hourly rate (USD)",   type: number, default: 60 }
  - { id: hours, label: "Billable hours/week", type: number, default: 25 }
outputs:
  - { label: "Annual gross revenue", expr: "rate * hours * 44", format: "usd" }
`;

function render() {
  return renderToStaticMarkup(
    React.createElement(CalcCard, {
      widget: parseCalc(YAML),
      blockId: 'b0',
      courseSlug: 'c',
      lessonFile: 'f.md',
    })
  );
}

describe('CalcCard', () => {
  it('computes the outputs from the declared defaults on first render', () => {
    // 60 * 25 * 44 — the reader sees a real number before touching anything,
    // so the model is legible without interacting.
    expect(render()).toContain('$66,000');
  });

  it('renders every input label and its default value', () => {
    const html = render();
    expect(html).toContain('Hourly rate (USD)');
    expect(html).toContain('Billable hours/week');
    expect(html).toContain('value="60"');
    expect(html).toContain('value="25"');
  });

  it('keeps the arithmetic collapsed until asked', () => {
    const html = render();
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('rate * hours * 44');
  });

  // Unlike RecallCard/QuizCard there is no `verified` gate — nothing here is
  // a generated claim that could be wrong, so it renders on any lesson.
  it('takes no verified prop and renders regardless', () => {
    expect(render()).not.toBe('');
  });
});

// A mechanical guard for the bundle boundary, not a style preference. An
// earlier revision of this component imported formatCalcValue *by value* from
// course_content.calc.ts, which top-level imports yaml + zod for build-time
// parsing — and that put 8 `yaml` and 1 `zod` marker into the shipped lesson
// chunk, breaking docs/phases/06-quiz-tradeoff-diff.md's "YAML parser client
// bundle'a girmiyor". The formatter now lives in course_content.calc-format.ts
// and this file's only tie to the parser is a type.
describe('CalcCard bundle boundary', () => {
  it('imports course_content.calc as a type only, never as a value', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('./CalcCard.tsx', import.meta.url), 'utf-8');
    const calcImports = source.match(/^import .*course_content\.calc';$/gm) ?? [];
    expect(calcImports).toHaveLength(1);
    expect(calcImports[0]).toMatch(/^import type /);
  });
});
