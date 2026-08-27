import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { QuizCard } from './QuizCard';
import { parseQuiz } from '../course_content.quiz';

const YAML = `
- q: "test question"
  anchor: "test anchor"
  options:
    - text: "wrong"
      correct: false
      why: "wrong because"
    - text: "right"
      correct: true
      why: "right because"
`;

describe('QuizCard', () => {
  it('renders nothing on an unverified lesson', () => {
    const widget = parseQuiz(YAML);
    const html = renderToStaticMarkup(React.createElement(QuizCard, { widget, verified: false }));
    expect(html).toBe('');
  });

  it('shows the question and options, but not the why text, before any click', () => {
    const widget = parseQuiz(YAML);
    const html = renderToStaticMarkup(React.createElement(QuizCard, { widget, verified: true }));
    expect(html).toContain('test question');
    expect(html).toContain('wrong');
    expect(html).toContain('right');
    expect(html).not.toContain('wrong because');
    expect(html).not.toContain('right because');
  });

});
