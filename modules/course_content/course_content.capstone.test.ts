import { describe, expect, it } from 'vitest';
import { hasCapstone, loadCapstone, parseCapstoneMarkdown } from './course_content.capstone';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from './course_content.manifest';
import { splitLessonSections } from './course_content.parser';
import { parseMistakes } from './course_content.mistakes';

const withCapstone = listCourseSlugs().filter(hasCapstone);

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
