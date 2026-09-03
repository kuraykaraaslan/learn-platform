import Link from 'next/link';
import type { DeveloperPathSummary } from '../course_content.types';

// The four curated cross-course reading orders, as a row of cards. Shown on
// the home page ABOVE the catalog (docs/phases/23-developer-paths.md): the
// catalog stays the way in, a path is a reading suggestion in front of it.
// Reused, heading-less, as the top of /paths.
//
// Server component. No progress, no counter — `stepCount` and `courseCount`
// describe the path, they do not track a reader.
export function PathsRail({
  paths,
  heading = true,
}: {
  paths: DeveloperPathSummary[];
  heading?: boolean;
}) {
  return (
    <section>
      {heading && (
        <>
          <h2 className="text-lg font-semibold text-text-primary">Developer paths</h2>
          <p className="mt-1 text-sm text-text-secondary">
            A curated reading order across courses — for a specific job, not a whole branch.
          </p>
        </>
      )}
      <div className={`grid gap-4 sm:grid-cols-2 ${heading ? 'mt-5' : ''}`}>
        {paths.map((path) => (
          <Link
            key={path.id}
            href={`/paths/${path.id}`}
            className="group flex flex-col rounded-lg border border-border bg-surface-raised p-4 transition-all hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md"
          >
            <h3 className="font-semibold text-text-primary transition-colors group-hover:text-primary">
              {path.title}
            </h3>
            <p className="mt-1 line-clamp-3 text-sm text-text-secondary">{path.blurb}</p>
            <p className="mt-3 text-xs text-text-disabled">
              {path.stepCount} lessons · {path.courseCount} courses
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
