import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { LessonPage } from '@/modules/course_content/ui/LessonPage';

// Fully static: every (courseSlug, lessonSlug) pair across every course is
// generated at build time — there's no server to render this on demand.
export function generateStaticParams() {
  return CourseContentService.listCourses().flatMap((course) =>
    CourseContentService.listLessonItems(course.slug).map((item) => ({
      courseSlug: course.slug,
      lessonSlug: item.lessonSlug,
    }))
  );
}

export default async function LessonRoute({
  params,
}: {
  params: Promise<{ courseSlug: string; lessonSlug: string }>;
}) {
  const { courseSlug, lessonSlug } = await params;
  const summary = CourseContentService.getCourseSummary(courseSlug);
  const lesson = CourseContentService.getLesson(courseSlug, lessonSlug);
  if (!summary || !lesson) notFound();

  const neighbors = CourseContentService.getLessonNeighbors(courseSlug, lessonSlug);
  const paths = CourseContentService.pathsForLesson(lesson.id);

  return (
    <LessonPage lesson={lesson} courseTitle={summary.title} neighbors={neighbors} paths={paths} />
  );
}
