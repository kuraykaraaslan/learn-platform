// Why a 3-sigma rule stops finding outliers once there are a few of them.
// Counted on a fixed series, not asserted.
//
// The effect is called masking: an outlier contributes to the standard
// deviation it is about to be judged against, so a handful of them inflate the
// yardstick until none of them looks unusual any more. The median and the
// median absolute deviation do not have this property, because neither moves
// when a minority of the points moves.
//
// This script takes one deterministic base series, injects k copies of a fixed
// artefact value for k = 0..6, and reports what each method finds.
//
//   classical : |x - mean| / sd            flagged above 3
//   robust    : 0.6745 * |x - median| / MAD  flagged above 3.5
//
// The 0.6745 constant and the 3.5 cutoff are the modified z-score as defined
// in the NIST/SEMATECH e-Handbook of Statistical Methods (section 1.3.5.17,
// after Iglewicz and Hoaglin); they are not tuned here.
//
// Determinism: the base series is generated from its index by fixed
// arithmetic, the artefact value and the cutoffs are literals, and output is
// ordered by k. No clock, no random, no library.

const N = 40;
const ARTEFACT = 6.5; // mm/s -- a transport artefact, not machine behaviour
const CLASSICAL_CUTOFF = 3;
const ROBUST_CUTOFF = 3.5;

/** A plausible vibration series: a level, a daily cycle, a small wobble. */
function baseSeries() {
  const out = [];
  for (let i = 0; i < N; i++) {
    const daily = 0.3 * Math.sin((2 * Math.PI * (i - 6)) / 24);
    const wobble = 0.05 * Math.sin(i * 1.7);
    out.push(Number((2.2 + daily + wobble).toFixed(3)));
  }
  return out;
}

const mean = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;

function sd(xs) {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, x) => a + (x - m) ** 2, 0) / (xs.length - 1));
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 === 0 ? (s[mid - 1] + s[mid]) / 2 : s[mid];
}

/** Median absolute deviation: the median of the distances to the median. */
function mad(xs) {
  const m = median(xs);
  return median(xs.map((x) => Math.abs(x - m)));
}

const base = baseSeries();

console.log(`base series: ${N} points, level 2.2 mm/s with a daily cycle`);
console.log(`artefact value injected: ${ARTEFACT} mm/s`);
console.log(`classical rule |z| > ${CLASSICAL_CUTOFF}, robust rule |modified z| > ${ROBUST_CUTOFF}`);
console.log('');
console.log('  k   mean     sd     max |z|   found     median    MAD     max |mz|   found');

for (let k = 0; k <= 6; k++) {
  // Replace the first k points with the artefact -- a fixed, repeatable choice.
  const xs = base.map((x, i) => (i < k ? ARTEFACT : x));

  const m = mean(xs);
  const s = sd(xs);
  const med = median(xs);
  const md = mad(xs);

  const z = xs.map((x) => Math.abs(x - m) / s);
  const mz = xs.map((x) => (md === 0 ? 0 : (0.6745 * Math.abs(x - med)) / md));

  const foundClassical = z.filter((v) => v > CLASSICAL_CUTOFF).length;
  const foundRobust = mz.filter((v) => v > ROBUST_CUTOFF).length;

  console.log(
    `  ${k}   ${m.toFixed(3)}   ${s.toFixed(3)}   ${Math.max(...z).toFixed(2).padStart(6)}   ${String(foundClassical).padStart(2)}/${k}` +
      `      ${med.toFixed(3)}   ${md.toFixed(3)}   ${Math.max(...mz).toFixed(2).padStart(7)}   ${String(foundRobust).padStart(2)}/${k}`
  );
}

console.log('');
console.log('Read the two "found" columns down the page. The classical rule finds every');
console.log('artefact up to three and then, at four, finds none at all -- not fewer, none.');
console.log('Each artefact it is trying to detect has already been added to the standard');
console.log('deviation it is being measured against, and by the fourth the yardstick has');
console.log('grown past it. The robust pair does not move: a minority of points cannot shift');
console.log('a median, so the yardstick stays the length it was.');
console.log('');
console.log('This is why an alarm built on a mean and a standard deviation gets quieter as');
console.log('a sensor gets worse, which is the opposite of what anyone designing it intended.');
