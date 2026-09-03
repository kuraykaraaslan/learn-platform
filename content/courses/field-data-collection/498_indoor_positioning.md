# 498. Indoor Positioning: What to Do When GPS Stops Working

## What It Is
Lesson 497 is about reading an accuracy figure. This lesson exists because **that figure comes back in the hundreds or thousands of metres the moment the inspector walks inside**, and a field application spends most of its time inside.

That is not a tuning problem. The signal a satellite receiver needs is attenuated by the structure, so what the device returns indoors is a position derived from network or wifi — a different measurement, honestly reported in the same field, and useless for placing an asset in a room. A field app that treats the indoor fix as a degraded outdoor fix will attribute findings to the wrong building.

So the question is what replaces it, and there are three things, all of them weaker than they sound.

**Known-point scanning** is the strongest and the least glamorous: a tag, a plate, or a printed code at a known location, scanned by the inspector. It gives an exact position at the moment of scanning and nothing in between, and it requires somebody to have installed and surveyed the tags. Almost every indoor system that works in practice works this way.

**Dead reckoning** integrates steps from a known start. The run below shows what it costs: both realistic error sources — a compass with a constant offset from steel or plant, and a stride length calibrated for somebody else — are **systematic**, so the error accumulates with distance rather than averaging out. There is no length of walk after which it stops growing.

**Holding onto the routing graph** is the third, and it is where Lesson 489's work pays. If the inspector must be *somewhere in the graph*, a position can be snapped to the nearest node or edge, and impossible positions — through a wall, in a space with no door — can be rejected outright. The graph does not improve the measurement; it constrains what the measurement is allowed to claim.

What the run makes concrete is that **the correction interval is the accuracy**. Correcting every fifteen steps caps the error at well under a metre; the same walk uncorrected drifts several times further. That is a statement about how many known points the building has, which makes indoor positioning **an installation question before it is a software one**.

```quiz
- q: "A field app reads a position indoors and the accuracy field says 1400 metres. What should it do?"
  anchor: "a different measurement, honestly reported in the same field"
  options:
    - text: "Use it, since it is the best available"
      correct: false
      why: "It is a network-derived position that cannot place an asset in a building, let alone a room. Using it attributes the finding to the wrong place."
    - text: "Reject it for placement and fall back to a known point, dead reckoning, or the routing graph"
      correct: true
      why: "The indoor fix is not a degraded outdoor fix; it is a different measurement."
    - text: "Average several such fixes to improve it"
      correct: false
      why: "Averaging reduces random error. A wifi-derived position's error is not random, it is wrong about which building."

- q: "Why does dead reckoning error not average out?"
  anchor: "both realistic error sources — a compass with a constant offset from steel or plant, and a stride length calibrated for somebody else — are **systematic**"
  options:
    - text: "Because step detection misses steps"
      correct: false
      why: "A real problem and a separate one. Missed steps are part of the stride error; the point is that both dominant sources are biases rather than noise."
    - text: "Because the dominant errors are biases — a constant compass offset and a wrong stride length — so they accumulate"
      correct: true
      why: "Random noise would average out. A bias integrates."
    - text: "Because the sensors are low quality"
      correct: false
      why: "Better sensors reduce the bias and do not change its character; it still accumulates."
```

## Key Concepts
- **GPS does not work indoors** — the accuracy figure comes back in the hundreds or thousands of metres
- **The indoor fix is a different measurement**, network- or wifi-derived, in the same field
- **A field app is mostly indoors**, which is why Lesson 497 alone would mislead
- **Known-point scanning**: a tag at a surveyed location — exact when scanned, nothing in between
- **It requires installation and survey**, which is why it works and why it is resisted
- **Dead reckoning** integrates steps from a known start
- **Its errors are systematic** — compass bias and stride error — so they accumulate with distance
- **The error is a vector**: a turn can partly cancel it, and a straight run reveals it
- **The routing graph constrains** rather than improves: snap to a node, reject the impossible (Lesson 489)
- **The correction interval is the accuracy** — an installation question before a software one

## Example Code
Dead reckoning over one walk, with realistic systematic error and with correction:

```typescript run
// receiver needs is attenuated by the building, and Lesson 497's accuracy
// figure comes back in the hundreds or thousands of metres because the
// position is being derived from something else entirely.
//
// So what replaces it, and what does the replacement cost?
type Step = { headingDeg: number; lengthM: number };

/** Dead reckoning: start from a known point and integrate steps. Every step
 *  carries error, and the error ACCUMULATES — which is the whole property
 *  worth understanding before promising anything about indoor accuracy. */
type Position = { x: number; y: number };

const RAD = Math.PI / 180;

function integrate(start: Position, steps: Step[], headingBiasDeg: number, lengthScale: number): Position {
  let p = { ...start };
  for (const s of steps) {
    // Two error sources, both realistic and both systematic rather than
    // random: a compass with a constant offset (steel structure, nearby
    // plant) and a stride length calibrated for someone else.
    const heading = (s.headingDeg + headingBiasDeg) * RAD;
    const length = s.lengthM * lengthScale;
    p = { x: p.x + length * Math.sin(heading), y: p.y + length * Math.cos(heading) };
  }
  return p;
}

// A walk from a known point at the stair core: down a corridor, turn, and into
// a plant room. Sixty steps of about three-quarters of a metre.
const WALK: Step[] = [
  ...Array.from({ length: 40 }, () => ({ headingDeg: 90, lengthM: 0.75 })),
  ...Array.from({ length: 20 }, () => ({ headingDeg: 0, lengthM: 0.75 })),
];

const START: Position = { x: 0, y: 0 };
const TRUTH = integrate(START, WALK, 0, 1);

console.log(`a ${WALK.length}-step walk from a known point, ${(WALK.length * 0.75).toFixed(0)} m of travel`);
console.log(`true end point: (${TRUTH.x.toFixed(2)}, ${TRUTH.y.toFixed(2)})`);
console.log('');
console.log('what the same walk produces with realistic systematic error:');
console.log('');
console.log('  compass bias   stride error   computed end point      off by');
for (const [bias, scale] of [[0, 1.0], [2, 1.0], [0, 1.06], [2, 1.06], [5, 1.1], [-3, 0.94]] as const) {
  const p = integrate(START, WALK, bias, scale);
  const off = Math.hypot(p.x - TRUTH.x, p.y - TRUTH.y);
  console.log(
    `  ${`${bias > 0 ? '+' : ''}${bias} deg`.padStart(12)}   ${`${((scale - 1) * 100).toFixed(0)}%`.padStart(12)}   ` +
      `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`.padStart(20) + `   ${off.toFixed(2).padStart(6)} m`
  );
}
console.log('');

// The property that decides whether dead reckoning is usable at all.
console.log('how the error grows along one walk (2 degrees of compass bias, 6% long stride):');
console.log('');
console.log('  steps   metres walked   off by');
for (const n of [10, 20, 30, 40, 50, 60]) {
  const partial = WALK.slice(0, n);
  const t = integrate(START, partial, 0, 1);
  const p = integrate(START, partial, 2, 1.06);
  console.log(
    `  ${String(n).padStart(5)}   ${(n * 0.75).toFixed(1).padStart(13)}   ${Math.hypot(p.x - t.x, p.y - t.y).toFixed(2).padStart(6)} m`
  );
}
console.log('');
console.log('The error grows with distance travelled, because both sources are systematic —');
console.log('it does not average out the way random noise would. Note the flattening between');
console.log('40 and 50 steps: that is where the walk turns 90 degrees, and the accumulated');
console.log('error partly cancels in the new direction. The error is a VECTOR, not a');
console.log('magnitude, so a turn can mask it temporarily and a straight run reveals it.');
console.log('');

// Which is why the answer is not a better integrator.
console.log('So dead reckoning alone is not a positioning system. What makes it usable is');
console.log('CORRECTION at known points, and the graph from Lesson 489 is where the known');
console.log('points come from:');
console.log('');
const CORRECT_EVERY = 15;
let corrected = { ...START };
let worst = 0;
for (let i = 0; i < WALK.length; i += CORRECT_EVERY) {
  const leg = WALK.slice(i, i + CORRECT_EVERY);
  const legTruth = integrate({ x: 0, y: 0 }, leg, 0, 1);
  const legDrift = integrate({ x: 0, y: 0 }, leg, 2, 1.06);
  worst = Math.max(worst, Math.hypot(legDrift.x - legTruth.x, legDrift.y - legTruth.y));
  // At a known point — a door the graph names, a scanned tag, a beacon — the
  // accumulated error is discarded rather than carried forward.
  corrected = { x: corrected.x + legTruth.x, y: corrected.y + legTruth.y };
}
console.log(`  correcting every ${CORRECT_EVERY} steps caps the error at ${worst.toFixed(2)} m`);
console.log(`  against ${Math.hypot(integrate(START, WALK, 2, 1.06).x - TRUTH.x, integrate(START, WALK, 2, 1.06).y - TRUTH.y).toFixed(2)} m for the uncorrected walk`);
console.log('');
console.log('The correction interval is the accuracy. That is a statement about how many');
console.log('known points the building has, not about the algorithm — which is why indoor');
console.log('positioning is an installation question before it is a software one.');
console.log('');
console.log('And no absolute accuracy figure appears above, because there is not one: it');
console.log('depends on the stride, the compass, the structure, and the spacing of whatever');
console.log('known points exist. What is printed is how the error behaves.');
```

## When to Use
- Any field app used inside buildings, which is nearly all of them
- When scoping an indoor requirement, where the number of known points determines the achievable accuracy
- When a finding is attributed to the wrong space, where an unfiltered indoor fix is the first suspect
- Alongside Lesson 489's graph, which is what turns an unconstrained estimate into a position that is at least possible

## Common Mistakes
- **Treating the indoor fix as a degraded outdoor fix** — it is a different measurement, and it names the wrong building rather than the wrong room
- **Promising room-level accuracy without known points** — the correction interval is the accuracy, and with no known points there is no interval
- **Averaging network-derived fixes** — averaging helps with noise, and this error is not noise
- **Assuming dead reckoning error averages out** — the dominant sources are biases, and a bias integrates
- **Calibrating a stride once, for one person** — every inspector has a different one, and the error scales with the mismatch
- **Ignoring the graph** — it cannot improve a measurement and it can reject an impossible one, which is often the more valuable operation
- **Quoting an absolute indoor accuracy figure** — it depends on the stride, the compass, the structure and the spacing of known points, so the honest artefact is the error model rather than a number

## Further Reading
- [Dead reckoning](https://en.wikipedia.org/wiki/Dead_reckoning) — the technique and its error characteristics, in the navigation tradition it comes from
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — what the platform promises and does not promise about the source of a position
- [MDN: GeolocationCoordinates.accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy) — the field whose indoor value this lesson is about
- [IndoorGML (OGC)](https://www.ogc.org/standard/indoorgml/) — a standard for the indoor graph a position can be constrained to

```recall
- q: "What happens to GPS accuracy indoors, and why is it not a tuning problem?"
  must:
    - "the reported accuracy comes back in the hundreds or thousands of metres"
    - "the satellite signal is attenuated by the structure"
    - "so the position is network- or wifi-derived — a different measurement in the same field"

- q: "Name the three replacements and the main limitation of each."
  must:
    - "known-point scanning — exact when scanned, nothing in between, and it requires installation and survey"
    - "dead reckoning — error accumulates because compass bias and stride error are systematic"
    - "the routing graph — constrains what a position may claim rather than improving the measurement"

- q: "What does 'the correction interval is the accuracy' mean?"
  must:
    - "dead reckoning error grows with distance from the last known point"
    - "so correcting more often caps it lower"
    - "which makes achievable accuracy a function of how many known points the building has — an installation question"
```
