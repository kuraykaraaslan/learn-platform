import type { Root, Text, PhrasingContent } from 'mdast';
import { lessonIndex } from './course_content.index';

/**
 * The three ways the corpus refers to another lesson, recognized in prose so
 * the source text never has to be rewritten:
 *
 *   1. `(#41)`        — the canonical form
 *   2. `see #41`      — a bare id after a reference cue
 *   3. `Lesson 41`    — the spelled-out form used in the business courses
 *
 * A bare `#41` with no cue is deliberately NOT matched: the corpus also writes
 * "rule #1" and "Top 10 #29", and linking those would be wrong. An id range
 * ("#53–62") is skipped too — it is one reference to many lessons and cannot
 * become a single link.
 */
const REF = new RegExp(
  [
    String.raw`\(#(?<paren>\d{1,3})\)`,
    String.raw`(?<cue>\b(?:see|See|ties to|also see|counterpart to|covered in|described in)\s+)#(?<cued>\d{1,3})\b(?!\s*[–—-]\s*\d)`,
    String.raw`\b(?<word>Lessons?\s+)(?<spelled>\d{1,3})\b`,
  ].join('|'),
  'g'
);

export function remarkLessonRefs() {
  const index = lessonIndex();

  return (tree: Root) => {
    visit(tree as unknown as { children?: unknown[]; type: string });

    function visit(node: { children?: unknown[]; type: string }) {
      if (!Array.isArray(node.children)) return;
      // Never rewrite inside a link (nested links are invalid). Code nodes have
      // no children, so fenced and inline code are untouched by construction.
      if (node.type === 'link' || node.type === 'linkReference') return;

      const next: PhrasingContent[] = [];
      let changed = false;

      for (const child of node.children as PhrasingContent[]) {
        if (child.type !== 'text') {
          visit(child as unknown as { children?: unknown[]; type: string });
          next.push(child);
          continue;
        }

        const value = (child as Text).value;
        const parts: PhrasingContent[] = [];
        let cursor = 0;

        REF.lastIndex = 0;
        for (let match = REF.exec(value); match; match = REF.exec(value)) {
          const g = match.groups!;
          const id = Number(g.paren ?? g.cued ?? g.spelled);
          const ref = index.get(id);
          if (!ref) continue;

          // Keep the cue word ("see ", "Lesson ") outside the link where it
          // reads as prose, and inside it where it reads as the label.
          const lead = g.cue ?? '';
          const label = g.word ? `${g.word.trim()} ${id}` : `#${id}`;
          const from = match.index + lead.length;

          if (from > cursor) parts.push({ type: 'text', value: value.slice(cursor, from) });
          parts.push({
            type: 'link',
            url: ref.href,
            title: ref.title,
            children: [{ type: 'text', value: label }],
          });
          cursor = match.index + match[0].length;
        }

        if (!parts.length) {
          next.push(child);
          continue;
        }
        if (cursor < value.length) parts.push({ type: 'text', value: value.slice(cursor) });
        next.push(...parts);
        changed = true;
      }

      if (changed) node.children = next;
    }
  };
}
