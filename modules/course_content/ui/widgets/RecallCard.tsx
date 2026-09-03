// P11 "Close the Tab" (docs/phases/11-recall-and-calc.md): free recall, not
// a quiz. The reader writes their own answer from memory before seeing
// anything — the 15-character gate is the whole point ("without this gate
// it's a reveal-answer button, not a recall exercise," per the spec's own
// framing). Never rendered on an unverified lesson, same stopping rule
// FailureDrillCard/QuizCard already enforce.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { useProgressStore, mistakeKey, widgetFieldKey, type MistakeAssessment } from '@/modules/progress/progress.store';
import { useHydrated } from '@/modules/progress/useHydrated';
import type { RecallItem, RecallWidget } from '../../course_content.recall';
import { WidgetShell } from '../WidgetShell';
import { canReveal, charsRemaining } from '../reveal-gate';
import { BTN_PRIMARY, CHECKBOX, CHIP_BASE, CHIP_IDLE, CHIP_ON, FIELD } from '../widget-ui';

const ASSESSMENT_LABEL: Record<MistakeAssessment, string> = {
  knew: 'I knew it',
  partial: 'Partial',
  missed: 'Missed',
};
const ASSESSMENTS = Object.keys(ASSESSMENT_LABEL) as MistakeAssessment[];

function RecallItemView({
  item,
  index,
  blockId,
  courseSlug,
  lessonFile,
  revealed,
  onReveal,
}: {
  item: RecallItem;
  index: number;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
  revealed: boolean;
  onReveal: () => void;
}) {
  const [answer, setAnswer] = useState('');
  const unlocked = canReveal(answer);
  const hydrated = useHydrated();

  const checked = useProgressStore((s) => s.checklistChecked);
  const setChecklistChecked = useProgressStore((s) => s.setChecklistChecked);
  const assessKey = mistakeKey(courseSlug, lessonFile, `${blockId}-${index}`);
  const assessment = useProgressStore((s) => s.mistake[assessKey]);
  const setAssessment = useProgressStore((s) => s.setMistakeAssessment);

  return (
    <div className={cn(index > 0 && 'mt-4 border-t border-border pt-4')}>
      <p className="mb-2 text-sm font-medium text-text-primary">{item.q}</p>

      {!revealed && (
        <div>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            rows={3}
            placeholder="Write what you remember before revealing the checklist…"
            className={cn(FIELD, 'resize-y p-2')}
          />
          <button type="button" onClick={onReveal} disabled={!unlocked} className={cn(BTN_PRIMARY, 'mt-2')}>
            Show
          </button>
          {!unlocked && answer.length > 0 && (
            <p className="mt-1 text-xs text-text-secondary">{charsRemaining(answer)} more characters</p>
          )}
        </div>
      )}

      {revealed && (
        <div>
          <p className="mb-1 text-xs text-text-secondary">Your answer:</p>
          <p className="mb-3 whitespace-pre-wrap rounded-md border border-border bg-surface-overlay p-2 text-sm text-text-primary">
            {answer}
          </p>

          <p className="mb-1 text-xs text-text-secondary">Did your answer cover:</p>
          <ul className="mb-3 space-y-1.5">
            {item.must.map((m, mi) => {
              const key = widgetFieldKey(courseSlug, lessonFile, blockId, `${index}-${mi}`);
              return (
                <li key={mi}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className={CHECKBOX}
                      checked={(hydrated && checked[key]) ?? false}
                      onChange={(e) => setChecklistChecked(key, e.target.checked)}
                    />
                    <span className={hydrated && checked[key] ? 'text-text-secondary line-through' : 'text-text-primary'}>
                      {m}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>

          <div className="flex gap-2">
            {ASSESSMENTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAssessment(assessKey, value)}
                className={cn(CHIP_BASE, hydrated && assessment === value ? CHIP_ON : CHIP_IDLE)}
              >
                {ASSESSMENT_LABEL[value]}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RecallCard({
  widget,
  blockId,
  courseSlug,
  lessonFile,
  verified,
}: {
  widget: RecallWidget;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
  verified: boolean;
}) {
  // Lifted out of RecallItemView so the strip can count reveals. Plain
  // useState (nothing about a reveal is persisted), so SSR renders 0.
  const [revealed, setRevealed] = useState<boolean[]>(() => widget.items.map(() => false));

  if (!verified) return null;

  return (
    <WidgetShell kind="recall" status={`${revealed.filter(Boolean).length}/${widget.items.length} revealed`}>
      {widget.items.map((item, i) => (
        <RecallItemView
          key={i}
          item={item}
          index={i}
          blockId={blockId}
          courseSlug={courseSlug}
          lessonFile={lessonFile}
          revealed={revealed[i] ?? false}
          onReveal={() => setRevealed((prev) => prev.map((v, j) => (j === i ? true : v)))}
        />
      ))}
    </WidgetShell>
  );
}
