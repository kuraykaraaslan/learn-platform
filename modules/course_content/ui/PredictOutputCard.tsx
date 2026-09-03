// P5 (docs/phases/05-ci-and-proof.md): predict-then-reveal for a `proof`
// fence. Never a Run button — nothing here executes anything. The command
// is visible, the output stays hidden until the reader commits to a
// prediction (15+ characters), then both are shown side by side. The
// output itself was produced by scripts/stamp-verify.ts actually running
// the command in content/_verify/<courseSlug>/<lessonId>/ — a real CI
// artifact, not authored prose, which is the entire point: a wrong
// prediction can't be quietly reworded into a right one after the fact.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { useProgressStore, mistakeKey, type MistakeAssessment } from '@/modules/progress/progress.store';
import { useHydrated } from '@/modules/progress/useHydrated';
import type { LessonBlock } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { BTN_PRIMARY, CHIP_BASE, CHIP_IDLE, CHIP_ON, FIELD, PANE } from './widget-ui';

const MIN_PREDICTION_LENGTH = 15;

const ASSESSMENT_LABEL: Record<MistakeAssessment, string> = {
  knew: 'I knew it',
  partial: 'Partial',
  missed: 'Missed',
};
const ASSESSMENTS = Object.keys(ASSESSMENT_LABEL) as MistakeAssessment[];

/** `$ <command>\n<real captured output>` — see scripts/stamp-verify.ts. */
function splitCommandAndOutput(source: string): { command: string; output: string } {
  const newline = source.indexOf('\n');
  if (newline === -1) return { command: source, output: '' };
  return { command: source.slice(0, newline), output: source.slice(newline + 1) };
}

export function PredictOutputCard({
  block,
  courseSlug,
  lessonFile,
}: {
  block: Extract<LessonBlock, { kind: 'code' }>;
  courseSlug: string;
  lessonFile: string;
}) {
  const [prediction, setPrediction] = useState('');
  const [revealed, setRevealed] = useState(false);

  const key = mistakeKey(courseSlug, lessonFile, block.id);
  const assessment = useProgressStore((s) => s.mistake[key]);
  const setAssessment = useProgressStore((s) => s.setMistakeAssessment);
  const hydrated = useHydrated();

  const { command, output } = splitCommandAndOutput(block.source);
  const at = typeof block.meta.opts.at === 'string' ? block.meta.opts.at : undefined;
  const commit = typeof block.meta.opts.commit === 'string' ? block.meta.opts.commit : undefined;
  const canReveal = prediction.trim().length >= MIN_PREDICTION_LENGTH;

  return (
    // 'predict output' and 'hidden'/'revealed' are deliberately free of a
    // capital-R "Run": docs/phases/05 bans a Run button here (nothing on this
    // card executes anything) and the test matches />\s*Run\s*</ to prove it.
    <WidgetShell kind="proof" status={revealed ? 'revealed' : 'hidden'} bodyClassName="p-3 font-mono text-xs">
      <pre className="whitespace-pre-wrap text-text-primary">{command}</pre>

      {!revealed && (
        <div className="mt-3 font-sans">
          <label htmlFor={`predict-${block.id}`} className="mb-1 block text-text-secondary">
            What do you expect this to print?
          </label>
          <textarea
            id={`predict-${block.id}`}
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            rows={3}
            className={cn(FIELD, 'resize-y p-2 text-xs')}
          />
          <button type="button" onClick={() => setRevealed(true)} disabled={!canReveal} className={cn(BTN_PRIMARY, 'mt-2')}>
            Show real output
          </button>
          {!canReveal && prediction.length > 0 && (
            <p className="mt-1 text-xs text-text-secondary">
              {MIN_PREDICTION_LENGTH - prediction.trim().length} more characters
            </p>
          )}
        </div>
      )}

      {revealed && (
        <div className="mt-3 space-y-3 font-sans">
          <div>
            <p className="mb-1 text-text-secondary">Your prediction:</p>
            <pre className={PANE}>{prediction}</pre>
          </div>
          <div>
            <p className="mb-1 text-text-secondary">
              Real output — produced by CI{at ? ` on ${at}` : ''}{commit ? `, commit ${commit}` : ''}.
            </p>
            <pre className={PANE}>{output}</pre>
          </div>

          <div className="flex gap-2">
            {ASSESSMENTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAssessment(key, value)}
                className={cn(CHIP_BASE, hydrated && assessment === value ? CHIP_ON : CHIP_IDLE)}
              >
                {ASSESSMENT_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
      )}
    </WidgetShell>
  );
}
