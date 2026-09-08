import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { listFences, type Fence } from '../../modules/course_content/course_content.fences';
import {
  listCourseSlugs,
  readCourseManifest,
  readLessonMarkdown,
} from '../../modules/course_content/course_content.manifest';
import type { Interactive } from '../../modules/course_content/course_content.types';
import { parseFenceMeta } from '../../modules/course_content/course_content.fence-meta';
import { RUNNABLE_LANGS } from '../../modules/course_content/course_content.transpile';
import { MAX_SEED_BYTES } from '../../modules/course_content/course_content.seeds';
import { parseQuiz } from '../../modules/course_content/course_content.quiz';
import { parseNumbers, claimsPublishedDefault, hasMeasurement } from '../../modules/course_content/course_content.numbers';
import { hasCapstone, hasPathCapstone, listCapstoneProofFences, loadCapstone, loadPathCapstone } from '../../modules/course_content/course_content.capstone';
import { DEVELOPER_PATHS } from '../../modules/course_content/course_content.paths';
import { parseMistakes } from '../../modules/course_content/course_content.mistakes';
import { parseRecall } from '../../modules/course_content/course_content.recall';
import { flattenSpatial, parseSpatial } from '../../modules/course_content/course_content.spatial';
import { extractMountFiles } from '../../modules/course_content/course_content.mount';
import { splitSnippetFiles } from '../../modules/course_content/course_content.snippets';

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
  verified?: boolean;
  interactive?: Interactive;
};

export type Rule = {
  id: string;
  severity: Severity;
  description: string;
  lesson?: (file: LessonFile) => Finding[];
  course?: (slug: string, files: LessonFile[]) => Finding[];
  /** P43: for things that belong to no single lesson or course — a developer
   *  path's capstone, for instance, whose rubric is scoped to the path's steps
   *  rather than to one course's lessons. Runs once per lint. */
  global?: (corpus: LessonFile[]) => Finding[];
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

/** Languages no gate in this repo covers: scripts/verify-code.ts compiles
 *  TS/JS only, and the three runtimes (P8 sandbox, P9 WebContainer, P10
 *  PGlite) execute TS/JS, a Node project and SQL. A fence in any of these
 *  ships on the author's word alone. See `code/unverified-language`. */
const UNVERIFIED_LANGS = new Set([
  'java', 'python', 'py', 'ruby', 'go', 'csharp', 'cs', 'php', 'rust', 'kotlin', 'swift', 'cpp', 'c',
]);

/** The languages this corpus has deliberately taken on, each with the phase
 *  that accepted it and why no other language would have done. These stay
 *  `warn`, so the counter this rule was built to be keeps counting.
 *
 *  Everything else in UNVERIFIED_LANGS is an `error`, which is the half that
 *  was missing: with nineteen identical warnings standing, a first Python
 *  fence would have arrived as the twentieth and been invisible — and stopping
 *  exactly that is what this rule's own description says it is for. See
 *  docs/phases/40-unverified-language-gate.md. */
const ACCEPTED_UNVERIFIED = new Map<string, string>([
  [
    'csharp',
    'docs/phases/16-autodesk-developer-platform.md — the Revit API has no other language, and that phase caps the fences in its own acceptance criteria',
  ],
  [
    'java',
    "framework-deep-dives' Spring Boot lessons, where Java is the subject rather than the vehicle; the count is pinned in docs/phases/README.md's measured table",
  ],
]);

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
        verified: item.verified,
        interactive: item.interactive,
      });
    }
  }
  return out;
}

// Fenced blocks are skipped deliberately. A section's lines run to the next
// heading, so a `recall` fence appended at the end of a lesson lands inside
// Further Reading — and its `- q:` / `- "..."` entries are list items by
// syntax while being nothing of the sort. This was latent across every lesson
// with a trailing recall fence and only surfaced when one happened to contain
// `(OnCreate.class)`, which sources/bare-domain read as a citation domain.
const bullets = (file: LessonFile, heading: string) => {
  const lines = file.sections.find((s) => s.heading.startsWith(heading))?.lines ?? [];
  const out: string[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence;
      continue;
    }
    if (!inFence && line.trimStart().startsWith('- ')) out.push(line);
  }
  return out;
};

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

// Written only by scripts/stamp-verified.ts. Absent (nothing has ever been
// stamped yet) is not an error on its own — verify/stale-stamp below only
// fires for a lesson that actually claims `verified: true`.
const VERIFIED_SHA_REPORT = path.join(process.cwd(), 'content', '_reports', 'verified-sha.json');
const verifiedShaReport: Record<string, string> = fs.existsSync(VERIFIED_SHA_REPORT)
  ? JSON.parse(fs.readFileSync(VERIFIED_SHA_REPORT, 'utf-8'))
  : {};

/** Both path-capstone rules need the parsed capstone; only the first reports a
 *  parse failure, so the same file never produces two findings for one cause. */
function loadPathCapstoneOrReport(
  pathId: string,
  rule: string,
  findings: Finding[]
): ReturnType<typeof loadPathCapstone> {
  if (!hasPathCapstone(pathId)) return null;
  try {
    return loadPathCapstone(pathId);
  } catch (error) {
    findings.push({
      rule,
      severity: 'error',
      target: `paths/${pathId}/capstone.md`,
      message: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

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
        // Catches `return <X>`, a bare `<X ...>` element line, and lowercase
        // intrinsic tags — the first version of this rule only matched a line
        // starting with `<Capital`, and missed five lessons because of it.
        .filter(
          (f) =>
            f.lang.toLowerCase() === 'typescript' &&
            /(^\s*<[a-zA-Z][\w.]*[\s/>]|\breturn\s*\(?\s*<[a-zA-Z]|=>\s*\(?\s*<[a-zA-Z])/m.test(f.code)
        )
        .map((f) => ({
          rule: 'code/jsx-in-ts-fence',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: 'fence contains JSX but is tagged `typescript` — should be `tsx`',
        })),
  },
  {
    id: 'code/reader-codebase-assertion',
    severity: 'error',
    description:
      'A code comment telling the reader what their own codebase already contains. These hid inside fences, where the prose rules do not look, and are the same defect as the deleted Coverage Level section: the reader has never seen that code. An import from "@/lib/..." is NOT flagged — that is idiomatic for "your own module".',
    lesson: (file) => {
      // "your existing login logic" is a placeholder for the reader's own code
      // and is fine. What is not fine is naming a file, class or design the
      // reader is told they already have.
      const ASSERTS =
        /(what you already have|you already have this|your existing [\w./-]*(?:\.ts|\.tsx|\/|[A-Z]\w+)|your current (HS256|RBAC|setup|approach|implementation)|fits your [A-Z]|already in your (codebase|project|stack))/;
      return file.fences
        .filter((f) => ASSERTS.test(f.code))
        .map((f) => ({
          rule: 'code/reader-codebase-assertion',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: `code comment asserts what the reader's codebase contains: ${
            f.code.split('\n').find((l) => ASSERTS.test(l))?.trim().slice(0, 90) ?? ''
          }`,
        }));
    },
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
    id: 'code/prose-fence-should-be-template',
    // Born `error`, not the usual `warn`: docs/phases/04-template-widgets.md
    // measured 91 such fences and scripts/retag-template-fences.ts fixed all
    // of them in the same change that introduced this rule, so there is no
    // backlog to phase in against — the corpus is already clean of it.
    severity: 'error',
    description:
      'A `md`/`markdown` fence with >=3 "**Label:**" lines is a fillable document template, not real markdown — rehype-highlight\'s markdown grammar turns the bold labels (and any table in the same fence) into unreadable monospace noise. Retag it `template` (see scripts/retag-template-fences.ts) so course_content.blocks.ts renders it as a TemplateFormCard widget instead.',
    lesson: (file) => {
      const LABEL = /^\s*\*\*([^*]{2,60}):?\*\*/;
      return file.fences
        .filter((f) => f.lang === 'md' || f.lang === 'markdown')
        .filter((f) => f.code.split('\n').filter((l) => LABEL.test(l)).length >= 3)
        .map((f) => ({
          rule: 'code/prose-fence-should-be-template',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: `fence looks like a fillable template (>=3 bold-label lines) but is still tagged \`${f.lang}\``,
        }));
    },
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
        // Mask both what the pipeline links AND the counter-noun forms it
        // deliberately does not: "rule #1" is correctly plain text, so
        // reporting it as an unlinked reference is the rule's own bug.
        const masked = line
          .replace(linked, (m) => ' '.repeat(m.length))
          .replace(
            /\b(?:rule|issue|step|item|no|num|number|pr|ticket|bug|chapter|figure|part|point|phase|option|version|week|day)\.?\s+#\d{1,3}\b/gi,
            (m) => ' '.repeat(m.length)
          );
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
  {
    id: 'drill/unverified-lesson',
    severity: 'error',
    description:
      'A manifest.json opts a lesson into an interactive mechanism (`interactive: "drill"` or `"full"`) without `verified: true` also being set. The stopping rule this repo runs on: never open an exercise on an unverified lesson.',
    lesson: (file) => {
      if (file.interactive === undefined || file.interactive === 'off') return [];
      if (file.verified === true) return [];
      return [
        {
          rule: 'drill/unverified-lesson',
          severity: 'error',
          target: file.target,
          message: `interactive: "${file.interactive}" but verified is not true`,
        },
      ];
    },
  },
  {
    id: 'drill/widget-on-unverified-lesson',
    severity: 'warn',
    description:
      'A `quiz` or `recall` fence, or a `spatial` fence declaring an `ask`, on a lesson that is not `verified`. QuizCard and RecallCard both return null in that case — the stopping rule working — so the fence renders nothing at all and the effort is invisible to every reader. SpatialCard is the one partial case: its tree still renders (a tree is a reference, not an exercise) but its `ask` half stays shut, so the question and its reveal are the invisible part. The neighbouring `drill/unverified-lesson` rule does not catch any of this: it checks a manifest `interactive` field that no lesson in the corpus actually sets, so nothing was watching the fences themselves. Born `warn` per the repo rule, because the corpus is not clean of it: 114 is on stamp-verified.ts\'s T1.7 harm denylist and can only be cleared by the expert pass that list is waiting for, so its drills stay written-but-dark until then. Promote to `error` once that is resolved.',
    lesson: (file) => {
      if (file.verified === true) return [];
      const gated = file.fences.filter((f) => {
        if (f.lang === 'quiz' || f.lang === 'recall') return true;
        if (f.lang !== 'spatial') return false;
        // A gateless spatial fence renders in full on an unverified lesson,
        // so there is nothing dark to report; only the `ask` is withheld.
        try {
          return parseSpatial(f.code).ask !== undefined;
        } catch {
          return false; // spatial/invalid-payload already reports this fence
        }
      });
      return gated.map((f) => ({
        rule: 'drill/widget-on-unverified-lesson',
        severity: 'warn' as const,
        target: file.target,
        line: f.line,
        message:
          f.lang === 'spatial'
            ? '`spatial` fence declares an `ask` on an unverified lesson — the question and its reveal never open'
            : `\`${f.lang}\` fence on an unverified lesson — it renders nothing`,
      }));
    },
  },
  {
    id: 'verify/stale-stamp',
    severity: 'error',
    description:
      'A lesson manifest.json claims `verified: true` but its body sha does not match (or is missing from) content/_reports/verified-sha.json — either the file changed after being stamped, or `verified` was set by hand. Only scripts/stamp-verified.ts may set it; run that to re-stamp.',
    lesson: (file) => {
      if (file.verified !== true) return [];
      const recorded = verifiedShaReport[file.target];
      if (recorded === sha(file.raw)) return [];
      return [
        {
          rule: 'verify/stale-stamp',
          severity: 'error',
          target: file.target,
          message: recorded
            ? 'body sha no longer matches the recorded verified stamp — re-run scripts/stamp-verified.ts'
            : 'verified: true has no matching entry in verified-sha.json — set by hand, not by stamp-verified.ts',
        },
      ];
    },
  },
  {
    id: 'run/marker-on-unrunnable-lang',
    severity: 'error',
    description:
      'A `run` fence tagged with a language no runner can execute. course_content.transpile.ts\'s RUNNABLE_LANGS (typescript/ts/javascript/js) goes through the P8 sandbox; `sql` goes through P10\'s PGlite runner instead — no bash, yaml, java, dockerfile, hcl, tsx, or jsx. Applies to `run project` fences too — WebContainer still needs a real Node entry file.',
    lesson: (file) =>
      file.fences
        .filter((f) => parseFenceMeta(f.meta).run && f.lang !== 'sql' && !RUNNABLE_LANGS.has(f.lang))
        .map((f) => ({
          rule: 'run/marker-on-unrunnable-lang',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: `\`run\` fence tagged \`${f.lang || '(none)'}\`, which the sandbox cannot execute`,
        })),
  },
  {
    id: 'run/no-observable-output',
    severity: 'error',
    description:
      'A plain `run` fence (P8 sandbox, not `run project`) with no console.log/warn/error/table call writes nothing when Run is clicked — this is the rule that catches the "44 no-import TS fences, only 5 actually print anything" trap docs/phases/08-live-js-runner.md measured. A dead Run button is worse than no Run button. Not applied to `run project`: a server\'s observable output is its HTTP response in the preview iframe, not a console call. Not applied to `sql` (P10): a query\'s result table/plan is its own observable output, with no console.* equivalent.',
    lesson: (file) => {
      const OUTPUT_CALL = /\bconsole\.(log|warn|error|table|info)\s*\(/;
      return file.fences
        .filter((f) => {
          const meta = parseFenceMeta(f.meta);
          return meta.run && !meta.project && f.lang !== 'sql' && !OUTPUT_CALL.test(f.code);
        })
        .map((f) => ({
          rule: 'run/no-observable-output',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: '`run` fence has no console.* call — Run would produce no visible output',
        }));
    },
  },
  {
    id: 'run/not-self-contained',
    severity: 'error',
    description:
      'A plain `run` fence (P8 sandbox) that imports something. That sandbox\'s iframe has no network access at all (default-src \'none\') and no module loader, so any import fails at execution time regardless of whether the package exists. Does not apply to `run project` — WebContainer runs a real `npm install`, so imports are the entire point. Does not apply to `sql` (P10) — PGlite has no JS import statements to match, and its own dataset comes from `seed=`, not a network call.',
    lesson: (file) => {
      const IMPORT_OR_REQUIRE = /^\s*import\b|\brequire\s*\(/m;
      return file.fences
        .filter((f) => {
          const meta = parseFenceMeta(f.meta);
          return meta.run && !meta.project && f.lang !== 'sql' && IMPORT_OR_REQUIRE.test(f.code);
        })
        .map((f) => ({
          rule: 'run/not-self-contained',
          severity: 'error' as const,
          target: file.target,
          line: f.line,
          message: '`run` fence imports something — the sandbox has no network access and no module loader',
        }));
    },
  },
  {
    id: 'verify/hand-edited-output',
    severity: 'error',
    description:
      'A `proof` fence (P5, docs/phases/05-ci-and-proof.md) whose body no longer matches its own `sha=` meta attribute — the body was hand-edited after scripts/stamp-verify.ts wrote it, or `sha=` was hand-edited to match a tampered body. This is the fast, offline half of the check: it verifies the fence is internally self-consistent without re-running anything. scripts/stamp-verify.ts --check is the slow half — it re-runs the real command and confirms the body still matches what that command actually produces today, which this rule cannot detect on its own (a hand-edit that happens to still be internally consistent would pass this rule but fail --check).',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'proof')
        .flatMap((f) => {
          const recorded = parseFenceMeta(f.meta).opts.sha as string | undefined;
          const actual = sha(f.code);
          if (recorded === actual) return [];
          return [
            {
              rule: 'verify/hand-edited-output',
              severity: 'error' as const,
              target: file.target,
              line: f.line,
              message: recorded
                ? `proof fence body sha (${actual}) does not match its own sha=${recorded} — re-run scripts/stamp-verify.ts`
                : 'proof fence has no sha= meta attribute — run scripts/stamp-verify.ts to stamp it',
            },
          ];
        }),
  },
  {
    id: 'run/missing-seed-file',
    severity: 'error',
    description:
      'A `sql run seed=<name>` fence (P10, PGlite) names a seed with no matching content/_runtime/seeds/<name>.sql file, or one over the 50 KB cap. course_content.seeds.ts throws for the same reason at build time (loadSeed() runs during static generation) — this rule catches it at lint time instead, before a full `next build` is needed to find out.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'sql' && parseFenceMeta(f.meta).run && parseFenceMeta(f.meta).seed)
        .flatMap((f) => {
          const seedName = parseFenceMeta(f.meta).seed as string;
          const seedPath = path.join(process.cwd(), 'content', '_runtime', 'seeds', `${seedName}.sql`);
          if (!fs.existsSync(seedPath)) {
            return [
              {
                rule: 'run/missing-seed-file',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `seed="${seedName}" has no content/_runtime/seeds/${seedName}.sql`,
              },
            ];
          }
          const size = fs.statSync(seedPath).size;
          if (size > MAX_SEED_BYTES) {
            return [
              {
                rule: 'run/missing-seed-file',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `content/_runtime/seeds/${seedName}.sql is ${size} bytes, over the ${MAX_SEED_BYTES}-byte cap`,
              },
            ];
          }
          return [];
        }),
  },
  {
    id: 'run/needs-native',
    severity: 'error',
    description:
      'A `run project` fence importing a package WebContainer cannot run: @prisma/client and typeorm need a native query engine or a real DB server, electron needs a desktop runtime, bullmq/ioredis need Redis, pg needs Postgres, expo/react-native need a mobile runtime, and bcrypt is a native addon (bcryptjs is fine — pure JS). Measured in docs/phases/09-webcontainer.md; none of these get fixed by trying harder inside a WebContainer, the runtime itself cannot do it.',
    lesson: (file) => {
      const NATIVE_PACKAGES: Array<{ pattern: RegExp; name: string }> = [
        { pattern: /['"]@prisma\/client['"]/, name: '@prisma/client' },
        { pattern: /['"]typeorm['"]/, name: 'typeorm' },
        { pattern: /['"]electron['"]/, name: 'electron' },
        { pattern: /['"]bullmq['"]/, name: 'bullmq' },
        { pattern: /['"]ioredis['"]/, name: 'ioredis' },
        { pattern: /['"]pg['"]/, name: 'pg' },
        { pattern: /['"]expo['"]/, name: 'expo' },
        { pattern: /['"]react-native['"]/, name: 'react-native' },
        // Word boundary + not followed by "js": bcrypt (native) is banned,
        // bcryptjs (pure JS, fine) must not be caught by the same pattern.
        { pattern: /['"]bcrypt['"]/, name: 'bcrypt' },
      ];
      return file.fences
        .filter((f) => parseFenceMeta(f.meta).project)
        .flatMap((f) =>
          NATIVE_PACKAGES.filter((p) => p.pattern.test(f.code)).map((p) => ({
            rule: 'run/needs-native',
            severity: 'error' as const,
            target: file.target,
            line: f.line,
            message: `\`run project\` fence imports \`${p.name}\`, which WebContainer cannot run`,
          }))
        );
    },
  },
  {
    id: 'run/unresolved-project-import',
    severity: 'error',
    description:
      'A `run project` fence whose relative import names a file the fence does not declare. This exists because scripts/verify-code.ts deliberately tolerates missing modules in a project fence (WebContainer runs a real `npm install`, so importing express is correct) — and that tolerance would otherwise also swallow a mistyped sibling path, which no tool would catch until a reader clicked Run and got a module-not-found. Every relative import must resolve to one of the fence\'s own `// path.ts` parts.',
    lesson: (file) =>
      file.fences
        .filter((f) => parseFenceMeta(f.meta).project)
        .flatMap((f) => {
          let declared: string[];
          try {
            declared = extractMountFiles(f.code, parseFenceMeta(f.meta).entry).map((m) => m.path);
          } catch (err) {
            return [
              {
                rule: 'run/unresolved-project-import',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `\`run project\` fence cannot be split into files: ${String(err instanceof Error ? err.message : err)}`,
              },
            ];
          }

          // Compare without extension: the corpus writes `./libs/app-error.ts`
          // (explicit, as ESM needs) but a fence part could equally be
          // declared `.js`, and neither spelling should be a lint failure.
          const stripExt = (p: string) => p.replace(/\.(?:ts|tsx|js|jsx|mts|cts)$/, '');
          const known = new Set(declared.map(stripExt));

          const findings: Finding[] = [];
          const IMPORT_SOURCE = /(?:from\s+|require\()\s*['\"]([^'\"]+)['\"]/g;
          for (const part of splitSnippetFiles(f.code)) {
            const owner = extractMountFiles(part, parseFenceMeta(f.meta).entry)[0]?.path ?? '';
            const ownerDir = owner.includes('/') ? owner.slice(0, owner.lastIndexOf('/')) : '';
            IMPORT_SOURCE.lastIndex = 0;
            for (let m = IMPORT_SOURCE.exec(part); m; m = IMPORT_SOURCE.exec(part)) {
              const source = m[1];
              if (!source.startsWith('.')) continue;
              const resolved = path.posix.normalize(path.posix.join(ownerDir, source));
              if (known.has(stripExt(resolved))) continue;
              findings.push({
                rule: 'run/unresolved-project-import',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `\`run project\` fence imports "${source}" from ${owner || 'its entry file'}, which resolves to "${resolved}" — not one of the fence's files (${declared.join(', ')})`,
              });
            }
          }
          return findings;
        }),
  },
  {
    id: 'capstone/path-rubric-off-path',
    severity: 'error',
    description:
      "A developer path's capstone quotes a mistake lead from a lesson that is not one of that path's steps, or does not quote it verbatim. The course capstone's rule (capstone/unsourced-rubric-row) is that a rubric may only quote the course it belongs to; for a path the natural scope is the path's own curated steps, which is a sharper constraint rather than a looser one — the capstone measures exactly the reading order it sits at the end of. docs/phases/43-path-capstone.md.",
    global: (corpus) => {
      const findings: Finding[] = [];
      const byId = new Map(corpus.map((f) => [f.id, f]));

      for (const developerPath of DEVELOPER_PATHS) {
        const capstone = loadPathCapstoneOrReport(developerPath.id, 'capstone/path-rubric-off-path', findings);
        if (!capstone) continue;

        const steps = new Set<number>(developerPath.steps);
        for (const row of capstone.rubric) {
          if (!steps.has(row.lesson)) {
            findings.push({
              rule: 'capstone/path-rubric-off-path',
              severity: 'error',
              target: `paths/${developerPath.id}/capstone.md`,
              message: `rubric row cites lesson ${row.lesson}, which is not a step on this path`,
            });
            continue;
          }
          const file = byId.get(row.lesson);
          const section = file?.sections.find((sec) => sec.heading.startsWith('Common Mistakes'));
          const leads = section ? parseMistakes(section.lines.join('\n')).map((m) => m.lead) : [];
          if (!leads.includes(row.lead)) {
            findings.push({
              rule: 'capstone/path-rubric-off-path',
              severity: 'error',
              target: `paths/${developerPath.id}/capstone.md`,
              message: `"${row.lead}" is not a Common Mistakes lead in lesson ${row.lesson}`,
            });
          }
        }
      }

      return findings;
    },
  },
  {
    id: 'capstone/path-rubric-cites-unverified',
    severity: 'error',
    description:
      "A developer path's capstone rubric cites a lesson that is not `verified: true`. Same reasoning as capstone/rubric-cites-unverified one scope up: a rubric row asks the reader to score their own work against an item, which is an exercise rather than a reading, so it may only measure content the corpus stands behind. Kept separate from capstone/path-rubric-off-path because it is a different failure — the lesson is on the path, the quote is real, and the corpus simply has not vouched for it yet. It relaxes on its own when a lesson leaves HARM_DENYLIST. docs/phases/43-path-capstone.md.",
    global: (corpus) => {
      const findings: Finding[] = [];
      const byId = new Map(corpus.map((f) => [f.id, f]));

      for (const developerPath of DEVELOPER_PATHS) {
        // A parse failure is reported once, by path-rubric-off-path.
        if (!hasPathCapstone(developerPath.id)) continue;
        let capstone;
        try {
          capstone = loadPathCapstone(developerPath.id)!;
        } catch {
          continue;
        }

        const steps = new Set<number>(developerPath.steps);
        for (const row of capstone.rubric) {
          if (!steps.has(row.lesson)) continue; // off-path is the other rule's finding
          if (byId.get(row.lesson)?.verified !== true) {
            findings.push({
              rule: 'capstone/path-rubric-cites-unverified',
              severity: 'error',
              target: `paths/${developerPath.id}/capstone.md`,
              message: `rubric row cites lesson ${row.lesson}, which is not verified — a rubric may only measure what the corpus stands behind`,
            });
          }
        }
      }

      return findings;
    },
  },
  {
    id: 'capstone/rubric-cites-unverified',
    severity: 'error',
    description:
      "A capstone rubric row cites a lesson that is not `verified: true`. docs/phases/README.md's invariant #3 is written about a lesson's own page, but stamp-verified.ts's HARM_DENYLIST states the reason it exists — \"a drill inherits the correctness of the content it sits on, and a wrong mitigation drilled into a reader's memory is worse than one merely read\" — and a rubric row asks the reader to score their own work against that item, which is an exercise rather than a reading. docs/phases/36-rubric-cites-verified.md takes the conservative reading, as P24's #541 and P17's #478 did. If a lesson leaves the denylist this rule relaxes on its own.",
    course: (slug, files) => {
      if (!hasCapstone(slug)) return [];
      let capstone;
      try {
        capstone = loadCapstone(slug)!;
      } catch {
        return []; // capstone/unsourced-rubric-row reports the parse failure
      }
      const verified = new Map(files.map((f) => [f.id, f.verified === true]));
      return capstone.rubric
        .filter((row) => verified.get(row.lesson) !== true)
        .map((row) => ({
          rule: 'capstone/rubric-cites-unverified',
          severity: 'error' as const,
          target: `${slug}/capstone.md`,
          message: `rubric row cites lesson ${row.lesson}, which is not verified — a rubric may only measure what the corpus stands behind`,
        }));
    },
  },
  {
    id: 'capstone/hand-edited-proof',
    severity: 'error',
    description:
      "A `proof` fence inside a capstone.md whose body no longer matches its own `sha=` meta attribute. This is verify/hand-edited-output's counterpart for capstones: that rule walks lesson fences, and capstone.md is deliberately invisible to the lesson pipeline (docs/phases/34-capstone.md), so it needs its own walk over the same scanner stamp-verify.ts uses. Cheap and offline; `npx tsx scripts/stamp-verify.ts --check` is still the half that re-runs the command and confirms the output has not changed.",
    course: (slug) =>
      listCapstoneProofFences([slug]).flatMap((fence) => {
        const recorded = parseFenceMeta(fence.meta).opts.sha as string | undefined;
        const actual = sha(fence.code);
        if (recorded === actual) return [];
        return [
          {
            rule: 'capstone/hand-edited-proof',
            severity: 'error' as const,
            target: `${slug}/capstone.md`,
            line: fence.line,
            message: recorded
              ? `capstone proof body sha (${actual}) does not match its own sha=${recorded} — re-run scripts/stamp-verify.ts`
              : 'capstone proof fence has no sha= meta attribute — run scripts/stamp-verify.ts to stamp it',
          },
        ];
      }),
  },
  {
    id: 'capstone/unsourced-rubric-row',
    severity: 'error',
    description:
      "A `capstone.md` rubric row's `lead` is not a verbatim Common Mistakes lead from the lesson it names. docs/investigate/04-roadmap.md's T2.4 requires that \"Rubric satırları o kursun kendi Common Mistakes maddelerinden türetilir\" — this makes that mechanical instead of aspirational, in the same way P33's cheat sheet test does for its own verbatim contract. A rubric written freehand would be the author's opinion wearing the corpus's clothes.",
    course: (slug, files) => {
      if (!hasCapstone(slug)) return [];
      let capstone;
      try {
        capstone = loadCapstone(slug)!;
      } catch (error) {
        return [
          {
            rule: 'capstone/unsourced-rubric-row',
            severity: 'error' as const,
            target: `${slug}/capstone.md`,
            message: error instanceof Error ? error.message : String(error),
          },
        ];
      }

      const leadsByLesson = new Map<number, Set<string>>();
      for (const file of files) {
        const section = file.sections.find((s) => s.heading.startsWith('Common Mistakes'));
        if (!section) continue;
        leadsByLesson.set(file.id, new Set(parseMistakes(section.lines.join('\n')).map((m) => m.lead)));
      }

      return capstone.rubric.flatMap((row) => {
        const leads = leadsByLesson.get(row.lesson);
        if (!leads) {
          return [
            {
              rule: 'capstone/unsourced-rubric-row',
              severity: 'error' as const,
              target: `${slug}/capstone.md`,
              message: `rubric row cites lesson ${row.lesson}, which is not in this course`,
            },
          ];
        }
        if (leads.has(row.lead)) return [];
        return [
          {
            rule: 'capstone/unsourced-rubric-row',
            severity: 'error' as const,
            target: `${slug}/capstone.md`,
            message: `"${row.lead}" is not a Common Mistakes lead in lesson ${row.lesson}`,
          },
        ];
      });
    },
  },
  {
    id: 'numbers/unsourced-default',
    severity: 'error',
    description:
      "A `numbers` row states a default and does not link to what publishes it. docs/investigate/04-roadmap.md's T2.2 made this the whole credibility condition — \"each row either links inline to the document publishing the number, or gives the command that produces it; if neither, the row is deleted\" — and docs/phases/31-numbers-that-matter.md turns it from review etiquette into a gate. A row with no published default writes `—` and owes no link.",
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'numbers')
        .flatMap((f) => {
          let widget;
          try {
            widget = parseNumbers(f.code);
          } catch (error) {
            return [
              {
                rule: 'numbers/unsourced-default',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `numbers fence failed validation: ${error instanceof Error ? error.message : String(error)}`,
              },
            ];
          }
          return widget.rows
            .filter((row) => claimsPublishedDefault(row) && !row.source)
            .map((row) => ({
              rule: 'numbers/unsourced-default',
              severity: 'error' as const,
              target: file.target,
              line: f.line,
              message: `"${row.quantity}" states the default "${row.default}" with no source link (use "—" if none is published)`,
            }));
        }),
  },
  {
    id: 'numbers/unmeasurable-row',
    severity: 'error',
    description:
      "A `numbers` row's `measure` column gives the reader neither a command nor a link. That column is the reason the widget exists: T2.2's argument is that a reader who comes back with a number measured on their own system has learned more than fifty correct paragraphs could teach. A cell with no backticked command and no URL is a description of measuring rather than a way to measure.",
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'numbers')
        .flatMap((f) => {
          let widget;
          try {
            widget = parseNumbers(f.code);
          } catch {
            return []; // numbers/unsourced-default already reports the parse failure
          }
          return widget.rows
            .filter((row) => !hasMeasurement(row))
            .map((row) => ({
              rule: 'numbers/unmeasurable-row',
              severity: 'error' as const,
              target: file.target,
              line: f.line,
              message: `"${row.quantity}" has no measurable step: \`measure\` needs a backticked command or a link`,
            }));
        }),
  },
  {
    id: 'recall/invalid-payload',
    severity: 'error',
    description:
      'A `recall` fence course_content.recall.ts\'s zod schema rejects — fewer than 3 or more than 5 items, an item with an empty `must[]`, or unparseable YAML. This mirrors quiz/missing-why for the other P11 widget: without it a malformed recall fence surfaces only as a crash inside the corpus parse-snapshot test, which names the assertion rather than the fence. docs/phases/11-recall-and-calc.md sets the 3-5 range — a Close the Tab check, not a full quiz.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'recall')
        .flatMap((f) => {
          try {
            parseRecall(f.code);
            return [];
          } catch (error) {
            return [
              {
                rule: 'recall/invalid-payload',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `recall fence failed validation: ${error instanceof Error ? error.message : String(error)}`,
              },
            ];
          }
        }),
  },
  {
    id: 'quiz/missing-why',
    severity: 'error',
    description:
      'A `quiz` fence course_content.quiz.ts\'s zod schema rejects — a missing `why` on some option, zero or more than one `correct: true`, fewer than 2 options, or unparseable YAML. docs/phases/06-quiz-tradeoff-diff.md: a wrong option has to say why it\'s wrong or the quiz is a guessing game, not a check.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'quiz')
        .flatMap((f) => {
          try {
            parseQuiz(f.code);
            return [];
          } catch (error) {
            return [
              {
                rule: 'quiz/missing-why',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `quiz fence failed validation: ${error instanceof Error ? error.message : String(error)}`,
              },
            ];
          }
        }),
  },
  {
    id: 'quiz/unanchored-answer',
    severity: 'error',
    description:
      'A `quiz` question\'s `anchor` does not appear verbatim in the lesson\'s own prose (outside quiz fence bodies themselves — a self-referential match doesn\'t count). The whole point of anchor: a question the lesson didn\'t actually say cannot be quizzed, closing the roadmap\'s "generated text silently canonicalizes what the lesson currently gets wrong" objection.',
    lesson: (file) => {
      const quizFences = file.fences.filter((f) => f.lang === 'quiz');
      if (quizFences.length === 0) return [];
      const proseWithoutQuizzes = quizFences.reduce((text, f) => text.split(f.code).join(''), file.raw);

      return quizFences.flatMap((f) => {
        let questions;
        try {
          questions = parseQuiz(f.code).questions;
        } catch {
          return []; // quiz/missing-why already reports this fence
        }
        return questions
          .filter((q) => !proseWithoutQuizzes.includes(q.anchor))
          .map((q) => ({
            rule: 'quiz/unanchored-answer',
            severity: 'error' as const,
            target: file.target,
            line: f.line,
            message: `anchor "${q.anchor}" does not appear in this lesson's own prose`,
          }));
      });
    },
  },
  {
    id: 'quiz/max-three',
    severity: 'error',
    description: 'More than 3 quiz questions total across every `quiz` fence in one lesson.',
    lesson: (file) => {
      const quizFences = file.fences.filter((f) => f.lang === 'quiz');
      if (quizFences.length === 0) return [];

      let total = 0;
      for (const f of quizFences) {
        try {
          total += parseQuiz(f.code).questions.length;
        } catch {
          // quiz/missing-why already reports a malformed fence
        }
      }
      if (total <= 3) return [];
      return [
        {
          rule: 'quiz/max-three',
          severity: 'error' as const,
          target: file.target,
          message: `${total} quiz questions across ${quizFences.length} fence(s) — at most 3 per lesson`,
        },
      ];
    },
  },
  {
    id: 'spatial/invalid-payload',
    // Born `error`, not the usual `warn` (docs/phases/README.md invariant #6),
    // for the reason code/prose-fence-should-be-template recorded: the corpus
    // had zero `spatial` fences when this rule was written, so it cannot be
    // blocked by a backlog it did not create.
    severity: 'error',
    description:
      'A `spatial` fence course_content.spatial.ts rejects — unparseable YAML, an unknown key, a numeric property value, a tree outside the 3-40 node range or deeper than 6, a duplicate node id, a `rel` on the root or missing on a child, half a gate (`ask` without `reveal` or the reverse), or more than one `flag: focus`. The same "bad payload is a build failure" stance quiz/tradeoff/recall already take, reported here against the fence instead of as a stack trace inside the corpus parse-snapshot test.',
    lesson: (file) =>
      file.fences
        .filter((f) => f.lang === 'spatial')
        .flatMap((f) => {
          try {
            parseSpatial(f.code);
            return [];
          } catch (error) {
            return [
              {
                rule: 'spatial/invalid-payload',
                severity: 'error' as const,
                target: file.target,
                line: f.line,
                message: `spatial fence failed validation: ${error instanceof Error ? error.message : String(error)}`,
              },
            ];
          }
        }),
  },
  {
    id: 'spatial/unanchored-reveal',
    severity: 'error',
    description:
      "A `spatial` fence's `reveal` sentence, or one of its `props[].set` names, does not appear verbatim in the lesson's own prose (outside `spatial` fence bodies themselves — a self-referential match doesn't count). This is quiz/unanchored-answer applied to the other widget that can state a fact, and it is the rule that stops this one from producing plausible IFC: a tree the lesson never taught cannot be its own answer, and a Pset name the lesson never mentions cannot appear on a node. It also makes version-dependent Pset names findable — when a schema release renames one, the exact list to change is whatever this rule points at.",
    lesson: (file) => {
      const fences = file.fences.filter((f) => f.lang === 'spatial');
      if (fences.length === 0) return [];
      const proseWithoutTrees = fences.reduce((text, f) => text.split(f.code).join(''), file.raw);

      return fences.flatMap((f) => {
        let widget;
        try {
          widget = parseSpatial(f.code);
        } catch {
          return []; // spatial/invalid-payload already reports this fence
        }

        const out: Finding[] = [];
        if (widget.reveal && !proseWithoutTrees.includes(widget.reveal)) {
          out.push({
            rule: 'spatial/unanchored-reveal',
            severity: 'error',
            target: file.target,
            line: f.line,
            message: `reveal "${widget.reveal.slice(0, 70)}" does not appear in this lesson's own prose`,
          });
        }
        const sets = new Set(flattenSpatial(widget.root).flatMap((n) => (n.props ?? []).map((p) => p.set)));
        for (const set of sets) {
          if (proseWithoutTrees.includes(set)) continue;
          out.push({
            rule: 'spatial/unanchored-reveal',
            severity: 'error',
            target: file.target,
            line: f.line,
            message: `property set "${set}" appears on a node but nowhere in this lesson's own prose`,
          });
        }
        return out;
      });
    },
  },
  {
    id: 'code/unverified-language',
    // Born `warn` (invariant #6): the corpus is not clean of it — the 10
    // pre-existing `java` fences are exactly the gap this rule exists to make
    // visible rather than to pretend away.
    severity: 'warn',
    description:
      'A code fence in a language nothing checks: scripts/verify-code.ts typechecks TS/JS only, and the three runtimes cover TS/JS (P8), a Node project (P9) and SQL (P10). Everything else ships unverified. This is a COUNTER, not a ban — docs/phases/16-autodesk-developer-platform.md deliberately brings C# fences in, because the Revit API has no other language, and caps them in its own acceptance criteria. What the rule buys is that the unchecked fence count stays visible and bounded, instead of Python quietly arriving with the built-environment courses whose real tools (ifcopenshell, pyproj) are Python.',
    lesson: (file) =>
      file.fences
        .filter((f) => UNVERIFIED_LANGS.has(f.lang.toLowerCase()))
        .map((f) => {
          const accepted = ACCEPTED_UNVERIFIED.get(f.lang.toLowerCase());
          return {
            rule: 'code/unverified-language',
            severity: (accepted ? 'warn' : 'error') as 'warn' | 'error',
            target: file.target,
            line: f.line,
            message: accepted
              ? `\`${f.lang}\` fence — no typechecker and no runtime covers this language (accepted: ${accepted})`
              : `\`${f.lang}\` fence — no typechecker and no runtime covers this language, and it is not on the accepted list in scripts/content-lint/rules.ts. Add it there with a reason, or use a language something checks.`,
          };
        }),
  },
];
