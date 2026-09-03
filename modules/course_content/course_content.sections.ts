// The catalog's branch split for the home page (app/(frontend)/page.tsx).
//
// There is no `section` key in the course manifests — the split lives here, in
// one reviewable file, rather than spread across the course manifest.json
// files. The order inside each branch is a *reading* order (fundamentals
// first), the same spirit as the authored-id order the sidebar uses within a
// course.
//
// course_content.sections.test.ts asserts every course under content/courses/
// appears in exactly one branch — so adding a course fails the build until it
// is classified here, instead of silently vanishing from the home page.
//
// How many branches there are is not this file's claim to make: COURSE_SECTIONS
// below is the single source of truth and CourseSectionId is derived from it.
// Adding a branch is one object literal.

export type CourseSectionDef = {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** Course slugs, in the order they should appear under this branch. */
  readonly slugs: readonly string[];
};

export const COURSE_SECTIONS = [
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
  {
    id: 'built-environment',
    title: 'The built environment',
    blurb:
      "Software for physical assets: model formats, coordinates, telemetry, and keeping an asset's data true after handover.",
    slugs: ['bim-ifc-data-models', 'gis-spatial-data', 'autodesk-developer-platform', 'iot-telemetry-edge'],
  },
] as const satisfies readonly CourseSectionDef[];

/** Derived from the data, not maintained beside it. Adding a branch is one
 *  object literal above — this union follows on its own. */
export type CourseSectionId = (typeof COURSE_SECTIONS)[number]['id'];

export const COURSE_SECTION_IDS: readonly CourseSectionId[] = COURSE_SECTIONS.map((s) => s.id);

/** slug -> which branch it belongs to (or null if unclassified). */
export function sectionForCourse(slug: string): CourseSectionId | null {
  for (const section of COURSE_SECTIONS) {
    // .some(), not .includes(): under `as const` each `slugs` is a literal
    // tuple, and a literal tuple's `includes` narrows its own parameter to the
    // union of its members — it rejects a plain `string` (TS2345). The
    // alternative was a cast, which would defeat the point of deriving the
    // type from the data at all.
    if (section.slugs.some((s) => s === slug)) return section.id;
  }
  return null;
}
