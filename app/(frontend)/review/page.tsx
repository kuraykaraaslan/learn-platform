import { ReviewQueue } from '@/modules/progress/ui/ReviewQueue';

export default function ReviewPage() {
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Return Queue</h1>
      <p className="mb-6 text-sm text-text-secondary">
        Cards you marked &ldquo;Missed&rdquo; or &ldquo;Partial&rdquo; while reading, resurfaced on a spaced schedule.
      </p>
      <ReviewQueue />
    </div>
  );
}
