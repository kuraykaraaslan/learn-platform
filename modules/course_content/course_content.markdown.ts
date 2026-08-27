import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeStringify from 'rehype-stringify';
import { remarkLessonRefs } from './remark-lesson-refs';

// Sync end-to-end (rehype-highlight does no async I/O), so processSync is safe
// to call directly from a Server Component / generateStaticParams at build time.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkLessonRefs)
  .use(remarkRehype)
  .use(rehypeHighlight)
  .use(rehypeStringify);

export function markdownToHtml(markdown: string): string {
  return String(processor.processSync(markdown));
}
