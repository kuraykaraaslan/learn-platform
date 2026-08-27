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
import type { RecallItem, RecallWidget } from '../../course_content.recall';

const MIN_ANSWER_LENGTH = 15;

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
}: {
  item: RecallItem;
  index: number;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
}) {
  const [answer, setAnswer] = useState('');
  const [revealed, setRevealed] = useState(false);
  const canReveal = answer.trim().length >= MIN_ANSWER_LENGTH;

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
            className="w-full resize-y rounded-md border border-border bg-surface-overlay p-2 text-sm text-text-primary outline-none focus-visible:border-primary"
          />
          <button
            type="button"
            onClick={() => setRevealed(true)}
            disabled={!canReveal}
            className="mt-2 rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Show
          </button>
          {!canReveal && answer.length > 0 && (
            <p className="mt-1 text-xs text-text-secondary">{MIN_ANSWER_LENGTH - answer.trim().length} more characters</p>
          )}
        </div>
      )}

      {revealed && (
        <div>
          <p className="mb-1 text-xs text-text-secondary">Your answer:</p>
          <p className="mb-3 whitespace-pre-wrap rounded-md bg-surface-overlay p-2 text-sm text-text-primary">{answer}</p>

          <p className="mb-1 text-xs text-text-secondary">Did your answer cover:</p>
          <ul className="mb-3 space-y-1.5">
            {item.must.map((m, mi) => {
              const key = widgetFieldKey(courseSlug, lessonFile, blockId, `${index}-${mi}`);
              return (
                <li key={mi}>
                  <label className="flex items-start gap-2 text-sm">
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={checked[key] ?? false}
                      onChange={(e) => setChecklistChecked(key, e.target.checked)}
                    />
                    <span className={checked[key] ? 'text-text-secondary line-through' : 'text-text-primary'}>{m}</span>
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
                className={cn(
                  'rounded-md border px-2 py-1 text-xs transition-colors',
                  assessment === value
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-text-secondary hover:text-text-primary'
                )}
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
  if (!verified) return null;

  return (
    <div className="mt-2 rounded-md border border-border bg-surface-sunken p-3">
      {widget.items.map((item, i) => (
        <RecallItemView
          key={i}
          item={item}
          index={i}
          blockId={blockId}
          courseSlug={courseSlug}
          lessonFile={lessonFile}
        />
      ))}
    </div>
  );
}
