import { describe, expect, it } from 'vitest';
import { formatCalcValue, parseCalc } from './course_content.calc';

// The spec's own example fence, docs/phases/11-recall-and-calc.md.
const YAML = `
inputs:
  - { id: rate,  label: "Hourly rate (USD)",    type: number, default: 60 }
  - { id: hours, label: "Billable hours/week",  type: number, default: 25 }
outputs:
  - { label: "Annual gross revenue", expr: "rate * hours * 44", format: "usd" }
`;

describe('parseCalc', () => {
  it('parses the spec\'s example fence and keeps a usable AST per output', () => {
    const widget = parseCalc(YAML);
    expect(widget.type).toBe('calc');
    expect(widget.inputs.map((i) => i.id)).toEqual(['rate', 'hours']);
    expect(widget.outputs[0].format).toBe('usd');
    expect(widget.outputs[0].ast).toBeDefined();
  });

  it('defaults an output with no format to plain number', () => {
    const widget = parseCalc(`
inputs:
  - { id: a, label: "A", type: number, default: 1 }
outputs:
  - { label: "Twice A", expr: "a * 2" }
`);
    expect(widget.outputs[0].format).toBe('number');
  });

  // The build-failure this parser exists for: an expr naming an input that
  // does not exist would otherwise reach a reader as a permanently blank cell.
  it('rejects an output referring to an undeclared input', () => {
    const bad = `
inputs:
  - { id: rate, label: "Rate", type: number, default: 60 }
outputs:
  - { label: "Revenue", expr: "rate * huors * 44", format: "usd" }
`;
    expect(() => parseCalc(bad)).toThrow(/huors/);
  });

  it('rejects a malformed expression', () => {
    const bad = `
inputs:
  - { id: a, label: "A", type: number, default: 1 }
outputs:
  - { label: "Broken", expr: "a * * 2" }
`;
    expect(() => parseCalc(bad)).toThrow();
  });

  it('rejects a duplicated input id', () => {
    const bad = `
inputs:
  - { id: a, label: "A", type: number, default: 1 }
  - { id: a, label: "A again", type: number, default: 2 }
outputs:
  - { label: "A", expr: "a" }
`;
    expect(() => parseCalc(bad)).toThrow(/twice/);
  });

  it('rejects an input id that is not a plain identifier', () => {
    const bad = `
inputs:
  - { id: "day rate", label: "Day rate", type: number, default: 1 }
outputs:
  - { label: "X", expr: "1" }
`;
    expect(() => parseCalc(bad)).toThrow();
  });

  it('rejects a fence with no inputs or no outputs', () => {
    expect(() => parseCalc('inputs: []\noutputs: [{ label: "X", expr: "1" }]')).toThrow();
    expect(() => parseCalc('inputs: [{ id: a, label: "A", type: number, default: 1 }]\noutputs: []')).toThrow();
  });
});

describe('formatCalcValue', () => {
  it('renders currency with a symbol and thousands separators', () => {
    expect(formatCalcValue(66000, 'usd')).toBe('$66,000');
    expect(formatCalcValue(66000, 'eur')).toBe('€66,000');
  });

  it('keeps at most two decimals for a fractional currency value', () => {
    expect(formatCalcValue(1234.567, 'usd')).toBe('$1,234.57');
  });

  it('renders a percent with its sign', () => {
    expect(formatCalcValue(12.5, 'percent')).toBe('12.5%');
  });

  // A reader mid-typing has emptied a field; showing "NaN"/"Infinity" would
  // read as a bug rather than as an incomplete form.
  it('renders a non-finite result as an em dash', () => {
    expect(formatCalcValue(Number.NaN, 'usd')).toBe('—');
    expect(formatCalcValue(Infinity, 'number')).toBe('—');
  });
});
