import { describe, expect, it } from 'vitest';
import { markdownToHtml } from './course_content.markdown';
import { lessonIndex } from './course_content.index';

describe('remarkLessonRefs', () => {
  it('turns a canonical "(#N)" reference into a link to that lesson', () => {
    const html = markdownToHtml('Bounded contexts (#134) are the seam.');
    expect(html).toContain('href="/courses/architecture-design-patterns-testing/domain-driven-design"');
    expect(html).toContain('>#134<');
  });

  it('leaves a reference to a nonexistent lesson as plain text rather than a dead link', () => {
    expect(markdownToHtml('nothing here (#999).')).toContain('(#999)');
    expect(markdownToHtml('nothing here (#999).')).not.toContain('<a ');
  });

  it('never rewrites inside inline code or a fenced block', () => {
    expect(markdownToHtml('`const x = "(#4)"`')).not.toContain('<a ');
    expect(markdownToHtml('```ts\nconst a = "(#4)";\n```')).not.toContain('<a ');
  });

  it('does not nest a link inside an existing link', () => {
    const html = markdownToHtml('[label (#4)](/somewhere)');
    expect(html).toContain('href="/somewhere"');
    expect((html.match(/<a /g) ?? []).length).toBe(1);
  });

  it('resolves every id in the corpus index to a real course route', () => {
    const index = lessonIndex();
    expect(index.size).toBe(412);
    for (const ref of index.values()) {
      expect(ref.href).toMatch(/^\/courses\/[a-z0-9-]+\/[a-z0-9-]+$/);
    }
  });
});
