import Link from 'next/link';
import type { DeveloperPathSummary } from '../course_content.types';

// A static "Part of:" row on the lesson page (docs/phases/23-developer-paths.md).
// Server component, no client JS, no state — everyone sees the same row. It is
// deliberately NOT a progress affordance: no tick, no step number, no "x of y".
export function PathBadge({ paths }: { paths: DeveloperPathSummary[] }) {
  if (paths.length === 0) return null;

  return (
    <p className="mt-8 border-t border-border pt-4 text-xs text-text-secondary">
      <span>Part of: </span>
      {paths.map((path, i) => (
        <span key={path.id}>
          {i > 0 && <span aria-hidden="true"> · </span>}
          <Link href={`/paths/${path.id}`} className="text-primary hover:underline">
            {path.title}
          </Link>
        </span>
      ))}
    </p>
  );
}
