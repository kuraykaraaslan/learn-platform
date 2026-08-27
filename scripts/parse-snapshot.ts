/**
 * Regenerates content/_reports/parse-snapshot.json — a SHA-256 per rendered
 * lesson section across the whole corpus.
 *
 * This is the safety net for every bulk edit: mechanical passes over 412 files
 * (frontmatter, voice fixes, link rewrites) must leave the rendered HTML
 * byte-identical, and the snapshot is what proves it. Regenerate ONLY when a
 * render change is intended, and say so in the commit.
 *
 *   npx tsx scripts/parse-snapshot.ts
 */
import fs from 'node:fs';
import path from 'node:path';
import { buildParseSnapshot } from '../modules/course_content/course_content.snapshot';

const OUT = path.join(process.cwd(), 'content', '_reports', 'parse-snapshot.json');

const snapshot = buildParseSnapshot();
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(snapshot, null, 2) + '\n');

console.log(`wrote ${OUT}`);
console.log(`  courses: ${Object.keys(snapshot.courses).length}`);
console.log(`  lessons: ${snapshot.lessonCount}`);
