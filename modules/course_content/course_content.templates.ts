// Parses a `template`- or checklist-shaped fence's raw text into the
// structured data ui/widgets/TemplateFormCard.tsx and ui/widgets/
// ChecklistCard.tsx render from. Kept out of course_content.blocks.ts so
// that file stays focused on the pre-boundary split, same reasoning as
// course_content.mistakes.ts being split out of course_content.parser.ts.

export type TemplateToken =
  | { kind: 'text'; value: string }
  | { kind: 'bold'; value: string }
  | { kind: 'field'; id: string; placeholder: string; inputType: 'text' | 'number' | 'date' | 'textarea' }
  | { kind: 'checkbox'; id: string; label: string; checked: boolean };

export type TemplateWidget = {
  type: 'template';
  /** One entry per line of the original fence — preserving line breaks is
   *  the point ("the document's shape is what's being preserved", per the
   *  phase spec), not a byproduct. */
  lines: TemplateToken[][];
  raw: string;
};

export type ChecklistItem = { id: string; label: string; checked: boolean };

export type ChecklistWidget = {
  type: 'checklist';
  items: ChecklistItem[];
  raw: string;
};

// `^\s*[-*]\s+\[[ xX]\]` — a checkbox list item. Captured separately from
// CHECKBOX_TOKEN below because at the line level it also owns the leading
// bullet marker (kept as static text so the rendered list still looks like
// a list).
const CHECKBOX_LINE = /^(\s*[-*]\s+)\[([ xX])\](.*)$/;

// Bold text OR a named slot. This only ever runs on a line CHECKBOX_LINE
// already rejected, so `[X]`/`[Y]` are real slots here, not stray checkbox
// syntax — the spec's own example (`$[X]/hour or $[Y]/day`) uses exactly
// those two names, which is also why inferInputType treats "X"/"Y" as
// number placeholders rather than as the checkbox letter. A literal `[ ]`
// (a bare space) never matches: the first character inside the brackets is
// required to be alphanumeric. `(?!\()` excludes `[label](url)` markdown
// link syntax.
const INLINE_TOKEN = /\*\*([^*]+)\*\*|\[([A-Za-z0-9][^\]\n]{0,40})\](?!\()/g;

function inferInputType(placeholder: string): 'text' | 'number' | 'date' | 'textarea' {
  if (/^(x|y|n|number|amount|\d+)$/i.test(placeholder)) return 'number';
  if (/date|month year/i.test(placeholder)) return 'date';
  if (placeholder.length > 25) return 'textarea';
  return 'text';
}

function parseInlineTokens(line: string, nextId: () => string): TemplateToken[] {
  const tokens: TemplateToken[] = [];
  let cursor = 0;

  INLINE_TOKEN.lastIndex = 0;
  for (let match = INLINE_TOKEN.exec(line); match; match = INLINE_TOKEN.exec(line)) {
    const [full, bold, slot] = match;

    if (match.index > cursor) tokens.push({ kind: 'text', value: line.slice(cursor, match.index) });
    if (bold !== undefined) {
      tokens.push({ kind: 'bold', value: bold });
    } else {
      tokens.push({ kind: 'field', id: nextId(), placeholder: slot, inputType: inferInputType(slot) });
    }
    cursor = match.index + full.length;
  }
  if (cursor < line.length) tokens.push({ kind: 'text', value: line.slice(cursor) });
  return tokens;
}

export function parseTemplate(raw: string): TemplateWidget {
  let fieldCounter = 0;
  let checkboxCounter = 0;
  const nextFieldId = () => `f${fieldCounter++}`;
  const nextCheckboxId = () => `c${checkboxCounter++}`;

  const lines = raw.split('\n').map((line): TemplateToken[] => {
    const checkbox = CHECKBOX_LINE.exec(line);
    if (checkbox) {
      const [, bullet, mark, rest] = checkbox;
      const tokens: TemplateToken[] = [{ kind: 'text', value: bullet }];
      tokens.push({ kind: 'checkbox', id: nextCheckboxId(), label: rest.trim(), checked: /[xX]/.test(mark) });
      return tokens;
    }
    return parseInlineTokens(line, nextFieldId);
  });

  return { type: 'template', lines, raw };
}

export function parseChecklist(raw: string): ChecklistWidget {
  const items: ChecklistItem[] = [];
  let counter = 0;

  for (const line of raw.split('\n')) {
    const match = CHECKBOX_LINE.exec(line);
    if (!match) continue;
    items.push({ id: `c${counter++}`, label: match[3].trim(), checked: /[xX]/.test(match[2]) });
  }

  return { type: 'checklist', items, raw };
}

/** At least one checkbox list item anywhere in the fence — the measured
 *  shape of the corpus's 36 checklist fences (course_content.blocks.ts
 *  applies this only to fences that ISN'T already form-shaped; a fence with
 *  both bold labels and checkboxes renders as a template, whose own
 *  checkbox-line handling covers the same items). */
export function looksLikeChecklist(raw: string): boolean {
  return raw.split('\n').some((line) => CHECKBOX_LINE.test(line));
}

/** Re-serializes a template with the reader's values spliced in — a blank
 *  field stays literally `[placeholder]` (docs/phases/04-template-widgets.md
 *  is explicit: a half-filled document is never silently exported as whole),
 *  and bold/text runs come back exactly as parsed, since nothing in this
 *  widget ever rewrites them. */
export function composeFilledText(
  widget: TemplateWidget,
  values: Record<string, string>,
  checked: Record<string, boolean>
): string {
  return widget.lines
    .map((line) =>
      line
        .map((token) => {
          switch (token.kind) {
            case 'text':
              return token.value;
            case 'bold':
              return `**${token.value}**`;
            case 'field':
              return values[token.id]?.trim() ? values[token.id] : `[${token.placeholder}]`;
            case 'checkbox':
              return `[${checked[token.id] ? 'x' : ' '}] ${token.label}`;
          }
        })
        .join('')
    )
    .join('\n');
}

export function countEmptyFields(widget: TemplateWidget, values: Record<string, string>): number {
  let count = 0;
  for (const line of widget.lines) {
    for (const token of line) {
      if (token.kind === 'field' && !values[token.id]?.trim()) count++;
    }
  }
  return count;
}
