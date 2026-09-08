// P44: `breaks` — docs/investigate/04-roadmap.md's T2.6 ("How It Breaks"), as
// a fence rather than the `##` section it originally specified, for the same
// reason P31 gave: HEADING_RULES is a protected surface and a fence leaves it
// untouched (docs/phases/44-how-it-breaks.md).
//
// The rhythm is predict-then-reveal, and the prediction is against a stated
// wrong instinct rather than a list of options. That is the difference from
// QuizCard: a quiz asks which answer is right, this asks the reader to notice
// that the answer they already believed is the wrong one. Nothing opens until
// they have written their own diagnosis — the same 15-character gate P11
// argued for and P14 moved into reveal-gate.ts.
//
// Never rendered on an unverified lesson (invariant #3): a diagnosis is an
// exercise, and an exercise inherits the correctness of what it sits on.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { BreaksEntry, BreaksWidget } from '../../course_content.breaks';
import { WidgetShell } from '../WidgetShell';
import { canReveal, charsRemaining } from '../reveal-gate';
import { BTN_PRIMARY, FIELD } from '../widget-ui';

function EntryView({ entry, index }: { entry: BreaksEntry; index: number }) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const unlocked = canReveal(answer);
  const remaining = charsRemaining(answer);

  return (
    <div className={cn(index > 0 && 'mt-5 border-t border-border pt-5')}>
      <p className="text-sm font-medium text-text-primary">{entry.symptom}</p>
      <p className="mt-1.5 text-xs text-text-secondary">
        <span className="font-medium text-text-primary">First instinct: </span>
        {entry.instinct}
      </p>

      {!revealed && (
        <>
          <label className="mt-3 block text-xs text-text-secondary" htmlFor={`breaks-${index}`}>
            What would you look at, and what do you expect it to say?
          </label>
          <textarea
            id={`breaks-${index}`}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            className={cn(FIELD, 'mt-1.5 w-full resize-y p-2 text-sm')}
            placeholder="Your diagnosis, before you look."
          />
          <div className="mt-2 flex items-center gap-3">
            <button type="button" className={BTN_PRIMARY} disabled={!unlocked} onClick={() => setRevealed(true)}>
              Look
            </button>
            {answer.length > 0 && !unlocked && (
              <span className="text-xs text-text-disabled">{remaining} more characters</span>
            )}
          </div>
        </>
      )}

      {revealed && (
        <div className="mt-3 space-y-3">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-secondary">What you run</p>
            <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary">
              {entry.look}
            </pre>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-text-secondary">What you see</p>
            {/* Verbatim from a stamped proof fence in this lesson — nobody
                typed it, and breaks/see-not-proven is what keeps that true. */}
            <pre className="mt-1 overflow-x-auto rounded-md border border-border bg-surface px-3 py-2 font-mono text-xs text-text-primary">
              {entry.see}
            </pre>
          </div>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Why: </span>
            {entry.why}
          </p>
          <p className="text-sm text-text-secondary">
            <span className="font-medium text-text-primary">Which knob: </span>
            {entry.knob}
          </p>
        </div>
      )}
    </div>
  );
}

export function BreaksCard({ widget, verified }: { widget: BreaksWidget; verified: boolean }) {
  if (!verified) return null;
  return (
    <WidgetShell
      kind="breaks"
      status={`${widget.entries.length} ${widget.entries.length === 1 ? 'symptom' : 'symptoms'}`}
    >
      {widget.caption ? <p className="mb-3 text-sm text-text-secondary">{widget.caption}</p> : null}
      {widget.entries.map((entry, i) => (
        <EntryView key={entry.symptom} entry={entry} index={i} />
      ))}
    </WidgetShell>
  );
}
