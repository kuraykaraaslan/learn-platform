// Course catalog / site home — data-driven from modules/course_content.
import Link from 'next/link';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { CourseCatalog } from '@/modules/course_content/ui/CourseCatalog';
import { SearchLauncher } from '@/modules/course_content/ui/SearchLauncher';

export default function HomePage() {
  const sections = CourseContentService.listCourseSections();
  const stats = CourseContentService.catalogStats();

  const firstCourse = sections[0]?.courses[0];

  return (
    <div>
      <section className="border-b border-border pb-10">
        <p className="text-sm font-medium text-primary">Path to the software business era</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-semibold leading-tight text-text-primary sm:text-4xl">
          Don&rsquo;t just read about it &mdash; build it, break it, and prove it works.
        </h1>
        <p className="mt-4 max-w-2xl text-text-secondary">
          {stats.courses} courses, from the fundamentals every senior engineer assumes to the
          business of getting paid for the work. Code runs in your browser, mistakes are drills
          you have to answer, and there&rsquo;s no sign-up.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          {firstCourse && (
            <Link
              href={`/courses/${firstCourse.slug}`}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-fg transition-colors hover:bg-primary-hover"
            >
              Start with the fundamentals
            </Link>
          )}
          <SearchLauncher />
        </div>

        <dl className="mt-8 grid max-w-xl grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Stat value={stats.lessons} label="lessons" />
          <Stat value={stats.courses} label="courses" />
          <Stat value={stats.drillableLessons} label="with drills" />
          <Stat value={stats.conceptTerms} label="glossary terms" />
        </dl>
      </section>

      <div className="pt-10">
        <CourseCatalog sections={sections} />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <dt className="text-2xl font-semibold tabular-nums text-text-primary">{value}</dt>
      <dd className="text-xs text-text-secondary">{label}</dd>
    </div>
  );
}
