import { describe, expect, it } from 'vitest';
import { claimsPublishedDefault, hasMeasurement, parseNumbers, NO_PUBLISHED_DEFAULT } from './course_content.numbers';

const ROW = `
    quantity: "PostgreSQL 18 \`lock_timeout\`"
    default: "0 — no limit"
    source: "https://www.postgresql.org/docs/current/runtime-config-client.html"
    at_scale: "A statement waits for as long as the holder keeps the lock."
    measure: "\`SHOW lock_timeout;\`"`;

const VALID = `
caption: "Three settings that decide what happens under contention."
rows:
  -${ROW}
`;

describe('parseNumbers', () => {
  it('parses a caption and its rows', () => {
    const widget = parseNumbers(VALID);
    expect(widget.type).toBe('numbers');
    expect(widget.caption).toContain('under contention');
    expect(widget.rows).toHaveLength(1);
    expect(widget.rows[0].quantity).toContain('lock_timeout');
    expect(widget.rows[0].source).toContain('postgresql.org');
  });

  it('makes the caption optional and keeps the raw body', () => {
    const widget = parseNumbers(`rows:\n  -${ROW}\n`);
    expect(widget.caption).toBeUndefined();
    expect(widget.raw).toContain('lock_timeout');
  });

  it('rejects a row missing the at-scale column', () => {
    const withoutWhy = VALID.split('\n').filter((line) => !line.includes('at_scale')).join('\n');
    expect(() => parseNumbers(withoutWhy)).toThrow();
  });

  it('rejects a table with no rows, and one longer than eight', () => {
    expect(() => parseNumbers('rows: []')).toThrow();
    expect(() => parseNumbers(`rows:\n${`  -${ROW}\n`.repeat(9)}`)).toThrow();
  });

  it('rejects a source that is not a url', () => {
    expect(() => parseNumbers(VALID.replace('https://www.postgresql.org/docs/current/runtime-config-client.html', 'the docs'))).toThrow();
  });
});

// The two conditions docs/investigate/04-roadmap.md's T2.2 made the price of
// the widget existing at all. They live in the parser module rather than in
// the lint rules so the rule and the card cannot disagree about what a sourced
// row is.
describe('the sourcing contract', () => {
  it('treats an em dash as "nobody publishes a default", and anything else as a claim', () => {
    const claimed = parseNumbers(VALID).rows[0];
    expect(claimsPublishedDefault(claimed)).toBe(true);
    const unpublished = parseNumbers(VALID.replace('"0 — no limit"', `"${NO_PUBLISHED_DEFAULT}"`)).rows[0];
    expect(claimsPublishedDefault(unpublished)).toBe(false);
  });

  it('accepts a backticked command or a link as a measurement, and prose as neither', () => {
    const row = parseNumbers(VALID).rows[0];
    expect(hasMeasurement(row)).toBe(true);
    expect(hasMeasurement({ ...row, measure: 'https://example.com/how-to-measure' })).toBe(true);
    expect(hasMeasurement({ ...row, measure: 'check the server configuration' })).toBe(false);
    expect(hasMeasurement({ ...row, measure: 'run ``' })).toBe(false);
  });
});
