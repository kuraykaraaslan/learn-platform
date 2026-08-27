// Splits a fence already written in the corpus's own long-standing
// broken/fixed (or bad/good, naive/better) teaching pattern into two named
// halves ui/DiffCard.tsx toggles between. Writes no new content — it labels
// a shape scripts/verify-code.ts's 'shows-variants' defect class already
// recognizes as intentional (duplicate identifiers across the two halves
// are the whole point, not a real defect).
//
// Marked by a `// ── broken ──` / `// ── fixed ──` divider pair inside one
// fence — chosen over separate `diff=broken`/`diff=fixed` fences because it
// keeps a lesson's already-existing single fence intact instead of forcing
// a rewrite into two, for a fence that's ALREADY in this shape today.

const BROKEN_MARKER = /^\s*\/\/\s*──+\s*broken\s*──+\s*$/im;
const FIXED_MARKER = /^\s*\/\/\s*──+\s*fixed\s*──+\s*$/im;

export type DiffWidget = {
  type: 'diff';
  broken: string;
  fixed: string;
  raw: string;
};

export function looksLikeDiff(raw: string): boolean {
  return BROKEN_MARKER.test(raw) && FIXED_MARKER.test(raw);
}

/** Assumes looksLikeDiff(raw) is true — course_content.blocks.ts only calls
 *  this after checking. Whichever marker comes first starts the "broken"
 *  half; text before the first marker (a shared preamble, e.g. shared type
 *  declarations both halves use) is prepended to both halves so each stays
 *  independently valid/readable. */
export function parseDiff(raw: string): DiffWidget {
  const lines = raw.split('\n');
  const brokenIdx = lines.findIndex((l) => BROKEN_MARKER.test(l));
  const fixedIdx = lines.findIndex((l) => FIXED_MARKER.test(l));

  const preamble = lines.slice(0, Math.min(brokenIdx, fixedIdx)).join('\n');
  const [firstIdx, firstLabel, secondIdx] =
    brokenIdx < fixedIdx ? [brokenIdx, 'broken', fixedIdx] : [fixedIdx, 'fixed', brokenIdx];

  const firstBody = lines.slice(firstIdx + 1, secondIdx).join('\n');
  const secondBody = lines.slice(secondIdx + 1).join('\n');

  const broken = firstLabel === 'broken' ? firstBody : secondBody;
  const fixed = firstLabel === 'broken' ? secondBody : firstBody;

  const join = (body: string) => (preamble ? `${preamble}\n${body}` : body);
  return { type: 'diff', broken: join(broken), fixed: join(fixed), raw };
}
