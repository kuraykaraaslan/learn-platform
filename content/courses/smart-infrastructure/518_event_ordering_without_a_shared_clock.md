# 518. Event Ordering Across Systems That Do Not Share a Clock

## What It Is
Two systems record events. SCADA logs "operator set the pump setpoint to 50". A PLC logs "applied setpoint 50". A standby PLC, after a failover, logs "applied setpoint 20". To reconstruct what happened — to answer "what setpoint is the device actually holding" — you need these events in order. The obvious key is the timestamp, and the obvious key is wrong, because the systems do not share a clock.

Clock skew is not a bug you fix with better NTP. A few hundred milliseconds of offset between two devices is normal, and control events are often milliseconds apart. Worse, a failover puts two events on two different devices' clocks by construction, and one of those clocks can be minutes off. Sort by wall-clock timestamp and you get an order that is plausible, monotonic, and not what happened — Lesson 474's three clocks, now with the added problem that the clocks belong to different systems.

The fix is to order by **causality** instead of by time. A **Lamport clock** is a per-node counter: increment it on every local event, and on receiving a message, set it to `max(local, received) + 1`. This guarantees that if event A caused event B, then `lamport(A) < lamport(B)` — a total order consistent with causality, with ties (genuinely concurrent events) broken by node id. A **version vector** goes further: it keeps a counter per node, so it can tell "A happened before B" from "A and B are concurrent" — which is the information you need to know whether a conflict is real or just apparent.

Neither of these needs a synchronised clock, and that is the point. They need the events to carry a little metadata — a counter, or a vector — set by the systems as they emit and exchange messages. Retrofitting that onto systems that do not emit it is the hard part, and where it is impossible, the honest position is that cross-system order is unknown for events closer together than the worst-case skew, and the integration contract (Lesson 522) has to say so.

```quiz
- q: "Why can't cross-system event order be recovered from timestamps, even with good clock sync?"
  anchor: "A few hundred milliseconds of offset between two devices is normal, and control events are often milliseconds apart"
  options:
    - text: "Because timestamps are stored at second resolution"
      correct: false
      why: "Resolution can be sub-millisecond and the problem remains — the clocks themselves disagree."
    - text: "Because normal sub-second skew between independent clocks is larger than the gap between the events being ordered"
      correct: true
      why: "And a failover puts consecutive events on different clocks, one of which can be minutes off."
    - text: "Because timestamps are always in local time"
      correct: false
      why: "Zone handling (Lesson 516) is a separate issue; even in perfect UTC the clocks still drift apart."

- q: "What does a version vector tell you that a Lamport clock does not?"
  anchor: "it can tell \"A happened before B\" from \"A and B are concurrent\""
  options:
    - text: "The exact wall-clock time each event occurred"
      correct: false
      why: "Neither mechanism recovers wall-clock time; that is not what they are for."
    - text: "Whether two events are causally ordered or genuinely concurrent — so you know if a conflict is real"
      correct: true
      why: "A Lamport clock imposes a total order even on concurrent events; a version vector preserves that they were concurrent."
    - text: "Which node has the fastest clock"
      correct: false
      why: "It carries no clock information at all — only per-node event counts."
```

## Key Concepts
- **Reconstructing what happened needs events in order** — and across systems the timestamp is the wrong key
- **Clock skew is normal, not a bug** — sub-second offset between independent clocks, and control events are closer than that
- **A failover puts consecutive events on different clocks** by construction
- **Order by causality, not by time**
- **Lamport clock** — a per-node counter, bumped locally and to `max(local, received) + 1` on receive; gives a total order consistent with causality
- **Version vector** — a counter per node; distinguishes "before" from "concurrent"
- **Neither needs a synchronised clock** — they need the events to carry a counter or vector
- **Where the metadata cannot be retrofitted**, cross-system order is unknown within the skew window, and the contract must say so (Lesson 522)

## Example Code
Assigning Lamport timestamps as messages flow between two nodes, and what each ordering reconstructs:

```typescript run
type Event = { node: string; kind: 'set' | 'applied'; value: number; wall: string; lamport: number };

/** The true sequence. Node B's clock runs 90s fast; node C's runs 75s slow.
 *  B applied 50, then failed; C took over and applied 20. */
const EVENTS: Event[] = [
  { node: 'A', kind: 'set', value: 50, wall: '2024-05-01T08:00:00Z', lamport: 1 },
  { node: 'B', kind: 'applied', value: 50, wall: '2024-05-01T08:01:50Z', lamport: 2 }, // B +90s
  { node: 'A', kind: 'set', value: 20, wall: '2024-05-01T08:00:40Z', lamport: 3 },
  { node: 'C', kind: 'applied', value: 20, wall: '2024-05-01T07:59:45Z', lamport: 4 }, // C -75s
];

const replay = (ordered: Event[]) => {
  let held: number | null = null;
  for (const e of ordered) if (e.kind === 'applied') held = e.value;
  return held;
};
const show = (list: Event[]) => list.map((e) => `${e.node}:${e.kind}(${e.value})`).join(' -> ');

const byWall = [...EVENTS].sort((x, y) => x.wall.localeCompare(y.wall));
const byLamport = [...EVENTS].sort((x, y) => x.lamport - y.lamport || x.node.localeCompare(y.node));

console.log('by wall clock: ', show(byWall), ' => held', replay(byWall));
console.log('by Lamport:    ', show(byLamport), ' => held', replay(byLamport));
console.log('');
console.log('The device is holding 20. Wall-clock order puts C:applied(20) first — because');
console.log("C's clock is slow — then B:applied(50) last, and reconstructs 50. The Lamport");
console.log('order follows causality and reconstructs 20.');
```

```typescript
/** Version-vector comparison: returns how two events relate. `null` means
 *  concurrent — the case a Lamport clock would silently linearise. */
type Vec = Record<string, number>;

function compare(a: Vec, b: Vec): 'before' | 'after' | 'equal' | 'concurrent' {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  let aLess = false;
  let aMore = false;
  for (const k of keys) {
    const av = a[k] ?? 0;
    const bv = b[k] ?? 0;
    if (av < bv) aLess = true;
    if (av > bv) aMore = true;
  }
  if (aLess && aMore) return 'concurrent';
  if (aLess) return 'before';
  if (aMore) return 'after';
  return 'equal';
}
```

The same negotiation replayed three ways — wall clock, Lamport, and version vector — as a proof:

```proof sha=d762e8c0d64e639d at=2026-09-03 commit=8693fb3
$ node replay.js
The four events, in the order they actually happened (causal order):
  A:set(50)  ->  B:applied(50)  ->  A:set(20)  ->  C:applied(20)

B's clock runs 90s fast, C's runs 75s slow. B applied 50 before C applied 20,
but C's stamp (07:59:45) lands BEFORE B's stamp (08:01:50).

ORDER BY wall clock:
  C:applied(20)  ->  A:set(50)  ->  A:set(20)  ->  B:applied(50)
  final setpoint replayed: 50

ORDER BY Lamport clock:
  A:set(50)  ->  B:applied(50)  ->  A:set(20)  ->  C:applied(20)
  final setpoint replayed: 20

Version vectors: 0 concurrent pair(s). Every event here causally
precedes the next, so the vector clock confirms one valid total order exists and
it is the Lamport one.

The field device is holding setpoint 20. Wall-clock replay reconstructs 50 — wrong.
Lamport replay reconstructs 20 — correct.

This is not fixable by "sync the clocks better". Sub-second NTP skew is enough to
reorder two control events that are milliseconds apart, and a failover puts the
two events on different clocks by construction. The order has to come from
causality, not from time.
```

## When to Use
- Whenever an integration reconstructs a sequence of actions from more than one system's log
- In any control or command path — the order of "commanded" and "applied" decides what state you believe the device is in
- After a failover or a redundant-pair handover, where consecutive events are on different clocks by design
- When writing the integration contract (Lesson 522), to state the ordering guarantee — causal, or "unknown within N seconds"

## Common Mistakes
- **Sorting cross-system events by timestamp** — the order is plausible and wrong, and nothing flags it
- **"We'll just sync the clocks"** — sub-second skew still reorders events that are sub-second apart, which control events are
- **Using a Lamport clock and forgetting it linearises concurrent events** — two truly independent events get an order they did not have
- **Adding version vectors but never checking for `concurrent`** — the extra information is collected and ignored
- **Assuming a single system's own log is correctly ordered** — it usually is, but a multi-threaded writer or a buffered forwarder can reorder within one system too
- **Not stating the ordering guarantee in the contract** — consumers then assume causal order they are not getting

## Further Reading
- [Lamport, "Time, Clocks, and the Ordering of Events in a Distributed System" (1978)](https://lamport.azurewebsites.net/pubs/time-clocks.pdf) — the original paper; the happens-before relation and the clock condition
- [Lesson 474](/courses/iot-telemetry-edge/three-clocks) — device time, gateway time and ingest time within one pipeline, the single-system version of this problem
- [Version vectors (overview and comparison with vector clocks)](https://en.wikipedia.org/wiki/Version_vector) — the per-node-counter structure and how it detects concurrency

```recall
- q: "Why is a timestamp the wrong key for ordering events across systems?"
  must:
    - "the systems do not share a clock and sub-second skew is normal"
    - "control events are often closer together than the skew"
    - "a failover puts consecutive events on different clocks by construction"

- q: "How does a Lamport clock work and what does it guarantee?"
  must:
    - "a per-node counter, incremented on each local event"
    - "on receiving a message, set to max(local, received) + 1"
    - "if A caused B then lamport(A) < lamport(B) — a total order consistent with causality"

- q: "What does a version vector add over a Lamport clock, and what is the honest fallback?"
  must:
    - "it distinguishes 'A before B' from 'A and B concurrent'"
    - "so you know whether a conflict is real or apparent"
    - "where the metadata cannot be retrofitted, order is unknown within the skew window and the contract must say so"
```
