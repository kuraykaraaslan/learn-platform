// Home-page catalog (app/(frontend)/page.tsx): the two tracks, each a grid of
// course cards, plus an optional "your experience" filter that highlights the
// courses whose lessons mostly sit at the chosen level.
//
// Client component only for that filter + the cover-image error fallback. The
// choice is remembered in localStorage under its own key — deliberately NOT
// the progress store (progress.store.ts is locked to a fixed key set), and it
// is a view preference, not progress.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/libs/utils/cn';
import { BracketBar } from './BracketBar';
import {
  BRACKET_LABELS,
  BRACKET_ORDER,
  type Bracket,
  type CourseSection,
  type CourseSummary,
} from '../course_content.types';

const STORAGE_KEY = 'learn:home:experience';

function useRememberedBracket() {
  const [bracket, setBracket] = useState<Bracket | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (BRACKET_ORDER as string[]).includes(saved)) setBracket(saved as Bracket);
    } catch {
      /* private mode / disabled storage — just start unfiltered */
    }
    setHydrated(true);
  }, []);

  function choose(next: Bracket | null) {
    setBracket(next);
    try {
      if (next) localStorage.setItem(STORAGE_KEY, next);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }

  return { bracket: hydrated ? bracket : null, choose };
}

export function CourseCatalog({ sections }: { sections: CourseSection[] }) {
  const { bracket, choose } = useRememberedBracket();

  return (
    <div>
      <ExperiencePicker selected={bracket} onSelect={choose} />

      <div className="mt-10 space-y-14">
        {sections.map((section) => (
          <section key={section.id}>
            <h2 className="text-lg font-semibold text-text-primary">{section.title}</h2>
            <p className="mt-1 text-sm text-text-secondary">{section.blurb}</p>

            <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {section.courses.map((course) => (
                <CourseCard key={course.slug} course={course} activeBracket={bracket} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ExperiencePicker({
  selected,
  onSelect,
}: {
  selected: Bracket | null;
  onSelect: (b: Bracket | null) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-text-secondary">Years writing software:</span>
      <div className="inline-flex overflow-hidden rounded-md border border-border">
        {BRACKET_ORDER.map((b) => (
          <button
            key={b}
            type="button"
            aria-pressed={selected === b}
            onClick={() => onSelect(selected === b ? null : b)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium transition-colors border-l border-border first:border-l-0',
              selected === b
                ? 'bg-primary text-primary-fg'
                : 'bg-surface-raised text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
            )}
          >
            {BRACKET_LABELS[b].replace(' yrs', '')}
          </button>
        ))}
      </div>
      {selected && (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className="text-xs text-text-secondary underline underline-offset-2 hover:text-text-primary"
        >
          Show all
        </button>
      )}
    </div>
  );
}

function CourseCard({
  course,
  activeBracket,
}: {
  course: CourseSummary;
  activeBracket: Bracket | null;
}) {
  const fits = activeBracket === null || course.dominantBracket === activeBracket;
  const atLevel = activeBracket ? course.bracketCounts[activeBracket] : 0;

  return (
    <Link
      href={`/courses/${course.slug}`}
      className={cn(
        'group flex flex-col overflow-hidden rounded-lg border bg-surface-raised transition-all',
        'hover:-translate-y-0.5 hover:shadow-md',
        fits ? 'border-border hover:border-border-strong' : 'border-border opacity-55 hover:opacity-100',
        activeBracket && fits && 'ring-2 ring-primary ring-offset-2 ring-offset-surface-base border-transparent'
      )}
    >
      <CardCover course={course} />

      <div className="flex flex-1 flex-col p-4">
        <h3 className="font-semibold text-text-primary group-hover:text-primary transition-colors">
          {course.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-sm text-text-secondary">{course.description}</p>

        <div className="mt-auto pt-3">
          <BracketBar bracketCounts={course.bracketCounts} total={course.count} />
          <p className="mt-1.5 text-xs text-text-disabled">
            {course.count} lessons
            {activeBracket && atLevel > 0 && (
              <span className="text-primary"> · {atLevel} at your level</span>
            )}
            {!activeBracket && ` · mostly ${BRACKET_LABELS[course.dominantBracket]}`}
          </p>
        </div>
      </div>
    </Link>
  );
}

function CardCover({ course }: { course: CourseSummary }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-primary-subtle to-surface-overlay">
      {!failed && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={course.cover}
          alt=""
          loading="lazy"
          onError={() => setFailed(true)}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
      )}
      {failed && (
        <div className="flex h-full w-full items-center justify-center">
          <span className="text-2xl font-bold text-primary/40">{course.title.slice(0, 2)}</span>
        </div>
      )}
    </div>
  );
}

