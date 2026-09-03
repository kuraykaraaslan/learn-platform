// P6 (docs/phases/06-quiz-tradeoff-diff.md): a `quiz` fence, parsed at build
// time (course_content.quiz.ts — YAML + zod, never shipped to the client).
// Never rendered on an unverified lesson — same stopping rule P1's
// FailureDrillCard already enforces (docs/phases/README.md's invariant #3:
// never open an exercise on unverified content).
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import type { QuizQuestion, QuizWidget } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { CHOICE_BASE, CHOICE_IDLE } from './widget-ui';

function QuestionCard({
  question,
  index,
  selected,
  onSelect,
}: {
  question: QuizQuestion;
  index: number;
  selected: number | null;
  onSelect: (option: number) => void;
}) {
  return (
    <div className={cn(index > 0 && 'mt-4 border-t border-border pt-4')}>
      <p className="mb-2 text-sm font-medium text-text-primary">{question.q}</p>
      <div className="space-y-1.5">
        {question.options.map((option, i) => {
          const isSelected = selected === i;
          const showResult = selected !== null;
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => onSelect(i)}
                disabled={showResult}
                className={cn(
                  CHOICE_BASE,
                  showResult && option.correct && 'border-success bg-success-subtle text-success-fg',
                  showResult && isSelected && !option.correct && 'border-error bg-error-subtle text-error-fg',
                  showResult && !isSelected && !option.correct && 'border-border text-text-secondary',
                  !showResult && CHOICE_IDLE
                )}
              >
                {option.text}
              </button>
              {showResult && isSelected && (
                <p className={cn('mt-1 px-1 text-xs', option.correct ? 'text-success-fg' : 'text-error-fg')}>
                  {option.why}
                </p>
              )}
            </div>
          );
        })}
      </div>
      {/* Every option's own reasoning, wrong ones included — not just the
          one the reader picked. A quiz where only the clicked option
          explains itself teaches nothing about the options not chosen. */}
      {selected !== null && (
        <details className="mt-2 text-xs text-text-secondary">
          <summary className="cursor-pointer">Why the other options are wrong</summary>
          <ul className="mt-1 list-disc space-y-1 pl-4">
            {question.options.map((option, i) =>
              i === selected ? null : (
                <li key={i}>
                  <span className="text-text-primary">{option.text}:</span> {option.why}
                </li>
              )
            )}
          </ul>
        </details>
      )}
    </div>
  );
}

export function QuizCard({ widget, verified }: { widget: QuizWidget; verified: boolean }) {
  // Lifted out of QuestionCard so the header strip can count answers. Plain
  // useState, so SSR and the hydrating render both produce 0 — nothing here
  // reads persisted state, and nothing about a quiz is persisted at all.
  const [selected, setSelected] = useState<(number | null)[]>(() => widget.questions.map(() => null));

  if (!verified) return null;

  const answered = selected.filter((s) => s !== null).length;

  return (
    <WidgetShell kind="quiz" status={`${answered}/${widget.questions.length} answered`}>
      {widget.questions.map((q, i) => (
        <QuestionCard
          key={i}
          question={q}
          index={i}
          selected={selected[i] ?? null}
          onSelect={(option) => setSelected((prev) => prev.map((v, j) => (j === i ? option : v)))}
        />
      ))}
    </WidgetShell>
  );
}
