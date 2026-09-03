# 486. Desired vs Reported State: Reconciliation and the Staleness Window

## What It Is
A twin holds two answers to the same question — what the thing should be doing, and what it last said it was doing — and the interesting work is in the gap between them. This is Lesson 479's fleet-configuration pattern applied to physical state, and it has one extra failure mode that makes it harder.

The extra failure is **staleness**. In a fleet, a device that has not reported is visibly a device that has not reported. Here, the reported value is a number, and a number compares fine. A point whose last reading was ninety minutes ago on a five-minute cadence will compare cleanly against its setpoint and produce a confident "in sync" — about a state of affairs from ninety minutes ago. The comparison did not fail; it answered a question nobody asked.

So reconciliation needs a **staleness window** before it needs a comparison, and it produces more than two states. There are four that matter and they need different responses: **no target set** (the point is reporting only, and nothing is wrong); **never reported** (the binding may be broken, per Lesson 485); **stale** (nothing is known, and the comparison must not be attempted); and only then **converged** or **diverged**.

Divergence itself splits, and this is the distinction that decides whether anyone is woken up. A setpoint changed thirty seconds ago is *expected* to disagree — the plant is still moving. A setpoint that has disagreed for four hours is a fault. Same numbers, opposite meanings, and the only thing separating them is **when the target was set**. A reconciliation that reports divergence without duration pages for both.

The last piece is the tolerance. Comparing two floating-point measurements for equality is meaningless, so there is a band, and the band belongs below the sensor's own resolution — which is Lesson 482's dead band, in a different place and for the same reason.

```quiz
- q: "A point's reported value matches its setpoint exactly, and its last reading was ninety minutes ago on a five-minute cadence. What does the comparison tell you?"
  anchor: "The comparison did not fail; it answered a question nobody asked"
  options:
    - text: "That it is in sync"
      correct: false
      why: "That it WAS in sync ninety minutes ago. Nothing is known about now, and reporting it as in sync is a confident statement about the past."
    - text: "Almost nothing — the reading is too old for the comparison to be about the present"
      correct: true
      why: "Which is why the staleness window is checked before the comparison, not after."
    - text: "That the sensor is broken"
      correct: false
      why: "Probably, and that is a separate conclusion. What the comparison itself established is only that nothing current is known."

- q: "Two points each report four degrees above their setpoint. Why might only one of them be a fault?"
  anchor: "the only thing separating them is **when the target was set**"
  options:
    - text: "Because the sensors have different tolerances"
      correct: false
      why: "Possible and not the distinction here. Both gaps exceed any reasonable tolerance."
    - text: "Because one setpoint changed a minute ago and the plant is still moving; the other has disagreed for hours"
      correct: true
      why: "Same numbers, opposite meanings, and the duration is what separates them."
    - text: "Because one is a measurement and the other is a computed value"
      correct: false
      why: "That distinction matters and belongs to Lesson 491. This one is about time."
```

## Key Concepts
- **Desired and reported**, as in Lesson 479, applied to physical state
- **Staleness is the extra failure**: an old number compares cleanly and means nothing
- **Check the window before the comparison** — not after, and not instead
- **Four states before you get to a comparison**: no target, never reported, stale, then converged or diverged
- **Divergence needs a duration**: settling and stuck have identical numbers
- **When the target was set** is what separates them
- **A tolerance band is required** — comparing measurements for equality is meaningless (Lesson 482)
- **The band belongs below the sensor's resolution**, or it reports noise as divergence
- **"Nothing is known" must be expressible**, or it is reported as agreement

## Example Code
The reconciliation, with all four states and the duration that distinguishes settling from stuck:

```typescript run
// said anything recently enough for the comparison to mean anything.
type PointValue = { value: number; at: string };

type TwinPoint = {
  pointId: string;
  /** What the twin has been told to want. Null when nothing was ever asked. */
  desired: PointValue | null;
  /** What the physical thing last said. Null when it has never reported. */
  reported: PointValue | null;
};

/** Four states, not two. A boolean "in sync" collapses the two that need
 *  different responses: one of them is a control problem and the other is a
 *  data problem, and only the second one is urgent. */
type Reconciliation =
  | { state: 'no-target' }
  | { state: 'never-reported' }
  | { state: 'stale'; ageSeconds: number }
  | { state: 'converged'; gap: number }
  | { state: 'diverged'; gap: number; forSeconds: number };

/** The staleness window is the whole reason this is not a comparison. A point
 *  that reported ten minutes ago on a five-minute cadence is not telling you
 *  the current state of anything, and comparing it to `desired` produces a
 *  confident answer about the past. */
const STALENESS_WINDOW_S = 600;
/** How far apart the two may be before it counts. Below the sensor's own
 *  resolution, a difference is noise (Lesson 482's dead band, applied here). */
const TOLERANCE = 0.5;

function reconcile(point: TwinPoint, nowIso: string): Reconciliation {
  const now = Date.parse(nowIso);
  if (point.desired === null) return { state: 'no-target' };
  if (point.reported === null) return { state: 'never-reported' };

  const ageSeconds = (now - Date.parse(point.reported.at)) / 1000;
  if (ageSeconds > STALENESS_WINDOW_S) return { state: 'stale', ageSeconds };

  const gap = point.reported.value - point.desired.value;
  if (Math.abs(gap) <= TOLERANCE) return { state: 'converged', gap };

  // How long it has been trying. A setpoint changed thirty seconds ago is
  // expected to disagree; one that has disagreed for an hour is a fault.
  const forSeconds = (now - Date.parse(point.desired.at)) / 1000;
  return { state: 'diverged', gap, forSeconds };
}

const NOW = '2026-03-01T12:00:00Z';

const POINTS: TwinPoint[] = [
  { pointId: 'ahu-1/supply-temp', desired: { value: 18.0, at: '2026-03-01T09:00:00Z' }, reported: { value: 18.2, at: '2026-03-01T11:58:00Z' } },
  { pointId: 'ahu-2/supply-temp', desired: { value: 18.0, at: '2026-03-01T11:59:30Z' }, reported: { value: 22.4, at: '2026-03-01T11:59:50Z' } },
  { pointId: 'ahu-3/supply-temp', desired: { value: 18.0, at: '2026-03-01T08:00:00Z' }, reported: { value: 24.1, at: '2026-03-01T11:59:00Z' } },
  { pointId: 'ahu-4/supply-temp', desired: { value: 18.0, at: '2026-03-01T09:00:00Z' }, reported: { value: 18.1, at: '2026-03-01T10:40:00Z' } },
  { pointId: 'ahu-5/supply-temp', desired: { value: 18.0, at: '2026-03-01T09:00:00Z' }, reported: null },
  { pointId: 'plant/flow-rate', desired: null, reported: { value: 3.4, at: '2026-03-01T11:59:00Z' } },
];

const describe = (r: Reconciliation): string => {
  switch (r.state) {
    case 'no-target': return 'no target set — reporting only';
    case 'never-reported': return 'has never reported';
    case 'stale': return `last reported ${(r.ageSeconds / 60).toFixed(0)} min ago — comparison is meaningless`;
    case 'converged': return `converged (gap ${r.gap.toFixed(1)})`;
    case 'diverged': return `diverged by ${r.gap.toFixed(1)} for ${(r.forSeconds / 60).toFixed(0)} min`;
  }
};

console.log(`reconciling at ${NOW}, staleness window ${STALENESS_WINDOW_S / 60} min, tolerance ${TOLERANCE}`);
console.log('');
for (const point of POINTS) {
  const r = reconcile(point, NOW);
  console.log(`  ${point.pointId.padEnd(20)} ${r.state.padEnd(15)} ${describe(r)}`);
}
console.log('');

// Why the fourth state earns its keep: two points with identical numbers and
// opposite meanings.
const settling = POINTS[1];
const broken = POINTS[2];
console.log('ahu-2 and ahu-3 both report roughly 4-6 above target. A boolean would call both');
console.log('"out of sync" and page for both. The difference is when the target was set:');
console.log(`  ahu-2  target set ${((Date.parse(NOW) - Date.parse(settling.desired!.at)) / 60000).toFixed(0)} min ago — it is still settling`);
console.log(`  ahu-3  target set ${((Date.parse(NOW) - Date.parse(broken.desired!.at)) / 60000).toFixed(0)} min ago — it is not going to`);
console.log('');
console.log('And ahu-4 is the state that a comparison gets confidently wrong: its numbers');
console.log('agree, so a boolean says "in sync", but it has not reported for over an hour.');
console.log('What that actually means is that nothing is known about it at all.');
```

## When to Use
- Any twin that holds a target as well as an observation — a setpoint, a schedule, a commanded position
- When an alerting rule fires on divergence, where the duration is what makes it actionable
- When a dashboard shows green, where the staleness window is what stops green meaning "we last heard from it before lunch"
- When choosing the tolerance, where the sensor's own resolution is measurable from the data you already have

## Common Mistakes
- **Comparing before checking staleness** — an old value compares fine and produces a confident answer about the past
- **A boolean in-sync flag** — it collapses the four states, and the two it merges need opposite responses
- **Reporting divergence without duration** — settling and stuck look identical, so either both page or neither does
- **No tolerance band** — two floating-point measurements are never equal, so everything diverges
- **A tolerance below the sensor's resolution** — it reports the sensor's own noise as a control fault
- **Treating "no target set" as an error** — plenty of points are observations only, and flagging them fills the report with things that are working

## Further Reading
- [Digital Twin Definition Language (DTDL)](https://github.com/Azure/opendigitaltwins-dtdl) — how one ontology separates a desired property from a reported one, as a concrete example
- [NGSI-LD specifications (FIWARE)](https://github.com/FIWARE/specifications) — a second model of the same distinction, with different vocabulary
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — retained messages and the Last Will, which are how the reported side arrives and how its absence is signalled (Lesson 471)

```recall
- q: "What does the staleness window protect against, and when is it checked?"
  must:
    - "an old reported value compares cleanly against a target and produces a confident answer about the past"
    - "it is checked before the comparison, not after"
    - "so that 'nothing is known' is a state rather than an agreement"

- q: "Name the four states reconciliation produces before comparing."
  must:
    - "no target set — reporting only, nothing wrong"
    - "never reported — the binding may be broken"
    - "stale — nothing current is known"
    - "then converged or diverged"

- q: "Why does divergence need a duration?"
  must:
    - "a setpoint changed a minute ago is expected to disagree while the plant moves"
    - "one that has disagreed for hours is a fault"
    - "the numbers are identical; when the target was set is the difference"
```
