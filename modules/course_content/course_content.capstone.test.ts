import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import {
  hasCapstone,
  hasPathCapstone,
  listCapstoneProofFences,
  loadCapstone,
  loadPathCapstone,
  parseCapstoneMarkdown,
} from './course_content.capstone';
import { DEVELOPER_PATHS } from './course_content.paths';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';
import { splitLessonSections } from './course_content.parser';
import { parseMistakes } from './course_content.mistakes';

const withCapstone = listCourseSlugs().filter(hasCapstone);
const pathsWithCapstone = DEVELOPER_PATHS.filter((p) => hasPathCapstone(p.id));

/** lesson id -> the course that owns it, built once from the manifests. */
const courseOfLesson = new Map<number, string>();
for (const slug of listCourseSlugs()) {
  for (const item of readCourseManifest(slug).items) courseOfLesson.set(item.id, slug);
}

describe('parseCapstoneMarkdown', () => {
  it('is opt-in: most courses have no capstone and that is not a gap', () => {
    expect(withCapstone.length).toBeGreaterThan(0);
    expect(withCapstone.length).toBeLessThan(listCourseSlugs().length);
  });

  it('requires all four sections', () => {
    const complete = `# Capstone — X\n\n## Brief\nb\n\n## Deliverable\nd\n\n## Rubric\n\`\`\`rubric\nrows:\n  - lead: "l"\n    lesson: 1\n    looks_like: "x"\n  - lead: "m"\n    lesson: 1\n    looks_like: "y"\n  - lead: "n"\n    lesson: 1\n    looks_like: "z"\n\`\`\`\n\n## Reference Walkthrough\nr\n`;
    expect(() => parseCapstoneMarkdown('x', complete)).not.toThrow();
    for (const heading of ['## Brief', '## Deliverable', '## Rubric', '## Reference Walkthrough']) {
      const missing = complete.split('\n').filter((l) => l !== heading).join('\n');
      expect(() => parseCapstoneMarkdown('x', missing)).toThrow();
    }
  });

  it('rejects a rubric with fewer than three rows', () => {
    const thin = `# Capstone — X\n\n## Brief\nb\n\n## Deliverable\nd\n\n## Rubric\n\`\`\`rubric\nrows:\n  - lead: "l"\n    lesson: 1\n    looks_like: "x"\n\`\`\`\n\n## Reference Walkthrough\nr\n`;
    expect(() => parseCapstoneMarkdown('x', thin)).toThrow();
  });
});

// docs/investigate/04-roadmap.md's T2.4: "Rubric satırları o kursun kendi
// Common Mistakes maddelerinden türetilir." The lint rule enforces this at
// lint time; this is the same assertion as a unit test, so a broken rubric
// fails `npm run test` too rather than only the content pipeline.
describe('the rubric is derived, not written', () => {
  it('quotes every lead verbatim from the lesson it names, in the same course', () => {
    const offenders: string[] = [];

    for (const slug of withCapstone) {
      const capstone = loadCapstone(slug)!;
      const items = readCourseManifest(slug).items;

      for (const row of capstone.rubric) {
        const item = items.find((i) => i.id === row.lesson);
        if (!item) {
          offenders.push(`${slug}: lesson ${row.lesson} is not in this course`);
          continue;
        }
        const { sections } = splitLessonSections(readLessonMarkdown(slug, item.file));
        const leads = parseMistakes(sections.commonMistakes).map((m) => m.lead);
        if (!leads.includes(row.lead)) offenders.push(`${slug}#${row.lesson}: ${row.lead}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('cites only verified lessons', () => {
    // docs/phases/36-rubric-cites-verified.md. A rubric row asks the reader to
    // score their own work against an item, which is an exercise rather than a
    // reading — so it may only measure content the corpus stands behind. P34
    // shipped eight rows citing HARM_DENYLIST lessons; this is the guard that
    // would have caught it.
    for (const slug of withCapstone) {
      const items = readCourseManifest(slug).items;
      for (const row of loadCapstone(slug)!.rubric) {
        const item = items.find((i) => i.id === row.lesson)!;
        expect(item.verified, `${slug} rubric cites unverified lesson ${row.lesson}`).toBe(true);
      }
    }
  });

  it('gives every row a looks_like the lesson does not already contain', () => {
    // The one authored field. If it were also lifted from the lesson the
    // rubric would just be the Common Mistakes list with extra steps.
    for (const slug of withCapstone) {
      const capstone = loadCapstone(slug)!;
      for (const row of capstone.rubric) {
        expect(row.looks_like.length).toBeGreaterThan(40);
        expect(row.looks_like).not.toBe(row.lead);
      }
    }
  });
});

describe('capstone.md is invisible to the lesson pipeline', () => {
  it('is not a manifest item, so nothing walks it as a lesson', () => {
    for (const slug of withCapstone) {
      expect(readCourseManifest(slug).items.map((i) => i.file)).not.toContain('capstone.md');
    }
  });
});

// P35: the reference walkthrough's claims are executed rather than asserted.
// stamp-verify.ts writes these bodies and content-lint checks their sha; these
// are the same guarantees expressed as unit tests, so `npm run test` fails too
// if a capstone proof is hand-edited or loses its workspace.
describe('capstone proofs', () => {
  const fences = listCapstoneProofFences(withCapstone);

  it('exists wherever there is something to run, and is not invented where there is not', () => {
    // P35 wrote this as "one proof per capstone", which was true while every
    // capstone was in a code domain. P41's business capstone has nothing to
    // execute — no database, no runtime, only a diagnosis — and P35's own rule
    // says that where a claim cannot be run, its output is not written. So the
    // assertion is that the mechanism is exercised and that every proof which
    // exists is real, NOT that each capstone must produce one. Forcing a proof
    // here would produce exactly the fabricated output the rule exists to stop.
    expect(fences.length).toBeGreaterThan(0);
    expect(fences.length).toBeLessThanOrEqual(withCapstone.length);
  });

  it('has a workspace at content/_verify/<course>/capstone with a verify script', () => {
    for (const fence of fences) {
      const dir = path.join(process.cwd(), 'content', '_verify', fence.courseSlug, 'capstone');
      expect(fs.existsSync(dir)).toBe(true);
      const pkg = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf-8'));
      expect(pkg.scripts?.verify).toBeTruthy();
    }
  });

  it('is stamped, and the body matches its own sha', () => {
    for (const fence of fences) {
      const recorded = /sha=([0-9a-f]+)/.exec(fence.meta)?.[1];
      expect(recorded, `${fence.courseSlug}/capstone.md is unstamped`).toBeTruthy();
      const actual = createHash('sha256').update(fence.code, 'utf8').digest('hex').slice(0, 16);
      expect(actual).toBe(recorded);
    }
  });

  it('opens with the command that produced it, as every proof body does', () => {
    for (const fence of fences) expect(fence.code.startsWith('$ node ')).toBe(true);
  });
});

describe("a developer path's capstone", () => {
  // docs/phases/43-path-capstone.md. Same parser, same UI, same rules as a
  // course capstone; what differs is the home (content/paths/<id>/capstone.md)
  // and the scope of the rubric (the path's steps, not a course's lessons).
  it('is opt-in, the same way a course capstone is', () => {
    expect(hasPathCapstone('no-such-path')).toBe(false);
    expect(loadPathCapstone('no-such-path')).toBeNull();
    expect(pathsWithCapstone.length).toBeGreaterThan(0);
  });

  it('quotes every lead verbatim from a lesson that is a step on that path', () => {
    const offenders: string[] = [];

    for (const developerPath of pathsWithCapstone) {
      const capstone = loadPathCapstone(developerPath.id)!;
      const steps = new Set<number>(developerPath.steps);

      for (const row of capstone.rubric) {
        if (!steps.has(row.lesson)) {
          offenders.push(`${developerPath.id}: lesson ${row.lesson} is not a step on this path`);
          continue;
        }
        const slug = courseOfLesson.get(row.lesson)!;
        const item = readCourseManifest(slug).items.find((i) => i.id === row.lesson)!;
        expect(item.verified, `${developerPath.id} rubric cites unverified lesson ${row.lesson}`).toBe(true);
        const { sections } = splitLessonSections(readLessonMarkdown(slug, item.file));
        const leads = parseMistakes(sections.commonMistakes).map((m) => m.lead);
        if (!leads.includes(row.lead)) offenders.push(`${developerPath.id}#${row.lesson}: ${row.lead}`);
      }
    }

    expect(offenders).toEqual([]);
  });

  it('draws its rows from at least three courses — the thing a course capstone cannot do', () => {
    // This is the phase's whole point rather than a stylistic preference: a
    // capstone confined to one course measures one course. If this assertion
    // ever holds trivially, the path capstone has stopped earning its home.
    for (const developerPath of pathsWithCapstone) {
      const courses = new Set(
        loadPathCapstone(developerPath.id)!.rubric.map((row) => courseOfLesson.get(row.lesson))
      );
      expect(courses.size, `${developerPath.id} capstone spans ${courses.size} course(s)`).toBeGreaterThanOrEqual(3);
    }
  });

  it('lives beside the path, never inside a course, so no course walks it', () => {
    for (const developerPath of pathsWithCapstone) {
      const file = path.join(process.cwd(), 'content', 'paths', developerPath.id, 'capstone.md');
      expect(fs.existsSync(file)).toBe(true);
      expect(hasCapstone(developerPath.id)).toBe(false);
    }
  });
});
