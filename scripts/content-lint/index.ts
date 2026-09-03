/**
 * Runs the content rule pack over every lesson and manifest under
 * content/courses/ (the count is printed, never assumed).
 *
 *   npx tsx scripts/content-lint            # report, always exit 0
 *   npx tsx scripts/content-lint --strict   # exit 1 on any `error`-severity finding
 *
 * Every rule ships as `warn` and is promoted to `error` only once the corpus is
 * clean of it, so the gate never blocks on a backlog it did not create. Waive a
 * single file with content/_waivers.json — each waiver carries a reason, an
 * owner and an expiry, and an expired waiver is itself a finding.
 */
import fs from 'node:fs';

// Piping this report into `head` closes stdout early; without this the process
// dies with an unhandled EPIPE instead of just stopping.
process.stdout.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EPIPE') process.exit(0);
  throw error;
});
import path from 'node:path';
import { listCourseSlugs } from '../../modules/course_content/course_content.manifest';
import { loadCorpus, RULES, type Finding } from './rules';

const OUT_DIR = path.join(process.cwd(), 'content', '_reports');
const WAIVERS = path.join(process.cwd(), 'content', '_waivers.json');

type Waiver = { rule: string; target: string; reason: string; owner: string; expires: string };

const waivers: Waiver[] = fs.existsSync(WAIVERS)
  ? JSON.parse(fs.readFileSync(WAIVERS, 'utf-8')).waivers
  : [];

const corpus = loadCorpus();
const byCourse = new Map<string, typeof corpus>();
for (const file of corpus) byCourse.set(file.courseSlug, [...(byCourse.get(file.courseSlug) ?? []), file]);

const findings: Finding[] = [];
for (const rule of RULES) {
  if (rule.lesson) for (const file of corpus) findings.push(...rule.lesson(file));
  if (rule.course) for (const slug of listCourseSlugs()) findings.push(...rule.course(slug, byCourse.get(slug) ?? []));
}

const today = new Date().toISOString().slice(0, 10);
const expired = waivers.filter((w) => w.expires < today);
for (const w of expired) {
  findings.push({
    rule: 'waiver/expired',
    severity: 'error',
    target: w.target,
    message: `waiver for ${w.rule} expired ${w.expires} (owner: ${w.owner})`,
  });
}

const active = new Set(
  waivers.filter((w) => w.expires >= today).map((w) => `${w.rule}::${w.target}`)
);
const live = findings.filter((f) => !active.has(`${f.rule}::${f.target}`));

const byRule = new Map<string, Finding[]>();
for (const f of live) byRule.set(f.rule, [...(byRule.get(f.rule) ?? []), f]);

const ordered = [...byRule.entries()].sort((a, b) => b[1].length - a[1].length);

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(
  path.join(OUT_DIR, 'content-lint.json'),
  JSON.stringify(
    {
      generatedFrom: 'scripts/content-lint',
      lessons: corpus.length,
      totals: {
        findings: live.length,
        errors: live.filter((f) => f.severity === 'error').length,
        warnings: live.filter((f) => f.severity === 'warn').length,
        waived: findings.length - live.length,
      },
      byRule: Object.fromEntries(ordered.map(([rule, fs_]) => [rule, fs_.length])),
      findings: live,
    },
    null,
    2
  ) + '\n'
);

const md: string[] = [
  '# Content lint report',
  '',
  '`npx tsx scripts/content-lint` — generated file, do not edit by hand.',
  '',
  `${corpus.length} lessons · ${live.length} findings · ${findings.length - live.length} waived`,
  '',
  '| Rule | Findings | Severity | What it means |',
  '|---|---:|---|---|',
];
for (const [rule, list] of ordered) {
  const def = RULES.find((r) => r.id === rule);
  md.push(`| \`${rule}\` | ${list.length} | ${list[0].severity} | ${def?.description ?? ''} |`);
}
md.push('', '## Findings by rule', '');
for (const [rule, list] of ordered) {
  md.push(`### \`${rule}\` — ${list.length}`, '');
  const shown = list.slice(0, 40);
  for (const f of shown) md.push(`- ${f.target}${f.line ? `:${f.line}` : ''} — ${f.message}`);
  if (list.length > shown.length) md.push(`- …and ${list.length - shown.length} more (see content-lint.json)`);
  md.push('');
}
fs.writeFileSync(path.join(OUT_DIR, 'content-lint.md'), md.join('\n'));

console.log(`${corpus.length} lessons · ${live.length} findings (${live.filter((f) => f.severity === 'error').length} error, ${live.filter((f) => f.severity === 'warn').length} warn)`);
for (const [rule, list] of ordered) console.log(`  ${String(list.length).padStart(4)}  ${rule}`);
console.log('reports -> content/_reports/content-lint.{json,md}');

if (process.argv.includes('--strict') && live.some((f) => f.severity === 'error')) process.exit(1);
