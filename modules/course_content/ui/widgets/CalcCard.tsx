// P11's calculator (docs/phases/11-recall-and-calc.md). A writing affordance:
// the lesson supplies the model, the reader supplies their own numbers. There
// is no correct answer here and nothing is graded — the point is that a reader
// leaves with *their* figure, not the author's worked example.
//
// Expressions are evaluated by course_content.expr.ts's own parser, never
// `eval`/`new Function` — see that file's header for why that matters here
// specifically. The AST is parsed once at build time (course_content.calc.ts)
// and only walked on each keystroke.
'use client';

import { useState } from 'react';
import { useProgressStore, widgetFieldKey } from '@/modules/progress/progress.store';
import { useHydrated } from '@/modules/progress/useHydrated';
import { WidgetShell } from '../WidgetShell';
import { BTN_SECONDARY, FIELD } from '../widget-ui';
import { evaluate } from '../../course_content.expr';
import { formatCalcValue } from '../../course_content.calc-format';
// Type-only, and it must stay that way: course_content.calc.ts pulls in yaml +
// zod for build-time parsing, and a value import from here would ship both to
// the browser. CalcCard.test.ts guards this.
import type { CalcWidget } from '../../course_content.calc';

export function CalcCard({
  widget,
  blockId,
  courseSlug,
  lessonFile,
}: {
  widget: CalcWidget;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
}) {
  const hydrated = useHydrated();
  const [showModel, setShowModel] = useState(false);

  // Reuses templateValues rather than adding a persisted field of its own:
  // both are string field values keyed by widgetFieldKey(), and quota.ts's
  // LRU eviction already covers that map.
  const allValues = useProgressStore((s) => s.templateValues);
  const setTemplateValue = useProgressStore((s) => s.setTemplateValue);

  const storageKey = (id: string) => widgetFieldKey(courseSlug, lessonFile, blockId, id);

  // Before hydration the store is empty, so the server and the first client
  // render both show the declared defaults — no mismatch. Persisted values
  // only take over once useHydrated flips.
  function rawValue(input: CalcWidget['inputs'][number]): string {
    if (!hydrated) return String(input.default);
    const stored = allValues[storageKey(input.id)];
    return stored ?? String(input.default);
  }

  const scope: Record<string, number> = {};
  for (const input of widget.inputs) {
    // An empty field is NaN, not 0 — every output that depends on it renders
    // as "—" instead of quietly implying the reader entered a zero.
    const raw = rawValue(input).trim();
    scope[input.id] = raw === '' ? Number.NaN : Number(raw);
  }

  function handleReset() {
    for (const input of widget.inputs) setTemplateValue(storageKey(input.id), String(input.default));
  }

  return (
    // No status slot: the only countable thing here would be a completion
    // metric, which docs/phases/README.md invariant #4 rules out — and a calc
    // has no right answer to be finished with anyway.
    <WidgetShell kind="calc" bodyClassName="p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {widget.inputs.map((input) => (
          <label key={input.id} className="flex flex-col gap-1">
            <span className="text-xs text-text-secondary">{input.label}</span>
            <input
              type="number"
              inputMode="decimal"
              value={rawValue(input)}
              min={input.min}
              step={input.step}
              onChange={(e) => setTemplateValue(storageKey(input.id), e.target.value)}
              className={FIELD}
            />
          </label>
        ))}
      </div>

      <dl className="mt-4 space-y-2 border-t border-border pt-3">
        {widget.outputs.map((output, i) => {
          let value: number;
          try {
            value = evaluate(output.ast, scope);
          } catch {
            // Only reachable for a field the reader emptied; a malformed
            // expression already failed the build in course_content.calc.ts.
            value = Number.NaN;
          }
          return (
            <div key={i} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-text-secondary">{output.label}</dt>
              <dd className="font-mono text-base font-medium tabular-nums text-text-primary">
                {formatCalcValue(value, output.format)}
              </dd>
            </div>
          );
        })}
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={handleReset} className={BTN_SECONDARY}>
          Reset to defaults
        </button>
        <button type="button" onClick={() => setShowModel((v) => !v)} aria-expanded={showModel} className={BTN_SECONDARY}>
          {showModel ? 'Hide the arithmetic' : 'Show the arithmetic'}
        </button>
        <span className="text-text-secondary">Your numbers stay in this browser.</span>
      </div>

      {showModel && (
        <ul className="mt-2 space-y-1 border-t border-border pt-2">
          {widget.outputs.map((output, i) => (
            <li key={i} className="font-mono text-xs text-text-secondary">
              {output.label} = {output.expr}
            </li>
          ))}
        </ul>
      )}
    </WidgetShell>
  );
}
