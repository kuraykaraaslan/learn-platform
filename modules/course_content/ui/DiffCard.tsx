// P6: a broken/fixed pair the corpus already writes today (course_content.
// diff.ts labels it, writes no new content). A toggle between two full code
// bodies, with same-index lines that differ between them highlighted —
// a plain per-line comparison, not a real LCS diff: exact for the corpus's
// actual shape (a fixed function signature, one or two lines changed inside
// it), approximate if a real edit ever inserts/removes a line and shifts
// everything after it out of alignment.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { DiffWidget } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { CHIP_BASE, CHIP_IDLE } from './widget-ui';

function diffLines(a: string[], b: string[]): boolean[] {
  const len = Math.max(a.length, b.length);
  return Array.from({ length: len }, (_, i) => a[i] !== b[i]);
}

export function DiffCard({ widget }: { widget: DiffWidget }) {
  const [showing, setShowing] = useState<'broken' | 'fixed'>('broken');

  const brokenLines = widget.broken.split('\n');
  const fixedLines = widget.fixed.split('\n');
  const changed = diffLines(brokenLines, fixedLines);
  const lines = showing === 'broken' ? brokenLines : fixedLines;

  return (
    <WidgetShell kind="diff" bodyClassName="p-3 font-mono text-xs">
      <div className="mb-2 flex gap-1 font-sans">
        {(['broken', 'fixed'] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setShowing(mode)}
            className={cn(
              CHIP_BASE,
              'px-3 capitalize',
              showing === mode
                ? mode === 'broken'
                  ? 'border-error bg-error-subtle text-error-fg'
                  : 'border-success bg-success-subtle text-success-fg'
                : CHIP_IDLE
            )}
          >
            {mode}
          </button>
        ))}
      </div>
      <pre className="overflow-x-auto whitespace-pre text-text-primary">
        {lines.map((line, i) => (
          <div key={i} className={cn(changed[i] && (showing === 'broken' ? 'bg-error-subtle' : 'bg-success-subtle'))}>
            {line || ' '}
          </div>
        ))}
      </pre>
    </WidgetShell>
  );
}
