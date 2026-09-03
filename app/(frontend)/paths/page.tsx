import { CourseContentService } from '@/modules/course_content/course_content.service';
import { PathsRail } from '@/modules/course_content/ui/PathsRail';

// Static: the four paths come from course_content.paths.ts at build time.
export const dynamic = 'error';

export default function PathsRoute() {
  const paths = CourseContentService.listPaths();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold text-text-primary">Developer paths</h1>
      <p className="mt-2 max-w-2xl text-text-secondary">
        Each path is a hand-picked reading order across several courses, aimed at one kind of
        work. A lesson can sit in more than one path, or in none — the catalog is still the
        complete list.
      </p>

      <div className="mt-8">
        <PathsRail paths={paths} heading={false} />
      </div>
    </div>
  );
}
