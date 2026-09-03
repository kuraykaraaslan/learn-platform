// Four proportional segments, one primary hue getting more solid with depth —
// reads as "how advanced is this" without a legend. Shared by the home-page
// course cards (CourseCatalog) and the course overview header.
import { BRACKET_LABELS, BRACKET_ORDER, type Bracket } from '../course_content.types';
import { cn } from '@/libs/utils/cn';

const SHADE: Record<Bracket, string> = {
  '0-1': 'bg-primary/25',
  '1-3': 'bg-primary/45',
  '3-7': 'bg-primary/70',
  '7-10': 'bg-primary',
};

export function BracketBar({
  bracketCounts,
  total,
  className = 'h-1.5',
}: {
  bracketCounts: Record<Bracket, number>;
  total: number;
  className?: string;
}) {
  return (
    <div
      className={cn('flex w-full overflow-hidden rounded-full bg-surface-sunken', className)}
      role="img"
      aria-label={BRACKET_ORDER.filter((b) => bracketCounts[b] > 0)
        .map((b) => `${bracketCounts[b]} lessons at ${BRACKET_LABELS[b]}`)
        .join(', ')}
    >
      {BRACKET_ORDER.map((b) =>
        bracketCounts[b] > 0 ? (
          <div key={b} className={SHADE[b]} style={{ width: `${(bracketCounts[b] / total) * 100}%` }} />
        ) : null
      )}
    </div>
  );
}

/** "mostly 1-3 yrs" / "mostly 1-3 yrs, some 7-10 yrs" — a words summary of the
 *  same distribution, for where a bar alone is too terse. */
export function bracketSummary(bracketCounts: Record<Bracket, number>): string {
  const ranked = BRACKET_ORDER.filter((b) => bracketCounts[b] > 0).sort(
    (a, b) => bracketCounts[b] - bracketCounts[a]
  );
  if (ranked.length === 0) return '';
  const parts = [`mostly ${BRACKET_LABELS[ranked[0]]}`];
  if (ranked[1]) parts.push(`some ${BRACKET_LABELS[ranked[1]]}`);
  return parts.join(', ');
}
