// P12 Return Queue (docs/phases/12-search-and-review-queue.md): a Leitner
// spaced-repetition session built entirely on P1's own drill self-
// assessments — no deck of its own. public/review-index.json supplies the
// card content (lead + body), progress.store.ts's reviewBox supplies the
// schedule; this component just joins the two and shows what's due today.
//
// Deliberately no streak, no backlog count, no percentage: "today: 10
// cards" is the only number shown, ever — showing how many are overdue is
// exactly the pressure-metric docs/phases/README's invariants rule out.
'use client';

import { useEffect, useMemo, useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { useProgressStore, type MistakeAssessment } from '../progress.store';
import { useHydrated } from '../useHydrated';
import type { ReviewCard } from '../review-card';

const DAILY_CAP = 10;

const ASSESSMENT_LABEL: Record<MistakeAssessment, string> = {
  knew: 'I knew it',
  partial: 'Partial',
  missed: 'Missed',
};
const ASSESSMENTS = Object.keys(ASSESSMENT_LABEL) as MistakeAssessment[];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function CardView({ card, onDone }: { card: ReviewCard; onDone: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const setAssessment = useProgressStore((s) => s.setMistakeAssessment);

  return (
    <div className="rounded-lg border border-border bg-surface-raised p-5">
      <p className="mb-1 text-xs text-text-secondary">{card.lessonTitle}</p>
      <p className="mb-3 text-sm font-medium text-text-primary">{card.lead}</p>

      {!revealed ? (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="rounded-md border border-primary bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/20"
        >
          Show
        </button>
      ) : (
        <div>
          {/* eslint-disable-next-line react/no-danger -- card.bodyHtml comes from the same build-time markdown pipeline as every other lesson body, not user input */}
          <div
            className="mb-3 text-sm text-text-secondary [&_p]:mb-2 [&_code]:rounded [&_code]:bg-surface-sunken [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs"
            dangerouslySetInnerHTML={{ __html: card.bodyHtml }}
          />
          <div className="flex gap-2">
            {ASSESSMENTS.map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setAssessment(card.key, value);
                  onDone();
                }}
                className={cn(
                  'rounded-md border px-2 py-1 text-xs transition-colors',
                  'border-border text-text-secondary hover:text-text-primary hover:border-primary'
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

export function ReviewQueue() {
  const [allCards, setAllCards] = useState<ReviewCard[] | null>(null);
  const [session, setSession] = useState<ReviewCard[] | null>(null);
  const [completed, setCompleted] = useState(0);
  const hydrated = useHydrated();
  const reviewBox = useProgressStore((s) => s.reviewBox);

  useEffect(() => {
    fetch('/review-index.json')
      .then((r) => r.json())
      .then(setAllCards)
      .catch(() => setAllCards([]));
  }, []);

  // Built once per page load (not re-derived on every reviewBox change,
  // which would reshuffle the session out from under the reader mid-card
  // every time they answer one).
  const dueCards = useMemo(() => {
    if (!allCards || !hydrated) return null;
    const today = todayIso();
    return allCards.filter((c) => {
      const box = reviewBox[c.key];
      return box && box.nextReviewAt <= today;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session is intentionally frozen at first render, see comment above
  }, [allCards, hydrated]);

  useEffect(() => {
    if (dueCards && session === null) setSession(shuffle(dueCards).slice(0, DAILY_CAP));
  }, [dueCards, session]);

  if (!hydrated || allCards === null || session === null) {
    return <p className="text-sm text-text-secondary">Loading…</p>;
  }

  const remaining = session.slice(completed);

  if (session.length === 0) {
    return <p className="text-sm text-text-secondary">Nothing due for review today.</p>;
  }

  if (remaining.length === 0) {
    return <p className="text-sm text-text-secondary">Done — {session.length} card{session.length === 1 ? '' : 's'} reviewed today.</p>;
  }

  return (
    <div>
      <p className="mb-4 text-sm text-text-secondary">Today: {session.length} cards</p>
      <CardView key={remaining[0].key} card={remaining[0]} onDone={() => setCompleted((c) => c + 1)} />
    </div>
  );
}
