import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { CourseManifest } from './course_content.types';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');

// `.strict()` on both schemas is deliberate. A plain z.object SILENTLY DROPS
// unknown keys, so a manifest key added by hand (or a typo in an existing one)
// disappears between the file and the app with no error anywhere — which made
// every manifest-driven feature impossible to land safely. Anything new must be
// declared here first; a key that is not declared is now a loud parse failure.
const ManifestItemSchema = z
  .object({
    id: z.number(),
    file: z.string(),
    title: z.string(),
    bracket: z.enum(['0-1', '1-3', '3-7', '7-10']),
    category: z.string(),
    /** Minutes to read. Optional until measured for every lesson. */
    minutes: z.number().int().positive().optional(),
    /** Lesson ids (globally unique across all courses) this lesson assumes. */
    prereqs: z.array(z.number()).optional(),
  })
  .strict();

const CourseManifestSchema = z
  .object({
    slug: z.string(),
    title: z.string(),
    description: z.string(),
    items: z.array(ManifestItemSchema),
  })
  .strict();

/** Every course slug currently present under content/courses/. */
export function listCourseSlugs(): string[] {
  if (!fs.existsSync(CONTENT_ROOT)) return [];
  return fs
    .readdirSync(CONTENT_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

/** Reads and Zod-validates one course's manifest.json. Throws if missing/invalid. */
export function readCourseManifest(courseSlug: string): CourseManifest {
  const manifestPath = path.join(CONTENT_ROOT, courseSlug, 'manifest.json');
  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  return CourseManifestSchema.parse(raw);
}

export function readLessonMarkdown(courseSlug: string, file: string): string {
  const filePath = path.join(CONTENT_ROOT, courseSlug, file);
  return fs.readFileSync(filePath, 'utf-8');
}
