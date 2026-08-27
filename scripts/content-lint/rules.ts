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
        verified: item.verified,
        interactive: item.interactive,
      });
    }
  }
  return out;
}

const bullets = (file: LessonFile, heading: string) =>
  (file.sections.find((s) => s.heading.startsWith(heading))?.lines ?? []).filter((l) =>
    l.trimStart().startsWith('- ')
  );

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
      'A `run` fence tagged with a language the sandbox cannot execute (course_content.transpile.ts\'s RUNNABLE_LANGS is exactly typescript/ts/javascript/js — no bash, yaml, java, dockerfile, hcl, tsx, or jsx). Applies to `run project` fences too — WebContainer still needs a real Node entry file.',
    lesson: (file) =>
      file.fences
        .filter((f) => parseFenceMeta(f.meta).run && !RUNNABLE_LANGS.has(f.lang))
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
      'A plain `run` fence (P8 sandbox, not `run project`) with no console.log/warn/error/table call writes nothing when Run is clicked — this is the rule that catches the "44 no-import TS fences, only 5 actually print anything" trap docs/phases/08-live-js-runner.md measured. A dead Run button is worse than no Run button. Not applied to `run project`: a server\'s observable output is its HTTP response in the preview iframe, not a console call.',
    lesson: (file) => {
      const OUTPUT_CALL = /\bconsole\.(log|warn|error|table|info)\s*\(/;
      return file.fences
        .filter((f) => {
          const meta = parseFenceMeta(f.meta);
          return meta.run && !meta.project && !OUTPUT_CALL.test(f.code);
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
      'A plain `run` fence (P8 sandbox) that imports something. That sandbox\'s iframe has no network access at all (default-src \'none\') and no module loader, so any import fails at execution time regardless of whether the package exists. Does not apply to `run project` — WebContainer runs a real `npm install`, so imports are the entire point.',
    lesson: (file) => {
      const IMPORT_OR_REQUIRE = /^\s*import\b|\brequire\s*\(/m;
      return file.fences
        .filter((f) => {
          const meta = parseFenceMeta(f.meta);
          return meta.run && !meta.project && IMPORT_OR_REQUIRE.test(f.code);
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
];
