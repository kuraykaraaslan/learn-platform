import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import { toHtml } from 'hast-util-to-html';
import { VFile } from 'vfile';
import type { Root as HastRoot } from 'hast';
import { remarkLessonRefs } from './remark-lesson-refs';
import { remarkCallouts } from './remark-callouts';
import { remarkConcepts } from './remark-concepts';
import { rehypeStashCode } from './rehype-stash-code';

/**
 * Per-lesson state a section's markdown is rendered with. The pipeline below
 * is one module-level singleton shared by every lesson and section — this is
 * what actually varies per call, threaded through vfile.data rather than as a
 * `.use()` option, because `.use()` options are fixed once at pipeline-build
 * time and this repo parses hundreds of sections through the same processor.
 */
export type MarkdownContext = {
  lessonId: number;
  /** Shared across all 6 sections of one lesson (same object, mutated in
   *  place) — remark-concepts.ts decrements this and stops linking new terms
   *  once it hits 0, enforcing "at most 4 concept links per lesson" across
   *  section boundaries, not just within one section. */
  conceptLinkBudget: { remaining: number };
  /** Slugs actually linked anywhere in this lesson, in link order — read
   *  back by course_content.parser.ts so the caller (ultimately LessonPage)
   *  knows which concept definitions to ship to the client. */
  usedConcepts: string[];
};

declare module 'vfile' {
  interface DataMap {
    markdownContext?: MarkdownContext;
  }
}

// Sync end-to-end (rehype-highlight does no async I/O), so processSync is safe
// to call directly from a Server Component / generateStaticParams at build time.
//
// remarkCallouts runs right after remarkGfm, on the rawest text available, so
// it sees the `[!KIND]` marker before anything else touches the blockquote's
// text. remarkConcepts runs after it (so it never tries to link inside a
// marker that's about to be stripped) and before remarkLessonRefs, matching
// docs/phases/03-concept-glossary.md's specified order.
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
  .use(remarkConcepts)
  .use(remarkLessonRefs)
  .use(remarkRehype)
  .use(rehypeStashCode)
  .use(rehypeHighlight);

export function markdownToHast(markdown: string, ctx?: MarkdownContext): HastRoot {
  const file = new VFile(markdown);
  if (ctx) file.data.markdownContext = ctx;
  return hastProcessor.runSync(hastProcessor.parse(file), file) as HastRoot;
}

export function markdownToHtml(markdown: string, ctx?: MarkdownContext): string {
  return toHtml(markdownToHast(markdown, ctx));
}
