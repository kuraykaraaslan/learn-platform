import { describe, expect, it } from 'vitest';
import { parseTradeoff } from './course_content.tradeoff';

const VALID = `
question: "Blue-green or rolling deployment?"
sides:
  - name: "Blue-green"
    wins_when:
      - signal: "rollback must be instant (flip the load balancer back)"
      - signal: "budget covers two full running environments"
  - name: "Rolling"
    wins_when:
      - signal: "no budget for an idle second environment"
`;

describe('parseTradeoff', () => {
  it('parses a valid tradeoff fence into a widget with exactly two sides', () => {
    const widget = parseTradeoff(VALID);
    expect(widget.type).toBe('tradeoff');
    expect(widget.sides).toHaveLength(2);
    expect(widget.sides[0].name).toBe('Blue-green');
    expect(widget.sides[1].wins_when).toHaveLength(1);
  });

  it('rejects a fence with only one side', () => {
    const oneSided = `
question: "q"
sides:
  - name: "Only side"
    wins_when:
      - signal: "s"
`;
    expect(() => parseTradeoff(oneSided)).toThrow();
  });

  it('rejects a fence with three sides', () => {
    const threeSided = `
question: "q"
sides:
  - name: "A"
    wins_when: [{ signal: "s" }]
  - name: "B"
    wins_when: [{ signal: "s" }]
  - name: "C"
    wins_when: [{ signal: "s" }]
`;
    expect(() => parseTradeoff(threeSided)).toThrow();
  });

  it('rejects a side with no win conditions', () => {
    const empty = `
question: "q"
sides:
  - name: "A"
    wins_when: []
  - name: "B"
    wins_when:
      - signal: "s"
`;
    expect(() => parseTradeoff(empty)).toThrow();
  });
});
