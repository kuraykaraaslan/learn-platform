// The write-before-you-look gate, in one place because two widgets now run it.
//
// P11 introduced it inside RecallCard with the whole argument attached:
// "without this gate it's a reveal-answer button, not a recall exercise". P14's
// SpatialCard needs exactly the same gate for its `ask`, and a second literal
// 15 in a second file is a number that can drift apart from its own reasoning
// — so the constant moved here rather than being copied (P14's acceptance
// criterion, made mechanical by SpatialCard.test.ts and RecallCard.test.ts
// both importing it).
//
// Deliberately dependency-free: both importers are 'use client' components.

/** Characters of the reader's own answer required before anything opens. */
export const MIN_ANSWER_LENGTH = 15;

export function canReveal(answer: string): boolean {
  return answer.trim().length >= MIN_ANSWER_LENGTH;
}

/** How many more characters the reader owes — only ever shown once they have
 *  started writing, so an empty field is not nagged at. */
export function charsRemaining(answer: string): number {
  return Math.max(0, MIN_ANSWER_LENGTH - answer.trim().length);
}
