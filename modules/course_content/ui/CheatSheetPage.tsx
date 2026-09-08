// P33: one printable page per course, built entirely from what the lessons
// already say. Nothing on this page was written for it — see
// course_content.cheatsheet.ts for the contract and the test that enforces it.
//
// A server component. The only client code is PrintButton, which exists for a
// single window.print() call.
import Link from 'next/link';
import type { CheatSheet } from '../course_content.cheatsheet';
import { PrintButton } from './PrintButton';

/** Renders a bullet's inline markdown the sheet actually uses: `**bold**`
 *  leads and `code` spans. Nothing else is interpreted — the strings are
 *  verbatim lesson text, and this page is not a second markdown pipeline. */
function inline(text: string, key: string): React.ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={`${key}-${i}`} className="font-semibold text-text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code key={`${key}-${i}`} className="rounded-sm bg-surface-sunken px-1 py-0.5 text-[0.9em]">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

export function CheatSheetPage({ sheet }: { sheet: CheatSheet }) {
  const lessons = sheet.lessons.filter((l) => l.concepts.length > 0 || l.mistakes.length > 0);

  return (
    <div data-print="sheet" className="mx-auto max-w-3xl">
      <header className="mb-6 border-b border-border pb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-text-primary">{sheet.title}</h1>
            <p className="mt-1 text-sm text-text-secondary">{sheet.description}</p>
          </div>
          <PrintButton />
        </div>
        <p className="mt-3 text-xs text-text-secondary">
          {lessons.length} lessons. Every line below is copied from the lesson it names — this page
          summarises nothing.{' '}
          <Link href={`/courses/${sheet.courseSlug}`} className="underline" data-print="hide">
            Back to the course
          </Link>
        </p>
      </header>

      <div className="space-y-6">
        {lessons.map((lesson) => (
          <section key={lesson.id} data-print="lesson">
            <h2 className="text-sm font-semibold text-text-primary">
              <Link
                href={`/courses/${sheet.courseSlug}/${lesson.lessonSlug}`}
                className="hover:underline"
              >
                {lesson.id}. {lesson.title}
              </Link>
            </h2>

            {lesson.concepts.length > 0 && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-text-secondary marker:text-border">
                {lesson.concepts.map((concept, i) => (
                  <li key={i}>{inline(concept, `c${lesson.id}-${i}`)}</li>
                ))}
              </ul>
            )}

            {lesson.mistakes.length > 0 && (
              <div className="mt-2 pl-5">
                <p className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
                  Watch for
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-4 text-sm text-text-secondary marker:text-border">
                  {lesson.mistakes.map((mistake, i) => (
                    <li key={i}>{inline(mistake, `m${lesson.id}-${i}`)}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}
