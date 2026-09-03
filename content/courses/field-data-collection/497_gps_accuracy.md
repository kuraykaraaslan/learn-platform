# 497. GPS Accuracy: Horizontal Error, Fix Quality, and When to Reject a Point

## What It Is
Lesson 441 established that a coordinate is only meaningful with its reference system. This lesson is about the other half: **a position from a phone is a measurement, and its accuracy is a variable the device reports to you.**

The field to read is the horizontal accuracy, and what it means is more specific than most people assume. The Geolocation API defines it as the radius of a **95% confidence circle** — so the true position is inside it nineteen times in twenty, and **outside it one time in twenty**. It is not a worst case, and a fix reporting eight metres is not a guarantee of eight metres.

Two properties follow and both matter. **Area grows with the square** of the figure, so a number that reads as a small increase is not one — going from eight metres to thirty-two is sixteen times the area. And **an accuracy in the hundreds or thousands of metres is a different measurement wearing the same field name**: it is a position derived from network or wifi rather than from satellites, which is what a device returns when it cannot see the sky.

There is no correct threshold, because the threshold comes from what the app is doing. Deciding which *site* someone is on tolerates a hundred metres; deciding which *building* wants tens; deciding which *room* wants metres, which a phone outdoors will rarely give and indoors will not give at all (Lesson 498). Staking out a survey point is not achievable from a phone, and knowing that is more useful than a filter that tries.

The last piece is that **precision and currency are separate questions**. A cached fix is a real position from somewhere the inspector was — possibly before lunch. A filter that checks only accuracy will happily record the most precise position in the log and attribute it to the wrong asset.

**No device-specific accuracy figure appears in this lesson, and none should.** It depends on the handset, the constellation in view, the sky, and the weather. What the run gives you is how to read what your own device reports.

```quiz
- q: "A fix reports an accuracy of 8 metres. What does that mean?"
  anchor: "the true position is inside it nineteen times in twenty, and **outside it one time in twenty**"
  options:
    - text: "The position is within 8 metres of the truth"
      correct: false
      why: "It is within 8 metres nineteen times in twenty. One fix in twenty is outside, and there is no flag on that one."
    - text: "The truth is inside an 8-metre circle with 95% confidence — so one fix in twenty is worse"
      correct: true
      why: "It is a confidence radius, not a bound."
    - text: "The device's hardware is accurate to 8 metres"
      correct: false
      why: "The figure is a per-fix estimate that changes with the sky, not a property of the hardware."

- q: "A fix reports an accuracy of 1200 metres. What has probably happened?"
  anchor: "a position derived from network or wifi rather than from satellites"
  options:
    - text: "The satellites are temporarily degraded"
      correct: false
      why: "Possible and rare. The ordinary cause is that the device gave up on satellites entirely."
    - text: "The position came from network or wifi rather than satellites — a different measurement in the same field"
      correct: true
      why: "Which is what a device indoors returns, and it is the signature to watch for."
    - text: "The accuracy field is in a different unit"
      correct: false
      why: "The unit is metres throughout. The magnitude is the signal."
```

## Key Concepts
- **A position is a measurement**, and the device reports how good it thinks it is
- **Horizontal accuracy is a 95% confidence radius** — one fix in twenty is outside it
- **Area grows with the square**: 8 m to 32 m is sixteen times the area
- **Hundreds or thousands of metres** means a network- or wifi-derived position
- **Vertical accuracy is usually several times worse**, for geometric reasons
- **There is no universal threshold** — it comes from what the app is deciding
- **Site, building, room** are three different requirements and only two are reachable
- **Precision and currency are separate**: a cached fix is a real position from earlier
- **A rejected fix and no fix are different outcomes**: one means wait, the other means this device will not give you one
- **No device-specific figure belongs in a lesson** — the reader reads their own

## Example Code
Five fixes, what each claims about itself, and what each is usable for:

```typescript run
// it thinks it is. Reading that field correctly is most of the work.
//
// No device-specific accuracy figure appears below, and none should: it depends
// on the handset, the constellation in view, the sky, and the weather. What is
// printed is how to read what YOUR device reports.
type Fix = {
  lat: number;
  lon: number;
  /** Metres. The Geolocation API defines this as the radius of a 95%
   *  confidence circle — so the true position is inside it 19 times in 20,
   *  and OUTSIDE it one time in 20. That is not a worst case. */
  accuracy: number;
  /** Metres, or null when the device has no vertical estimate. Usually
   *  several times worse than the horizontal figure, for geometric reasons. */
  altitudeAccuracy: number | null;
  timestamp: string;
  label: string;
};

/** What the app is trying to do decides the threshold. There is no universal
 *  one, and picking a number without a purpose is how a filter ends up either
 *  rejecting everything indoors or accepting a fix from the next street. */
type Purpose = { name: string; requiredAccuracyM: number; why: string };

const PURPOSES: Purpose[] = [
  { name: 'which site am I on', requiredAccuracyM: 100, why: 'sites are hundreds of metres apart' },
  { name: 'which building', requiredAccuracyM: 25, why: 'buildings on one site are tens of metres apart' },
  { name: 'which room', requiredAccuracyM: 3, why: 'rooms are metres apart — and see Lesson 498' },
  { name: 'stake out a survey point', requiredAccuracyM: 0.05, why: 'not achievable from a phone at all' },
];

const FIXES: Fix[] = [
  { lat: 51.5007, lon: -0.1246, accuracy: 8, altitudeAccuracy: 24, timestamp: '2026-03-01T09:00:00Z', label: 'open sky, several minutes settled' },
  { lat: 51.5008, lon: -0.1245, accuracy: 32, altitudeAccuracy: 90, timestamp: '2026-03-01T09:02:00Z', label: 'between buildings' },
  { lat: 51.5011, lon: -0.1240, accuracy: 1200, altitudeAccuracy: null, timestamp: '2026-03-01T09:04:00Z', label: 'indoors — network-derived, not satellite' },
  { lat: 51.5007, lon: -0.1247, accuracy: 65, altitudeAccuracy: null, timestamp: '2026-03-01T09:05:00Z', label: 'first fix, still converging' },
  { lat: 51.5007, lon: -0.1246, accuracy: 11, altitudeAccuracy: 30, timestamp: '2026-03-01T09:05:10Z', label: 'open sky again, just now' },
];

console.log('what each fix claims about itself:');
console.log('');
console.log('  accuracy   vertical   area of the 95% circle   fix looks like');
for (const f of FIXES) {
  const area = Math.PI * f.accuracy ** 2;
  const areaText = area > 1e6 ? `${(area / 1e6).toFixed(2)} km2` : `${area.toFixed(0)} m2`;
  console.log(
    `  ${String(f.accuracy).padStart(6)} m   ${(f.altitudeAccuracy === null ? 'none' : `${f.altitudeAccuracy} m`).padStart(8)}   ` +
      `${areaText.padStart(21)}   ${f.label}`
  );
}
console.log('');
console.log('The area grows with the SQUARE of the accuracy figure, which is why a number');
console.log('that reads as a small increase is not one. And an accuracy in the hundreds or');
console.log('thousands of metres is the signature of a position derived from network or');
console.log('wifi rather than from satellites — a different measurement wearing the same');
console.log('field name.');
console.log('');

console.log('which fixes are usable, by what the app is doing:');
console.log('');
const header = ['purpose', ...FIXES.map((_, i) => `fix ${i + 1}`)];
console.log(`  ${header[0].padEnd(34)} ${header.slice(1).map((h) => h.padStart(7)).join(' ')}`);
for (const p of PURPOSES) {
  const cells = FIXES.map((f) => (f.accuracy <= p.requiredAccuracyM ? 'ok' : 'no').padStart(7));
  console.log(`  ${`${p.name} (<=${p.requiredAccuracyM} m)`.padEnd(34)} ${cells.join(' ')}`);
}
console.log('');
for (const p of PURPOSES) console.log(`  ${p.name}: ${p.why}`);
console.log('');

/** The filter, with the threshold as an argument rather than a constant. A
 *  rejected fix is a distinct outcome from no fix at all: one means "wait and
 *  try again", the other means "this device is not going to give you one". */
type FixDecision =
  | { use: true; fix: Fix }
  | { use: false; reason: 'too-imprecise'; accuracy: number; needed: number }
  | { use: false; reason: 'no-vertical'; }
  | { use: false; reason: 'stale'; ageSeconds: number };

const MAX_FIX_AGE_S = 30;

function decide(fix: Fix, purpose: Purpose, nowIso: string, needsHeight: boolean): FixDecision {
  const ageSeconds = (Date.parse(nowIso) - Date.parse(fix.timestamp)) / 1000;
  // A cached fix is a real position from somewhere you were. Lesson 474's
  // staleness argument, on the device side.
  if (ageSeconds > MAX_FIX_AGE_S) return { use: false, reason: 'stale', ageSeconds };
  if (fix.accuracy > purpose.requiredAccuracyM) {
    return { use: false, reason: 'too-imprecise', accuracy: fix.accuracy, needed: purpose.requiredAccuracyM };
  }
  if (needsHeight && fix.altitudeAccuracy === null) return { use: false, reason: 'no-vertical' };
  return { use: true, fix };
}

const NOW = '2026-03-01T09:05:25Z';
const buildingLevel = PURPOSES[1];
console.log(`deciding at ${NOW} for "${buildingLevel.name}", height not required:`);
for (const [i, f] of FIXES.entries()) {
  const d = decide(f, buildingLevel, NOW, false);
  const text = d.use
    ? 'use it'
    : d.reason === 'too-imprecise'
      ? `reject: ${d.accuracy} m, needed ${d.needed} m`
      : d.reason === 'stale'
        ? `reject: ${d.ageSeconds.toFixed(0)} s old`
        : 'reject: no vertical estimate';
  console.log(`  fix ${i + 1}  ${text}`);
}
console.log('');
console.log("Note that fix 1 is the most precise of the five and is rejected anyway, because");
console.log('it is five minutes old. Precision and currency are separate questions, and a');
console.log('filter that only checks one of them will happily record a position from where');
console.log('the inspector was standing before lunch.');
```

## When to Use
- Any capture that records a position, which is most field capture
- When deciding whether a position is evidence of location or merely metadata
- When a filter is rejecting everything or accepting everything, where the threshold has probably been chosen without a purpose
- Before promising room-level accuracy, which outdoors is marginal and indoors is Lesson 498's subject

## Common Mistakes
- **Reading the accuracy figure as a bound** — it is a 95% radius, so one fix in twenty is worse and nothing marks it
- **Comparing accuracy figures linearly** — the area is what matters, and it goes as the square
- **Accepting a fix with an accuracy in the hundreds of metres** — that is a network-derived position, and it places the asset on the wrong street
- **Checking accuracy and not age** — the most precise fix in the log may be from where the inspector was standing an hour ago
- **A single threshold for the whole app** — deciding a site and deciding a room are different questions with different answers
- **Writing a device-specific figure into a spec** — it depends on the handset and the sky, so it will be wrong for somebody
- **Treating a rejected fix as no fix** — one means try again in a moment, the other means change the approach

## Further Reading
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — the definition of the accuracy attribute, which is the one sentence worth reading before interpreting it
- [MDN: GeolocationCoordinates.accuracy](https://developer.mozilla.org/en-US/docs/Web/API/GeolocationCoordinates/accuracy) — the same, with the 95% confidence wording stated plainly
- [GPS.gov](https://www.gps.gov/) — the official programme site, for what the system itself commits to as opposed to what a handset achieves
- [Circular error probable](https://en.wikipedia.org/wiki/Circular_error_probable) — the wider family of radial-error measures, and why a percentage has to be attached to one

```recall
- q: "What exactly does the horizontal accuracy field mean?"
  must:
    - "the radius of a 95% confidence circle"
    - "so the true position is outside it one time in twenty"
    - "it is not a worst case or a bound"

- q: "Give two things that follow from how the figure behaves."
  must:
    - "area grows with the square, so 8 m to 32 m is sixteen times the area"
    - "an accuracy in the hundreds or thousands of metres is a network- or wifi-derived position"
    - "a different measurement reported in the same field"

- q: "Why is there no universal accuracy threshold?"
  must:
    - "the threshold comes from what the app is deciding — site, building, or room"
    - "and precision is separate from currency: a cached fix is a real position from earlier"
    - "a device-specific figure depends on the handset, the constellation and the sky"
```
