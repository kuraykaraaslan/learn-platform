import Link from 'next/link';
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

      {BRACKET_ORDER.filter((bracket) => items.some((i) => i.bracket === bracket)).map((bracket) => (
        <div key={bracket} className="mb-6">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-text-secondary mb-2">
            {BRACKET_LABELS[bracket]}
          </h2>
          <ul className="space-y-1">
            {items
              .filter((i) => i.bracket === bracket)
              .sort((a, b) => a.id - b.id)
              .map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/courses/${summary.slug}/${item.lessonSlug}`}
                    className="block rounded-md px-3 py-2 text-sm text-text-primary hover:bg-surface-overlay transition-colors"
                  >
                    {item.title}
                  </Link>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
