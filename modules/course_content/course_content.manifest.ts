import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import type { CourseManifest } from './course_content.types';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');

const ManifestItemSchema = z.object({
  id: z.number(),
  file: z.string(),
  title: z.string(),
  bracket: z.enum(['0-1', '1-3', '3-7', '7-10']),
  category: z.string(),
});

const CourseManifestSchema = z.object({
  slug: z.string(),
  title: z.string(),
  description: z.string(),
  items: z.array(ManifestItemSchema),
});

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
