// The catalog's two-track split for the home page (app/(frontend)/page.tsx).
//
// There is no `section` key in the course manifests — the split lives here, in
// one reviewable file, rather than spread across 23 manifest.json files. The
// order inside each track is a *reading* order (fundamentals first), the same
// spirit as the authored-id order the sidebar uses within a course.
//
// course_content.sections.test.ts asserts every course under content/courses/
// appears in exactly one track — so adding a 24th course fails the build until
// it is classified here, instead of silently vanishing from the home page.

export type CourseSectionId = 'engineering' | 'business';

export type CourseSectionDef = {
  id: CourseSectionId;
  title: string;
  blurb: string;
  /** Course slugs, in the order they should appear under this track. */
  slugs: string[];
};

export const COURSE_SECTIONS: CourseSectionDef[] = [
  {
    id: 'engineering',
    title: 'Engineering craft',
    blurb: 'From the fundamentals every later lesson assumes, up to the systems work that separates a senior engineer.',
    slugs: [
      'fundamentals-tools',
      'algorithms-concurrency',
      'architecture-design-patterns-testing',
      'database-advanced',
      'database-caching-performance',
      'distributed-systems-api-design',
      'framework-deep-dives',
      'frontend-performance-scaling',
      'ai-llm-engineering',
      'security',
      'privacy-compliance-incident-response',
      'observability-deployment',
      'advanced-deep-dive-topics',
    ],
  },
  {
    id: 'business',
    title: 'The software business',
    blurb: 'Turning that craft into paid work: finding clients, pricing it, shipping it, and running the operation.',
    slugs: [
      'career-entrepreneurship',
      'client-acquisition-sales',
      'contracts-pricing-legal',
      'client-delivery-pm-handover',
      'product-technical-strategy',
      'process-soft-skills',
      'business-finance-solo-ops',
      'saas-business-skills',
      'content-seo-personal-brand',
      'open-source-community',
    ],
  },
];

/** slug -> which track it belongs to (or null if unclassified). */
export function sectionForCourse(slug: string): CourseSectionId | null {
  for (const section of COURSE_SECTIONS) {
    if (section.slugs.includes(slug)) return section.id;
  }
  return null;
}
