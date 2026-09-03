# 481. Edge Processing: What to Compute Before You Pay for Transport

## What It Is
Every byte a device sends costs something — airtime under Lesson 472's duty cycle, battery, or a line on a cellular bill. Edge processing is the decision to spend computation on the device instead, and the question is not whether it is a good idea in general but **which computations pay for themselves**.

Three shapes almost always do. **Aggregation**: send an hourly minimum, maximum, mean and count instead of three hundred samples, and the transport cost drops by two orders of magnitude while the alerting signal survives — which is the same argument Lesson 477's rollup makes on the storage side. **Change detection**: send only when the value moves by more than a dead band, so a sensor watching something stable falls silent, with a heartbeat so silence is distinguishable from death. **Filtering**: drop the sample that is obviously a sensor fault before it costs anything to transmit, and count how many you dropped so the fault is visible.

Two shapes almost never do. **Anything requiring data the device does not have** — a comparison against a fleet average, a lookup against another system — moves the data to the device, which is what you were trying to avoid. And **anything whose logic changes often**, because logic on a device is firmware, and firmware is Lesson 479's staged rollout with a rollback plan rather than a deploy.

That last point is the real constraint, and it is worth stating plainly: **edge processing converts a bandwidth cost into a deployment cost.** A threshold on the server changes in a config push; the same threshold in edge code changes in a firmware release. Which one is cheaper depends on how often it changes and how many devices there are, and both are knowable in advance.

The other thing that always stays is the **raw data question**. Aggregating at the edge means the samples behind the aggregate never existed anywhere. If a dispute, a calibration or an investigation might need them, the aggregate is not a summary — it is the only record, and the decision to have made it is permanent.

```quiz
- q: "Which computation is a poor candidate for the edge?"
  anchor: "moves the data to the device, which is what you were trying to avoid"
  options:
    - text: "Hourly aggregation of the device's own samples"
      correct: false
      why: "The best candidate there is: two orders of magnitude less transport, computed from data the device already has."
    - text: "Comparing a reading against the fleet's current average"
      correct: true
      why: "The device does not have the fleet average, so providing it means transporting data to the device."
    - text: "Dropping samples that are outside the sensor's physical range"
      correct: false
      why: "Cheap, local, and it prevents a transmission — a good candidate."

- q: "What does edge processing convert a bandwidth cost into?"
  anchor: "converts a bandwidth cost into a deployment cost"
  options:
    - text: "A compute cost, paid in device battery"
      correct: false
      why: "Real, and usually small next to transmission. The structural cost is elsewhere."
    - text: "A deployment cost — logic on a device is firmware, and changing it is a staged rollout"
      correct: true
      why: "A threshold on the server changes in a config push; the same threshold on the device changes in a firmware release."
    - text: "A storage cost, since the device must buffer more"
      correct: false
      why: "Aggregation reduces what must be buffered rather than increasing it."
```

## Key Concepts
- **The unit of cost is the transmitted byte** — airtime, battery, or a bill
- **Aggregation pays**: minimum, maximum, mean and count instead of every sample
- **Change detection pays**: send on movement past a dead band, with a heartbeat so silence is legible
- **Local filtering pays**: drop an obvious sensor fault before it costs anything, and count the drops
- **Anything needing external data does not pay** — it inverts the transfer
- **Anything that changes often does not pay** — device logic is firmware (Lesson 479)
- **Bandwidth cost becomes deployment cost**, and which is cheaper is calculable in advance
- **A heartbeat is mandatory** with change detection, or a dead device looks like a stable one
- **Aggregating destroys the samples** — if anyone might need them, the aggregate is the only record

## Example Code
There is no runtime here: what this lesson describes runs on the device, and the honest artefact is the decision rather than a simulation of a radio. The arithmetic behind it, though, is simple enough to write down:

```typescript
/** What a reporting strategy costs, in the only unit that matters. Airtime per
 *  frame comes from Lesson 472's calculation, not from a datasheet's headline
 *  bit rate. */
type Strategy = {
  name: string;
  /** Frames the device sends per day under this strategy. */
  framesPerDay: number;
  /** Whether the individual samples still exist anywhere afterwards. */
  keepsRawSamples: boolean;
  /** Whether changing the logic requires a firmware release. */
  changeCost: 'config' | 'firmware';
};

const SAMPLES_PER_DAY = 24 * 60; // one a minute

export const STRATEGIES: Strategy[] = [
  { name: 'send every sample', framesPerDay: SAMPLES_PER_DAY, keepsRawSamples: true, changeCost: 'config' },
  // One frame an hour carrying min, max, mean and count.
  { name: 'hourly aggregate', framesPerDay: 24, keepsRawSamples: false, changeCost: 'firmware' },
  // Depends entirely on the signal: this is the number to measure on real
  // data before committing, not to assume.
  { name: 'change detection', framesPerDay: 0, keepsRawSamples: false, changeCost: 'firmware' },
];

/** The comparison that decides it. `changesPerYear` is how often the logic is
 *  expected to move; `devices` is how many units a firmware release has to
 *  reach. Both are knowable before any code is written. */
export function deploymentBurden(strategy: Strategy, changesPerYear: number, devices: number): number {
  // A config change touches a row; a firmware release touches every device,
  // through Lesson 479's staged rollout, with a rollback plan behind it.
  return strategy.changeCost === 'config' ? changesPerYear : changesPerYear * devices;
}

/** Change detection needs a heartbeat, or a device that died is
 *  indistinguishable from a signal that did not move. The heartbeat interval
 *  is therefore the detection latency for a dead device, and choosing it is
 *  choosing how long a failure may go unnoticed. */
export const HEARTBEAT_SECONDS = 3600;
```

## When to Use
- When transport is the dominant cost — a duty-cycled radio, a metered connection, a battery budget
- When the sampling rate needed for correctness is much higher than the rate needed for reporting
- When a device must act locally regardless of the link, where the computation was going to be local anyway
- When the raw samples genuinely have no downstream consumer, which is a question to ask rather than assume

## Common Mistakes
- **Change detection without a heartbeat** — a dead device and a stable signal look identical, and the failure is discovered when someone goes to look
- **Aggregating away data someone later needs** — the samples behind the aggregate never existed anywhere else, and the decision is permanent
- **Putting frequently-changing logic on the device** — every threshold adjustment becomes a firmware release with a staged rollout
- **Edge computation requiring server data** — it inverts the transfer and adds a dependency on a link that may be down
- **Not counting what was filtered** — dropped samples that are not counted make a sensor fault invisible
- **Assuming the transport saving without measuring the signal** — change detection's frame count depends entirely on how much the value moves, which is a measurement rather than an estimate

## Further Reading
- [RP002-1.0.4 regional parameters](https://resources.lora-alliance.org/technical-specifications/rp002-1-0-4-regional-parameters) — where the transport budget this lesson is spending comes from
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — message expiry and topic aliases, two protocol-level ways to spend fewer bytes without moving computation
- [ThingsBoard documentation](https://thingsboard.io/docs/) — where a platform's rule engine does the same aggregation on the server side, for comparison (Lesson 480)

```recall
- q: "Name three computations that pay for themselves at the edge."
  must:
    - "aggregation — min, max, mean and count instead of every sample"
    - "change detection — send on movement past a dead band, with a heartbeat"
    - "local filtering — drop an obvious sensor fault, and count the drops"

- q: "Name two that do not, and why."
  must:
    - "anything needing data the device does not have — it inverts the transfer"
    - "anything whose logic changes often — device logic is firmware, and changing it is a staged rollout"

- q: "What does edge processing trade away besides samples?"
  must:
    - "a bandwidth cost becomes a deployment cost"
    - "a threshold on the server changes with a config push; on the device it changes with a firmware release"
    - "and aggregating destroys the underlying samples permanently"
```
