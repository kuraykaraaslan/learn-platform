import { visit } from 'unist-util-visit';
import type { Root } from 'hast';

declare module 'hast' {
  interface Data {
    /** Raw pre>code text, stashed by rehypeStashCode before rehype-highlight
     *  replaces the text child with highlighted spans. */
    source?: string;
  }
}

/** pre > code's raw source, stashed into node.data.source before rehype-highlight
 *  splits it into spans. hast-util-to-html ignores `data`, so this plugin does
 *  not change output HTML (verified across all 412 lessons). Scoped to
 *  pre > code only — unscoped would also stash the 3,563 inline `code` runs,
 *  harmlessly but pointlessly. */
export function rehypeStashCode() {
  return (tree: Root) => {
    visit(tree, 'element', (node, _index, parent) => {
      if (node.tagName !== 'code') return;
      if (!parent || parent.type !== 'element' || parent.tagName !== 'pre') return;
      const first = node.children[0];
      if (first?.type === 'text') {
        // mdast-util-to-hast's code handler always appends one trailing "\n"
        // to the mdast code node's value (for HTML <pre><code> correctness).
        // Strip it back off so data.source matches the mdast value — the same
        // string course_content.fences.ts's listFences() reads off the raw
        // markdown, verified by course_content.blocks.test.ts.
        (node.data ??= {}).source = first.value.replace(/\n$/, '');
      }
    });
  };
}
