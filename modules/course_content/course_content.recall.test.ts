import { describe, expect, it } from 'vitest';
import { parseRecall } from './course_content.recall';

function items(n: number) {
  return Array.from({ length: n }, (_, i) => ({ q: `q${i}`, must: [`must${i}`] }));
}

describe('parseRecall', () => {
  it('parses a valid 3-item recall fence', () => {
    const widget = parseRecall(JSON.stringify(items(3)));
    expect(widget.type).toBe('recall');
    expect(widget.items).toHaveLength(3);
  });

  it('parses a valid 5-item recall fence', () => {
    const widget = parseRecall(JSON.stringify(items(5)));
    expect(widget.items).toHaveLength(5);
  });

  it('rejects fewer than 3 items', () => {
    expect(() => parseRecall(JSON.stringify(items(2)))).toThrow();
  });

  it('rejects more than 5 items', () => {
    expect(() => parseRecall(JSON.stringify(items(6)))).toThrow();
  });

  it('rejects an item with an empty must[]', () => {
    const bad = [
      { q: 'q0', must: [] },
      { q: 'q1', must: ['m'] },
      { q: 'q2', must: ['m'] },
    ];
    expect(() => parseRecall(JSON.stringify(bad))).toThrow();
  });
});
