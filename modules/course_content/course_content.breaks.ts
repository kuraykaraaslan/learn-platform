// Parses a `breaks`-shaped fence's YAML body — build-time only, same
// reasoning as course_content.numbers.ts: yaml and zod never reach the client,
// and BreaksCard imports only the type from here.
//
// This is docs/investigate/04-roadmap.md's T2.6 ("How It Breaks"), whose four
// beats are symptom -> what you see -> why -> which knob. The reviewers who
// deferred it named one reason — "a hallucinated psql output is
// indistinguishable from a real one" — and set one mechanical rule: no
// runnable repro, no section.
//
// That rule is honored here by making `see` unwritable. Every line of it must
// appear verbatim in a stamped `proof` fence in the same lesson, which is the
// only output in this repo nobody types (scripts/stamp-verify.ts is its only
// writer). The lint rule `breaks/see-not-proven` is where that is enforced;
// see docs/phases/44-how-it-breaks.md.
import YAML from 'yaml';
import { z } from 'zod';

const EntrySchema = z.object({
  /** What a human reported. The roadmap asks for a number in it, which
   *  `breaks/symptom-without-a-number` enforces rather than the schema. */
  symptom: z.string().min(1),
  /** The first wrong instinct — what the reader is asked to commit against
   *  before anything is revealed. Not a quiz option: there is nothing to pick,
   *  only something to have believed. */
  instinct: z.string().min(1),
  /** The real diagnostic command. */
  look: z.string().min(1),
  /** Real output, quoted verbatim from a proof fence in this lesson. Never
   *  authored — see the module comment. */
  see: z.string().min(1),
  /** The mechanism, not an adjective. */
  why: z.string().min(1),
  /** The setting or change that addresses it. */
  knob: z.string().min(1),
});

const BreaksFenceSchema = z.object({
  /** Optional one-line framing above the entries. */
  caption: z.string().min(1).optional(),
  /** The roadmap's own cap: at most three per lesson. A fourth is a sign the
   *  lesson is carrying two subjects. */
  entries: z.array(EntrySchema).min(1).max(3),
});

export type BreaksEntry = z.infer<typeof EntrySchema>;

export type BreaksWidget = {
  type: 'breaks';
  caption?: string;
  entries: BreaksEntry[];
  raw: string;
};

export function parseBreaks(raw: string): BreaksWidget {
  const parsed: unknown = YAML.parse(raw);
  const { caption, entries } = BreaksFenceSchema.parse(parsed);
  return { type: 'breaks', caption, entries, raw };
}

/** The lines of a `see` block that a proof must actually contain. Blank lines
 *  carry no claim, so they are not required to appear anywhere; everything
 *  else is, trimmed at both ends because YAML block scalars and a proof body
 *  do not have to agree about trailing spaces or common indentation.
 *
 *  Shared by the lint rule and the test so the two cannot disagree about what
 *  "quoted verbatim" means. */
export function provableLines(see: string): string[] {
  return see
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/** True when the symptom carries a figure. The roadmap's wording is "what a
 *  human reported, with a number" — a symptom without one ("it got slow") is
 *  the vague report this section exists to replace. */
export function symptomHasNumber(symptom: string): boolean {
  return /\d/.test(symptom);
}
