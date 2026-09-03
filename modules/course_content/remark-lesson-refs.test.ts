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
    expect(index.size).toBe(523);
    for (const ref of index.values()) {
      expect(ref.href).toMatch(/^\/courses\/[a-z0-9-]+\/[a-z0-9-]+$/);
    }
  });
});

describe('remarkLessonRefs — non-canonical forms', () => {
  it('links a bare id that matches a lesson', () => {
    expect(markdownToHtml('ties to #55 SLO/SLI/SLA')).toContain('/courses/observability-deployment/slo-sli-sla');
  });

  it('links the spelled-out "Lesson N" form and keeps it as the label', () => {
    const html = markdownToHtml('See also Lesson 337 for the mechanics.');
    expect(html).toContain('>Lesson 337<');
    expect(html).toContain('href="/courses/business-finance-solo-ops/');
  });

  it('does NOT link a bare id with no cue — "rule #1" is not a lesson reference', () => {
    expect(markdownToHtml('rule #1 is "do not be afraid to launch"')).not.toContain('<a ');
  });

  it('does NOT link an id range, which is one reference to many lessons', () => {
    expect(markdownToHtml('its own observability stack (see #53–62), and calls')).not.toContain('<a ');
  });

  it('keeps a prose cue outside the link so the sentence still reads', () => {
    const html = markdownToHtml('in place (see Lesson 258), someone must run support');
    expect(html).toContain('(see <a ');
  });

  it('links the "Course N" form the compliance lessons use', () => {
    expect(markdownToHtml('Blameless Post-Mortem (course #79) covers the retrospective')).toContain('<a ');
    expect(markdownToHtml('Course 358 — Data Classification')).toContain('>Course 358<');
  });

  it('never links an id introduced by a counter noun', () => {
    // The deny-list is small because a survey of every bare id in all 412
    // lessons found exactly one counter usage. If a new one appears, it must
    // be added here rather than discovered by a reader.
    for (const counter of ['rule', 'step', 'issue', 'item', 'phase', 'option', 'week']) {
      expect(markdownToHtml(`${counter} #1 is the one that matters`)).not.toContain('<a ');
    }
  });
});
