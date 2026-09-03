// Cross-course reading orders for the home page (docs/phases/23-developer-paths.md).
//
// A PATH is not a BRANCH. A branch (course_content.sections.ts) is a catalog
// grouping: every course sits in exactly one, and together they cover the
// catalog. A path is a curated reading order that crosses courses — one lesson
// can appear in several paths or in none, and a lesson appearing in no path is
// not a defect. The moment a path lists everything it stops being curation.
//
// The steps are a hand-written, hand-ordered list of lesson ids. They are
// deliberately NOT derived from a `prereqs`/`teaches`/`unlocks` graph: the
// roadmap's T2.5 note is that such a graph "needs 412 judgements and a model
// will happily invent them". A short authored list is cheap, auditable and
// honest; a 505-lesson dependency graph is not. The `prereqs?` manifest field
// stays unused, here as everywhere.
//
// Reading order is NOT required to be ascending lesson id: a path may point
// backward on purpose (the digital-twin path reads #443's datums before #484's
// georeferencing, which has a higher id).
//
// course_content.paths.test.ts enforces the invariants: 8-16 steps, at least
// two distinct courses per path, unique ids within a path, kebab-case path
// ids, and every step resolving to a real lesson.

export type DeveloperPathDef = {
  readonly id: string;
  readonly title: string;
  readonly blurb: string;
  /** Lesson ids in reading order. Globally unique, so no course qualifier. */
  readonly steps: readonly number[];
};

export const DEVELOPER_PATHS = [
  {
    id: 'bim-developer',
    title: 'BIM Developer Path',
    blurb:
      'Read an IFC model as data, query and diff it, drive Revit from code, and keep an element’s identity alive across a re-export.',
    steps: [431, 432, 433, 434, 435, 436, 437, 439, 440, 455, 456, 459, 460, 490],
  },
  {
    id: 'gis-developer',
    title: 'GIS Developer Path',
    blurb:
      'Coordinates that are not numbers, geometry that passes every schema check and is still wrong, spatial SQL, and tiles that come out mirrored — plus where a phone’s coordinates and a model’s coordinates meet.',
    steps: [441, 442, 443, 445, 446, 447, 448, 449, 484, 499, 450, 516],
  },
  {
    id: 'iot-engineer',
    title: 'IoT Engineer Path',
    blurb:
      'The device-to-database path and everywhere a reading is lost on it: three clocks, idempotent ingest, store-and-forward, a time-series schema, downsampling that does not lie, and ordering events across systems that do not share a clock.',
    steps: [469, 470, 471, 474, 475, 476, 477, 481, 482, 487, 488, 518, 519],
  },
  {
    id: 'digital-twin',
    title: 'Digital Twin Path',
    blurb:
      'A twin is a model, a state and a history joined by a binding. This path assembles it from six courses: the spatial structure, the coordinate worlds, the ingest path, the whole twin, the handover that populates it, and the identity resolution that keeps five systems agreeing on one asset.',
    steps: [434, 443, 475, 483, 484, 485, 486, 487, 488, 489, 490, 491, 492, 511, 515, 493],
  },
] as const satisfies readonly DeveloperPathDef[];

/** Derived from the data, not maintained beside it — same as CourseSectionId. */
export type DeveloperPathId = (typeof DEVELOPER_PATHS)[number]['id'];

export const DEVELOPER_PATH_IDS: readonly DeveloperPathId[] = DEVELOPER_PATHS.map((p) => p.id);

/**
 * Every path a given lesson id appears in, in the declared path order. Empty
 * array when the lesson is in no path — which is expected, not a gap.
 * Pure, resolved at build time (the lesson-page badge is a server component).
 */
export function pathsForLesson(lessonId: number): DeveloperPathDef[] {
  // .some(), not .includes(): under `as const` each `steps` is a literal tuple
  // and its `includes` narrows the argument to the union of its own members,
  // rejecting a plain `number`. Same reason sectionForCourse() uses `.some()`.
  return DEVELOPER_PATHS.filter((path) => path.steps.some((s) => s === lessonId));
}
