import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { hasCapstone, loadCapstone } from '@/modules/course_content/course_content.capstone';
import { CapstonePage } from '@/modules/course_content/ui/CapstonePage';

/** Only the courses that actually have a capstone.md get a route — the
 *  roadmap's own rule: "Route dosya varlığına göre açılır, yoksa hiçbir şey
 *  gösterilmez." */
export function generateStaticParams() {
  return CourseContentService.listCourses()
    .filter((course) => hasCapstone(course.slug))
    .map((course) => ({ courseSlug: course.slug }));
}

export const dynamicParams = false;

export default async function CapstoneRoute({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const summary = CourseContentService.getCourseSummary(courseSlug);
  const capstone = loadCapstone(courseSlug);
  if (!summary || !capstone) notFound();

  return <CapstonePage capstone={capstone} courseTitle={summary.title} />;
}
