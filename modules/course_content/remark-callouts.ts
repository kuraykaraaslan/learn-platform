import { visit } from 'unist-util-visit';
import type { Root, Blockquote, Paragraph, Text } from 'mdast';

/**
 * GFM alert syntax (`> [!NOTE]`) is not supported by this pipeline today —
 * verified: it renders as a plain blockquote with the marker as literal text.
 * This plugin turns a blockquote whose first paragraph starts with `[!KIND]`
 * into `<aside data-callout="kind">`, dropping the marker line. It runs after
 * remarkGfm, before remarkRehype, and relies on mdast-util-to-hast's
 * `data.hName`/`data.hProperties` override — no new hast handler needed.
 *
 * PITFALL is this corpus's own addition: the inline counterpart to a Common
 * Mistakes entry, for a warning that belongs in the middle of prose rather
 * than the end-of-lesson list.
 */
const CALLOUT_KINDS = ['NOTE', 'TIP', 'WARNING', 'CAUTION', 'PITFALL'] as const;
export type CalloutKind = Lowercase<(typeof CALLOUT_KINDS)[number]>;

const MARKER = new RegExp(`^\\[!(${CALLOUT_KINDS.join('|')})\\]\\s*\\n?`);

export function remarkCallouts() {
  return (tree: Root) => {
    visit(tree, 'blockquote', (node: Blockquote) => {
      const first = node.children[0];
      if (!first || first.type !== 'paragraph') return;

      const firstChild = (first as Paragraph).children[0];
      if (!firstChild || firstChild.type !== 'text') return;

      const match = MARKER.exec((firstChild as Text).value);
      if (!match) return;

      const kind = match[1].toLowerCase() as CalloutKind;
      const rest = (firstChild as Text).value.slice(match[0].length);
      if (rest === '') (first as Paragraph).children.shift();
      else (firstChild as Text).value = rest;

      node.data = { ...node.data, hName: 'aside', hProperties: { 'data-callout': kind } };
    });
  };
}
