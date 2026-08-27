import { markdownToHast, markdownToHtml } from './course_content.markdown';
import { splitBlocks, type LessonBlock } from './course_content.blocks';
import type { LessonSections } from './course_content.types';

// The original 118-document corpus is NOT perfectly consistent in its section
// naming (verified across all 145 files): "Example Code" appears as "Example
// Code", "Example Code or Template", or "Example / Template"; "When to Use"
// appears as "When to Use", "When to Use / Apply", or "When NOT to Use". This
// matches on a prefix so every variant lands in the right field.
const HEADING_RULES: Array<{ prefix: string; field: keyof LessonSections }> = [
  { prefix: 'What It Is', field: 'whatItIs' },
  { prefix: 'Key Concepts', field: 'keyConcepts' },
  { prefix: 'Example Code', field: 'exampleCode' },
  { prefix: 'Example / Template', field: 'exampleCode' },
  { prefix: 'When to Use', field: 'whenToUse' },
  { prefix: 'When NOT to Use', field: 'whenToUse' },
  { prefix: 'Common Mistakes', field: 'commonMistakes' },
  { prefix: 'Further Reading', field: 'furtherReading' },
];

function matchHeading(heading: string): keyof LessonSections | null {
  for (const rule of HEADING_RULES) {
    if (heading.startsWith(rule.prefix)) return rule.field;
  }
  return null;
}

/**
 * Every lesson .md follows a fixed shape: `# N. Title` then six `##`
 * sections in a known order. This splits on `## Heading` lines, mapping only
 * *recognized* headings (see HEADING_RULES) to a field boundary — an
 * unrecognized `##` line (e.g. a sub-heading inside a worked example) is
 * treated as ordinary content of whichever section is currently open, not a
 * new section. Fence state (```) is tracked so a `##`-looking line inside a
 * code block is never mistaken for a heading either.
 *
 * Everything before the first recognized heading is discarded — which is what
 * makes YAML frontmatter safe to add, and why a section placed ABOVE
 * `## What It Is` vanishes entirely instead of rendering in the wrong card.
 */
export function splitLessonSections(raw: string): { title: string; sections: LessonSections } {
  const lines = raw.split('\n');

  const titleLine = lines.find((l) => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#\s*\d+\.\s*/, '').trim() : '';

  const sections: Partial<Record<keyof LessonSections, string>> = {};
  let currentField: keyof LessonSections | null = null;
  let buffer: string[] = [];
  let inFence = false;

  function flush() {
    if (currentField && buffer.length > 0) {
      sections[currentField] = buffer.join('\n').trim();
    }
    buffer = [];
  }

  for (const line of lines) {
    // Fence state is only meaningful inside an open section. Guarding on
    // currentField makes everything before the first recognized heading fully
    // inert: without it, an ODD number of fence-opening lines up there (a
    // frontmatter value holding a ``` block, a lesson that opens with one)
    // leaves inFence stuck on, every later "## " is read as fenced content,
    // and the lesson renders completely blank with no error.
    if (currentField && line.trimStart().startsWith('```')) {
      inFence = !inFence;
      buffer.push(line);
      continue;
    }

    if (!inFence) {
      const headingMatch = line.match(/^##\s+(.+?)\s*$/);
      if (headingMatch) {
        const field = matchHeading(headingMatch[1].trim());
        if (field) {
          flush();
          currentField = field;
          continue;
        }
        // Unrecognized heading (e.g. a sub-step inside "Example Code") — falls
        // through and is appended as ordinary content below.
      }
    }

    if (currentField) buffer.push(line);
  }
  flush();

  return {
    title,
    sections: {
      whatItIs: sections.whatItIs ?? '',
      keyConcepts: sections.keyConcepts ?? '',
      exampleCode: sections.exampleCode ?? '',
      whenToUse: sections.whenToUse ?? '',
      commonMistakes: sections.commonMistakes ?? '',
      furtherReading: sections.furtherReading ?? '',
    },
  };
}

/** Raw markdown per section, rendered to HTML. Output is byte-identical to
 *  before the block-refactor (course_content.snapshot.ts and
 *  scripts/parse-snapshot.ts depend on that). */
export function parseLessonMarkdown(raw: string): { title: string; sections: LessonSections } {
  const { title, sections } = splitLessonSections(raw);
  return {
    title,
    sections: Object.fromEntries(
      Object.entries(sections).map(([key, markdown]) => [key, markdownToHtml(markdown)])
    ) as LessonSections,
  };
}

/** Same section split as parseLessonMarkdown, but each section is rendered to
 *  <pre>-bounded blocks instead of one opaque HTML string — see
 *  course_content.blocks.ts. Raw per-section markdown is returned alongside
 *  (course_content.mistakes.ts's parseMistakes needs the Common Mistakes
 *  section's raw markdown, not HTML; kept out of this file so it stays
 *  single-purpose, per docs/phases/01-callouts-and-drill.md). */
export function parseLessonBlocks(raw: string): {
  title: string;
  sections: LessonSections;
  blocks: Record<keyof LessonSections, LessonBlock[]>;
} {
  const { title, sections } = splitLessonSections(raw);
  return {
    title,
    sections,
    blocks: Object.fromEntries(
      Object.entries(sections).map(([key, markdown]) => [
        key,
        splitBlocks(markdownToHast(markdown), key as keyof LessonSections),
      ])
    ) as Record<keyof LessonSections, LessonBlock[]>,
  };
}
