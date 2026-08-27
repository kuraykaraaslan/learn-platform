import { describe, expect, it } from 'vitest';
import {
  parseTemplate,
  parseChecklist,
  looksLikeChecklist,
  composeFilledText,
  countEmptyFields,
} from './course_content.templates';

describe('parseTemplate', () => {
  it('turns a bold label into a bold token, not a field', () => {
    const widget = parseTemplate('**Rate:** flat fee');
    const fields = widget.lines.flat().filter((t) => t.kind === 'field');
    expect(fields).toHaveLength(0);
    expect(widget.lines[0]).toContainEqual({ kind: 'bold', value: 'Rate:' });
  });

  it('recognizes X/Y/N as number fields — the spec\'s own canonical example', () => {
    const widget = parseTemplate('**Rate:** $[X]/hour or $[Y]/day');
    const fields = widget.lines[0].filter((t) => t.kind === 'field');
    expect(fields.map((f) => (f.kind === 'field' ? f.placeholder : null))).toEqual(['X', 'Y']);
    expect(fields.every((f) => f.kind === 'field' && f.inputType === 'number')).toBe(true);
  });

  it('infers date, textarea, and plain text field types', () => {
    const widget = parseTemplate(
      ['**Start:** [Month Year]', '**Notes:** [explanation of the delay reason]', '**Name:** [client name]'].join('\n')
    );
    const [start, notes, name] = widget.lines.map((l) => l.find((t) => t.kind === 'field'));
    expect(start?.kind === 'field' && start.inputType).toBe('date');
    expect(notes?.kind === 'field' && notes.inputType).toBe('textarea');
    expect(name?.kind === 'field' && name.inputType).toBe('text');
  });

  it('does not treat a long bracketed example list as a field (over the 41-char cap)', () => {
    const widget = parseTemplate('**Included:** [debugging, code review, advisory calls, specified feature work]');
    const fields = widget.lines[0].filter((t) => t.kind === 'field');
    expect(fields).toHaveLength(0);
  });

  it('does not treat a markdown link as a field', () => {
    const widget = parseTemplate('See [the docs](https://example.com) for details.');
    const fields = widget.lines[0].filter((t) => t.kind === 'field');
    expect(fields).toHaveLength(0);
  });

  it('parses a checkbox line, keeping the bullet as static text', () => {
    const widget = parseTemplate('- [ ] Confirm scope\n- [x] Sign contract');
    expect(widget.lines[0]).toEqual([
      { kind: 'text', value: '- ' },
      { kind: 'checkbox', id: expect.any(String), label: 'Confirm scope', checked: false },
    ]);
    expect(widget.lines[1][1]).toMatchObject({ kind: 'checkbox', label: 'Sign contract', checked: true });
  });

  it('keeps the original raw text verbatim', () => {
    const raw = '**Rate:** $[X]/hour';
    expect(parseTemplate(raw).raw).toBe(raw);
  });
});

describe('parseChecklist', () => {
  it('extracts only checkbox items, ignoring surrounding prose', () => {
    const widget = parseChecklist(['## Pre-launch', '- [ ] Confirm scope', 'Some prose.', '- [x] Sign contract'].join('\n'));
    expect(widget.items).toEqual([
      { id: 'c0', label: 'Confirm scope', checked: false },
      { id: 'c1', label: 'Sign contract', checked: true },
    ]);
  });
});

describe('looksLikeChecklist', () => {
  it('is true for any fence with at least one checkbox line', () => {
    expect(looksLikeChecklist('- [ ] one item')).toBe(true);
  });

  it('is false for prose with no checkbox syntax', () => {
    expect(looksLikeChecklist('Just a sentence about brackets like [this].')).toBe(false);
  });
});

describe('composeFilledText', () => {
  it('substitutes a filled field, keeps bold markers, and leaves an empty field as [placeholder]', () => {
    const widget = parseTemplate('**Rate:** $[X]/hour or $[Y]/day');
    const [fx, fy] = widget.lines[0].filter((t) => t.kind === 'field') as Extract<
      (typeof widget.lines)[number][number],
      { kind: 'field' }
    >[];
    const text = composeFilledText(widget, { [fx.id]: '150' }, {});
    expect(text).toBe('**Rate:** $150/hour or $[Y]/day');
  });

  it('re-renders a checkbox line from its checked state', () => {
    const widget = parseTemplate('- [ ] Confirm scope');
    const checkbox = widget.lines[0].find((t) => t.kind === 'checkbox')!;
    expect(composeFilledText(widget, {}, { [checkbox.id]: true })).toBe('- [x] Confirm scope');
    expect(composeFilledText(widget, {}, {})).toBe('- [ ] Confirm scope');
  });

  it('round-trips a fully unfilled template back to (nearly) the original', () => {
    const raw = '**Rate:** $[X]/hour or $[Y]/day';
    const widget = parseTemplate(raw);
    expect(composeFilledText(widget, {}, {})).toBe(raw);
  });
});

describe('countEmptyFields', () => {
  it('counts only fields, not checkboxes, and only the unfilled ones', () => {
    const widget = parseTemplate('**Rate:** $[X]/hour or $[Y]/day\n- [ ] Confirm scope');
    const [fx] = widget.lines[0].filter((t) => t.kind === 'field') as Extract<
      (typeof widget.lines)[number][number],
      { kind: 'field' }
    >[];
    expect(countEmptyFields(widget, {})).toBe(2);
    expect(countEmptyFields(widget, { [fx.id]: '150' })).toBe(1);
  });
});
