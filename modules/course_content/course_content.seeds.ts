import fs from 'node:fs';
import path from 'node:path';

const SEEDS_DIR = path.join(process.cwd(), 'content', '_runtime', 'seeds');

// docs/phases/10-pglite-sql.md's own hard cap — the seed is inlined into
// every static page that references it (course_content.service.ts reads it
// at build time), so an oversized seed isn't a runtime slowdown, it's extra
// bytes baked into 412 lessons' worth of static HTML. Breaking the build is
// the point: there's no soft-fail path where an oversized seed just ships
// quietly.
export const MAX_SEED_BYTES = 50 * 1024;

/**
 * Reads `content/_runtime/seeds/<name>.sql`. Called from server-rendered
 * lesson pages at build time (`next build`'s static generation), so a thrown
 * error here is a build failure, not a runtime one — the enforcement
 * mechanism docs/phases/10-pglite-sql.md calls for ("aşan build'i kırıyor").
 */
export function loadSeed(name: string): string {
  const filePath = path.join(SEEDS_DIR, `${name}.sql`);
  if (!fs.existsSync(filePath)) {
    throw new Error(`content/_runtime/seeds/${name}.sql does not exist (referenced by a \`seed=${name}\` fence).`);
  }
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_SEED_BYTES) {
    throw new Error(
      `content/_runtime/seeds/${name}.sql is ${stat.size} bytes, over the ${MAX_SEED_BYTES}-byte cap. ` +
        `Use generate_series() to build large tables from a small script instead of listing rows literally.`
    );
  }
  return fs.readFileSync(filePath, 'utf-8');
}
