import Link from 'next/link';
import { Badge } from '@kui/ui/Badge';
import { BRACKET_LABELS, type DeveloperPath } from '../course_content.types';

// One developer path: its steps in reading order, grouped by course so the
// reader can see which courses it draws from. Numbered for order only —
// there is no completion state, no tick, no "n of m" (invariant #4). The
// number is the reading position, the same way the course-overview list is
// numbered.
export function PathPage({ path, hasCapstone = false }: { path: DeveloperPath; hasCapstone?: boolean }) {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="mb-4 text-xs text-text-secondary" aria-label="Breadcrumb">
        <Link href="/paths" className="hover:text-text-primary">
          Developer paths
        </Link>
      </nav>

      <h1 className="text-2xl font-semibold text-text-primary">{path.title}</h1>
      <p className="mt-2 text-text-secondary">{path.blurb}</p>
      <p className="mt-3 text-xs text-text-disabled">
        {path.stepCount} lessons across {path.courseCount} courses · read in order
      </p>

      <div className="mt-8 space-y-8">
        {path.byCourse.map((group) => (
          <section key={group.courseSlug}>
            <h2 className="text-sm font-semibold text-text-secondary">
              <Link href={`/courses/${group.courseSlug}`} className="hover:text-text-primary">
                {group.courseTitle}
              </Link>
            </h2>
            <ol className="mt-2 space-y-1">
              {group.steps.map((step) => (
                <li key={step.id}>
                  <Link
                    href={step.href}
                    className="flex items-baseline gap-3 rounded-md px-3 py-2 transition-colors hover:bg-surface-overlay"
                  >
                    <span className="w-6 shrink-0 text-right text-xs tabular-nums text-text-disabled">
                      {path.steps.findIndex((s) => s.id === step.id) + 1}
                    </span>
                    <span className="flex-1 text-sm font-medium text-text-primary">{step.title}</span>
                    <Badge variant="neutral" size="sm">
                      {BRACKET_LABELS[step.bracket]}
                    </Badge>
                  </Link>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      {/* P43: only where content/paths/<id>/capstone.md exists. It sits after
          the last step rather than beside the title, because unlike a course's
          capstone this one measures the whole reading order above it. */}
      {hasCapstone && (
        <Link
          href={`/paths/${path.id}/capstone`}
          className="mt-8 block rounded-lg border border-border bg-surface-raised px-4 py-3 transition-colors hover:bg-surface-overlay"
        >
          <span className="text-sm font-medium text-text-primary">Capstone</span>
          <span className="mt-1 block text-xs text-text-secondary">
            One deliverable that spans every course above.
          </span>
        </Link>
      )}
    </div>
  );
}
