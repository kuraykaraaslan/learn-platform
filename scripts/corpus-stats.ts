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

const documented = new Map<string, string>();
for (const line of fs.readFileSync(README, 'utf-8').split('\n')) {
  const cells = line.split('|').map((c) => c.trim());
  if (cells.length !== 5) continue; // "", label, baseline, today, ""
  documented.set(cells[1], cells[3]);
}

let bad = 0;
for (const [label, value] of Object.entries(measured)) {
  const doc = documented.get(label);
  if (doc === undefined) { console.error(`MISSING  "${label}" — no such row in the table`); bad++; continue; }
  if (doc !== value) { console.error(`STALE    "${label}"  documented ${doc}  ·  measured ${value}`); bad++; continue; }
  if (!checkMode) console.log(`ok       ${label.padEnd(38)} ${value}`);
}

console.log(`\n${Object.keys(measured).length} rows checked · ${bad} disagree`);
if (bad > 0) {
  console.error("docs/phases/README.md's Bugün column no longer matches the corpus. Update it — the P0 zemini column must not move.");
  process.exit(1);
}
