// Parses a `recall`-shaped fence's YAML body — same build-time-only
// parsing (YAML + zod, never shipped to the client) as course_content.
// quiz.ts and course_content.tradeoff.ts.
import YAML from 'yaml';
import { z } from 'zod';

const RecallItemSchema = z.object({
  q: z.string().min(1),
  // What a correct free-recall answer needs to have covered — checked off
  // by the reader themselves after writing their own answer, not graded.
  must: z.array(z.string().min(1)).min(1).max(6),
});

// docs/phases/11-recall-and-calc.md: 3-5 items — a "Close the Tab" check,
// not a full quiz.
const RecallFenceSchema = z.array(RecallItemSchema).min(3).max(5);

export type RecallItem = z.infer<typeof RecallItemSchema>;

export type RecallWidget = {
  type: 'recall';
  items: RecallItem[];
  raw: string;
};

export function parseRecall(raw: string): RecallWidget {
  const parsed: unknown = YAML.parse(raw);
  const items = RecallFenceSchema.parse(parsed);
  return { type: 'recall', items, raw };
}
