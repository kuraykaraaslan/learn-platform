import { describe, expect, it, vi } from 'vitest';
import type { Concept } from './course_content.concepts';
import { markdownToHtml, type MarkdownContext } from './course_content.markdown';

const FIXTURE_CONCEPTS: Record<string, Concept> = {
  'idempotency-key': {
    term: 'idempotency key',
    aliases: ['idempotency keys'],
    short: 'A key the client generates to make a retried request a no-op.',
    lesson: 7,
  },
  'saga-pattern': {
    term: 'saga pattern',
    short: 'A sequence of local transactions coordinated via compensating actions.',
    lesson: 3,
  },
};

vi.mock('./course_content.concepts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./course_content.concepts')>();
  return { ...actual, loadConcepts: () => FIXTURE_CONCEPTS };
});

function ctx(overrides: Partial<MarkdownContext> = {}): MarkdownContext {
  return { lessonId: 999, conceptLinkBudget: { remaining: 4 }, usedConcepts: [], ...overrides };
}

describe('remarkConcepts', () => {
  it('links the first occurrence of a term to a button, not an anchor', () => {
    const c = ctx();
    const html = markdownToHtml('Use an idempotency key here.', c);
    expect(html).toContain('<button type="button" class="concept-term" data-concept="idempotency-key"');
    expect(html).toContain('aria-describedby="concept-tooltip"');
    expect(html).not.toContain('<a ');
    expect(c.usedConcepts).toEqual(['idempotency-key']);
  });

  it('does not link a second occurrence of the same term within one section', () => {
    const html = markdownToHtml('An idempotency key here, and another idempotency key there.', ctx());
    expect(html.match(/data-concept="idempotency-key"/g)).toHaveLength(1);
  });

  it('resolves an alias to the same concept as the canonical term', () => {
    const html = markdownToHtml('Two idempotency keys walk into a bar.', ctx());
    expect(html).toContain('data-concept="idempotency-key"');
    expect(html).toContain('>idempotency keys<'); // original casing/form preserved
  });

  it('never links inside the lesson that defines the term (no self-link)', () => {
    const html = markdownToHtml('An idempotency key, defined right here.', ctx({ lessonId: 7 }));
    expect(html).not.toContain('data-concept');
  });

  it('stops linking once the shared budget hits zero, even for a not-yet-seen term', () => {
    const shared = ctx({ conceptLinkBudget: { remaining: 1 } });
    const html1 = markdownToHtml('An idempotency key appears.', shared);
    const html2 = markdownToHtml('A saga pattern appears.', shared);
    expect(html1).toContain('data-concept="idempotency-key"');
    expect(html2).not.toContain('data-concept');
    expect(shared.usedConcepts).toEqual(['idempotency-key']);
  });

  it('the same budget object is shared across separate sections of one lesson', () => {
    const shared = ctx({ conceptLinkBudget: { remaining: 4 } });
    markdownToHtml('An idempotency key in section one.', shared);
    markdownToHtml('A saga pattern in section two.', shared);
    expect(shared.conceptLinkBudget.remaining).toBe(2);
    expect(shared.usedConcepts).toEqual(['idempotency-key', 'saga-pattern']);
  });

  it('a term CAN be linked again in a later section (limit is per-section, not per-lesson)', () => {
    const shared = ctx({ conceptLinkBudget: { remaining: 4 } });
    const s1 = markdownToHtml('An idempotency key in section one.', shared);
    const s2 = markdownToHtml('An idempotency key again in section two.', shared);
    expect(s1).toContain('data-concept="idempotency-key"');
    expect(s2).toContain('data-concept="idempotency-key"');
  });

  it('never links inside a fenced code block', () => {
    const html = markdownToHtml('```\nconst key = "idempotency key";\n```', ctx());
    expect(html).not.toContain('data-concept');
  });

  it('never links inside inline code', () => {
    const html = markdownToHtml('See `idempotency key` in the header.', ctx());
    expect(html).not.toContain('data-concept');
  });

  it('never links inside a blockquote', () => {
    const html = markdownToHtml('> Note: send an idempotency key with every retry.', ctx());
    expect(html).not.toContain('data-concept');
  });

  it('spends no budget on a blockquote, so prose after it still links', () => {
    // The real case this exists for: a disclaimer blockquote repeated across a
    // whole course used to take a link slot AND the per-section first-mention,
    // so the sentence that actually taught the term rendered plain.
    const c = ctx({ conceptLinkBudget: { remaining: 1 } });
    const html = markdownToHtml(
      '> General education only: an idempotency key is not legal advice.\n\nAn idempotency key makes a retry a no-op.',
      c
    );
    expect(html).toContain('data-concept="idempotency-key"');
    // Linked once, in the prose — not in the quote.
    expect(html.match(/data-concept/g)).toHaveLength(1);
    expect(html).toMatch(/<blockquote>[\s\S]*?<\/blockquote>/);
    expect(html.split('</blockquote>')[0]).not.toContain('data-concept');
    expect(c.conceptLinkBudget.remaining).toBe(0);
  });

  it('does nothing when no context is passed (existing byte-identical callers unaffected)', () => {
    const html = markdownToHtml('An idempotency key, unlinked.');
    expect(html).not.toContain('data-concept');
  });
});
