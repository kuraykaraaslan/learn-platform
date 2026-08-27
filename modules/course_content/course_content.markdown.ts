import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import { toHtml } from 'hast-util-to-html';
import type { Root as HastRoot } from 'hast';
import { remarkLessonRefs } from './remark-lesson-refs';
import { remarkCallouts } from './remark-callouts';
import { rehypeStashCode } from './rehype-stash-code';

// Sync end-to-end (rehype-highlight does no async I/O), so processSync is safe
// to call directly from a Server Component / generateStaticParams at build time.
//
// remarkCallouts runs right after remarkGfm, on the rawest text available, so
// it sees the `[!KIND]` marker before anything else touches the blockquote's
// text; remarkLessonRefs runs after it and still reaches a callout's body
// normally (it visits text nodes regardless of the ancestor's hName override).
//
// rehypeStashCode runs between remarkRehype and rehypeHighlight: at that point
// pre > code still has its raw text child, which rehype-highlight is about to
// shred into spans. rehype-stringify is deliberately not in this pipeline —
// hast-util-to-html is called directly in markdownToHtml below, so
// splitBlocks (course_content.blocks.ts) can serialize the same hast tree
// per-block instead of only ever getting one big string.
const hastProcessor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkCallouts)
  .use(remarkLessonRefs)
  .use(remarkRehype)
  .use(rehypeStashCode)
  .use(rehypeHighlight);

export function markdownToHast(markdown: string): HastRoot {
  return hastProcessor.runSync(hastProcessor.parse(markdown)) as HastRoot;
}

export function markdownToHtml(markdown: string): string {
  return toHtml(markdownToHast(markdown));
}
