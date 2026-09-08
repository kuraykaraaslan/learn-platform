'use client';

// P34: the rubric, the seal and the export — the only client code in the
// capstone.
//
// The scores live in component state and nowhere else. docs/phases/README.md's
// invariant #4 forbids an accumulated completion measure, and
// progress.store.test.ts locks the persisted key list to six entries; adding a
// seventh for capstone scores would have to break that test to happen, which
// is exactly the conversation the test exists to force. A self-assessment that
// disappears on reload cannot become a score, a streak or a percentage.
import { useState } from 'react';
import type { RubricRow } from '../course_content.capstone';
import { BTN_PRIMARY, BTN_SECONDARY } from './widget-ui';

type Score = 'met' | 'partial' | 'missed';

const SCORES: { value: Score; label: string }[] = [
  { value: 'met', label: 'Met' },
  { value: 'partial', label: 'Partial' },
  { value: 'missed', label: 'Missed' },
];

export function CapstoneRubric({
  rows,
  courseSlug,
  title,
  referenceHtml,
}: {
  rows: RubricRow[];
  courseSlug: string;
  title: string;
  referenceHtml: string;
}) {
  const [scores, setScores] = useState<Record<number, Score>>({});
  const scored = rows.filter((_, i) => scores[i] !== undefined).length;
  const complete = scored === rows.length;

  function exportMarkdown() {
    const lines = [
      `# Capstone — ${title}`,
      '',
      `Course: ${courseSlug}`,
      '',
      '## My assessment',
      '',
      ...rows.map((row, i) => `- [${scores[i] ?? '—'}] ${row.lead} (Lesson ${row.lesson})`),
      '',
      '_Self-assessed. The reference walkthrough is deliberately not included —',
      'this package is your work, not the course\'s._',
      '',
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `capstone-${courseSlug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <ol className="space-y-3">
        {rows.map((row, i) => (
          <li key={i} className="rounded-md border border-border bg-surface-sunken p-3">
            <p className="text-sm font-medium text-text-primary">{row.lead}</p>
            <p className="mt-1 text-sm text-text-secondary">{row.looks_like}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {SCORES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={scores[i] === option.value}
                  onClick={() => setScores((prev) => ({ ...prev, [i]: option.value }))}
                  className={scores[i] === option.value ? BTN_PRIMARY : BTN_SECONDARY}
                >
                  {option.label}
                </button>
              ))}
              <span className="ml-auto text-[11px] uppercase tracking-wider text-text-secondary">
                Lesson {row.lesson}
              </span>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-sm text-text-secondary">
          {scored} of {rows.length} scored
        </span>
        <button type="button" className={BTN_SECONDARY} onClick={exportMarkdown} disabled={scored === 0}>
          Export my assessment
        </button>
      </div>

      <section className="mt-8 border-t border-border pt-6">
        <h2 className="text-lg font-semibold text-text-primary">Reference walkthrough</h2>
        {complete ? (
          <div
            className="prose-lesson mt-3"
            // Server-rendered from capstone.md through the same markdown
            // pipeline every lesson uses.
            dangerouslySetInnerHTML={{ __html: referenceHtml }}
          />
        ) : (
          <p className="mt-3 rounded-md border border-dashed border-border p-4 text-sm text-text-secondary">
            Sealed until you have scored yourself on every row above —{' '}
            {rows.length - scored} left. Reading it first turns this into a comprehension test,
            which is the one thing it is not.
          </p>
        )}
      </section>
    </div>
  );
}
