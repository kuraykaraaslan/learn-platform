import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';

export type Fence = {
  courseSlug: string;
  file: string;
  lessonId: number;
  lessonTitle: string;
  /** The info string exactly as authored, e.g. "typescript" or "md". */
  lang: string;
  /** 1-based line number of the opening fence in the source file. */
  line: number;
  /** Heading of the section the fence sits in, or null if before any. */
  section: string | null;
  code: string;
};

const HEADING = /^##\s+(.+?)\s*$/;
const FENCE = /^(\s*)(`{3,})(.*)$/;

/**
 * Extracts every fenced block in the corpus with enough context to report on
 * it. Deliberately independent of the lesson parser: this reads raw source, so
 * it also sees fences the parser drops (before the first heading) and fences in
 * sections the parser folds into a neighbour.
 */
export function listFences(): Fence[] {
  const out: Fence[] = [];

  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const lines = readLessonMarkdown(courseSlug, item.file).split('\n');
      let section: string | null = null;
      let i = 0;

      while (i < lines.length) {
        const fence = FENCE.exec(lines[i]);
        if (fence) {
          const [, indent, ticks, info] = fence;
          // A fence closes on a line of at least as many backticks and nothing
          // else; an inner ```block inside a longer ````fence is body, not a close.
          const closer = new RegExp(`^\\s*${ticks}\\s*$`);
          const body: string[] = [];
          let j = i + 1;
          while (j < lines.length && !closer.test(lines[j])) {
            body.push(lines[j].startsWith(indent) ? lines[j].slice(indent.length) : lines[j]);
            j++;
          }
          out.push({
            courseSlug,
            file: item.file,
            lessonId: item.id,
            lessonTitle: item.title,
            lang: info.trim().split(/\s+/)[0] ?? '',
            line: i + 1,
            section,
            code: body.join('\n'),
          });
          i = j + 1;
          continue;
        }

        const heading = HEADING.exec(lines[i]);
        if (heading) section = heading[1];
        i++;
      }
    }
  }

  return out;
}
