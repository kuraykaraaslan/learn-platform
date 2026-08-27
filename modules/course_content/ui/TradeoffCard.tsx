// P6: a `tradeoff` fence. No score, no "correct" side — the reader picks a
// side, then sees BOTH sides' win conditions, each a measurable signal
// rather than a feeling. Not gated on `verified` (docs/phases/06 gates only
// the quiz on that — a tradeoff has no answer key to protect).
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { TradeoffWidget } from '../course_content.blocks';

export function TradeoffCard({ widget }: { widget: TradeoffWidget }) {
  const [picked, setPicked] = useState<0 | 1 | null>(null);

  return (
    <div className="mt-2 rounded-md border border-border bg-surface-sunken p-3">
      <p className="mb-2 text-sm font-medium text-text-primary">{widget.question}</p>

      {picked === null && (
        <div className="flex gap-2">
          {widget.sides.map((side, i) => (
            <button
              key={side.name}
              type="button"
              onClick={() => setPicked(i as 0 | 1)}
              className="flex-1 rounded-md border border-border px-3 py-2 text-sm text-text-primary hover:border-primary"
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
            className="mb-2 text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary"
          >
            Pick again
          </button>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {widget.sides.map((side, i) => (
              <div
                key={side.name}
                className={cn(
                  'rounded-md border p-3',
                  picked === i ? 'border-primary bg-primary/5' : 'border-border'
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
    </div>
  );
}
