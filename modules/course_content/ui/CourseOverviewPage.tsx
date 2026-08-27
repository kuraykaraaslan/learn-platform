import Link from 'next/link';
import { Badge } from '@kui/ui/Badge';
import { BRACKET_LABELS, BRACKET_ORDER, type CourseSummary, type ManifestItem } from '../course_content.types';

type Item = ManifestItem & { lessonSlug: string };

export function CourseOverviewPage({
  summary,
  items,
}: {
  summary: CourseSummary;
  items: Item[];
}) {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">{summary.title}</h1>
      <p className="text-text-secondary mb-6">{summary.description}</p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        {BRACKET_ORDER.map((bracket) => (
          <div key={bracket} className="rounded-lg border border-border bg-surface-raised p-3">
            <div className="text-xs text-text-secondary mb-1">{BRACKET_LABELS[bracket]}</div>
            <div className="text-xl font-semibold text-text-primary">
              {summary.bracketCounts[bracket]}
            </div>
          </div>
        ))}
      </div>

      {/* Authored order (manifest id), not bracket order: grouping by bracket
          moved lessons up to 37 positions out of the sequence they were
          written in. The bracket travels with the lesson as a badge. */}
      <ol className="space-y-1">
        {[...items]
          .sort((a, b) => a.id - b.id)
          .map((item, index) => (
            <li key={item.id}>
              <Link
                href={`/courses/${summary.slug}/${item.lessonSlug}`}
                className="flex items-center gap-3 rounded-md px-3 py-2 text-sm text-text-primary hover:bg-surface-overlay transition-colors"
              >
                <span className="w-6 shrink-0 text-right text-xs tabular-nums text-text-disabled">
                  {index + 1}
                </span>
                <span className="flex-1">{item.title}</span>
                <Badge variant="neutral" size="sm">
                  {BRACKET_LABELS[item.bracket]}
                </Badge>
              </Link>
            </li>
          ))}
      </ol>
    </div>
  );
}
