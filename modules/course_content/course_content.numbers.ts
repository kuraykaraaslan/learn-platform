// Parses a `numbers`-shaped fence's YAML body — build-time only, same
// reasoning as course_content.tradeoff.ts: yaml and zod never reach the
// client, and NumbersCard imports only the type from here.
//
// This is docs/investigate/04-roadmap.md's T2.2 with its strict rule made
// mechanical rather than remembered: "each row either links inline to the
// document that publishes the number, or gives the command that produces it;
// if neither, the row is deleted." Those two conditions are lint rules
// (`numbers/unsourced-default`, `numbers/unmeasurable-row`), not review
// etiquette — see docs/phases/31-numbers-that-matter.md.
import YAML from 'yaml';
import { z } from 'zod';

/** A default nobody publishes. Written as an em dash so the sourcing rule can
 *  tell "there is no published default" from "somebody forgot the link". */
export const NO_PUBLISHED_DEFAULT = '—';

const RowSchema = z.object({
  /** The knob, stamped with the version it belongs to: the roadmap's own
   *  requirement — "PostgreSQL 16 default", never bare "default". */
  quantity: z.string().min(1),
  default: z.string().min(1),
  /** Required whenever `default` claims a value; enforced by lint rather than
   *  by the schema, so a malformed fence reports as one readable finding
   *  instead of a zod stack. */
  source: z.string().url().optional(),
  /** Why the default is wrong at scale. A mechanism, not an adjective. */
  at_scale: z.string().min(1),
  /** How the reader measures their own: a command in backticks, or a link. */
  measure: z.string().min(1),
});

const NumbersFenceSchema = z.object({
  /** Optional one-line framing above the table. */
  caption: z.string().min(1).optional(),
  rows: z.array(RowSchema).min(1).max(8),
});

export type NumbersRow = z.infer<typeof RowSchema>;

export type NumbersWidget = {
  type: 'numbers';
  caption?: string;
  rows: NumbersRow[];
  raw: string;
};

export function parseNumbers(raw: string): NumbersWidget {
  const parsed: unknown = YAML.parse(raw);
  const { caption, rows } = NumbersFenceSchema.parse(parsed);
  return { type: 'numbers', caption, rows, raw };
}

/** True when a row claims a published default and so owes a source link.
 *  Shared by the lint rule and the card, so they cannot disagree. */
export function claimsPublishedDefault(row: NumbersRow): boolean {
  return row.default.trim() !== NO_PUBLISHED_DEFAULT;
}

/** True when `measure` gives the reader something executable or readable:
 *  a backticked command, or a link. */
export function hasMeasurement(row: NumbersRow): boolean {
  return /`[^`]+`/.test(row.measure) || /https?:\/\//.test(row.measure);
}
