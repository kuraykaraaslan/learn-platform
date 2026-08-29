import Link from 'next/link';
import { Badge } from '@kui/ui/Badge';
import { BracketBar, bracketSummary } from './BracketBar';
import { LessonFeatureChips } from './LessonFeatureChips';
import { BRACKET_LABELS, type CourseSummary, type LessonCard } from '../course_content.types';

export function CourseOverviewPage({
  summary,
  lessons,
}: {
  summary: CourseSummary;
  lessons: LessonCard[];
}) {
  const ordered = [...lessons].sort((a, b) => a.id - b.id);
  const totalMinutes = ordered.reduce((sum, l) => sum + l.minutes, 0);
  const totalDrills = ordered.reduce((sum, l) => sum + l.features.drills, 0);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6 overflow-hidden rounded-lg border border-border bg-surface-raised">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={summary.cover}
          alt=""
          className="aspect-[16/6] w-full object-cover"
          onError={undefined}
        />
        <div className="p-5">
          <h1 className="text-2xl font-semibold text-text-primary">{summary.title}</h1>
          <p className="mt-1 text-text-secondary">{summary.description}</p>

          <div className="mt-4 max-w-xs">
            <BracketBar bracketCounts={summary.bracketCounts} total={summary.count} />
            <p className="mt-1.5 text-xs text-text-secondary">
              {summary.count} lessons · {bracketSummary(summary.bracketCounts)} · ~{totalMinutes} min
              {totalDrills > 0 && ` · ${totalDrills} drills`}
            </p>
          </div>
        </div>
      </div>

      <ol className="space-y-1.5">
        {ordered.map((lesson, index) => (
          <li key={lesson.id}>
            <Link
              href={`/courses/${summary.slug}/${lesson.lessonSlug}`}
              className="block rounded-md px-3 py-2.5 hover:bg-surface-overlay transition-colors"
            >
              <div className="flex items-baseline gap-3">
                <span className="w-5 shrink-0 text-right text-xs tabular-nums text-text-disabled">
                  {index + 1}
                </span>
                <span className="flex-1 text-sm font-medium text-text-primary">{lesson.title}</span>
                <Badge variant="neutral" size="sm">
                  {BRACKET_LABELS[lesson.bracket]}
                </Badge>
              </div>

              {lesson.teaser && (
                <p className="mt-1 pl-8 text-xs text-text-secondary line-clamp-1">{lesson.teaser}</p>
              )}

              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 pl-8">
                <LessonFeatureChips features={lesson.features} />
                <span className="text-[10px] text-text-disabled">
                  ~{lesson.minutes} min
                  {lesson.verified !== true && ' · draft'}
                </span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}
