import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { CourseOverviewPage } from '@/modules/course_content/ui/CourseOverviewPage';

export function generateStaticParams() {
  return CourseContentService.listCourses().map((course) => ({ courseSlug: course.slug }));
}

export default async function CourseOverviewRoute({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const summary = CourseContentService.getCourseSummary(courseSlug);
  if (!summary) notFound();

  const lessons = CourseContentService.listLessonCards(courseSlug);

  return <CourseOverviewPage summary={summary} lessons={lessons} />;
}
