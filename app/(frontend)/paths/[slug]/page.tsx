import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { PathPage } from '@/modules/course_content/ui/PathPage';

// One static page per path (docs/phases/23-developer-paths.md keeps ADR 0001's
// static-generation stance).
export function generateStaticParams() {
  return CourseContentService.listPaths().map((path) => ({ slug: path.id }));
}

export const dynamicParams = false;

export default async function PathRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = CourseContentService.getPath(slug);
  if (!path) notFound();

  return <PathPage path={path} />;
}
