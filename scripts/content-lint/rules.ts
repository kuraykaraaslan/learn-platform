import { listFences, type Fence } from '../../modules/course_content/course_content.fences';
import {
  listCourseSlugs,
  readCourseManifest,
  readLessonMarkdown,
} from '../../modules/course_content/course_content.manifest';

export type Severity = 'error' | 'warn';

export type Finding = {
  rule: string;
  severity: Severity;
  /** "<courseSlug>/<file>" or "<courseSlug>" for course-level rules. */
  target: string;
  line?: number;
  message: string;
};

export type LessonFile = {
  courseSlug: string;
  file: string;
  target: string;
  id: number;
  title: string;
  raw: string;
  lines: string[];
  /** Section heading -> its body lines, in source order. */
  sections: { heading: string; start: number; lines: string[] }[];
  fences: Fence[];
};

export type Rule = {
  id: string;
  severity: Severity;
  description: string;
  lesson?: (file: LessonFile) => Finding[];
  course?: (slug: string, files: LessonFile[]) => Finding[];
};

/**
 * Walks a lesson's lines, reporting for each whether it sits inside a fenced
 * block, using CommonMark's rule: a fence is closed only by a run of at least
 * as many backticks as opened it. A naive toggle on every "```" line goes out
 * of phase the moment a four-backtick block wraps three-backtick ones — which
 * is exactly how a lesson can look fine and render as one monospace blob.
 */
export function walkLines(lines: string[]): { line: string; index: number; inFence: boolean }[] {
  const out: { line: string; index: number; inFence: boolean }[] = [];
  let openTicks = 0;
  lines.forEach((line, index) => {
    const fence = /^\s*(`{3,})/.exec(line);
    if (fence) {
      const ticks = fence[1].length;
      if (openTicks === 0) {
        openTicks = ticks;
        out.push({ line, index, inFence: true });
        return;
      }
      if (ticks >= openTicks && /^\s*`+\s*$/.test(line)) {
        out.push({ line, index, inFence: true });
        openTicks = 0;
        return;
      }
    }
    out.push({ line, index, inFence: openTicks > 0 });
  });
  return out;
}

const RECOGNIZED = [
  'What It Is',
  'Key Concepts',
  'Example Code',
  'Example / Template',
  'When to Use',
  'When NOT to Use',
  'Common Mistakes',
  'Further Reading',
];

const isRecognized = (heading: string) => RECOGNIZED.some((p) => heading.startsWith(p));

export function loadCorpus(): LessonFile[] {
  const fencesByFile = new Map<string, Fence[]>();
  for (const fence of listFences()) {
    const key = `${fence.courseSlug}/${fence.file}`;
    fencesByFile.set(key, [...(fencesByFile.get(key) ?? []), fence]);
  }

  const out: LessonFile[] = [];
  for (const courseSlug of listCourseSlugs()) {
    for (const item of readCourseManifest(courseSlug).items) {
      const raw = readLessonMarkdown(courseSlug, item.file);
      const lines = raw.split('\n');
      const target = `${courseSlug}/${item.file}`;

      // Section split that mirrors the renderer: fenced lines never start a section.
      const sections: LessonFile['sections'] = [];
      for (const { line, index, inFence } of walkLines(lines)) {
        const heading = inFence ? null : /^##\s+(.+?)\s*$/.exec(line);
        if (heading) sections.push({ heading: heading[1], start: index + 1, lines: [] });
        else if (sections.length) sections[sections.length - 1].lines.push(line);
      }

      out.push({
        courseSlug,
        file: item.file,
        target,
        id: item.id,
        title: item.title,
        raw,
        lines,
        sections,
        fences: fencesByFile.get(target) ?? [],
      });
    }
  }
  return out;
}

const bullets = (file: LessonFile, heading: string) =>
  (file.sections.find((s) => s.heading.startsWith(heading))?.lines ?? []).filter((l) =>
    l.trimStart().startsWith('- ')
  );

export const RULES: Rule[] = [
  {
    id: 'shape/unrecognized-heading',
    severity: 'error',
    description:
      'A "## " heading the parser does not recognize is silently folded into the previous card instead of becoming its own section.',
    lesson: (file) =>
      file.sections
        .filter((s) => !isRecognized(s.heading))
        .map((s) => ({
          rule: 'shape/unrecognized-heading',
          severity: 'error' as const,
          target: file.target,
          line: s.start,
          message: `"## ${s.heading}" is not a recognized section; it renders inside the previous card.`,
        })),
  },
  {
    id: 'shape/missing-section',
    severity: 'error',
    description: 'Every lesson should carry the six-section shape.',
    lesson: (file) => {
      const present = new Set(
        file.sections.filter((s) => isRecognized(s.heading)).map((s) => {
          const match = RECOGNIZED.find((p) => s.heading.startsWith(p))!;
          return match.startsWith('Example') ? 'Example Code' : match.startsWith('When') ? 'When to Use' : match;
        })
      );
      const required = ['What It Is', 'Key Concepts', 'Example Code', 'When to Use', 'Common Mistakes', 'Further Reading'];
      return required
        .filter((r) => !present.has(r))
        .map((r) => ({
          rule: 'shape/missing-section',
          severity: 'error' as const,
          target: file.target,
          message: `missing "## ${r}"`,
        }));
    },
  },
  {
    id: 'code/jsx-in-ts-fence',
    severity: 'error',
    description: 'JSX inside a fence tagged `typescript` mis-highlights and proves the snippet was never compiled.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang.toLowerCase() === 'typescript' && /^\s*(return\s*\(|<[A-Z][\w.]*[\s/>])/m.test(f.code))
        .map((f) => ({
          rule: 'code/jsx-in-ts-fence',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: 'fence contains JSX but is tagged `typescript` — should be `tsx`',
        })),
  },
  {
    id: 'code/private-alias',
    severity: 'warn',
    description:
      'Snippets importing @/libs, @/modules, @/stores or @/components reference the first owner\'s private boilerplate; no reader can resolve them.',
    lesson: (file) =>
      file.fences
        .filter((f) => /from\s+['"]@\/(libs|modules|stores|components)\//.test(f.code))
        .map((f) => ({
          rule: 'code/private-alias',
          severity: 'warn' as const,
          target: file.target,
          line: f.line,
          message: `imports a private alias: ${
            [...f.code.matchAll(/from\s+['"](@\/(?:libs|modules|stores|components)\/[^'"]*)['"]/g)]
              .map((m) => m[1])
              .join(', ')
          }`,
        })),
  },
  {
    id: 'code/unlabeled-fence',
    severity: 'warn',
    description:
      'An unlabeled fence holding actual code is never syntax-highlighted and, more importantly, is invisible to scripts/verify-code.ts. An unlabeled fence holding a diagram, a checklist or a transcript is fine and is not flagged: rehype-highlight does not auto-detect, so it renders exactly as written.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === '')
        .filter((f) =>
          /^\s*(import|export|const|let|function|async|class|interface|type|return|await|SELECT|CREATE|ALTER)\b/m.test(
            f.code
          )
        )
        .map((f) => ({
          rule: 'code/unlabeled-fence',
          severity: 'warn' as const,
          target: file.target,
          line: f.line,
          message: 'fence has no language tag',
        })),
  },
  {
    id: 'sources/unlinked-web-source',
    severity: 'warn',
    description:
      'A Further Reading bullet naming a web resource (docs, a spec, an RFC, a cheat sheet, a site) with no URL. A book cited by author and title is a complete reference and is deliberately not flagged — the demand is that a reference be followable, not that it be clickable.',
    lesson: (file) => {
      const WEB =
        /\b(documentation|docs|cheat ?sheet|spec|specification|RFC\s*\d+|MDN|OWASP|W3C|IETF|changelog|repository|repo|website|web site|online|blog post|API reference)\b/i;
      // A title in italics or quotes plus an author is a book/paper citation.
      const CITATION = /\*[^*]{4,}\*|"[^"]{4,}"|—\s*[A-Z][a-z]+\s+[A-Z]/;

      return bullets(file, 'Further Reading')
        .filter((l) => !/https?:\/\//.test(l))
        .filter((l) => WEB.test(l) && !CITATION.test(l))
        .map((l) => ({
          rule: 'sources/unlinked-web-source',
          severity: 'warn' as const,
          target: file.target,
          message: `names a web resource but gives no URL: ${l.trim().slice(0, 90)}`,
        }));
    },
  },
  {
    id: 'sources/bare-domain',
    severity: 'warn',
    description:
      'A bare domain in parentheses looks like a citation but renders as plain grey text — remark-gfm only autolinks bare URLs, not "(zod.dev)".',
    lesson: (file) =>
      bullets(file, 'Further Reading')
        .filter((l) => !/https?:\/\//.test(l) && /\((?:[a-z0-9-]+\.)+[a-z]{2,}(?:\/[^\s)]*)?\)/i.test(l))
        .map((l) => ({
          rule: 'sources/bare-domain',
          severity: 'warn' as const,
          target: file.target,
          message: `bare domain renders as text, not a link: ${l.trim().slice(0, 90)}`,
        })),
  },
  {
    id: 'sources/disclaimer-as-source',
    severity: 'warn',
    description: 'A legal/financial disclaimer occupying a Further Reading slot is not a reference.',
    lesson: (file) =>
      bullets(file, 'Further Reading')
        .filter((l) => /general education|not (financial|tax|legal) advice|not legal advice/i.test(l))
        .map((l) => ({
          rule: 'sources/disclaimer-as-source',
          severity: 'warn' as const,
          target: file.target,
          message: `disclaimer in Further Reading: ${l.trim().slice(0, 80)}`,
        })),
  },
  {
    id: 'sources/quota-signature',
    severity: 'warn',
    description:
      'Every lesson in a course carrying the same number of Further Reading bullets is a generation artifact, not a research result.',
    course: (slug, files) => {
      const counts = files.map((f) => bullets(f, 'Further Reading').length).filter((n) => n > 0);
      if (counts.length < 8) return [];
      const unique = new Set(counts);
      if (unique.size > 1) return [];
      return [
        {
          rule: 'sources/quota-signature',
          severity: 'warn',
          target: slug,
          message: `all ${counts.length} lessons have exactly ${counts[0]} Further Reading bullets (zero variance)`,
        },
      ];
    },
  },
  {
    id: 'voice/private-reference',
    severity: 'error',
    description: "Names, repos and paths belonging to the corpus's first owner have no meaning to a reader.",
    lesson: (file) => {
      const pattern =
        /\b(kuray|karaaslan|avantleap|KUIreact|kui-react|internal-ai-rules|internal-university|next-boilerplate|74K lines)\b/i;
      return file.lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, index }) => ({
          rule: 'voice/private-reference',
          severity: 'error' as const,
          target: file.target,
          line: index + 1,
          message: `private reference: ${line.trim().slice(0, 90)}`,
        }));
    },
  },
  {
    id: 'voice/audit-residue',
    severity: 'error',
    description:
      'Sentences that grade the reader\'s own codebase are left over from the deleted Coverage Level section; the reader has never seen that codebase.',
    lesson: (file) => {
      const pattern =
        /(^|\s)(For your (boilerplate|stack|SaaS|setup|codebase|app)\b|[Yy]ou already (do|have|handle) this(?!\s+(vocabulary|knowledge|habit|instinct))|[Yy]our current (approach|setup|implementation)\b|as (?:noted|identified) above)/;
      return file.lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => pattern.test(line))
        .map(({ line, index }) => ({
          rule: 'voice/audit-residue',
          severity: 'error' as const,
          target: file.target,
          line: index + 1,
          message: `assumes a codebase the reader has not seen: ${line.trim().slice(0, 90)}`,
        }));
    },
  },
  {
    id: 'links/unlinked-lesson-ref',
    severity: 'warn',
    description:
      'A "#N" that matches a real lesson but carries no reference cue is left as plain text by the markdown pipeline, because "rule #1" and "Top 10 #29" also exist. Parenthesise it as "(#N)" or add a cue ("see #N").',
    lesson: (file) => {
      const ids = new Set<number>();
      for (const slug of listCourseSlugs())
        for (const item of readCourseManifest(slug).items) ids.add(item.id);

      // Mirrors remark-lesson-refs: a bare id becomes a link unless a counter
      // noun precedes it. Anything this masks out is already linked.
      const linked =
        /(?<!\b(?:rule|issue|step|item|no|num|number|pr|ticket|bug|chapter|figure|part|point|phase|option|version|week|day)\.?\s)#\d{1,3}\b|\b(?:Lessons?|Courses?)\s+\d{1,3}\b/gi;

      const out: Finding[] = [];
      for (const { line, index, inFence } of walkLines(file.lines)) {
        if (inFence) continue;
        const masked = line.replace(linked, (m) => ' '.repeat(m.length));
        for (const match of masked.matchAll(/#(\d{1,3})\b/g)) {
          const id = Number(match[1]);
          if (!ids.has(id)) continue;
          const rest = masked.slice(match.index! + match[0].length);
          if (/^\s*[–—-]\s*\d/.test(rest)) continue; // an id range is not one link
          out.push({
            rule: 'links/unlinked-lesson-ref',
            severity: 'warn',
            target: file.target,
            line: index + 1,
            message: `"#${id}" matches a lesson but has no cue, so it renders as plain text: ${line.trim().slice(0, 80)}`,
          });
        }
      }
      return out;
    },
  },
  {
    id: 'links/dead-lesson-ref',
    severity: 'error',
    description: 'A "#N" cross-reference to a lesson id that does not exist cannot ever become a link.',
    lesson: (file) => {
      const ids = new Set<number>();
      for (const slug of listCourseSlugs())
        for (const item of readCourseManifest(slug).items) ids.add(item.id);
      const out: Finding[] = [];
      for (const { line, index, inFence } of walkLines(file.lines)) {
        if (inFence) continue;
        for (const match of line.matchAll(/\(#(\d{1,3})\)/g)) {
          const id = Number(match[1]);
          if (!ids.has(id))
            out.push({
              rule: 'links/dead-lesson-ref',
              severity: 'error',
              target: file.target,
              line: index + 1,
              message: `"(#${id})" refers to a lesson id that does not exist`,
            });
        }
      }
      return out;
    },
  },
];
