// P34: the capstone page. A server component apart from the rubric, which
// needs state for the self-assessment and the seal.
import Link from 'next/link';
import type { Capstone } from '../course_content.capstone';
import { CapstoneRubric } from './CapstoneRubric';

export function CapstonePage({ capstone, courseTitle }: { capstone: Capstone; courseTitle: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-6">
        <Link
          href={`/courses/${capstone.courseSlug}`}
          className="text-sm text-text-secondary underline decoration-border underline-offset-4 hover:text-text-primary"
        >
          {courseTitle}
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-text-primary">Capstone — {capstone.title}</h1>
        <p className="mt-1 text-sm text-text-secondary">
          One deliverable, scored by you against this course&rsquo;s own documented mistakes. Nothing
          here is recorded or counted.
        </p>
      </header>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary">Brief</h2>
        <div className="prose-lesson mt-2" dangerouslySetInnerHTML={{ __html: capstone.briefHtml }} />
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-semibold text-text-primary">Deliverable</h2>
        <div
          className="prose-lesson mt-2"
          dangerouslySetInnerHTML={{ __html: capstone.deliverableHtml }}
        />
      </section>

      <section>
        <h2 className="text-lg font-semibold text-text-primary">Rubric</h2>
        <p className="mt-1 mb-3 text-sm text-text-secondary">
          Every row is a mistake this course already documents, quoted from the lesson beside it.
        </p>
        <CapstoneRubric
          rows={capstone.rubric}
          courseSlug={capstone.courseSlug}
          title={capstone.title}
          referenceHtml={capstone.referenceHtml}
        />
      </section>
    </div>
  );
}
