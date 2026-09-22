/**
 * Generates a two-host (female + male) audio podcast for one or more
 * lessons: OpenAI writes the dialogue script from the lesson's own markdown,
 * ElevenLabs voices each line, and the turns are stitched into one mp3.
 *
 * Output (both checked in like public/covers/, per the same "safe to run
 * partially" convention):
 *   public/podcasts/<courseSlug>/<lessonSlug>.mp3   — the stitched episode
 *   public/podcasts/<courseSlug>/<lessonSlug>.json  — transcript + metadata
 *
 * LessonPodcastPlayer.tsx only renders when the .mp3 exists (checked in
 * course_content.service.ts's getLessonPodcast), so this is opt-in per
 * lesson — running it for zero or two lessons changes nothing else.
 *
 *   npx tsx scripts/generate-lesson-podcast.ts <courseSlug>/<lessonSlug> [...]
 *   npx tsx scripts/generate-lesson-podcast.ts --force algorithms-concurrency/concurrency-async-fundamentals
 *   npx tsx scripts/generate-lesson-podcast.ts --model gpt-4o --tts-model eleven_turbo_v2_5 ...
 *
 * Needs OPENAI_API_KEY and ELEVENLABS_API_KEY (read from .env.local or the
 * environment — see loadApiKey, copied from scripts/generate-covers.ts).
 * Costs real credits on both APIs: one chat completion + one TTS call per
 * dialogue turn (~16-24 turns/lesson), so this is meant to be run per lesson
 * on purpose, not swept across the whole corpus.
 */
import fs from 'node:fs';
import path from 'node:path';
import { readCourseManifest, readLessonMarkdown } from '../modules/course_content/course_content.manifest';
import { splitLessonSections } from '../modules/course_content/course_content.parser';

const OUT_ROOT = path.join(process.cwd(), 'public', 'podcasts');
const CHAT_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const VOICES_ENDPOINT = 'https://api.elevenlabs.io/v1/voices';
const TTS_ENDPOINT = (voiceId: string) => `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

type Speaker = 'host_a' | 'host_b'; // host_a is the female voice, host_b the male one
type Turn = { speaker: Speaker; text: string };

/** "029_owasp_top_10.md" -> "owasp-top-10" — same mapping the app itself
 *  uses (course_content.service.ts etc.), duplicated per that file's own
 *  convention rather than importing the @kui-dependent service module here. */
function fileToLessonSlug(file: string): string {
  return file
    .replace(/\.md$/, '')
    .replace(/^\d+_/, '')
    .replace(/_/g, '-');
}

/** Minimal .env.local reader — no dotenv dependency for a one-off script.
 *  Copied from scripts/generate-covers.ts, generalized to any key name. */
function loadApiKey(name: string): string {
  if (process.env[name]) return process.env[name]!;
  const envPath = path.join(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
      const m = line.match(new RegExp(`^\\s*${name}\\s*=\\s*(.+?)\\s*$`));
      if (m) return m[1].replace(/^["']|["']$/g, '');
    }
  }
  throw new Error(`${name} not found in environment or .env.local`);
}

function parseArgs() {
  const args = process.argv.slice(2);
  const flag = (name: string) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);
  const force = args.includes('--force');
  const model = flag('--model') ?? 'gpt-4o-mini';
  const ttsModel = flag('--tts-model') ?? 'eleven_multilingual_v2';
  const voiceFemale = flag('--voice-female');
  const voiceMale = flag('--voice-male');
  const pairs = args.filter((a) => !a.startsWith('--') && a.includes('/'));
  return { pairs, force, model, ttsModel, voiceFemale, voiceMale };
}

/** Strips fenced code blocks (quiz/YAML/code fences) — a podcast script
 *  should talk *about* the example, not read a code block aloud. */
function stripFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '').trim();
}

function buildLessonBrief(title: string, sections: ReturnType<typeof splitLessonSections>['sections']): string {
  const parts: [string, string][] = [
    ['What It Is', stripFences(sections.whatItIs)],
    ['Key Concepts', stripFences(sections.keyConcepts)],
    ['When to Use', stripFences(sections.whenToUse)],
    ['Common Mistakes', stripFences(sections.commonMistakes)],
  ];
  return [`# ${title}`, ...parts.filter(([, body]) => body.length > 0).map(([heading, body]) => `## ${heading}\n${body}`)].join(
    '\n\n'
  );
}

async function writeDialogueScript(
  apiKey: string,
  model: string,
  lessonTitle: string,
  brief: string
): Promise<Turn[]> {
  const system =
    'You write scripts for a friendly, knowledgeable two-host tech podcast that teaches one lesson from a ' +
    'software engineering course to a junior-to-mid developer audience. Base everything strictly on the ' +
    "lesson material you're given — never invent facts, numbers, or examples it doesn't support. Sound like " +
    'two colleagues talking, not two people reading a textbook aloud: contractions, the occasional aside, one ' +
    'host asking the other a real question. No stage directions, no sound effects, no bullet points spoken ' +
    'verbatim. Cover, in this rough order: what the concept is and why it matters, the key ideas, when you\'d ' +
    'actually reach for it, and the most common mistake engineers make with it — then a short sign-off. Aim ' +
    'for 18-24 short turns, alternating speakers, totalling roughly 900-1300 words.\n\n' +
    'Respond with ONLY a JSON object of the exact shape ' +
    '{"turns": [{"speaker": "host_a" | "host_b", "text": "..."}]} — host_a is the female host, host_b is the ' +
    'male host. No markdown, no keys other than "turns", no commentary outside the JSON.';

  const res = await fetch(CHAT_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.8,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: `Lesson: "${lessonTitle}"\n\n${brief}` },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as { choices: { message: { content: string } }[] };
  const content = json.choices[0]?.message?.content;
  if (!content) throw new Error('OpenAI returned no message content');

  let parsed: { turns?: Turn[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error(`OpenAI response was not valid JSON:\n${content}`);
  }
  if (!Array.isArray(parsed.turns) || parsed.turns.length === 0) {
    throw new Error(`OpenAI response had no "turns" array:\n${content}`);
  }
  return parsed.turns;
}

type ElevenVoice = { voice_id: string; name: string; category?: string; labels?: Record<string, string> };

/** Picks a female and a male voice from the account's own voice library
 *  instead of hardcoding voice IDs, which may not exist (or may be renamed)
 *  on every ElevenLabs account/key. --voice-female/--voice-male override. */
async function resolveVoices(
  apiKey: string,
  overrideFemale?: string,
  overrideMale?: string
): Promise<{ female: string; male: string }> {
  if (overrideFemale && overrideMale) return { female: overrideFemale, male: overrideMale };

  const res = await fetch(VOICES_ENDPOINT, { headers: { 'xi-api-key': apiKey } });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  const json = (await res.json()) as { voices: ElevenVoice[] };
  const voices = json.voices ?? [];
  if (voices.length === 0) throw new Error('ElevenLabs account has no voices available');

  const byGender = (g: string) =>
    voices.find((v) => v.labels?.gender === g && v.category === 'premade') ??
    voices.find((v) => v.labels?.gender === g);

  const female = overrideFemale ?? byGender('female')?.voice_id ?? voices[0].voice_id;
  const male = overrideMale ?? byGender('male')?.voice_id ?? voices.find((v) => v.voice_id !== female)?.voice_id ?? voices[0].voice_id;
  return { female, male };
}

async function synthesizeTurn(apiKey: string, voiceId: string, ttsModel: string, text: string): Promise<Buffer> {
  const res = await fetch(TTS_ENDPOINT(voiceId), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg', 'xi-api-key': apiKey },
    body: JSON.stringify({
      text,
      model_id: ttsModel,
      voice_settings: { stability: 0.4, similarity_boost: 0.8 },
    }),
  });
  if (!res.ok) throw new Error(`ElevenLabs TTS ${res.status}: ${await res.text()}`);
  return Buffer.from(await res.arrayBuffer());
}

async function generateOne(
  courseSlug: string,
  lessonSlug: string,
  opts: { model: string; ttsModel: string; openaiKey: string; elevenKey: string; voiceFemale?: string; voiceMale?: string }
) {
  const manifest = readCourseManifest(courseSlug);
  const item = manifest.items.find((i) => fileToLessonSlug(i.file) === lessonSlug);
  if (!item) throw new Error(`No lesson "${lessonSlug}" in course "${courseSlug}"`);

  const raw = readLessonMarkdown(courseSlug, item.file);
  const { sections } = splitLessonSections(raw);
  const brief = buildLessonBrief(item.title, sections);

  process.stdout.write(`  ${courseSlug}/${lessonSlug} … writing script `);
  const turns = await writeDialogueScript(opts.openaiKey, opts.model, item.title, brief);
  console.log(`(${turns.length} turns)`);

  const { female, male } = await resolveVoices(opts.elevenKey, opts.voiceFemale, opts.voiceMale);
  const voiceFor: Record<Speaker, string> = { host_a: female, host_b: male };

  const clips: Buffer[] = [];
  for (const [i, turn] of turns.entries()) {
    process.stdout.write(`    turn ${i + 1}/${turns.length} (${turn.speaker}) … `);
    clips.push(await synthesizeTurn(opts.elevenKey, voiceFor[turn.speaker], opts.ttsModel, turn.text));
    console.log('done');
  }

  const outDir = path.join(OUT_ROOT, courseSlug);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, `${lessonSlug}.mp3`), Buffer.concat(clips));
  fs.writeFileSync(
    path.join(outDir, `${lessonSlug}.json`),
    JSON.stringify(
      {
        courseSlug,
        lessonSlug,
        lessonTitle: item.title,
        generatedAt: new Date().toISOString(),
        openaiModel: opts.model,
        elevenLabsModel: opts.ttsModel,
        voices: { host_a: female, host_b: male },
        turns,
      },
      null,
      2
    )
  );
}

async function main() {
  const { pairs, force, model, ttsModel, voiceFemale, voiceMale } = parseArgs();
  if (pairs.length === 0) {
    console.log('Usage: npx tsx scripts/generate-lesson-podcast.ts [--force] <courseSlug>/<lessonSlug> [...]');
    process.exit(1);
  }

  const openaiKey = loadApiKey('OPENAI_API_KEY');
  const elevenKey = loadApiKey('ELEVENLABS_API_KEY');

  let made = 0;
  let skipped = 0;
  for (const pair of pairs) {
    const [courseSlug, lessonSlug] = pair.split('/');
    const outFile = path.join(OUT_ROOT, courseSlug, `${lessonSlug}.mp3`);
    if (!force && fs.existsSync(outFile)) {
      console.log(`  ${pair} … already present, skipping (--force to regenerate)`);
      skipped++;
      continue;
    }
    try {
      await generateOne(courseSlug, lessonSlug, { model, ttsModel, openaiKey, elevenKey, voiceFemale, voiceMale });
      made++;
    } catch (err) {
      console.log('FAILED');
      console.error(err instanceof Error ? err.message : err);
    }
  }

  console.log(`\n${made} generated, ${skipped} already present.`);
}

main();
