import type { LessonBlock } from './course_content.blocks';
import type { LessonMistake } from './course_content.mistakes';
import type { ConceptSummary } from './course_content.concepts';

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
