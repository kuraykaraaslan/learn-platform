/**
 * Verifies the "Bugün" column of docs/phases/README.md's Ölçülen zemin table
 * against a fresh measurement of the corpus.
 *
 * Why this exists: that table's own instruction is "korpus değiştikçe yeniden
 * ölçün — tahmin etmeyin", and it had not been followed. It still reported 0
 * mermaid lessons when there were 17, and 1041 single-sentence Common Mistakes
 * items when P2's own status row three lines above said 141. A number in prose
 * has nothing checking it, so it rots quietly — the same failure class the
 * report drift guard now covers for content/_reports.
 *
 * The P0 baseline column is deliberately NOT checked. It is the ground the
 * phase specs were argued from and must never move.
 *
 *   npx tsx scripts/corpus-stats.ts          # print measured vs documented
 *   npx tsx scripts/corpus-stats.ts --check  # exit 1 on any disagreement
 */
import fs from 'node:fs';
import path from 'node:path';
import { listCourseSlugs, readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { listFences } from '../modules/course_content/course_content.fences';
import { splitLessonSections } from '../modules/course_content/course_content.parser';
import { parseMistakes } from '../modules/course_content/course_content.mistakes';
import { parseFenceMeta } from '../modules/course_content/course_content.fence-meta';
import { looksLikeDiff } from '../modules/course_content/course_content.diff';
import { COURSE_SECTIONS } from '../modules/course_content/course_content.sections';

const README = path.join(process.cwd(), 'docs', 'phases', 'README.md');
const checkMode = process.argv.includes('--check');

const lessons: { slug: string; file: string; raw: string }[] = [];
for (const slug of listCourseSlugs())
  for (const item of readCourseManifest(slug).items)
    lessons.push({ slug, file: item.file, raw: readLessonMarkdown(slug, item.file) });

const fences = listFences();
const byLesson = new Map<string, typeof fences>();
for (const f of fences) {
  const key = `${f.courseSlug}/${f.file}`;
  byLesson.set(key, [...(byLesson.get(key) ?? []), f]);
}

const TEMPLATE = new Set(['template', 'md', 'markdown', 'text', 'checklist', 'form']);
const CODEISH = new Set(['typescript', 'tsx', 'javascript', 'js', 'ts', 'java', 'sql', 'bash', 'json', 'jsonc', 'yaml', 'ini', 'hcl', 'dockerfile']);
const BOX = /^\s*- \[[ xX]\]/gm;

let sections = 0, noFence = 0, onlyCode = 0, onlyTemplate = 0, blockquote = 0;
let cmTotal = 0, cmSingle = 0, cmDrillable = 0, withDrillable = 0, boxItems = 0;
for (const l of lessons) {
  const s = splitLessonSections(l.raw).sections as Record<string, string>;
  sections += Object.values(s).filter((v) => v.trim() !== '').length;
  const fs_ = byLesson.get(`${l.slug}/${l.file}`) ?? [];
  if (fs_.length === 0) noFence++;
  else {
    const langs = new Set(fs_.map((f) => f.lang));
    if ([...langs].every((x) => CODEISH.has(x))) onlyCode++;
    if ([...langs].every((x) => TEMPLATE.has(x))) onlyTemplate++;
  }
  if (/^>/m.test(l.raw)) blockquote++;
  boxItems += (l.raw.match(BOX) ?? []).length;
  const m = parseMistakes(s.commonMistakes ?? '');
  cmTotal += m.length;
  const drillable = m.filter((x) => x.form !== 'single').length;
  cmSingle += m.filter((x) => x.form === 'single').length;
  cmDrillable += drillable;
  if (drillable >= 1) withDrillable++;
}

const lang = (l: string) => fences.filter((f) => f.lang === l).length;
const lessonsWith = (l: string) => new Set(fences.filter((f) => f.lang === l).map((f) => `${f.courseSlug}/${f.file}`)).size;
const boxFences = fences.filter((f) => (f.code.match(BOX) ?? []).length > 0).length;
const templateFences = lang('template');
const templateLessons = lessonsWith('template');
const pct = (n: number, d: number) => (Math.round((n / d) * 1000) / 10).toFixed(1).replace('.', ',');

/** Row label in the README -> the value the corpus actually has today. */
const measured: Record<string, string> = {
  'Ders / kurs / bölüm': `${lessons.length} / ${listCourseSlugs().length} / **${sections}**`,
  Fence: String(fences.length),
  "Yalnız kod fence'i olan ders": String(onlyCode),
  "Yalnız şablon fence'i olan ders": String(onlyTemplate),
  "Hiç fence'i olmayan ders": String(noFence),
  'TS/TSX/JS fence': String(fences.filter((f) => ['typescript', 'tsx', 'javascript'].includes(f.lang)).length),
  'Common Mistakes maddesi': String(cmTotal),
  "— drill'lenebilir": `**${cmDrillable} (%${pct(cmDrillable, cmTotal)})**`,
  "— tek cümlelik (P2'nin işi)": `**${cmSingle}**`,
  "≥1 drill'lenebilir maddesi olan ders": `**${withDrillable}** (sıfır: ${lessons.length - withDrillable})`,
  'Form fence / dosya': `${templateFences} / ${templateLessons}`,
  'Checklist fence / madde': `${boxFences} / ${boxItems}`,
  '`sql` fence': String(lang('sql')),
  '`java` fence': String(lang('java')),
  'Blockquote kullanan ders': String(blockquote),
  'Mermaid kullanan ders': String(lessonsWith('mermaid')),
};

// The widget table is the same kind of claim in the same file, and it had gone
// stale inside a single session: three sql fences were marked runnable after
// the table was written, so `run` read 25/17 against an actual 28/20. Keyed on
// the widget label, checking both columns.
const isRun = (f: (typeof fences)[number]) => parseFenceMeta(f.meta).run;
const countBy = (p: (f: (typeof fences)[number]) => boolean) => fences.filter(p).length;
const lessonsBy = (p: (f: (typeof fences)[number]) => boolean) =>
  new Set(fences.filter(p).map((f) => `${f.courseSlug}/${f.file}`)).size;

const widgets: Record<string, [string, string]> = {};
for (const w of ['quiz', 'recall', 'mermaid', 'tradeoff', 'calc', 'proof', 'spatial'])
  widgets[`\`${w}\``] = [String(lang(w)), String(lessonsWith(w))];
widgets['`run` (toplam)'] = [String(countBy(isRun)), String(lessonsBy(isRun))];
widgets['— `sql run`'] = [String(countBy((f) => isRun(f) && f.lang === 'sql')), ''];
widgets['— JS/TS `run`'] = [
  String(countBy((f) => isRun(f) && f.lang !== 'sql' && !parseFenceMeta(f.meta).project)),
  '',
];
widgets['— `run project`'] = [String(countBy((f) => isRun(f) && parseFenceMeta(f.meta).project)), ''];
widgets['`diff`'] = [String(countBy((f) => looksLikeDiff(f.code))), String(lessonsBy((f) => looksLikeDiff(f.code)))];

// The third measurement map, and the reason it is a table of its own rather
// than a column. `P0 zemini` measures 412 lessons; after P21 `Bugün` measures
// 491, and the gap between the two columns stops meaning "what the phases did
// to the existing corpus". A fourth cell cannot be added: a 4-column row
// splits into 6 cells, `cells.length !== 5` skips it, and every label in that
// table then reports MISSING. So the domain gets its own 3-column table, whose
// labels appear nowhere else in the file, with a `P13 zemini` column of zeroes
// that never moves.
//
// The slug set is DERIVED from the built-environment branch, never listed
// here — course_content.sections.ts stays the single source of truth for what
// the domain contains.
// Set<string>, not the inferred Set of the literal tuple's members — under
// `as const` a branch's `slugs` is a literal tuple, and the narrowed Set's
// `has` rejects a plain string. Same reason sectionForCourse() uses `.some()`.
const domainSlugs: Set<string> = new Set(
  COURSE_SECTIONS.find((section) => section.id === 'built-environment')?.slugs ?? []
);
const domainLessons = lessons.filter((l) => domainSlugs.has(l.slug));
const domainFences = fences.filter((f) => domainSlugs.has(f.courseSlug));

let domainMistakes = 0;
let domainDrillable = 0;
for (const l of domainLessons) {
  const s_ = splitLessonSections(l.raw).sections as Record<string, string>;
  const m = parseMistakes(s_.commonMistakes ?? '');
  domainMistakes += m.length;
  domainDrillable += m.filter((x) => x.form !== 'single').length;
}

const domain: Record<string, string> = {
  'Alan dersi / alan kursu': `${domainLessons.length} / ${domainSlugs.size}`,
  "Alan fence'i": String(domainFences.length),
  'Alan Common Mistakes maddesi': String(domainMistakes),
  "Alan — drill'lenebilir": String(domainDrillable),
};

const documented = new Map<string, string>();
const documentedWidgets = new Map<string, [string, string]>();
for (const line of fs.readFileSync(README, 'utf-8').split('\n')) {
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length !== 5) continue; // "", label, baseline, today, ""
  // A table's separator row (`|---|---:|---|`) is shaped like a data row and
  // is not a label — it recurs once per table by construction.
  if (/^:?-{3,}:?$/.test(cells[1])) continue;
  // Last-writer-wins was invisible while every label happened to be unique.
  // The domain table makes it reachable: a new row whose label collides with
  // an existing one would silently shadow the checked value, and the check
  // would then pass against the wrong number.
  if (documented.has(cells[1]))
    throw new Error(
      `docs/phases/README.md has two rows labelled "${cells[1]}" — the later one shadows the checked value`
    );
  documented.set(cells[1], cells[3]);
  documentedWidgets.set(cells[1], [cells[2], cells[3]]);
}

let bad = 0;
for (const [label, value] of Object.entries({ ...measured, ...domain })) {
  const doc = documented.get(label);
  if (doc === undefined) { console.error(`MISSING  "${label}" — no such row in the table`); bad++; continue; }
  if (doc !== value) { console.error(`STALE    "${label}"  documented ${doc}  ·  measured ${value}`); bad++; continue; }
  if (!checkMode) console.log(`ok       ${label.padEnd(38)} ${value}`);
}

for (const [label, [fenceCount, lessonCount]] of Object.entries(widgets)) {
  const doc = documentedWidgets.get(label);
  if (doc === undefined) { console.error(`MISSING  widget row "${label}"`); bad++; continue; }
  if (doc[0] !== fenceCount || doc[1] !== lessonCount) {
    console.error(`STALE    widget "${label}"  documented ${doc[0]}/${doc[1] || '-'}  ·  measured ${fenceCount}/${lessonCount || '-'}`);
    bad++;
    continue;
  }
  if (!checkMode) console.log(`ok       ${label.padEnd(38)} ${fenceCount}${lessonCount ? ' / ' + lessonCount : ''}`);
}

console.log(`\n${Object.keys(measured).length + Object.keys(domain).length + Object.keys(widgets).length} rows checked · ${bad} disagree`);
if (bad > 0) {
  console.error("docs/phases/README.md's Bugün column no longer matches the corpus. Update it — the P0 zemini column must not move.");
  process.exit(1);
}
