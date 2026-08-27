export type Bracket = '0-1' | '1-3' | '3-7' | '7-10';

export type ManifestItem = {
  id: number;
  file: string;
  title: string;
  bracket: Bracket;
  category: string;
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
  sections: LessonSections;
};

export const BRACKET_LABELS: Record<Bracket, string> = {
  '0-1': '0-1 yrs',
  '1-3': '1-3 yrs',
  '3-7': '3-7 yrs',
  '7-10': '7-10 yrs',
};

export const BRACKET_ORDER: Bracket[] = ['0-1', '1-3', '3-7', '7-10'];
