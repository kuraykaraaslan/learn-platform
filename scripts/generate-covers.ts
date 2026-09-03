/**
 * Generates one cover image per course into public/covers/<slug>.webp, using
 * OpenAI's image API (gpt-image-1). Covers render on the home-page course
 * cards (modules/course_content/ui/CourseCatalog.tsx).
 *
 * The card falls back to a gradient + initials when a cover file is missing,
 * so this script is optional to run and safe to run partially.
 *
 *   npx tsx scripts/generate-covers.ts                 # all missing covers
 *   npx tsx scripts/generate-covers.ts --only security # just one
 *   npx tsx scripts/generate-covers.ts --force         # regenerate all
 *   npx tsx scripts/generate-covers.ts --quality high  # low|medium|high (default medium)
 *
 * Needs OPENAI_API_KEY (read from .env.local or the environment).
 */
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest } from '../modules/course_content/course_content.manifest';

const OUT_DIR = path.join(process.cwd(), 'public', 'covers');
const ENDPOINT = 'https://api.openai.com/v1/images/generations';

// One shared art direction so the 23 covers read as a set, not 23 unrelated
// pictures. Deliberately abstract — no text, no faces, no UI screenshots.
const ART_DIRECTION =
  'Minimalist editorial tech illustration for a course thumbnail. Flat geometric vector shapes, ' +
  'clean composition with generous negative space, subtle paper grain, soft diagonal gradient ' +
  'background. Restrained palette: deep blue (#2563eb), slate grey, and warm off-white, with one ' +
  'muted accent. Calm and modern, not busy. Absolutely no text, no letters, no numbers, no logos, ' +
  'no watermarks, no human faces, no code screenshots. Subject: ';

// Per-course subject — the concrete thing the illustration should depict.
const SUBJECTS: Record<string, string> = {
  'fundamentals-tools': 'a neat toolbox of primitive shapes — a wrench, a terminal prompt, a branching git graph',
  'algorithms-concurrency': 'interlocking gears and parallel light trails weaving through a sorted lattice',
  'architecture-design-patterns-testing': 'an architect\'s blueprint of stacked modular blocks with connecting lines',
  'database-advanced': 'a cutaway of layered database cylinders showing internal index trees',
  'database-caching-performance': 'a fast lane of cache tiers with data flowing through a speed gate',
  'distributed-systems-api-design': 'a constellation of connected server nodes exchanging message tokens',
  'framework-deep-dives': 'an exploded diagram of a framework\'s layers peeling apart like an onion',
  'frontend-performance-scaling': 'a browser window with a performance waterfall and a rising throughput curve',
  'ai-llm-engineering': 'an abstract neural lattice feeding a prompt pipeline into a glowing token stream',
  security: 'a layered shield over a lock and a probing key, defensive posture',
  'privacy-compliance-incident-response': 'a redacted document and a checklist under a protective dome',
  'observability-deployment': 'a control panel of dashboards, traces, and a deployment pipeline',
  'advanced-deep-dive-topics': 'a deep well of stacked technical strata lit from below',
  'career-entrepreneurship': 'a branching path of stepping stones climbing toward a distant flag',
  'client-acquisition-sales': 'a funnel of geometric shapes converging into a handshake motif',
  'contracts-pricing-legal': 'a signed document, a fountain pen, and a balanced scale',
  'client-delivery-pm-handover': 'a Gantt-style timeline of milestone markers handing off a package',
  'product-technical-strategy': 'a chessboard horizon with a roadmap arrow and a north-star point',
  'process-soft-skills': 'two speech bubbles and a feedback loop arrow around a small team of shapes',
  'business-finance-solo-ops': 'a cash-flow chart, a runway strip, and stacked coin columns',
  'saas-business-skills': 'a recurring-revenue staircase with a subscription cycle arrow',
  'content-seo-personal-brand': 'a magnet drawing readers toward a rising article and a search bar',
  'open-source-community': 'a network of contributors around a shared repository star',
  'bim-ifc-data-models': 'a wireframe building section unfolding into a nested tree of labelled data nodes',
  'gis-spatial-data': 'a graticule of meridians peeling off a globe and flattening into a grid of map tiles',
  'autodesk-developer-platform': 'a desktop drafting window, a headless job crate, and a cloud endpoint linked by one pipeline',
  'iot-telemetry-edge': 'a small sensor node emitting concentric signal arcs toward a gateway and a stack of stored readings',
};

type Quality = 'low' | 'medium' | 'high';

function parseArgs() {
  const args = process.argv.slice(2);
  const only = args.includes('--only') ? args[args.indexOf('--only') + 1] : null;
  const force = args.includes('--force');
  const quality = (args.includes('--quality')
    ? args[args.indexOf('--quality') + 1]
    : 'medium') as Quality;
  return { only, force, quality };
}

/** Minimal .env.local reader — no dotenv dependency for a one-off script. */
function loadApiKey(): string {
  if (process.env.OPENAI_API_KEY) return process.env.OPENAI_API_KEY;
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(/^\s*OPENAI_API_KEY\s*=\s*(.+?)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error('OPENAI_API_KEY not found in environment or .env.local');
}

async function generateOne(slug: string, title: string, apiKey: string, quality: Quality) {
  const subject = SUBJECTS[slug];
  if (!subject) throw new Error(`No cover subject defined for "${slug}" in scripts/generate-covers.ts`);

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: `${ART_DIRECTION}${subject}. (Course: "${title}".)`,
      n: 1,
      size: '1536x1024',
      quality,
      output_format: 'webp',
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  }

  const json = (await res.json()) as { data: { b64_json: string }[] };
  const b64 = json.data[0]?.b64_json;
  if (!b64) throw new Error(`No image data returned for "${slug}"`);

  const full = Buffer.from(b64, 'base64');
  const outFile = path.join(OUT_DIR, `${slug}.webp`);

  // The card renders these at ~400px wide; 1536px raw is ~1.5 MB each. Downscale
  // with sharp (a transitive dep) so 23 covers stay well under a few MB total.
  try {
    const sharp = (await import('sharp')).default;
    await sharp(full).resize(900, null, { withoutEnlargement: true }).webp({ quality: 78 }).toFile(outFile);
  } catch {
    fs.writeFileSync(outFile, full); // sharp unavailable — keep the full-size file
  }
}

async function main() {
  const { only, force, quality } = parseArgs();
  const apiKey = loadApiKey();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const slugs = only ? [only] : listCourseSlugs();
  let made = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const outFile = path.join(OUT_DIR, `${slug}.webp`);
    if (!force && fs.existsSync(outFile)) {
      skipped++;
      continue;
    }
    const manifest = readCourseManifest(slug);
    process.stdout.write(`  ${slug} … `);
    try {
      await generateOne(slug, manifest.title, apiKey, quality);
      made++;
      console.log('done');
    } catch (err) {
      console.log('FAILED');
      console.error(err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n${made} generated, ${skipped} already present (${quality} quality).`);
}

main();
