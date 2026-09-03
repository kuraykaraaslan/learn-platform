# 482. Alerting on Sensor Data Without Crying Wolf: Hysteresis, Debounce, Dead Bands

## What It Is
A threshold and a sensor sitting near it produce an alert every time the noise crosses the line. Each alert is correct — the value really was above the threshold — and the sequence is useless, because a person receiving forty of them learns to ignore the forty-first, which is the one that mattered.

The fix is to stop treating "is the value above the line" as the alerting condition, and there are three standard ways to do it. **Hysteresis** uses two lines instead of one: it takes more to turn the alert on than to turn it off, so noise smaller than the gap between them cannot rattle it. **A dead band** is a zone around the threshold in which nothing is decided at all — simpler than hysteresis, and stateless in the sense that only the current value matters. **Debounce** requires the condition to hold for several consecutive samples before it counts, which removes noise in exact proportion to the latency it adds.

The run below applies all four rules — the bare threshold and the three fixes — to the same thirty-five readings, and reports what each produced. The bare threshold raises ten alerts. The other three raise one each, and find the real excursion within a sample or two of when it starts.

**Every one of these costs something, and the cost is latency.** A debounce of three samples reports three samples late. Hysteresis with a wide gap will not fire until the value has moved well past the threshold. There is no rule that removes noise for free, and choosing the parameters means deciding how much delay an alert may carry — which is a question about the physical process, not about the code.

The failure mode of the fix is worth knowing too. **Hysteresis is not a noise filter**; it filters noise *smaller than the gap between its two lines*. A signal that swings past both lines flaps exactly as much as it did before, and choosing the gap means measuring your own sensor's noise amplitude rather than taking a default from anywhere.

```quiz
- q: "A bare threshold on a noisy sensor raises ten alerts in half an hour. Are the alerts wrong?"
  anchor: "Each alert is correct"
  options:
    - text: "Yes — the rule has a bug"
      correct: false
      why: "Every one of them is a true statement about a sample. That is what makes this hard to argue about and easy to ship."
    - text: "No — each is correct about a sample, and the sequence is wrong about what a person should be told"
      correct: true
      why: "Which is why the fix is at the rule level rather than in the data."
    - text: "Only the ones during the real excursion are correct"
      correct: false
      why: "All of them are correct. The noise crossings really did cross."

- q: "What does every noise-suppression rule cost?"
  anchor: "the cost is latency"
  options:
    - text: "Sensitivity — small real excursions are missed"
      correct: false
      why: "A real risk with a badly chosen gap, and not the universal cost. Latency is."
    - text: "Latency — the alert arrives later, in proportion to the noise removed"
      correct: true
      why: "A debounce of three samples reports three samples late; that is the price, stated."
    - text: "Nothing, if the parameters are chosen well"
      correct: false
      why: "Good parameters choose how much latency to pay. They do not avoid paying."
```

## Key Concepts
- **A correct alert can still be a useless alert** — every crossing was real
- **Hysteresis**: two lines, so it takes more to turn on than to turn off
- **Dead band**: a zone around the threshold where nothing is decided
- **Debounce**: require N consecutive samples before the condition counts
- **All three cost latency**, in proportion to the noise they remove
- **Hysteresis filters noise smaller than its gap** — a wider swing flaps regardless
- **Choosing the gap means measuring your sensor's noise**, not taking a default
- **Alert on absence too**: a device that stops reporting raises nothing, and that is the worst failure (Lesson 479)
- **Rollups must keep min and max** or the excursion is averaged away before the rule sees it (Lesson 477)

## Example Code
Four rules, the same readings, and what each one actually produced:

```typescript run
// readings. The alert counts below are what each rule actually produced.

// Half an hour of readings from a sensor hovering around 25.0, with real
// measurement noise and one genuine excursion at the end.
const THRESHOLD = 25.0;
const READINGS = [
  24.8, 25.1, 24.9, 25.2, 24.7, 25.0, 25.3, 24.6, 25.1, 24.9,
  25.4, 24.8, 25.2, 24.9, 25.1, 24.7, 25.3, 25.0, 24.8, 25.2,
  // The excursion that should actually page someone.
  26.1, 26.8, 27.4, 27.9, 28.2, 28.0, 27.6, 27.1, 26.4, 25.8,
  25.1, 24.9, 24.8, 25.1, 24.9,
];

type Rule = { name: string; step: (value: number) => boolean };

/** Fires whenever the value is above the line. The rule everyone writes first. */
function bare(): Rule {
  return { name: 'bare threshold', step: (v) => v > THRESHOLD };
}

/** Two lines instead of one: it takes MORE to turn on than to turn off, so
 *  noise around a single line cannot rattle it. */
function hysteresis(on: number, off: number): Rule {
  let firing = false;
  return {
    name: `hysteresis (on ${on}, off ${off})`,
    step: (v) => {
      if (!firing && v > on) firing = true;
      else if (firing && v < off) firing = false;
      return firing;
    },
  };
}

/** A band around the line inside which nothing is decided at all. Simpler
 *  than hysteresis and it has no memory, which is sometimes what you want. */
function deadBand(width: number): Rule {
  let firing = false;
  return {
    name: `dead band (+/- ${width})`,
    step: (v) => {
      if (v > THRESHOLD + width) firing = true;
      else if (v < THRESHOLD - width) firing = false;
      return firing;
    },
  };
}

/** Requires the condition to hold for N consecutive samples before it counts.
 *  Costs latency, in exact proportion to how much noise it removes. */
function debounce(samples: number): Rule {
  let consecutive = 0;
  return {
    name: `debounce (${samples} samples)`,
    step: (v) => {
      consecutive = v > THRESHOLD ? consecutive + 1 : 0;
      return consecutive >= samples;
    },
  };
}

type Outcome = { name: string; transitions: number; firstFireIndex: number; firingSamples: number };

function evaluate(rule: Rule): Outcome {
  let previous = false;
  let transitions = 0;
  let firstFireIndex = -1;
  let firingSamples = 0;
  READINGS.forEach((value, i) => {
    const firing = rule.step(value);
    if (firing) firingSamples++;
    if (firing && !previous) {
      transitions++;
      if (firstFireIndex === -1) firstFireIndex = i;
    }
    previous = firing;
  });
  return { name: rule.name, transitions, firstFireIndex, firingSamples };
}

console.log(`${READINGS.length} readings, threshold ${THRESHOLD}, one real excursion starting at sample 20`);
console.log('');
console.log('rule                              alerts raised   first at   samples firing');
for (const rule of [bare(), hysteresis(25.5, 24.9), deadBand(0.5), debounce(3)]) {
  const o = evaluate(rule);
  console.log(
    `  ${o.name.padEnd(32)} ${String(o.transitions).padStart(5)}       ` +
      `${String(o.firstFireIndex).padStart(8)}   ${String(o.firingSamples).padStart(6)}`
  );
}
console.log('');
console.log('The bare threshold raises an alert for every crossing of a line the sensor is');
console.log('sitting on. It is not wrong about any individual sample — the value really was');
console.log('above 25.0 each time. It is wrong about what a person should be told.');
console.log('');
const EXCURSION_START = 20;
const debounced = evaluate(debounce(3));
console.log(`The other three all find the excursion. What they differ in is when: the`);
console.log(`debounce rule first fires at sample ${debounced.firstFireIndex}, ${debounced.firstFireIndex - EXCURSION_START} after the excursion began, and that`);
console.log('latency is the price of the alerts it did not raise. There is no rule that');
console.log('removes noise for free.');
console.log('');

// The failure mode of the fix, which is the part usually left out.
const quiet = [24.8, 25.6, 24.8, 25.6, 24.8, 25.6, 24.8, 25.6];
const fresh = hysteresis(25.5, 24.9);
let flaps = 0;
let prev = false;
for (const v of quiet) {
  const now = fresh.step(v);
  if (now && !prev) flaps++;
  prev = now;
}
console.log(`a signal swinging past BOTH hysteresis lines every sample: ${flaps} alerts from ${quiet.length} readings`);
console.log('Hysteresis is not a noise filter. It filters noise SMALLER than the gap between');
console.log('its two lines, and choosing that gap means knowing the noise amplitude — which');
console.log('is a measurement of your own sensor, not a default anyone can hand you.');
```

## When to Use
- Any alert on a continuous measurement, which is every alert in a telemetry system
- When an on-call rotation is ignoring a class of alert, where the alert rule rather than the people is usually the thing to change
- When choosing parameters, where the sensor's own noise amplitude is a measurement you can take from the data you already have
- Alongside an absence check, since the three rules here all watch a value and none of them fires when the value stops arriving

## Common Mistakes
- **Shipping a bare threshold** — it is correct on every sample and unusable in aggregate, and it is what everyone writes first
- **Choosing a hysteresis gap by feel** — the gap has to exceed the noise amplitude, which is measurable from the existing data
- **Assuming hysteresis removes flapping** — it removes flapping smaller than its gap, and a wider swing flaps exactly as before
- **Ignoring the latency** — every rule here delays the alert, and how much delay is acceptable is a question about the process being measured
- **Not alerting on silence** — a device that died raises no threshold alert at all, which makes the worst outcome the quietest one
- **Averaging before alerting** — a rollup that keeps only the mean has already removed the excursion the rule was looking for (Lesson 477)

## Further Reading
- [ThingsBoard documentation](https://thingsboard.io/docs/) — a rule engine's own alarm nodes, including how it models an alarm's clear condition separately from its raise condition
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — the Last Will, which is the absence signal these rules cannot provide (Lesson 471)
- [PostgreSQL window functions](https://www.postgresql.org/docs/current/functions-window.html) — for evaluating a debounce or a dead band over stored data rather than a live stream

```recall
- q: "Name the three noise-suppression rules and what each does."
  must:
    - "hysteresis — two lines, so it takes more to turn on than to turn off"
    - "dead band — a zone around the threshold where nothing is decided"
    - "debounce — the condition must hold for N consecutive samples"

- q: "What do all three cost, and how is the amount chosen?"
  must:
    - "latency, in proportion to the noise removed"
    - "a debounce of three samples reports three samples late"
    - "how much delay is acceptable is a question about the physical process"

- q: "State the limit of hysteresis and what choosing its gap requires."
  must:
    - "it filters noise smaller than the gap between its two lines"
    - "a signal swinging past both lines flaps exactly as before"
    - "so the gap must exceed the sensor's measured noise amplitude, not a default"
```
