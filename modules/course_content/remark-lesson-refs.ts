import type { Root, Text, PhrasingContent } from 'mdast';
import { lessonIndex } from './course_content.index';

/**
 * Cross-references to another lesson, recognized in prose so the source text
 * never has to be rewritten. Any `#41` whose id exists in the corpus becomes a
 * link, as does the spelled-out `Lesson 41` / `Course 41` form.
 *
 * The exclusions are what make this safe, and both are grounded in what the
 * corpus actually contains rather than in caution:
 *
 *   - A counter noun before the id ("rule #1", "step #3") is never a lesson
 *     reference. A survey of every bare id in all 412 lessons found exactly one
 *     such usage, so the deny-list is small on purpose and is enforced by test.
 *   - An id range ("#53–62") is one reference to many lessons and cannot become
 *     a single link, so it is left alone.
 */
const COUNTER_NOUNS =
  /\b(rule|issue|step|item|no|num|number|pr|ticket|bug|chapter|figure|part|point|phase|option|version|week|day)\.?$/i;

const REF = new RegExp(
  [
    String.raw`\(#(?<paren>\d{1,3})\)`,
    String.raw`(?<word>\b(?:Lessons?|Courses?)\s+)(?<spelled>\d{1,3})\b`,
    String.raw`#(?<bare>\d{1,3})\b(?!\s*[–—-]\s*\d)`,
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
          const id = Number(g.paren ?? g.spelled ?? g.bare);
          const ref = index.get(id);
          if (!ref) continue;
          // "rule #1" counts rules, not lessons.
          if (g.bare && COUNTER_NOUNS.test(value.slice(0, match.index).trimEnd())) continue;

          // "Lesson 41" reads as its own label; a bare or parenthesised id
          // becomes "#41".
          const label = g.word ? `${g.word.trim()} ${id}` : `#${id}`;
          const from = match.index;

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
