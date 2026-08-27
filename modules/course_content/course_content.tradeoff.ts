// Parses a `tradeoff`-shaped fence's YAML body — same build-time-only
// parsing as course_content.quiz.ts, same zero-client-bytes reasoning.
//
// Deliberately has no concept of a "correct" side: docs/phases/06 revives
// the roadmap's rejected "answer key" idea only by removing the answer key
// entirely. The reader picks a side, both sides' win conditions are shown,
// and every win condition is a measurable signal (a number, or a link to
// what produces the number) — never a feeling.
import YAML from 'yaml';
import { z } from 'zod';

const SignalSchema = z.object({
  signal: z.string().min(1),
});

const SideSchema = z.object({
  name: z.string().min(1),
  wins_when: z.array(SignalSchema).min(1).max(6),
});

// Exactly two sides — matches the spec's own example and framing
// ("iki tarafın da hangi koşulda kazandığı açılır"): this is a binary
// decision explorer, not an N-way comparison table.
const TradeoffFenceSchema = z.object({
  question: z.string().min(1),
  sides: z.array(SideSchema).length(2),
});

export type TradeoffSide = z.infer<typeof SideSchema>;

export type TradeoffWidget = {
  type: 'tradeoff';
  question: string;
  sides: [TradeoffSide, TradeoffSide];
  raw: string;
};

export function parseTradeoff(raw: string): TradeoffWidget {
  const parsed: unknown = YAML.parse(raw);
  const { question, sides } = TradeoffFenceSchema.parse(parsed);
  return { type: 'tradeoff', question, sides: sides as [TradeoffSide, TradeoffSide], raw };
}
