/**
 * The only writer of `verified` in a course manifest.json. A lesson is
 * eligible only when all three hold:
 *
 *   1. Zero error-severity content-lint findings for that file.
 *   2. Zero non-tolerated defects for that file in code-verification.json.
 *   3. The file is not on the T1.7 harm denylist below.
 *
 * Also writes content/_reports/verified-sha.json — a sha256 of each stamped
 * lesson's raw markdown, which the `verify/stale-stamp` lint rule compares
 * against on every run. Edit the file after stamping (even a typo fix) and
 * the stamp goes stale: the rule fails until stamp-verified.ts runs again.
 * A human hand-editing `"verified": true` into a manifest.json produces
 * exactly that same failure — there is no path to `verified` that skips
 * this script.
 *
 *   npx tsx scripts/stamp-verified.ts            # writes manifests + report
 *   npx tsx scripts/stamp-verified.ts --dry-run  # reports only, no writes
 */
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { loadCorpus, RULES } from './content-lint/rules';

const CONTENT_ROOT = path.join(process.cwd(), 'content', 'courses');
const REPORTS_DIR = path.join(process.cwd(), 'content', '_reports');
const CODE_VERIFICATION = path.join(REPORTS_DIR, 'code-verification.json');
const SHA_REPORT = path.join(REPORTS_DIR, 'verified-sha.json');

// docs/investigate/04-roadmap.md T1.7 — hand-fixed content pending an expert
// pass (2 of these need a lawyer, 1 needs an accountant). Never auto-stamped,
// no matter what the mechanical gates say — a drill inherits the correctness
// of the content it sits on, and a wrong mitigation drilled into a reader's
// memory is worse than one merely read.
const HARM_DENYLIST = new Set([
  'security/32_jwt_security_rs256_hs256_rotation.md',
  'security/33_ssrf_server_side_request_forgery.md',
  'security/34_timing_attack_constant_time_comparison.md',
  'distributed-systems-api-design/03_saga_pattern.md',
  'distributed-systems-api-design/07_idempotency_key_pattern.md',
  'database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md',
  'database-advanced/43_zero_downtime_database_migration.md',
  'framework-deep-dives/410_springboot_jpa_entities_and_n_plus_one.md',
  'observability-deployment/53_opentelemetry.md',
  'contracts-pricing-legal/216_payment_gates_and_milestone_enforcement.md',
  'contracts-pricing-legal/230_contractor_classification.md',
  'business-finance-solo-ops/319_tax_and_accounting_readiness.md',
  'open-source-community/98_writing_stack_overflow_answers.md',
  'open-source-community/100_creating_reference_resource.md',
  'career-entrepreneurship/114_niche_positioning.md',
  'process-soft-skills/85_technical_blog_conference_talk.md',
  // P17: device identity, provisioning, rotation and revocation are security
  // mitigations. docs/phases/17-iot-telemetry-edge.md puts this lesson here
  // by design rather than by triage — it carries no quiz and no recall, and
  // the denylist is what mechanically keeps it that way.
  'iot-telemetry-edge/478_device_identity_and_provisioning.md',
  // P21: two lessons written and published but never auto-stamped, for the
  // same reason as 478 — a wrong drill is worse than a lesson merely read.
  // docs/phases/21-smart-infrastructure.md places both here by design.
  //   514 — OT/IT segregation is a security mitigation: a wrong segregation
  //         recommendation causes harm on an industrial network that a reader
  //         cannot verify alone.
  //   521 — licence, redaction and data-sharing is legal content, the
  //         roadmap's "never ships to production" class.
  // Both carry no quiz and no recall; an expert pass can remove them later.
  'smart-infrastructure/514_ot_and_it_protocol_boundaries.md',
  'smart-infrastructure/521_sharing_data_without_losing_control.md',
]);

function sha(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex').slice(0, 16);
}

const dryRun = process.argv.includes('--dry-run');

const corpus = loadCorpus();

const lintErrorTargets = new Set<string>();
for (const rule of RULES) {
  // verify/stale-stamp fires exactly when a verified lesson's content has
  // changed since it was last stamped — i.e. exactly the lessons this script
  // exists to re-stamp. Counting it as a lint error here would make it
  // permanently un-fixable: newly-stale is indistinguishable from
  // ineligible, and re-running this script (its own documented fix) could
  // never clear it.
  if (rule.id === 'verify/stale-stamp') continue;
  if (!rule.lesson) continue;
  for (const file of corpus) {
    for (const finding of rule.lesson(file)) {
      if (finding.severity === 'error') lintErrorTargets.add(finding.target);
    }
  }
}

const codeVerification = fs.existsSync(CODE_VERIFICATION)
  ? (JSON.parse(fs.readFileSync(CODE_VERIFICATION, 'utf-8')) as { lessons: { lesson: string }[] })
  : null;
if (!codeVerification) {
  console.error('content/_reports/code-verification.json missing — run `npm run content:verify-code` first.');
  process.exit(1);
}
const codeFailingTargets = new Set(codeVerification.lessons.map((l) => l.lesson));

const shaReport: Record<string, string> = fs.existsSync(SHA_REPORT)
  ? JSON.parse(fs.readFileSync(SHA_REPORT, 'utf-8'))
  : {};

let stamped = 0;
let restamped = 0;
let unchanged = 0;
let blocked = 0;

for (const courseSlug of listCourseSlugs()) {
  const manifest = readCourseManifest(courseSlug);
  let changed = false;

  for (const item of manifest.items) {
    const target = `${courseSlug}/${item.file}`;

    // Every lesson is re-evaluated on every run, verified or not — otherwise
    // `if (item.verified) continue` (the previous behavior) makes the
    // doc-comment's promise above ("edit the file, re-run this script")
    // false: a stamp can go stale from a content edit, but an
    // already-`verified: true` item would never have its sha refreshed.
    const eligible =
      !lintErrorTargets.has(target) && !codeFailingTargets.has(target) && !HARM_DENYLIST.has(target);
    if (!eligible) {
      blocked++;
      continue;
    }

    const body = readLessonMarkdown(courseSlug, item.file);
    const newSha = sha(body);
    const staleOrMissing = shaReport[target] !== newSha;

    if (!item.verified) {
      shaReport[target] = newSha;
      if (!dryRun) {
        (item as { verified?: boolean }).verified = true;
        changed = true;
      }
      stamped++;
    } else if (staleOrMissing) {
      shaReport[target] = newSha;
      restamped++;
    } else {
      unchanged++;
    }
  }

  if (changed && !dryRun) {
    const manifestPath = path.join(CONTENT_ROOT, courseSlug, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  }
}

if (!dryRun) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  fs.writeFileSync(SHA_REPORT, JSON.stringify(shaReport, null, 2) + '\n');
}

console.log(
  `${dryRun ? '[dry run] ' : ''}stamped: ${stamped}  restamped: ${restamped}  unchanged: ${unchanged}  blocked: ${blocked}  (denylist: ${HARM_DENYLIST.size})`
);
