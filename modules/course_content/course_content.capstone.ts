// P34: the capstone parser — docs/investigate/04-roadmap.md's T2.4.
//
// Deliberately a SEPARATE parser from course_content.parser.ts. T2.4's own
// condition was that "katı 6 bölümlü ders parser'ı ve HEADING_RULES hiç
// ellenmez", and P31 held the same line for the numbers widget: a new shape
// gets its own reader rather than a new prefix in the lesson parser.
//
// The rubric is the part that carries the credibility weight. Its rows are not
// written for the capstone — each one's `lead` is a verbatim Common Mistakes
// lead from a lesson in the same course, which the lint rule
// `capstone/unsourced-rubric-row` enforces against the corpus. That is the
// roadmap's rule ("Rubric satırları o kursun kendi Common Mistakes
// maddelerinden türetilir") made mechanical, in the same way P33's cheat sheet
// made its own verbatim contract a test.
import fs from 'node:fs';
import path from 'node:path';
import YAML from 'yaml';
import { z } from 'zod';
import { markdownToHtml } from './course_content.markdown';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');

const RubricRowSchema = z.object({
  /** Verbatim mistake lead from `lesson`. Never written here. */
  lead: z.string().min(1),
  /** The lesson the lead came from, so a reader can go and read it. */
  lesson: z.number().int().positive(),
  /** The only authored field: what this criterion looks like in the reader's
   *  own deliverable, rather than in a lesson's example. */
  looks_like: z.string().min(1),
});

const RubricSchema = z.object({
  rows: z.array(RubricRowSchema).min(3).max(12),
});

export type RubricRow = z.infer<typeof RubricRowSchema>;

export type Capstone = {
  courseSlug: string;
  title: string;
  briefHtml: string;
  deliverableHtml: string;
  rubric: RubricRow[];
  /** Sealed in the UI until every rubric row has been self-scored. */
  referenceHtml: string;
};

const HEADINGS = ['Brief', 'Deliverable', 'Rubric', 'Reference Walkthrough'] as const;

export function capstonePath(courseSlug: string): string {
  return path.join(CONTENT_ROOT, courseSlug, 'capstone.md');
}

export function hasCapstone(courseSlug: string): boolean {
  return fs.existsSync(capstonePath(courseSlug));
}

/** Splits the four sections and pulls the rubric out of its fence. Throws on a
 *  missing section or a malformed rubric — a broken capstone should fail the
 *  build, exactly as a broken quiz fence does (docs/phases/06). */
export function parseCapstoneMarkdown(courseSlug: string, raw: string): Capstone {
  const lines = raw.split('\n');
  const titleLine = lines.find((l) => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#\s*/, '').replace(/^Capstone\s*[—-]\s*/, '').trim() : '';

  const sections = new Map<string, string[]>();
  let current: string | null = null;
  for (const line of lines) {
    const heading = /^##\s+(.*)$/.exec(line);
    if (heading) {
      const name = HEADINGS.find((h) => heading[1].trim().startsWith(h)) ?? null;
      current = name;
      if (name) sections.set(name, []);
      continue;
    }
    if (current) sections.get(current)!.push(line);
  }

  for (const heading of HEADINGS) {
    if (!sections.has(heading)) throw new Error(`${courseSlug}/capstone.md is missing "## ${heading}"`);
  }

  const body = (name: (typeof HEADINGS)[number]) => sections.get(name)!.join('\n').trim();

  const rubricFence = /```rubric\n([\s\S]*?)\n```/.exec(body('Rubric'));
  if (!rubricFence) throw new Error(`${courseSlug}/capstone.md has no \`rubric\` fence under "## Rubric"`);
  const { rows } = RubricSchema.parse(YAML.parse(rubricFence[1]));

  return {
    courseSlug,
    title,
    briefHtml: markdownToHtml(body('Brief')),
    deliverableHtml: markdownToHtml(body('Deliverable')),
    rubric: rows,
    referenceHtml: markdownToHtml(body('Reference Walkthrough')),
  };
}

export function loadCapstone(courseSlug: string): Capstone | null {
  if (!hasCapstone(courseSlug)) return null;
  return parseCapstoneMarkdown(courseSlug, fs.readFileSync(capstonePath(courseSlug), 'utf-8'));
}

/** A `proof` fence found in a capstone.md, in the shape stamp-verify.ts and
 *  the lint rule both need.
 *
 *  Deliberately NOT routed through listFences(): that walks manifest items, so
 *  capstone.md is invisible to it — and that invisibility is what keeps
 *  corpus-stats from counting capstone fences as corpus fences and loadCorpus
 *  from treating a capstone as a lesson (docs/phases/34-capstone.md relies on
 *  it, and a test asserts it). One scanner, used by both callers, for the same
 *  reason P33 exported splitBulletItems rather than writing a second one. */
export type CapstoneProofFence = {
  courseSlug: string;
  file: 'capstone.md';
  /** 1-based line of the opening fence. */
  line: number;
  /** Info string after the language token, e.g. "sha=... at=... commit=...". */
  meta: string;
  /** Everything between the fence markers. */
  code: string;
};

export function listCapstoneProofFences(courseSlugs: string[]): CapstoneProofFence[] {
  const out: CapstoneProofFence[] = [];

  for (const courseSlug of courseSlugs) {
    if (!hasCapstone(courseSlug)) continue;
    const lines = fs.readFileSync(capstonePath(courseSlug), 'utf-8').split('\n');

    let open: { line: number; meta: string; body: string[] } | null = null;
    for (let i = 0; i < lines.length; i++) {
      const fence = /^```(\S*)\s*(.*)$/.exec(lines[i]);
      if (!fence) {
        if (open) open.body.push(lines[i]);
        continue;
      }
      if (open) {
        out.push({ courseSlug, file: 'capstone.md', line: open.line, meta: open.meta, code: open.body.join('\n') });
        open = null;
        continue;
      }
      if (fence[1] === 'proof') open = { line: i + 1, meta: fence[2].trim(), body: [] };
    }
  }

  return out;
}
