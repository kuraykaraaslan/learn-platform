import { describe, expect, it } from 'vitest';
import { parseQuiz } from './course_content.quiz';

const VALID = `
- q: "What happens if you send the same idempotency key twice with the same body?"
  anchor: "the stored response for that key"
  options:
    - text: "The second request returns 409"
      correct: false
      why: "409 is for conflicts; a replay with the same body isn't a conflict."
    - text: "The first response is returned from storage"
      correct: true
      why: "The key stores the first response; a replay with the same body gets that same result."
`;

describe('parseQuiz', () => {
  it('parses a valid quiz fence into a widget', () => {
    const widget = parseQuiz(VALID);
    expect(widget.type).toBe('quiz');
    expect(widget.questions).toHaveLength(1);
    expect(widget.questions[0].options).toHaveLength(2);
  });

  it('rejects a question with zero correct options', () => {
    const bad = VALID.replace('correct: true', 'correct: false');
    expect(() => parseQuiz(bad)).toThrow();
  });

  it('rejects a question with more than one correct option', () => {
    const bad = VALID.replace('correct: false', 'correct: true');
    expect(() => parseQuiz(bad)).toThrow();
  });

  it('rejects an option missing why', () => {
    const bad = `
- q: "test"
  anchor: "test"
  options:
    - text: "a"
      correct: true
    - text: "b"
      correct: false
      why: "because"
`;
    expect(() => parseQuiz(bad)).toThrow();
  });

  it('rejects more than 3 questions in one fence', () => {
    // Built as objects (YAML is a superset of JSON, so JSON.stringify is a
    // valid YAML document) rather than string surgery on VALID, to keep
    // this test's intent — "4 well-formed questions" — legible on its own.
    const questions = Array.from({ length: 4 }, (_, i) => ({
      q: `q${i}`,
      anchor: `a${i}`,
      options: [
        { text: 'a', correct: true, why: 'w' },
        { text: 'b', correct: false, why: 'w' },
      ],
    }));
    expect(() => parseQuiz(JSON.stringify(questions))).toThrow();
  });

  it('rejects malformed YAML', () => {
    expect(() => parseQuiz('not: a: valid: quiz')).toThrow();
  });
});
