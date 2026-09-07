# 566. Robust Statistics: Why the Mean and the Standard Deviation Betray You

## What It Is
The default way to decide whether a reading is unusual is to compare it against the mean, in units of the standard deviation, and flag anything past three of them. It is one line of code, it is what everyone reaches for, and on sensor data it has a property that makes it worse than useless: **the thing you are trying to detect is included in the yardstick you are measuring it with**.

An outlier pulls the mean toward itself and inflates the standard deviation, and the standard deviation is inflated *more*, because deviations are squared. One artefact usually survives this and is still flagged. A handful of them raise the bar past themselves and the rule goes quiet — a failure called **masking**, and it is not a gradual decline. On the series in the proof below, the rule finds every artefact up to three and then, at four, finds none at all.

The fix is to build the yardstick from statistics a minority of points cannot move. The **median** is unchanged by anything that happens to fewer than half the values. The **median absolute deviation** — the median of the distances to the median — is the spread equivalent, and it is equally immovable. Together they give the **modified z-score**, `0.6745 × (x − median) / MAD`, conventionally flagged above 3.5. Both constants come from the definition rather than from tuning: the NIST handbook's formulation, after Iglewicz and Hoaglin.

There is one failure mode worth knowing before you deploy it. If more than half the values are identical — a stuck sensor reporting the same number, a signal quantised coarsely — the MAD is zero and the modified z-score is undefined or infinite for every other point. That is not a defect in the method; it is the method telling you something true about the data, and the correct response is to handle a zero MAD explicitly rather than to divide by it.

None of this replaces Lesson 482. Hysteresis, dead bands and debounce decide **when an indicator becomes an alert**; robust statistics decide **what the indicator is**. Applying Lesson 482's mechanics to a classical z-score built on artefact-laden data just makes a wrong number quieter.

```quiz
- q: "Why does a 3-sigma rule find fewer outliers as more of them arrive?"
  anchor: "the thing you are trying to detect is included in the yardstick you are measuring it with"
  options:
    - text: "Because the sample size grows, and larger samples are harder to flag"
      correct: false
      why: "Sample size is unchanged here — the same points are being reclassified."
    - text: "Because each outlier inflates the standard deviation it is about to be judged against"
      correct: true
      why: "Deviations are squared, so the spread grows faster than the centre moves. This is masking."
    - text: "Because the mean moves toward the outliers and they end up closer to it"
      correct: false
      why: "The mean does move, but the dominant effect is the inflated spread."

- q: "What makes the median and the MAD resistant to outliers?"
  anchor: "unchanged by anything that happens to fewer than half the values"
  options:
    - text: "They are computed on sorted data, which removes extremes"
      correct: false
      why: "Sorting does not discard anything; the resistance comes from using a position rather than a sum."
    - text: "Neither moves unless more than half the values move"
      correct: true
      why: "Which is exactly the property a yardstick needs when the data contains artefacts."
    - text: "They ignore values beyond three standard deviations"
      correct: false
      why: "No exclusion happens — that would require already knowing which points are outliers."

- q: "The MAD of a series is zero. What does that mean?"
  anchor: "more than half the values are identical"
  options:
    - text: "The data is clean and no outliers exist"
      correct: false
      why: "It says nothing about outliers; it says something about the middle."
    - text: "More than half the values are identical — a stuck sensor or coarse quantisation — and the score is undefined"
      correct: true
      why: "Handle the zero explicitly; it is the method reporting something true about the data."
    - text: "The series is too short to compute a spread"
      correct: false
      why: "A short series gives a small MAD, not necessarily zero."
```

## Key Concepts
- **The classical rule includes the outlier in its own yardstick** — mean and standard deviation both move
- **The standard deviation moves more**, because deviations are squared
- **Masking**: with several outliers the rule goes quiet, and it is a cliff rather than a slope
- **The median is unmoved by a minority**, and so is the **median absolute deviation** (MAD)
- **Modified z-score**: `0.6745 × (x − median) / MAD`, conventionally flagged above 3.5 (NIST, after Iglewicz and Hoaglin)
- **A zero MAD means over half the values are identical** — a stuck sensor or coarse quantisation; handle it explicitly
- **This is not a replacement for Lesson 482** — that decides when an indicator becomes an alert, this decides what the indicator is

## Example Code
Both rules on one short series, so the arithmetic is visible before the counted version:

```typescript run
/** Twelve readings from one machine. One of them is a transport artefact. */
const xs = [2.21, 2.24, 2.19, 2.26, 2.22, 6.50, 2.25, 2.20, 2.23, 2.27, 2.21, 2.24];

const mean = (v: number[]): number => v.reduce((a, b) => a + b, 0) / v.length;
const sd = (v: number[]): number => {
  const m = mean(v);
  return Math.sqrt(v.reduce((a, x) => a + (x - m) ** 2, 0) / (v.length - 1));
};
const median = (v: number[]): number => {
  const s = [...v].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
};
const mad = (v: number[]): number => {
  const m = median(v);
  return median(v.map((x) => Math.abs(x - m)));
};

const m = mean(xs);
const s = sd(xs);
const med = median(xs);
const md = mad(xs);

console.log(`mean   ${m.toFixed(3)}   sd  ${s.toFixed(3)}`);
console.log(`median ${med.toFixed(3)}   MAD ${md.toFixed(3)}`);
console.log('');
console.log('  value    z (mean/sd)   modified z (median/MAD)');
for (const x of xs) {
  const z = Math.abs(x - m) / s;
  const mz = md === 0 ? Number.NaN : (0.6745 * Math.abs(x - med)) / md;
  const flag = z > 3 ? 'z' : ' ';
  const rflag = mz > 3.5 ? 'mz' : '  ';
  console.log(`  ${x.toFixed(2)}       ${z.toFixed(2).padStart(5)} ${flag}         ${mz.toFixed(2).padStart(6)} ${rflag}`);
}

console.log('');
console.log(`The artefact sits ${((6.5 - med) / md).toFixed(0)} MADs from the median and barely three standard`);
console.log('deviations from the mean, on the same twelve numbers. The difference is that it');
console.log('contributed to one of those two yardsticks and not to the other.');
```

One artefact is a mild case. The claim that matters — that the classical rule collapses once there are several — is countable, so it is counted rather than asserted. Before reading the output, predict how many artefacts it takes before a 3-sigma rule stops flagging any of them:

```proof sha=bfcb0ae555b0b35f at=2026-09-07 commit=a84146c
$ node masking.js
base series: 40 points, level 2.2 mm/s with a daily cycle
artefact value injected: 6.5 mm/s
classical rule |z| > 3, robust rule |modified z| > 3.5

  k   mean     sd     max |z|   found     median    MAD     max |mz|   found
  0   2.220   0.223     1.62    0/0      2.240   0.198      1.29    0/0
  1   2.335   0.709     5.87    1/1      2.248   0.194     14.82    1/1
  2   2.448   0.965     4.20    2/2      2.278   0.202     14.06    2/2
  3   2.563   1.154     3.41    3/3      2.309   0.179     15.75    3/3
  4   2.677   1.306     2.93    0/4      2.350   0.172     16.27    4/4
  5   2.787   1.435     2.59    0/5      2.391   0.158     17.54    5/5
  6   2.896   1.546     2.33    0/6      2.393   0.158     17.53    6/6

Read the two "found" columns down the page. The classical rule finds every
artefact up to three and then, at four, finds none at all -- not fewer, none.
Each artefact it is trying to detect has already been added to the standard
deviation it is being measured against, and by the fourth the yardstick has
grown past it. The robust pair does not move: a minority of points cannot shift
a median, so the yardstick stays the length it was.

This is why an alarm built on a mean and a standard deviation gets quieter as
a sensor gets worse, which is the opposite of what anyone designing it intended.
```

The two `found` columns are the lesson. Note also what the classical rule's own numbers do on the way: the standard deviation grows from 0.223 to 1.546, which is nearly sevenfold, on data whose honest spread never changed at all.

## When to Use
- On any sensor stream that can produce artefacts, which is every sensor stream that crosses a network
- When an alarm went quiet after a sensor started misbehaving — masking is the first hypothesis
- Before feeding an indicator into Lesson 482's hysteresis, since a robust indicator makes those mechanics cheap
- When comparing this week to a baseline, where a single artefact in either window can dominate a mean
- When a monitoring system's own statistics look implausibly stable — an inflated spread hides everything inside it

## Common Mistakes
- **Using mean and standard deviation on artefact-prone data** — the artefacts are in the yardstick
- **Believing masking is gradual** — it is a cliff, and the run shows it arriving between three artefacts and four
- **Removing outliers before computing the statistics** — the removal needs the statistics, so the reasoning is circular
- **Dividing by a zero MAD** — handle it, and treat it as the finding it is
- **Applying hysteresis to a broken indicator** — Lesson 482's mechanics make a wrong number quieter, not righter
- **Tuning the 3.5 cutoff to make the output look reasonable** — the constants come from the definition, and tuning them to taste means the threshold now encodes an expectation instead of a rule

## Further Reading
- [NIST/SEMATECH e-Handbook of Statistical Methods — detection of outliers](https://www.itl.nist.gov/div898/handbook/eda/section3/eda35h.htm) — the modified z-score, its 0.6745 constant and the 3.5 cutoff, stated with their origin
- [Lesson 482](/courses/iot-telemetry-edge/alerting-without-crying-wolf) — hysteresis, debounce and dead bands: when an indicator becomes an alert
- [Lesson 534](/courses/iot-hardware-basics/sensor-error) — where sensor artefacts come from before they reach any statistic
- [Lesson 564](/courses/condition-monitoring/baselines) — the baseline these statistics are computed over, and why it is per asset
- [Lesson 570](/courses/condition-monitoring/remaining-useful-life) — why a trend should be fitted to a robust feature, where one artefact would otherwise tilt the line

```recall
- q: "What is masking and why does it happen?"
  must:
    - "a 3-sigma rule stops flagging outliers once there are several of them"
    - "because each outlier inflates the standard deviation it is being judged against, and deviations are squared"
    - "it arrives as a cliff, not a gradual decline"

- q: "What replaces the mean and standard deviation, and why?"
  must:
    - "the median and the median absolute deviation (MAD)"
    - "neither moves unless more than half the values move, so a minority of artefacts cannot shift the yardstick"
    - "combined as the modified z-score, 0.6745 x (x - median) / MAD, flagged above 3.5"

- q: "What does a MAD of zero tell you, and what should the code do?"
  must:
    - "more than half the values are identical -- a stuck sensor or coarse quantisation"
    - "the modified z-score is undefined or infinite for every other point"
    - "handle the zero explicitly and treat it as a finding rather than dividing by it"
```
