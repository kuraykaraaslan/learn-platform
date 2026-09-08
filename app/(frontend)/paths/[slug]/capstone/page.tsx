import { notFound } from 'next/navigation';
import { CourseContentService } from '@/modules/course_content/course_content.service';
import { hasPathCapstone, loadPathCapstone } from '@/modules/course_content/course_content.capstone';
import { CapstonePage } from '@/modules/course_content/ui/CapstonePage';

/** Only paths with a content/paths/<id>/capstone.md get a route, the same rule
 *  the course capstone follows (docs/phases/34-capstone.md). */
export function generateStaticParams() {
  return CourseContentService.listPaths()
    .filter((path) => hasPathCapstone(path.id))
    .map((path) => ({ slug: path.id }));
}

export const dynamicParams = false;

export default async function PathCapstoneRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const path = CourseContentService.getPath(slug);
  const capstone = loadPathCapstone(slug);
  if (!path || !capstone) notFound();

  return <CapstonePage capstone={capstone} courseTitle={path.title} backHref={`/paths/${slug}`} />;
}
