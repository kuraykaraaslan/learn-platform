import type { Root, Text, PhrasingContent } from 'mdast';
import { lessonIndex } from './course_content.index';

const REF = /\(#(\d{1,3})\)/g;

/**
 * Turns the corpus's canonical cross-reference form "(#41)" into a real link
 * to that lesson.
 *
 * The lessons already point at each other constantly — the saga lesson names
 * the idempotency lesson, the SQL primer names the N+1 lesson — but as inert
 * text, so the reader has no route and the corpus reads as 412 dead ends.
 *
 * Only "(#N)" is rewritten: it is unambiguous. Bare "#41" and "Lesson 41" are
 * left alone and flagged by `links/non-canonical-ref` in content-lint, so the
 * corpus converges on one form instead of the tooling guessing at three.
 * An id with no lesson is left as plain text rather than becoming a dead link.
 */
export function remarkLessonRefs() {
  const index = lessonIndex();

  return (tree: Root) => {
    visit(tree);

    function visit(node: { children?: unknown[]; type: string }) {
      if (!('children' in node) || !Array.isArray(node.children)) return;
      // Never rewrite inside a link (nested links are invalid) or code.
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
        REF.lastIndex = 0;
        if (!REF.test(value)) {
          next.push(child);
          continue;
        }

        REF.lastIndex = 0;
        let cursor = 0;
        let match: RegExpExecArray | null;
        const parts: PhrasingContent[] = [];

        while ((match = REF.exec(value))) {
          const ref = index.get(Number(match[1]));
          if (!ref) continue;
          if (match.index > cursor) parts.push({ type: 'text', value: value.slice(cursor, match.index) });
          parts.push({
            type: 'link',
            url: ref.href,
            title: ref.title,
            children: [{ type: 'text', value: `#${ref.id}` }],
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
