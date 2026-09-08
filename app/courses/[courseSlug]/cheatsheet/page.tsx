import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { buildCheatSheet } from '@/modules/course_content/course_content.cheatsheet';
import { CheatSheetPage } from '@/modules/course_content/ui/CheatSheetPage';

export function generateStaticParams() {
  return CourseContentService.listCourses().map((course) => ({ courseSlug: course.slug }));
}

export default async function CheatSheetRoute({
  params,
}: {
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  if (!CourseContentService.getCourseSummary(courseSlug)) notFound();

  return <CheatSheetPage sheet={buildCheatSheet(courseSlug)} />;
}
