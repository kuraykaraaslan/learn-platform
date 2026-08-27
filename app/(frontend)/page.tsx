// Course catalog / site home — data-driven from modules/course_content.
import Link from 'next/link';
import { CourseContentService } from '@/modules/course_content/course_content.service';

export default function HomePage() {
  const courses = CourseContentService.listCourses();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-text-primary mb-2">Courses</h1>
      <p className="text-text-secondary mb-8">Path to the software business era.</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <Link
            key={course.slug}
            href={`/courses/${course.slug}`}
            className="block rounded-lg border border-border bg-surface-raised p-6 hover:border-border-strong transition-colors"
          >
            <h2 className="font-semibold text-text-primary mb-1">{course.title}</h2>
            <p className="text-sm text-text-secondary mb-3">{course.description}</p>
            <p className="text-xs text-text-disabled">{course.count} lessons</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
