# 488. Downsampling Without Lying: LTTB, Averaging, and What Each Destroys

## What It Is
A chart is a few hundred pixels wide and a twin's history is a few hundred thousand readings. Something has to reduce one to the other, and **every reduction destroys something**. The only question worth arguing about is which thing, and whether the destroyed thing is the one the reader was looking for.

**Bucket averaging** keeps the mean exactly and destroys every excursion. That is not a defect — an average is a correct summary of its bucket — but it is the wrong summary for a chart, because the question a person asks a chart is almost always "did anything unusual happen" rather than "what was the mean". The proof below runs it on a series containing a four-sample spike and a single-sample dropout, and it removes both.

**Bucket maximum** keeps the peaks and introduces an upward bias: every point in the output is the highest in its bucket, so the series sits above the truth and a dropout is invisible for exactly the same reason an average hides a spike. It is the right choice when only excursions in one direction matter, and it is a choice rather than a default.

**Every nth point** keeps nothing in particular. Whether it catches an excursion depends on where the excursion landed relative to the stride, which makes it correct by luck.

**LTTB** — Largest Triangle Three Buckets, from Steinarsson's 2013 thesis — keeps the **shape**. It splits the series into buckets and from each keeps the point forming the largest triangle with the previously kept point and the mean of the next bucket, because triangle area is large exactly where the line changes direction, which is what an eye picks out of a chart. In the proof it retains 99.8% of the series range and catches both the spike and the dropout.

What LTTB destroys is the arithmetic. **Its output has no aggregate meaning at all** — the mean of an LTTB series is not the mean of the data, and neither is anything else. So the rule is about the consumer rather than the algorithm: **downsample for drawing, aggregate for computing, and never let a chart series feed a calculation.**

```quiz
- q: "Bucket averaging removed a four-sample spike from a chart. Is the average wrong?"
  anchor: "an average is a correct summary of its bucket"
  options:
    - text: "Yes — it lost data"
      correct: false
      why: "Every value it reports is the true mean of its bucket. It is correct about what it claims."
    - text: "No — it is correct about the mean and wrong about the question a chart is asked"
      correct: true
      why: "Which is why the choice of reduction is a choice about the consumer."
    - text: "Only if the spike exceeded the bucket's standard deviation"
      correct: false
      why: "The average is the average regardless. There is no threshold at which it becomes wrong about itself."

- q: "Why must an LTTB series never feed a calculation?"
  anchor: "Its output has no aggregate meaning at all"
  options:
    - text: "Because it drops points, so any sum is too small"
      correct: false
      why: "Every reduction drops points. The problem is not the count."
    - text: "Because it selects for visual shape, so its output preserves no aggregate — not the mean, not anything"
      correct: true
      why: "It is a drawing algorithm, and its output is a picture expressed as numbers."
    - text: "Because the points it keeps are not real readings"
      correct: false
      why: "They are real readings — LTTB selects rather than synthesising, unlike averaging."
```

## Key Concepts
- **Every reduction destroys something** — the question is which thing
- **Bucket average**: keeps the mean exactly, destroys every excursion
- **Bucket maximum**: keeps peaks, biases upward, hides every dip
- **Every nth point**: correct by luck, depending on where the excursion fell
- **LTTB (Steinarsson, 2013)**: keeps the shape, by maximising triangle area
- **Triangle area is large where the line turns** — which is what an eye reads
- **LTTB selects rather than synthesising**: every output point is a real reading
- **LTTB preserves no aggregate** — its mean is not the data's mean
- **Downsample for drawing, aggregate for computing** — and never cross the two
- **The rollup of Lesson 477 is the aggregate side**, and it keeps min and max for this reason

## Example Code
Four reductions of one series, with what each preserved:

```typescript run
// on a fixed 500-point series; this is the implementation, small enough to
// read and to put your own series through.
type Point = { x: number; y: number };

/** LTTB (Steinarsson, 2013). Keeps the first and last points, splits the rest
 *  into `target - 2` buckets, and from each bucket keeps the point that forms
 *  the largest triangle with the previously kept point and the MEAN of the
 *  next bucket. The triangle area is the criterion because area is large
 *  exactly where the line changes direction — which is what a reader's eye
 *  is picking out of a chart. */
function lttb(data: Point[], target: number): Point[] {
  if (target >= data.length || target < 3) return data;

  const bucketSize = (data.length - 2) / (target - 2);
  const out: Point[] = [data[0]];
  let anchor = 0;

  for (let i = 0; i < target - 2; i++) {
    const nextStart = Math.floor((i + 1) * bucketSize) + 1;
    const nextEnd = Math.min(Math.floor((i + 2) * bucketSize) + 1, data.length);
    let avgX = 0;
    let avgY = 0;
    for (let j = nextStart; j < nextEnd; j++) {
      avgX += data[j].x;
      avgY += data[j].y;
    }
    avgX /= nextEnd - nextStart;
    avgY /= nextEnd - nextStart;

    const start = Math.floor(i * bucketSize) + 1;
    const end = Math.floor((i + 1) * bucketSize) + 1;
    let best = start;
    let bestArea = -1;
    for (let j = start; j < end; j++) {
      const area = Math.abs(
        (data[anchor].x - avgX) * (data[j].y - data[anchor].y) -
          (data[anchor].x - data[j].x) * (avgY - data[anchor].y)
      );
      if (area > bestArea) {
        bestArea = area;
        best = j;
      }
    }
    out.push(data[best]);
    anchor = best;
  }

  out.push(data[data.length - 1]);
  return out;
}

/** The alternatives, for comparison. Each is correct about a different thing. */
const bucketMean = (data: Point[], target: number): Point[] => reduceBuckets(data, target, (b) => ({
  x: b.reduce((s, p) => s + p.x, 0) / b.length,
  y: b.reduce((s, p) => s + p.y, 0) / b.length,
}));

const bucketMax = (data: Point[], target: number): Point[] =>
  reduceBuckets(data, target, (b) => b.reduce((m, p) => (p.y > m.y ? p : m)));

const everyNth = (data: Point[], target: number): Point[] =>
  data.filter((_, i) => i % Math.ceil(data.length / target) === 0);

function reduceBuckets(data: Point[], target: number, pick: (bucket: Point[]) => Point): Point[] {
  const size = Math.ceil(data.length / target);
  const out: Point[] = [];
  for (let i = 0; i < data.length; i += size) out.push(pick(data.slice(i, i + size)));
  return out;
}

// A short series with one thing in it worth seeing.
const DATA: Point[] = Array.from({ length: 120 }, (_, i) => ({
  x: i,
  y: Math.round((10 + 2 * Math.sin(i / 9) + (i >= 61 && i <= 63 ? 8 : 0)) * 100) / 100,
}));

const TARGET = 12;
const PEAK = Math.max(...DATA.map((p) => p.y));

console.log(`${DATA.length} points down to ${TARGET}, with a three-sample spike peaking at ${PEAK.toFixed(2)}`);
console.log('');
console.log('method            points   min     max     peak seen   keeps the mean');
const originalMean = DATA.reduce((s, p) => s + p.y, 0) / DATA.length;
for (const [name, fn] of [
  ['LTTB', lttb],
  ['bucket mean', bucketMean],
  ['bucket max', bucketMax],
  ['every nth point', everyNth],
] as const) {
  const out = fn(DATA, TARGET);
  const mean = out.reduce((s, p) => s + p.y, 0) / out.length;
  console.log(
    `  ${name.padEnd(16)} ${String(out.length).padStart(4)}   ` +
      `${Math.min(...out.map((p) => p.y)).toFixed(2).padStart(5)}   ${Math.max(...out.map((p) => p.y)).toFixed(2).padStart(5)}   ` +
      `${(Math.max(...out.map((p) => p.y)) >= PEAK - 0.01 ? 'yes' : 'no').padStart(9)}   ${mean.toFixed(3).padStart(9)}`
  );
}
console.log(`  ${'original'.padEnd(16)} ${String(DATA.length).padStart(4)}   ` +
  `${Math.min(...DATA.map((p) => p.y)).toFixed(2).padStart(5)}   ${PEAK.toFixed(2).padStart(5)}   ` +
  `${'yes'.padStart(9)}   ${originalMean.toFixed(3).padStart(9)}`);
console.log('');
console.log('Each of these is correct about something different, and none is correct about');
console.log('everything:');
console.log('  * bucket mean keeps the average and destroys every excursion');
console.log('  * bucket max keeps the peaks and invents an upward bias — it can never');
console.log('    show you a dip, so a dropout is invisible in exactly the same way');
console.log('  * every nth point keeps nothing in particular; whether it catches a spike');
console.log('    depends on where the spike landed relative to the stride');
console.log('  * LTTB keeps the SHAPE and keeps neither the mean nor any aggregate');
console.log('');
console.log('So the rule is about the consumer, not the algorithm: downsample for drawing,');
console.log('aggregate for computing, and never let a chart series feed a calculation.');
```

And the same comparison run and stamped on a fixed 500-point series with a spike and a dropout in it:

```proof sha=8235b9622583da8e at=2026-09-03 commit=ce295c5
$ node downsample.js
500 points down to about 50

                 points   minimum   maximum    range kept
  original         500    17.003    27.266       100.0%
  LTTB              50    17.003    27.248        99.8%
  bucket average    50    17.864    24.246        62.2%

the four-sample spike, peaking at y = 27.266 over a baseline of 17.748:
  LTTB            highest point kept there: 27.248   99.8% of the excursion
  bucket average  highest point kept there: none   0.0% of the excursion

the single-sample dropout at y = 17.003:
  LTTB            lowest point kept there: 17.003
  bucket average  lowest point kept there: 23.435

Neither result is a lie about the data it reports. The average really is the
average. What it is wrong about is the QUESTION the chart is being asked, which
is almost always "did anything unusual happen" rather than "what was the mean".

LTTB keeps the shape and does NOT keep the arithmetic: the mean of its output is
21.034 against the original's 21.060. Use it to draw, never to compute.
```

## When to Use
- Any chart over more readings than it has pixels, which is every twin chart
- When a user reports that an excursion "disappeared from the graph" — the reduction is the first thing to look at
- When a report and a chart disagree, where the chart was probably drawn from a downsampled series and the report from an aggregate
- When choosing a reduction, where the question is which feature the reader is looking for rather than which algorithm is best

## Common Mistakes
- **Averaging for a chart** — it is the correct summary of the wrong question, and it removes exactly what an alert exists to catch
- **Computing from a downsampled series** — an LTTB mean is not a mean, and nothing in the numbers says so
- **Bucket maximum as a default** — it hides every dip, so a dropout looks like normal operation
- **Every nth point because it is simplest** — whether it catches anything depends on the stride landing on it
- **Reducing before storing** — the aggregate is a derived artefact, and the raw series is what a later question needs (Lesson 477)
- **One reduction for every chart** — a chart of a control signal and a chart of an alarm are asking different questions of the same table

## Further Reading
- Sveinn Steinarsson, *Downsampling Time Series for Visual Representation*, MSc thesis, University of Iceland, 2013 — the source of LTTB, including the alternatives it was measured against
- [PostgreSQL window functions](https://www.postgresql.org/docs/current/functions-window.html) — for bucketing and aggregation in the database rather than in the client
- [TimescaleDB documentation](https://docs.timescale.com/) — where LTTB and bucketed aggregates are both available server-side, worth comparing against a client-side reduction

```recall
- q: "Say what each of the four reductions keeps and destroys."
  must:
    - "bucket average — keeps the mean exactly, destroys every excursion"
    - "bucket maximum — keeps peaks, biases upward, hides every dip"
    - "every nth point — correct by luck, depending on the stride"
    - "LTTB — keeps the shape, preserves no aggregate"

- q: "How does LTTB choose which point to keep?"
  must:
    - "the point forming the largest triangle with the previously kept point and the mean of the next bucket"
    - "because triangle area is largest where the line changes direction"
    - "which is what an eye picks out of a chart"

- q: "State the rule about consumers."
  must:
    - "downsample for drawing, aggregate for computing"
    - "never let a chart series feed a calculation"
    - "an LTTB mean is not the data's mean, and nothing in the numbers says so"
```
