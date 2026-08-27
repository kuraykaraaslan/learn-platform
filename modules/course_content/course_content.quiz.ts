// Parses a `quiz`-shaped fence's YAML body into structured data ui/
// QuizCard.tsx renders. Parsed at build time only (YAML.parse, zod) — the
// widget that reaches the client is already a plain object, so neither the
// yaml package nor zod ships to the browser (docs/phases/06-quiz-tradeoff-
// diff.md: "client maliyeti sıfır byte").
import YAML from 'yaml';
import { z } from 'zod';

const QuizOptionSchema = z.object({
  text: z.string().min(1),
  correct: z.boolean(),
  // Every option explains itself, wrong ones included — otherwise a quiz is
  // a guessing game, not a check of what the lesson actually said.
  why: z.string().min(1),
});

const QuizQuestionSchema = z
  .object({
    q: z.string().min(1),
    // Must appear verbatim in the lesson's own raw text — enforced by
    // scripts/content-lint's quiz/unanchored-answer rule, which has the
    // full lesson body this parser never sees. A question whose anchor
    // can't be found in the lesson didn't come from the lesson.
    anchor: z.string().min(1),
    options: z.array(QuizOptionSchema).min(2).max(6),
  })
  .refine((q) => q.options.filter((o) => o.correct).length === 1, {
    message: 'exactly one option must have correct: true',
  });

// A single fence capped at 3 as a sanity bound; the corpus-wide "at most 3
// PER LESSON" rule (docs/phases/06) needs the full lesson's fence list to
// enforce, since a lesson could in principle hold more than one quiz fence
// — that cross-fence sum is scripts/content-lint's quiz/max-three rule.
const QuizFenceSchema = z.array(QuizQuestionSchema).min(1).max(3);

export type QuizOption = z.infer<typeof QuizOptionSchema>;
export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export type QuizWidget = {
  type: 'quiz';
  questions: QuizQuestion[];
  raw: string;
};

export function parseQuiz(raw: string): QuizWidget {
  const parsed: unknown = YAML.parse(raw);
  const questions = QuizFenceSchema.parse(parsed);
  return { type: 'quiz', questions, raw };
}
