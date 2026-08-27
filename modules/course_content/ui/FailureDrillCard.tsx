// Common Mistakes, as predict-then-reveal: reading "register errorHandler
// before the routers" doesn't produce a prediction error, so it's forgotten.
// Showing just the lead and asking "what breaks?" creates a commitment — a
// wrong guess makes the explanation that follows land as a correction.
//
// Replaces LessonSectionCard's Common Mistakes card ONLY when three things
// hold (checked in FailureDrillCard itself, so LessonPage.tsx stays a
// one-line swap): interactive !== 'off', verified === true, and at least two
// drillable (non-'single') mistakes exist. Otherwise it falls back to
// exactly today's card — a drill inherits the correctness of the content
// it's built on, and this repo never opens an exercise on an unverified
// lesson (docs/phases/README.md's invariant #3).
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { useProgressStore, mistakeKey, lessonKey, type MistakeAssessment } from '@/modules/progress/progress.store';
import { useHydrated } from '@/modules/progress/useHydrated';
import type { Lesson } from '../course_content.types';
import type { LessonMistake } from '../course_content.mistakes';
import type { LessonBlock } from '../course_content.blocks';
import { LessonSectionCard } from './LessonSectionCard';

const ASSESSMENT_LABEL: Record<MistakeAssessment, string> = {
  knew: 'I knew it',
  partial: 'Partial',
  missed: 'Missed',
};
const ASSESSMENTS = Object.keys(ASSESSMENT_LABEL) as MistakeAssessment[];

function MistakeRow({
  storageKey,
  mistake,
  forceOpen,
}: {
  storageKey: string;
  mistake: LessonMistake;
  forceOpen: boolean;
}) {
  const [open, setOpen] = useState(false);
  const isOpen = open || forceOpen;
  const assessment = useProgressStore((s) => s.mistake[storageKey]);
  const setAssessment = useProgressStore((s) => s.setMistakeAssessment);
  const hydrated = useHydrated();

  return (
    <li className="border-b border-border py-3 last:border-0">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start justify-between gap-3 text-left text-sm font-medium text-text-primary"
      >
        <span>{mistake.lead}</span>
        <span aria-hidden="true" className="shrink-0 text-text-secondary">
          {isOpen ? 'Hide' : 'What breaks?'}
        </span>
      </button>

      {/* Recall-only, gated on hydration so SSR/first-paint never claims a
          persisted assessment before localStorage has actually been read. */}
      {hydrated && assessment && !isOpen && (
        <p className="mt-1 text-xs text-text-secondary">
          You marked this {ASSESSMENT_LABEL[assessment].toLowerCase()} last time.
        </p>
      )}

      {isOpen && (
        <div role="region" aria-label={mistake.lead} className="mt-2">
          {/* eslint-disable-next-line react/no-danger -- mistake.bodyHtml is our own build-time markdown pipeline output, not user input */}
          <div
            className="text-sm text-text-secondary [&_p]:mb-2 [&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs"
            dangerouslySetInnerHTML={{ __html: mistake.bodyHtml }}
          />
          <div className="mt-2 flex gap-2">
            {ASSESSMENTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setAssessment(storageKey, value)}
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
    </li>
  );
}

export function FailureDrillCard({ lesson, blocks }: { lesson: Lesson; blocks: LessonBlock[] }) {
  const key = lessonKey(lesson.courseSlug, lesson.file);
  const expandAll = useProgressStore((s) => s.expandAll[key] ?? false);
  const setExpandAll = useProgressStore((s) => s.setExpandAll);

  const drillable = lesson.mistakes.filter((m) => m.form !== 'single');
  const singles = lesson.mistakes.filter((m) => m.form === 'single');
  const eligible = lesson.interactive !== 'off' && lesson.verified === true && drillable.length >= 2;

  if (!eligible)
    return (
      <LessonSectionCard
        title="Common Mistakes"
        blocks={blocks}
        courseSlug={lesson.courseSlug}
        lessonFile={lesson.file}
        verified={lesson.verified === true}
      />
    );

  return (
    <section className="rounded-lg border border-border bg-surface-raised p-5">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide">Common Mistakes</h2>
        <button
          type="button"
          onClick={() => setExpandAll(key, !expandAll)}
          className="text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary"
        >
          {expandAll ? 'Collapse all' : 'Expand all'}
        </button>
      </div>
      <p className="mb-3 text-xs text-text-secondary">Guess what breaks before you open each one.</p>

      <ul>
        {drillable.map((mistake) => (
          <MistakeRow
            key={mistake.id}
            storageKey={mistakeKey(lesson.courseSlug, lesson.file, mistake.id)}
            mistake={mistake}
            forceOpen={expandAll}
          />
        ))}
      </ul>

      {singles.length > 0 && (
        <>
          <hr className="my-3 border-border" />
          {/* Not drillable — one unparseable sentence, honestly listed rather
              than wrapped in a fake button. */}
          <ul className="space-y-2">
            {singles.map((mistake) => (
              <li key={mistake.id} className="text-sm text-text-secondary [&_p]:inline">
                {/* eslint-disable-next-line react/no-danger -- mistake.bodyHtml is our own build-time markdown pipeline output, not user input */}
                <span dangerouslySetInnerHTML={{ __html: mistake.bodyHtml }} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
