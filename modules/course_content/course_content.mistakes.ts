import { markdownToHtml } from './course_content.markdown';

export type MistakeForm = 'bold-dash' | 'bold-colon' | 'bold-space' | 'plain-dash' | 'single';

export type LessonMistake = {
  /** Lesson-local, e.g. "m0" — stable as long as the section's bullet order
   *  doesn't change. The full localStorage key (course/file#m0) is composed
   *  by whatever reads this (progress store), which is the thing that
   *  actually knows the lesson's identity. */
  id: string;
  /** Plain text, ** stripped. Empty for 'single' — nothing to lead with. */
  lead: string;
  /** markdownToHtml(body) — inline code and (#41) lesson links survive. */
  bodyHtml: string;
  form: MistakeForm;
};

// Priority order matters: bold-dash is checked before bold-colon before
// bold-space so "**Rate limiting**: burst allowance — not enforced" (which
// could satisfy either bold-colon or bold-dash) lands on the more specific
// leading-punctuation read. Measured against the corpus: 370 / 200 / 9 / 126,
// remainder (1041) falls through to 'single'.
const PATTERNS: { form: MistakeForm; re: RegExp }[] = [
  { form: 'bold-dash', re: /^\*\*(?<lead>[^*]+)\*\*\s*[—–-]\s*(?<body>.+)$/ },
  { form: 'bold-colon', re: /^\*\*(?<lead>[^*]+)\*\*\s*:\s*(?<body>.+)$/ },
  { form: 'bold-space', re: /^\*\*(?<lead>[^*]+)\*\*\s+(?<body>.+)$/ },
  { form: 'plain-dash', re: /^(?<lead>[^—–]{12,120}?)\s+[—–]\s+(?<body>.+)$/ },
];

/**
 * Splits a Common Mistakes section's raw markdown into top-level `- ` bullets,
 * joining a wrapped item's continuation lines into one string. Safe at line
 * level because the corpus has zero nested bullets in this section.
 *
 * Fenced blocks are skipped. That was not needed until P44 put a `breaks`
 * fence inside Common Mistakes: its YAML entries begin `- symptom:`, which is
 * a bullet by syntax and nothing of the sort, and without this the four
 * entries of the two pilot lessons appeared as four extra Common Mistakes
 * items — inflating the corpus counts, the drill total, and the pool P36's
 * rubric leads are quoted from. Same hazard rules.ts's `bullets()` helper
 * already documents for a trailing `recall` fence in Further Reading.
 *
 * A fence closes only on a run of at least as many backticks as opened it
 * (CommonMark), so a four-backtick block wrapping three-backtick ones does not
 * put the scan out of phase — the same rule walkLines() follows.
 */
/** Exported for course_content.cheatsheet.ts, which has to split the Key
 *  Concepts bullets by exactly the same rule this file splits Common
 *  Mistakes by. Two splitters would drift, and the cheat sheet's whole
 *  contract is that what it prints is verbatim. */
export function splitBulletItems(markdown: string): string[] {
  const items: string[] = [];
  let current: string[] | null = null;

  const flush = () => {
    if (current) items.push(current.join(' ').trim());
    current = null;
  };

  let openTicks = 0;
  for (const line of markdown.split('\n')) {
    const fence = /^\s*(`{3,})/.exec(line);
    if (fence) {
      if (openTicks === 0) {
        flush();
        openTicks = fence[1].length;
      } else if (fence[1].length >= openTicks && /^\s*`+\s*$/.test(line)) {
        openTicks = 0;
      }
      continue;
    }
    if (openTicks > 0) continue;

    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      flush();
      current = [bullet[1]];
      continue;
    }
    if (line.trim() === '') {
      flush();
      continue;
    }
    current?.push(line.trim());
  }
  flush();

  return items.filter((item) => item.length > 0);
}

export function parseMistakes(commonMistakesMarkdown: string): LessonMistake[] {
  return splitBulletItems(commonMistakesMarkdown).map((text, index) => {
    const id = `m${index}`;
    for (const { form, re } of PATTERNS) {
      const match = re.exec(text)?.groups;
      if (match) {
        return { id, lead: match.lead.trim(), bodyHtml: markdownToHtml(match.body.trim()), form };
      }
    }
    return { id, lead: '', bodyHtml: markdownToHtml(text), form: 'single' as const };
  });
}
