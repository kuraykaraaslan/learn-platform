// Small chips on the course-overview list showing what a lesson actually
// asks the reader to *do* — so "Contributing to Open Source" reads as
// "4 drills · fill-in · checklist", not just a title.
import { Badge } from '@kui/ui/Badge';
import type { LessonFeatures } from '../course_content.types';

type Chip = { label: string; strong?: boolean };

function chips(f: LessonFeatures): Chip[] {
  const out: Chip[] = [];
  if (f.drills > 0) out.push({ label: `${f.drills} ${f.drills === 1 ? 'drill' : 'drills'}`, strong: true });
  if (f.runnableCode) out.push({ label: 'live code', strong: true });
  if (f.project) out.push({ label: 'run project', strong: true });
  if (f.sql) out.push({ label: 'live SQL', strong: true });
  if (f.diff) out.push({ label: 'broken → fixed' });
  if (f.quiz) out.push({ label: 'quiz' });
  if (f.tradeoff) out.push({ label: 'trade-off' });
  if (f.recall) out.push({ label: 'recall' });
  if (f.calc) out.push({ label: 'calculator' });
  if (f.checklist) out.push({ label: 'checklist' });
  if (f.template) out.push({ label: 'fill-in' });
  if (f.mermaid) out.push({ label: 'diagram' });
  return out;
}

export function LessonFeatureChips({ features }: { features: LessonFeatures }) {
  const list = chips(features);
  if (list.length === 0) return null;

  return (
    <span className="flex flex-wrap gap-1">
      {list.map((c) => (
        <Badge key={c.label} variant={c.strong ? 'primary' : 'neutral'} size="sm">
          {c.label}
        </Badge>
      ))}
    </span>
  );
}
