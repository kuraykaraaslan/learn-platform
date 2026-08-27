import type { Root, Text, PhrasingContent } from 'mdast';
import type { VFile } from 'vfile';
import { loadConcepts, buildConceptIndex } from './course_content.concepts';

/**
 * Links the first mention of each concept term/alias per SECTION (not per
 * text node — a term can appear once in an early paragraph and again, still
 * linkable, in a later one within the same section) to a `<button
 * data-concept>` that ui/ConceptTooltip.tsx hydrates into a definition
 * popover — never a plain `<a>`, since there's nowhere for a reader to
 * navigate to mid-prose.
 *
 * Three things this deliberately never does, all measured against the risk
 * the phase spec calls "mavi çorba" (blue soup of links):
 *   - No self-links: a term is never linked inside the lesson that defines it.
 *   - No more than `ctx.conceptLinkBudget.remaining` links in the WHOLE
 *     lesson — that budget is one object shared across all 6 sections'
 *     separate calls to this plugin (see course_content.markdown.ts).
 *   - Never inside a fence or inline code: both are mdast Literal nodes with
 *     a `value` string and no `children` array, so the tree walk below never
 *     reaches into them — the same structural guarantee remark-lesson-refs.ts
 *     already relies on.
 */
export function remarkConcepts() {
  return (tree: Root, file: VFile) => {
    const ctx = file.data.markdownContext;
    if (!ctx || ctx.conceptLinkBudget.remaining <= 0) return;

    // Not cached across calls (loadConcepts() already caches the raw JSON
    // read) — rebuilding the ~120-term lookup/regex per section is cheap
    // relative to the rest of this pipeline, and it means content/concepts.json
    // is never a step behind a mocked or edited version.
    const { lookup, pattern } = buildConceptIndex(loadConcepts());
    if (!pattern) return;

    // Rebound as plain consts so TypeScript narrows them inside the nested
    // `visit` closure below — narrowing on `ctx`/`pattern` themselves does
    // not survive crossing into a nested function.
    const budget = ctx.conceptLinkBudget;
    const lessonId = ctx.lessonId;
    const usedConcepts = ctx.usedConcepts;
    const matchPattern = pattern;

    const linkedThisSection = new Set<string>();

    function visit(node: { children?: unknown[]; type: string }) {
      if (!Array.isArray(node.children)) return;
      if (node.type === 'link' || node.type === 'linkReference' || node.type === 'conceptTerm') return;

      const next: PhrasingContent[] = [];
      let changed = false;

      for (const child of node.children as PhrasingContent[]) {
        if (child.type !== 'text') {
          visit(child as unknown as { children?: unknown[]; type: string });
          next.push(child);
          continue;
        }
        if (budget.remaining <= 0) {
          next.push(child);
          continue;
        }

        const value = (child as Text).value;
        const parts: PhrasingContent[] = [];
        let cursor = 0;

        matchPattern.lastIndex = 0;
        for (let match = matchPattern.exec(value); match; match = matchPattern.exec(value)) {
          const found = lookup.get(match[0].toLowerCase());
          if (!found) continue;
          const { slug, concept } = found;

          // Self-link, already-linked-this-section, or budget just ran out
          // mid-scan — none of these consume the match; text stays plain.
          if (concept.lesson === lessonId) continue;
          if (linkedThisSection.has(slug)) continue;
          if (budget.remaining <= 0) break;

          if (match.index > cursor) parts.push({ type: 'text', value: value.slice(cursor, match.index) });
          parts.push({
            // A type mdast-util-to-hast has no built-in handler for, so it
            // falls to its generic "apply data.hName/hProperties" path
            // instead of a real element handler. Using `type: 'link'` here
            // was tried and rejected: its handler runs first and sets
            // `href`, which `hProperties` then merges onto rather than
            // replaces — the button ends up with a stray `href="#"`.
            type: 'conceptTerm',
            data: {
              hName: 'button',
              hProperties: {
                type: 'button',
                className: ['concept-term'],
                'data-concept': slug,
                'aria-describedby': 'concept-tooltip',
              },
            },
            children: [{ type: 'text', value: match[0] }],
          } as unknown as PhrasingContent);
          cursor = match.index + match[0].length;

          linkedThisSection.add(slug);
          budget.remaining--;
          if (!usedConcepts.includes(slug)) usedConcepts.push(slug);
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

    visit(tree as unknown as { children?: unknown[]; type: string });
  };
}
