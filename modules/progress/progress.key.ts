/** Stable browser-progress key for one lesson. Safe to import on the server. */
export function lessonProgressKey(courseSlug: string, lessonSlug: string): string {
  return `${courseSlug}/${lessonSlug}`;
}
