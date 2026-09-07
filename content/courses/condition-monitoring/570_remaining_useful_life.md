# 570. Remaining Useful Life: What You Can Compute and What You Must Not Claim

## What It Is
"Remaining useful life" is the phrase that sells monitoring systems, and it is the one place in this course where the honest answer is mostly negative. A number of days until failure requires three things: a **trend** you can measure, a **threshold** that constitutes failure, and **evidence** that assets crossing that threshold do in fact fail. The first is arithmetic. The second is a judgement. The third is the labels of Lesson 569, which you probably do not have.

The trend is the easy part and it is worth doing well. Fit a line to a robust feature over a long enough window, and you get a rate — millimetres per second per day — along with a measure of how well the line fits. That rate is a real, defensible statement about the past: *this asset's vibration has been rising at 0.022 mm/s per day for the last twenty days.* Nobody can argue with it, because it is a description rather than a prediction.

The projection is where it stops being safe, and the reason is not statistical uncertainty — it is that **the answer is almost entirely determined by the threshold you assume**. The same fit, extrapolated to three different plausible failure levels, produces three answers that differ by months. The uncertainty in the fit is a rounding error next to the uncertainty in the number you compared it to, and quoting a single day count hides exactly the assumption that dominates it.

There is a second, quieter problem: **degradation is rarely linear all the way to failure**. A slow rise often becomes a fast one; a bearing that has been creeping for a month can go in a week. A linear extrapolation is therefore usually optimistic near the end, which is the worst possible direction for it to be wrong in.

So what may be said? *This asset has moved further from its own baseline than anything else in the fleet, at this rate, for this long, and here is when it would reach each of three levels if the rate held.* That sentence is defensible, actionable and complete. **A single number of days is not a more precise version of it — it is a different and unsupported claim.**

```quiz
- q: "What are the three things a remaining-useful-life figure requires?"
  anchor: "a **trend** you can measure, a **threshold** that constitutes failure, and **evidence**"
  options:
    - text: "A long history, a good model, and enough compute"
      correct: false
      why: "None of those is the binding constraint; the third item below usually is."
    - text: "A measurable trend, a threshold that constitutes failure, and evidence that crossing it means failure"
      correct: true
      why: "The first is arithmetic, the second is a judgement, and the third needs labels."
    - text: "A physics model, a sensor specification, and a maintenance schedule"
      correct: false
      why: "Useful inputs, but none of them supplies the evidence that a threshold means anything."

- q: "Why is quoting a single 'days to failure' number misleading even with a good fit?"
  anchor: "the answer is almost entirely determined by the threshold you assume"
  options:
    - text: "Because fits always have wide confidence intervals"
      correct: false
      why: "The fit's uncertainty is usually small next to the assumption it is compared against."
    - text: "Because the assumed failure threshold dominates the answer, and the single number hides it"
      correct: true
      why: "Three plausible thresholds produce three answers months apart on the same fit."
    - text: "Because the rate always changes"
      correct: false
      why: "It often does, which is a second problem — but the threshold assumption dominates even when it does not."

- q: "In which direction is a linear extrapolation usually wrong?"
  anchor: "usually optimistic near the end"
  options:
    - text: "Pessimistic — it predicts failure earlier than it happens"
      correct: false
      why: "That would at least be safe. Degradation typically accelerates."
    - text: "Optimistic — degradation often accelerates, so failure arrives sooner than the line says"
      correct: true
      why: "Which is the worst direction for the error to run in."
    - text: "Neither — errors are symmetric around the fit"
      correct: false
      why: "They would be if the underlying process were linear, and it usually is not near the end."
```

## Key Concepts
- **RUL needs three things**: a measurable trend, a failure threshold, and evidence that the threshold means failure
- **The trend is defensible** — a rate with a fit quality is a statement about the past
- **The projection is dominated by the assumed threshold**, not by the fit's uncertainty
- **Three plausible thresholds give three answers months apart** on the same data
- **Degradation is rarely linear to the end** — a linear projection is usually optimistic, the worst direction
- **Evidence that a level means failure is a label problem** (Lesson 569)
- **Say the rate, the duration and the levels** — a single day count is a different, unsupported claim

## Example Code
The same fit, projected to three thresholds, so the sensitivity is visible rather than hidden:

```typescript run
/** Twenty days of a daily condition indicator from one asset: a slow rise on
 *  top of a small wobble. The series is generated from its index so the fit
 *  below is reproducible. */
const days = 20;
const series: { day: number; value: number }[] = [];
for (let d = 0; d < days; d++) {
  const value = 2.47 + 0.022 * d + 0.03 * Math.sin(d * 1.7);
  series.push({ day: d, value: Number(value.toFixed(4)) });
}

/** Ordinary least squares on (day, value). */
function fit(points: { day: number; value: number }[]): { slope: number; intercept: number; r2: number } {
  const n = points.length;
  const mx = points.reduce((a, p) => a + p.day, 0) / n;
  const my = points.reduce((a, p) => a + p.value, 0) / n;
  const sxy = points.reduce((a, p) => a + (p.day - mx) * (p.value - my), 0);
  const sxx = points.reduce((a, p) => a + (p.day - mx) ** 2, 0);
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  const ssTot = points.reduce((a, p) => a + (p.value - my) ** 2, 0);
  const ssRes = points.reduce((a, p) => a + (p.value - (intercept + slope * p.day)) ** 2, 0);
  return { slope, intercept, r2: 1 - ssRes / ssTot };
}

const f = fit(series);
const latest = series[series.length - 1];

console.log(`observed: ${days} days, from ${series[0].value.toFixed(3)} to ${latest.value.toFixed(3)} mm/s`);
console.log(`fit     : ${f.slope.toFixed(4)} mm/s per day, R^2 = ${f.r2.toFixed(4)}`);
console.log('');
console.log('That first line is a description of the past and nobody can argue with it.');
console.log('Now the projection, against four levels a reasonable engineer might propose:');
console.log('');
console.log('  assumed failure level   days from today   reached on day');
for (const level of [3.2, 4.0, 4.5, 7.1]) {
  const daysToLevel = (level - (f.intercept + f.slope * latest.day)) / f.slope;
  console.log(
    `  ${level.toFixed(1)} mm/s               ${daysToLevel.toFixed(0).padStart(6)}            ${(latest.day + daysToLevel).toFixed(0).padStart(6)}`
  );
}

console.log('');
const a = (3.2 - (f.intercept + f.slope * latest.day)) / f.slope;
const b = (7.1 - (f.intercept + f.slope * latest.day)) / f.slope;
console.log(`Same asset, same data, same fit: ${a.toFixed(0)} days or ${b.toFixed(0)} days, depending only on`);
console.log(`a number nobody in this example has evidence for. The spread is ${(b - a).toFixed(0)} days and it`);
console.log('comes entirely from the assumption, not from the measurement.');
console.log('');
console.log('And every row above assumes the rate holds. It usually does not: degradation');
console.log('tends to accelerate, so each of these dates is more likely to be late than early.');
```

## When to Use
- When asked for a failure date, to convert the question into the rate, the duration and the assumed level
- When comparing assets, where the rate is a fair ranking and a projected date is not
- When a vendor quotes a warning time, where the useful questions are which threshold and which labels
- When planning an intervention window, where "if this rate held" is the honest framing to plan against
- When the rate itself changes, which is a stronger signal than the level and is worth alerting on separately

## Common Mistakes
- **Quoting days to failure** — the number is dominated by an assumption the quote does not mention
- **Reporting a high R² as confidence in the prediction** — it measures the fit to the past, not the truth of the extrapolation
- **Assuming linearity to the end** — degradation accelerates, so the estimate errs late
- **Fitting to a raw feature** — one artefact tilts a line; fit something robust (Lesson 566)
- **Fitting through a repair** — the series either side is two different machines (Lesson 571)
- **Treating a threshold from a fleet document as evidence for this asset** — it is a starting assumption, not a label

## Further Reading
- [ISO 13379-1 — condition monitoring and diagnostics of machines, data interpretation and diagnostics techniques](https://www.iso.org/standard/39836.html) — the standard's framing of diagnosis versus prognosis; catalogue reference, the clause text is paid
- [Lesson 569](/courses/condition-monitoring/labels-come-from-maintenance-history) — the evidence a threshold needs before a projection means anything
- [Lesson 566](/courses/condition-monitoring/robust-statistics) — why a line should be fitted to a robust feature rather than to raw readings
- [Lesson 512](/courses/asset-management-systems/buying-vs-building-eam) — the same evidence question asked of a vendor's claim rather than your own

```recall
- q: "What three things does a remaining-useful-life figure require?"
  must:
    - "a measurable trend, which is arithmetic"
    - "a threshold that constitutes failure, which is a judgement"
    - "evidence that assets crossing that threshold actually fail, which needs labels"

- q: "Why is a single days-to-failure number misleading?"
  must:
    - "the answer is dominated by the assumed failure threshold, not by the fit"
    - "three plausible thresholds give answers months apart on the same data"
    - "quoting one number hides the assumption that determines it"

- q: "What can be said honestly about a degrading asset?"
  must:
    - "the rate, the duration over which it has held, and how far the asset is from its own baseline"
    - "and when it would reach each of several stated levels if the rate held"
    - "not a single date -- and note that degradation usually accelerates, so a linear projection errs late"
```
