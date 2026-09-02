import { describe, expect, it } from 'vitest';
import { evaluateExpr, identifiersIn, parseExpr, ExprError } from './course_content.expr';

const scope = { rate: 60, hours: 25, weeks: 44 };

describe('parseExpr / evaluate', () => {
  it('evaluates the spec\'s own example expression', () => {
    // docs/phases/11-recall-and-calc.md: "rate * hours * 44"
    expect(evaluateExpr('rate * hours * 44', scope)).toBe(66000);
  });

  it('respects operator precedence over left-to-right order', () => {
    expect(evaluateExpr('2 + 3 * 4', {})).toBe(14);
    expect(evaluateExpr('(2 + 3) * 4', {})).toBe(20);
  });

  it('handles unary minus, including doubled and after an operator', () => {
    expect(evaluateExpr('-5', {})).toBe(-5);
    expect(evaluateExpr('10 - -5', {})).toBe(15);
    expect(evaluateExpr('--5', {})).toBe(5);
  });

  it('supports min, max and round', () => {
    expect(evaluateExpr('min(3, 7)', {})).toBe(3);
    expect(evaluateExpr('max(3, 7, 11)', {})).toBe(11);
    expect(evaluateExpr('round(2.567, 2)', {})).toBe(2.57);
    expect(evaluateExpr('round(2.6)', {})).toBe(3);
  });

  it('rounds half-way values without reintroducing float error', () => {
    // Math.round(1.005 * 100) / 100 is 1 — the naive form this avoids.
    expect(evaluateExpr('round(1.005, 2)', {})).toBe(1.01);
  });

  it('divides by zero to Infinity rather than throwing', () => {
    expect(evaluateExpr('1 / 0', {})).toBe(Infinity);
  });

  it('collects every identifier an expression reads, sorted and deduped', () => {
    expect(identifiersIn(parseExpr('rate * hours + rate'))).toEqual(['hours', 'rate']);
    expect(identifiersIn(parseExpr('round(min(a, b) * 2, 1)'))).toEqual(['a', 'b']);
    expect(identifiersIn(parseExpr('2 + 2'))).toEqual([]);
  });

  it('throws on an identifier with no value in scope', () => {
    expect(() => evaluateExpr('missing * 2', scope)).toThrow(ExprError);
  });

  // The security property this whole module exists for: a `calc` fence's expr
  // is author-written text that runs in every reader's browser, so anything
  // outside the declared grammar must fail to parse rather than reach a
  // JS engine.
  it.each([
    ['process.exit(1)', 'property access'],
    ['fetch("http://x")', 'string literals and unknown calls'],
    ['2 ** 8', 'exponentiation'],
    ['5 % 2', 'modulo'],
    ['a[0]', 'index access'],
    ['`x`', 'template literal'],
    ['a; b', 'statement separator'],
  ])('refuses to parse %s (%s)', (source) => {
    expect(() => parseExpr(source)).toThrow(ExprError);
  });

  it('treats a bare global name as an ordinary identifier with no value', () => {
    // `globalThis` tokenizes as an identifier, so parsing succeeds — but it
    // resolves against the calc fence's scope, not the JS global object.
    expect(() => evaluateExpr('globalThis', {})).toThrow(ExprError);
  });

  it.each([
    ['', 'empty'],
    ['(1 + 2', 'unclosed paren'],
    ['1 +', 'trailing operator'],
    ['min(1)', 'too few arguments'],
    ['round(1, 2, 3)', 'too many arguments'],
    ['nope(1, 2)', 'unknown function'],
    ['1.2.3', 'malformed number'],
  ])('rejects %s (%s)', (source) => {
    expect(() => parseExpr(source)).toThrow(ExprError);
  });
});
