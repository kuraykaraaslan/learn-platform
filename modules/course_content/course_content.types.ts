import type { LessonBlock } from './course_content.blocks';
import type { LessonMistake } from './course_content.mistakes';
import type { ConceptSummary } from './course_content.concepts';
import type { CourseSectionId } from './course_content.sections';

export type Bracket = '0-1' | '1-3' | '3-7' | '7-10';

export type Interactive = 'off' | 'drill' | 'full';

export type ManifestItem = {
  id: number;
  file: string;
  title: string;
  bracket: Bracket;
  category: string;
  /** Minutes to read. Optional until measured for every lesson. */
  minutes?: number;
  /** Lesson ids (globally unique across all courses) this lesson assumes. */
  prereqs?: number[];
  /** Written only by scripts/stamp-verified.ts. */
  verified?: boolean;
  interactive?: Interactive;
};

export type CourseManifest = {
  slug: string;
  title: string;
  description: string;
  items: ManifestItem[];
};

export type CourseSummary = {
  slug: string;
  title: string;
  description: string;
  count: number;
  bracketCounts: Record<Bracket, number>;
  /** Which home-page track this course sits in (course_content.sections.ts). */
  section: CourseSectionId;
  /** The bracket holding the most lessons — the card's "mostly N yrs" hint. */
  dominantBracket: Bracket;
  /** Static cover path under public/, always /covers/<slug>.webp. */
  cover: string;
};

/** One home-page track: a heading, a blurb, and its courses in reading order. */
export type CourseSection = {
  id: CourseSectionId;
  title: string;
  blurb: string;
  courses: CourseSummary[];
};

/** Which interactive mechanisms a lesson actually contains — surfaced as chips
 *  on the course-overview list so a reader can see a lesson isn't just prose. */
export type LessonFeatures = {
  /** Predict-then-reveal Common Mistakes drills (0 when the lesson is unverified). */
  drills: number;
  checklist: boolean;
  template: boolean;
  quiz: boolean;
  tradeoff: boolean;
  recall: boolean;
  diff: boolean;
  /** A runnable JS/TS snippet (```… run). */
  runnableCode: boolean;
  /** A full runnable project (```… project — WebContainer). */
  project: boolean;
  /** A runnable SQL cell (PGlite). */
  sql: boolean;
  mermaid: boolean;
  /** A `calc` fence — the reader's own numbers through the lesson's model
   *  (docs/phases/11-recall-and-calc.md). */
  calc: boolean;
};

export type LessonCard = ManifestItem & {
  lessonSlug: string;
  /** First sentence of "What It Is", plain text. */
  teaser: string;
  /** Rounded reading-time estimate in minutes (prose only, ~200 wpm). */
  minutes: number;
  features: LessonFeatures;
};

/** Corpus-wide numbers for the home-page hero. Measured, not hardcoded. */
export type CatalogStats = {
  lessons: number;
  courses: number;
  drillableLessons: number;
  conceptTerms: number;
};

export type LessonSections = {
  whatItIs: string;
  keyConcepts: string;
  exampleCode: string;
  whenToUse: string;
  commonMistakes: string;
  furtherReading: string;
};

export type Lesson = ManifestItem & {
  courseSlug: string;
  lessonSlug: string;
  /** Rounded reading-time estimate in minutes (prose only, ~200 wpm). */
  minutes: number;
  blocks: Record<keyof LessonSections, LessonBlock[]>;
  mistakes: LessonMistake[];
  /** Only the concepts actually linked somewhere in this lesson (keyed by
   *  slug) — never the whole ~120-term glossary, so the client only ever
   *  gets the handful of definitions ui/ConceptTooltip.tsx can show here. */
  concepts: Record<string, ConceptSummary>;
};

export const BRACKET_LABELS: Record<Bracket, string> = {
  '0-1': '0-1 yrs',
  '1-3': '1-3 yrs',
  '3-7': '3-7 yrs',
  '7-10': '7-10 yrs',
};

export const BRACKET_ORDER: Bracket[] = ['0-1', '1-3', '3-7', '7-10'];
