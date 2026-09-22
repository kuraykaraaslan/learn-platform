/**
 * Turns an already-generated lesson podcast (scripts/generate-lesson-
 * podcast.ts — needs to have run first) into a "studio" video: a shared
 * illustrated two-host studio backdrop (generated once, reused for every
 * lesson), a warm highlight wash over whichever host is currently speaking,
 * and burned-in captions from the transcript — muxed with the existing mp3
 * into a .webm (VP9 + Opus).
 *
 * There is no lip-synced avatar here — that needs a dedicated talking-avatar
 * service (D-ID/HeyGen/Synthesia/…) and its own API key, which this project
 * doesn't have. This is the "two hosts in a studio" video achievable with
 * OpenAI (background art) + ffmpeg alone.
 *
 * Output: public/podcasts/<courseSlug>/<lessonSlug>.webm
 * Shared asset: public/podcasts/studio-bg.webp (generated once, reused after)
 *
 *   npx tsx scripts/generate-lesson-podcast-video.ts <courseSlug>/<lessonSlug> [...]
 *   npx tsx scripts/generate-lesson-podcast-video.ts --force-bg ...   # regenerate the studio art
 *   npx tsx scripts/generate-lesson-podcast-video.ts --force ...      # re-render existing videos
 *   npx tsx scripts/generate-lesson-podcast-video.ts --preview 40 ... # first 40s only, to a temp file
 *
 * Needs OPENAI_API_KEY (background art only, skipped once studio-bg.webp
 * exists) and ffmpeg — bundled via the ffmpeg-static devDependency, no
 * system install required.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

const PODCASTS_ROOT = path.join(process.cwd(), 'public', 'podcasts');
const STUDIO_BG_PATH = path.join(PODCASTS_ROOT, 'studio-bg.webp');
const IMAGES_ENDPOINT = 'https://api.openai.com/v1/images/generations';
const WIDTH = 1280;
const HEIGHT = 720;
const FPS = 24;
const INSET = 12;

type Speaker = 'host_a' | 'host_b';
type Turn = { speaker: Speaker; text: string };
type Timing = Turn & { start: number; end: number };

/** Minimal .env.local reader — same pattern as scripts/generate-covers.ts
 *  and scripts/generate-lesson-podcast.ts, duplicated per that convention. */
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
  const pairs = args.filter((a) => !a.startsWith('--') && a.includes('/'));
  const previewIdx = args.indexOf('--preview');
  const preview = previewIdx >= 0 ? Number(args[previewIdx + 1]) : null;
  return { pairs, force: args.includes('--force'), forceBg: args.includes('--force-bg'), preview };
}

/** Same flat-geometric-illustration art direction as scripts/generate-
 *  covers.ts, adapted for a two-host studio scene instead of a course
 *  cover — abstract seated silhouettes, not photoreal faces, so this reads
 *  as "our studio" rather than an uncanny avatar. Generated once and reused
 *  for every lesson's video (a real studio doesn't get redecorated per
 *  episode). */
const STUDIO_PROMPT =
  'Minimalist editorial flat-vector illustration of a cozy two-person podcast recording studio, wide 16:9 ' +
  'composition. Two simplified geometric seated figures face a shared round table with two microphones on ' +
  'boom arms, warm ambient lighting. One figure sits in the left third of the frame, the other in the right ' +
  'third, both facing forward toward the viewer/camera; the center third is the empty table and mics. ' +
  'Abstract silhouette figures only — no realistic facial features, no photographic detail. Restrained ' +
  'palette: deep blue (#2563eb), slate grey, warm off-white, one muted amber accent for the studio lighting. ' +
  'Calm, modern, generous negative space top and bottom for overlays. No text, no letters, no numbers, no logos.';

async function generateStudioBackground(apiKey: string): Promise<void> {
  const res = await fetch(IMAGES_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-image-1',
      prompt: STUDIO_PROMPT,
      n: 1,
      size: '1536x1024',
      quality: 'high',
      output_format: 'webp',
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);

  const json = (await res.json()) as { data: { b64_json: string }[] };
  const b64 = json.data[0]?.b64_json;
  if (!b64) throw new Error('No image data returned for studio background');
  const full = Buffer.from(b64, 'base64');

  try {
    const sharp = (await import('sharp')).default;
    await sharp(full).resize(WIDTH, HEIGHT, { fit: 'cover' }).webp({ quality: 82 }).toFile(STUDIO_BG_PATH);
  } catch {
    fs.writeFileSync(STUDIO_BG_PATH, full); // sharp unavailable — keep the full-size file
  }
}

/** ffmpeg prints "Duration: 00:05:23.45" to stderr for any input, even with
 *  no output — cheaper than adding an ffprobe-static dependency just for
 *  this one lookup. */
async function probeDurationSeconds(filePath: string): Promise<number> {
  try {
    await execFileAsync(ffmpegPath as string, ['-i', filePath, '-hide_banner']);
  } catch (err) {
    const stderr = (err as { stderr?: string }).stderr ?? '';
    const m = stderr.match(/Duration:\s*(\d+):(\d+):(\d+(?:\.\d+)?)/);
    if (m) return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]);
    throw new Error(`Could not read duration from ffmpeg output for ${filePath}`);
  }
  throw new Error('ffmpeg -i unexpectedly succeeded without printing duration');
}

/** No per-turn audio boundaries are recorded by generate-lesson-podcast.ts
 *  (turns are synthesized separately but concatenated with no markers), so
 *  timing is estimated proportionally to each turn's character count and
 *  scaled to the mp3's real total duration. Good enough for captions/
 *  highlight sync on a test pass; drifts a little on outlier-length turns. */
function estimateTimings(turns: Turn[], totalSeconds: number): Timing[] {
  const totalChars = turns.reduce((sum, t) => sum + t.text.length, 0);
  let cursor = 0;
  return turns.map((turn) => {
    const duration = (turn.text.length / totalChars) * totalSeconds;
    const start = cursor;
    cursor += duration;
    return { ...turn, start, end: cursor };
  });
}

function assTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${s.toFixed(2).padStart(5, '0')}`;
}

function escapeAssText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/[{}]/g, '').replace(/\n/g, '\\N');
}

const SPEAKER_LABEL: Record<Speaker, string> = { host_a: 'Host A', host_b: 'Host B' };
// Inline ASS \c override tags take &HBBGGRR& (6 hex digits, no alpha byte —
// unlike the 8-digit &HAABBGGRR the [V4+ Styles] Format line above uses).
// host_a (female) light pink #FFB3E6, host_b (male) light blue #66C2FF.
const SPEAKER_COLOR: Record<Speaker, string> = { host_a: '&HE6B3FF&', host_b: '&HFFC266&' };

/** One caption per turn, styled with an opaque background box (BorderStyle
 *  3) so it stays readable over the studio art regardless of what's behind
 *  it. */
function buildAss(timings: Timing[]): string {
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: ${WIDTH}
PlayResY: ${HEIGHT}
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,DejaVu Sans,28,&H00FFFFFF,&H00FFFFFF,&H00000000,&HB0202020,0,0,0,0,100,100,0,0,3,0,0,2,60,60,40,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
  const lines = timings.map((t) => {
    const label = `{\\c${SPEAKER_COLOR[t.speaker]}}${SPEAKER_LABEL[t.speaker]}:{\\c&HFFFFFF&} `;
    return `Dialogue: 0,${assTimestamp(t.start)},${assTimestamp(t.end)},Default,,0,0,0,,${label}${escapeAssText(t.text)}`;
  });
  return header + lines.join('\n') + '\n';
}

/** An opaque amber frame around the currently-speaking host's third of the
 *  frame — not a precise mask (the studio art isn't guaranteed pixel-aligned),
 *  just an unambiguous "who's talking" cue. A translucent wash was tried
 *  first, but drawbox's alpha blending rendered as a dark dimming on this
 *  ffmpeg build, so it reads as the speaker being *muted*. */
function buildFilterScript(timings: Timing[], assPath: string): string {
  const third = Math.round(WIDTH / 3);
  const boxes = timings.map((t, i) => {
    const x = t.speaker === 'host_a' ? 0 : WIDTH - third;
    const label = `v${i}`;
    return `${label === 'v0' ? '[bg]' : `[v${i - 1}]`}drawbox=x=${x + INSET}:y=${INSET}:w=${third - 2 * INSET}:h=${HEIGHT - 2 * INSET}:color=orange:t=8:enable='between(t,${t.start.toFixed(2)},${t.end.toFixed(2)})'[${label}]`;
  });
  const lastLabel = `v${timings.length - 1}`;
  const escapedAssPath = assPath.replace(/\\/g, '\\\\').replace(/:/g, '\\:').replace(/'/g, "\\'");
  return [
    `[0:v]scale=${WIDTH}:${HEIGHT}:force_original_aspect_ratio=increase,crop=${WIDTH}:${HEIGHT},fps=${FPS}[bg]`,
    ...boxes,
    `[${lastLabel}]subtitles='${escapedAssPath}'[vout]`,
  ].join(';\n');
}

async function renderVideo(
  bgPath: string,
  audioPath: string,
  assPath: string,
  totalSeconds: number,
  timings: Timing[],
  outPath: string
): Promise<void> {
  const filterScriptPath = path.join(os.tmpdir(), `podcast-video-filter-${Date.now()}.txt`);
  fs.writeFileSync(filterScriptPath, buildFilterScript(timings, assPath));

  try {
    await execFileAsync(ffmpegPath as string, [
      '-y',
      '-loop', '1',
      '-i', bgPath,
      '-i', audioPath,
      '-filter_complex_script', filterScriptPath,
      '-map', '[vout]',
      '-map', '1:a',
      '-t', totalSeconds.toFixed(2),
      '-r', String(FPS),
      '-c:v', 'libvpx-vp9',
      '-crf', '32',
      '-b:v', '0',
      // Default libvpx-vp9 settings (deadline=good, cpu-used=0) are tuned for
      // max quality and are punishingly slow — minutes of wall time per
      // minute of video. This is a static background plus a text overlay,
      // not detailed footage, so cpu-used=4 trades a little quality for a
      // large speed win (row-mt parallelizes across the 4 available cores).
      '-deadline', 'good',
      '-cpu-used', '4',
      '-row-mt', '1',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'libopus',
      '-b:a', '128k',
      outPath,
    ]);
  } finally {
    fs.rmSync(filterScriptPath, { force: true });
  }
}

async function generateOne(courseSlug: string, lessonSlug: string, force: boolean, preview: number | null): Promise<void> {
  const dir = path.join(PODCASTS_ROOT, courseSlug);
  const audioPath = path.join(dir, `${lessonSlug}.mp3`);
  const transcriptPath = path.join(dir, `${lessonSlug}.json`);
  const outPath = preview ? path.join(os.tmpdir(), `${lessonSlug}.preview.webm`) : path.join(dir, `${lessonSlug}.webm`);

  if (!fs.existsSync(audioPath) || !fs.existsSync(transcriptPath)) {
    throw new Error(
      `No podcast found for ${courseSlug}/${lessonSlug} — run scripts/generate-lesson-podcast.ts first`
    );
  }
  if (!preview && !force && fs.existsSync(outPath)) {
    console.log(`  ${courseSlug}/${lessonSlug} … video already present, skipping (--force to re-render)`);
    return;
  }

  const { turns } = JSON.parse(fs.readFileSync(transcriptPath, 'utf-8')) as { turns: Turn[] };
  process.stdout.write(`  ${courseSlug}/${lessonSlug} … measuring audio `);
  const totalSeconds = await probeDurationSeconds(audioPath);
  console.log(`(${totalSeconds.toFixed(1)}s)`);

  const timings = estimateTimings(turns, totalSeconds);
  // Intermediate only — kept out of public/ so it isn't served.
  const assPath = path.join(os.tmpdir(), `${courseSlug}-${lessonSlug}.ass`);
  fs.writeFileSync(assPath, buildAss(timings));

  process.stdout.write('    rendering video … ');
  await renderVideo(STUDIO_BG_PATH, audioPath, assPath, preview ? Math.min(preview, totalSeconds) : totalSeconds, timings, outPath);
  fs.rmSync(assPath, { force: true });
  console.log(preview ? `done (preview: ${outPath})` : 'done');
}

async function main() {
  const { pairs, force, forceBg, preview } = parseArgs();
  if (pairs.length === 0) {
    console.log('Usage: npx tsx scripts/generate-lesson-podcast-video.ts [--force] [--force-bg] <courseSlug>/<lessonSlug> [...]');
    process.exit(1);
  }

  fs.mkdirSync(PODCASTS_ROOT, { recursive: true });
  if (forceBg || !fs.existsSync(STUDIO_BG_PATH)) {
    console.log('Generating shared studio background …');
    await generateStudioBackground(loadApiKey('OPENAI_API_KEY'));
  }

  let made = 0;
  for (const pair of pairs) {
    const [courseSlug, lessonSlug] = pair.split('/');
    try {
      await generateOne(courseSlug, lessonSlug, force, preview);
      made++;
    } catch (err) {
      console.log('FAILED');
      console.error(err instanceof Error ? err.message : err);
    }
  }
  console.log(`\n${made}/${pairs.length} video(s) rendered.`);
}

main();
