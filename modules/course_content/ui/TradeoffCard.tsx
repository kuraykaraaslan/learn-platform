// P6: a `tradeoff` fence. No score, no "correct" side — the reader picks a
// side, then sees BOTH sides' win conditions, each a measurable signal
// rather than a feeling. Not gated on `verified` (docs/phases/06 gates only
// the quiz on that — a tradeoff has no answer key to protect).
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { TradeoffWidget } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { BTN_LINK, CHOICE_BASE, CHOICE_IDLE } from './widget-ui';

export function TradeoffCard({ widget }: { widget: TradeoffWidget }) {
  const [picked, setPicked] = useState<0 | 1 | null>(null);

  return (
    // "no right answer" in the strip, not "no correct answer": docs/phases/06
    // bans the vocabulary of scoring here, and TradeoffCard.test.ts enforces
    // it by matching /correct|wrong|score/ against the whole rendered HTML.
    <WidgetShell kind="tradeoff" status="no right answer">
      <p className="mb-2 text-sm font-medium text-text-primary">{widget.question}</p>

      {picked === null && (
        <div className="flex gap-2">
          {widget.sides.map((side, i) => (
            <button
              key={side.name}
              type="button"
              onClick={() => setPicked(i as 0 | 1)}
              className={cn(CHOICE_BASE, CHOICE_IDLE, 'flex-1 text-center')}
            >
              {side.name}
            </button>
          ))}
        </div>
      )}

      {picked !== null && (
        <div>
          <button
            type="button"
            onClick={() => setPicked(null)}
            className={cn(BTN_LINK, 'mb-2')}
          >
            Pick again
          </button>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {widget.sides.map((side, i) => (
              <div
                key={side.name}
                className={cn(
                  'rounded-md border p-3',
                  picked === i ? 'border-primary bg-primary/10' : 'border-border bg-surface-base'
                )}
              >
                <p className="mb-1.5 text-sm font-medium text-text-primary">{side.name}</p>
                <p className="mb-1 text-xs text-text-secondary">Wins when:</p>
                <ul className="list-disc space-y-1 pl-4 text-xs text-text-secondary">
                  {side.wins_when.map((w, wi) => (
                    <li key={wi}>{w.signal}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
