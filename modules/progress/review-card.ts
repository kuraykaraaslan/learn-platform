// Pure type, no side effects — both scripts/build-review-index.ts (which
// has top-level fs/zlib calls that must never reach a client bundle) and
// ui/ReviewQueue.tsx import this instead of the script itself. A `import
// type` from a script file can be trusted to get erased at compile time,
// but relying on that erasure for a module with real side effects is
// exactly the fragile pattern that broke `next build` once already this
// session (course_content.seeds.ts's loadSeed(), reachable from a client
// bundle through one non-type-only import) — cheaper to just not have the
// dependency at all.
export type ReviewCard = {
  key: string;
  courseSlug: string;
  lessonSlug: string;
  lessonTitle: string;
  lead: string;
  bodyHtml: string;
};
