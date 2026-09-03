# 496. Conflict Resolution for Field Edits: LWW, Version Vectors, Manual Merge

## What It Is
Two inspectors open the same record, both go out of coverage, both edit it, and both come back. Nothing prevented that and nothing should have — they were doing their jobs. The question is what the system does with two divergent versions of one record, and there are three answers with very different honesty.

**Last write wins** sorts by timestamp and keeps the latest value per field. One line of code, no conflict ever reported, and it rests entirely on two device clocks that nobody synchronised. In the run below, device B's clock is eleven minutes fast, so B's edits win — and B is also the inspector who *found a defect*. The record ends up saying "escalated" because of a clock rather than because of a judgement. Had A's clock been the fast one, the same two inspections would have closed the finding.

**A version vector** compares causality instead of time. Each device keeps a counter, and one version dominates another when its counters are all at least as high — meaning its history includes the other's. When neither dominates, the edits are **concurrent**, which is a fact about what happened rather than about when anyone's clock said it did. The run reaches that conclusion without consulting a clock at all, and reports both fields as conflicts.

**Manual merge** is the third option and it is not a fallback. When the two edits are "no defect found" and "corrosion on flange, needs engineer", a human deciding is the *correct* behaviour, and any automatic winner is a guess with a professional's name attached to it.

The rule that follows is about the field rather than the algorithm: **automatic resolution is fine where a wrong choice is cheap, and unacceptable where the value carries a judgement.** A photo timestamp can be last-write-wins. An inspection outcome cannot.

```quiz
- q: "Last write wins resolved a conflict and reported none. What decided the outcome?"
  anchor: "it rests entirely on two device clocks that nobody synchronised"
  options:
    - text: "Which edit was made later"
      correct: false
      why: "Which edit CLAIMED to be later. Two unsynchronised device clocks decide that, and the run shows the earlier edit winning."
    - text: "Whichever device's clock was further ahead"
      correct: true
      why: "In the run, the device that edited first in real time wins because its clock ran fast."
    - text: "Which device synced first"
      correct: false
      why: "Sync order is not consulted — the timestamp is. That is a separate ordering, and equally arbitrary."

- q: "What does a version vector establish that a timestamp cannot?"
  anchor: "a fact about what happened rather than about when anyone's clock said it did"
  options:
    - text: "Which edit was made first"
      correct: false
      why: "It deliberately does not answer that. It answers whether either edit knew about the other."
    - text: "Whether the two edits were concurrent — whether either device's history included the other's"
      correct: true
      why: "Causality rather than time, which needs no clock at all."
    - text: "Which edit is more likely to be correct"
      correct: false
      why: "Nothing mechanical can answer that, which is exactly why the conflict is reported rather than resolved."
```

## Key Concepts
- **Concurrent offline edits are normal**, not a fault to prevent
- **Last write wins**: sort by timestamp, keep the latest — one line, no conflict reported
- **It depends on unsynchronised device clocks**, and cannot check them
- **A version vector** compares causality: one version dominates when its counters are all at least as high
- **Concurrent means neither dominates** — a fact about history, needing no clock
- **A version vector reports the conflict** rather than resolving it, which is more work and honest
- **Manual merge is not a fallback**: for a judgement, a human deciding is correct
- **The rule is about the field**: automatic where a wrong choice is cheap, never where the value is a judgement
- **A conflict nobody is told about is a decision nobody made**

## Example Code
The same edit sequence under both strategies:

```typescript run
// sequence, resolved two ways, produces two different final records — and
// only one of the strategies knows that a decision was made.
type Edit = {
  /** Which device made it. */
  device: string;
  field: 'status' | 'note';
  value: string;
  /** The device's own clock. Unsynchronised between devices, which is the
   *  assumption last-write-wins rests on and cannot check. */
  deviceTime: string;
  /** The device's own counter for this record, incremented per local edit.
   *  This is what a version vector is built from, and it needs no clock. */
  localVersion: number;
};

// Both inspectors opened the same record at version 3 and went out of range.
const BASE = { status: 'open', note: 'awaiting access', version: 3 };

const EDITS: Edit[] = [
  // Device A, in the plant room at 09:10 by its own clock.
  { device: 'A', field: 'status', value: 'closed', deviceTime: '2026-03-01T09:10:00Z', localVersion: 4 },
  { device: 'A', field: 'note', value: 'access granted, no defect found', deviceTime: '2026-03-01T09:12:00Z', localVersion: 5 },
  // Device B, on the roof, whose clock is eleven minutes fast. It edited
  // FIRST in real time and its timestamps say otherwise.
  { device: 'B', field: 'status', value: 'escalated', deviceTime: '2026-03-01T09:20:00Z', localVersion: 4 },
  { device: 'B', field: 'note', value: 'corrosion on flange, needs engineer', deviceTime: '2026-03-01T09:21:00Z', localVersion: 5 },
];

type Record_ = { status: string; note: string };

/** Last write wins: sort by timestamp, apply in order, keep the last value
 *  per field. One line of code, no conflict ever reported, and the answer
 *  depends entirely on two clocks nobody synchronised. */
function lastWriteWins(base: Record_, edits: Edit[]): { record: Record_; conflicts: number } {
  const record = { ...base };
  for (const e of [...edits].sort((a, b) => Date.parse(a.deviceTime) - Date.parse(b.deviceTime))) {
    record[e.field] = e.value;
  }
  return { record, conflicts: 0 };
}

/** A version vector: one counter per device, so two histories can be compared
 *  without any clock at all. `a` dominates `b` when every counter in `a` is
 *  at least `b`'s — meaning a's history includes b's. When neither dominates,
 *  the two edits are CONCURRENT: a fact about causality, not about time. */
type Vector = Record<string, number>;

const dominates = (a: Vector, b: Vector): boolean =>
  Object.keys({ ...a, ...b }).every((k) => (a[k] ?? 0) >= (b[k] ?? 0));

const concurrent = (a: Vector, b: Vector): boolean => !dominates(a, b) && !dominates(b, a);

/** Each device's vector after its local edits. Both diverged from the same
 *  base and neither has seen the other, so `base` is shared and each has only
 *  its own counter. */
function vectorFor(device: string, edits: Edit[], baseVersion: number): Vector {
  const mine = edits.filter((e) => e.device === device);
  return { base: baseVersion, [device]: mine.length };
}

type Resolution =
  | { kind: 'applied'; value: string; from: string }
  | { kind: 'conflict'; candidates: { device: string; value: string }[] };

function versionVector(edits: Edit[], baseVersion: number) {
  const devices = [...new Set(edits.map((e) => e.device))];
  const vectors = new Map(devices.map((d) => [d, vectorFor(d, edits, baseVersion)]));

  const perField = new Map<string, Edit[]>();
  for (const e of edits) perField.set(e.field, [...(perField.get(e.field) ?? []), e]);

  const record: Record<string, Resolution> = {};
  let conflicts = 0;

  for (const [field, fieldEdits] of perField) {
    const touched = [...new Set(fieldEdits.map((e) => e.device))];
    // Each device's own final answer for this field.
    const finals = touched.map((device) => {
      const last = fieldEdits.filter((e) => e.device === device).sort((a, b) => b.localVersion - a.localVersion)[0];
      return { device, value: last.value };
    });

    // Any pair of devices whose vectors are concurrent is a conflict on every
    // field they both touched. No clock is consulted.
    const clash = touched.some((d1) =>
      touched.some((d2) => d1 !== d2 && concurrent(vectors.get(d1)!, vectors.get(d2)!))
    );

    if (clash) {
      conflicts++;
      record[field] = { kind: 'conflict', candidates: finals };
    } else {
      record[field] = { kind: 'applied', value: finals[0].value, from: finals[0].device };
    }
  }
  return { record, conflicts, vectors };
}

console.log(`base record at version ${BASE.version}: status="${BASE.status}", note="${BASE.note}"`);
console.log('');
console.log('edits, in the order they were actually made:');
console.log('  device B edited FIRST in real time; its clock is eleven minutes fast');
for (const e of EDITS) {
  console.log(`  ${e.device}  v${e.localVersion}  ${e.deviceTime.slice(11, 16)}  ${e.field} = "${e.value}"`);
}
console.log('');

const lww = lastWriteWins({ status: BASE.status, note: BASE.note }, EDITS);
console.log('last write wins:');
console.log(`  status = "${lww.record.status}"`);
console.log(`  note   = "${lww.record.note}"`);
console.log(`  conflicts reported: ${lww.conflicts}`);
console.log('');

const vv = versionVector(EDITS, BASE.version);
console.log('version vector:');
for (const [device, v] of vv.vectors) console.log(`  ${device} is at ${JSON.stringify(v)}`);
for (const [field, r] of Object.entries(vv.record)) {
  if (r.kind === 'applied') console.log(`  ${field.padEnd(6)} = "${r.value}" (from ${r.from})`);
  else console.log(`  ${field.padEnd(6)} CONFLICT: ${r.candidates.map((c) => `${c.device}="${c.value}"`).join('  vs  ')}`);
}
console.log(`  conflicts reported: ${vv.conflicts}`);
console.log('');

console.log('Last write wins picked device B, silently, because B\'s clock ran fast — and B');
console.log('is also the inspector who found a defect. The record now says "escalated"');
console.log('because of a clock, not because of a judgement. Had A\'s clock been the fast');
console.log('one, the same two inspections would have closed the finding instead.');
console.log('');
console.log('The version vector reports BOTH fields as conflicts, because neither device\'s');
console.log('history includes the other\'s — and it reaches that conclusion without consulting');
console.log('a clock at all. That is more work, since somebody has to look, and it is the only');
console.log('strategy that can tell you a choice was made.');
console.log('');
console.log('Manual merge is the third option and it is not a fallback: for a field record');
console.log('where the two edits are "no defect found" and "corrosion, needs engineer",');
console.log('a human deciding is the correct behaviour and any automatic winner is a guess.');
```

## When to Use
- Any field application where two people can hold the same record — which is most of them
- When deciding a per-field strategy, since the right answer differs by field within one record
- When a record's history shows a value changing without an obvious cause — last-write-wins is usually the cause
- When designing the sync protocol, since a version vector needs a counter that the server preserves and returns

## Common Mistakes
- **Last write wins on a field that carries a judgement** — an inspection outcome is decided by a clock, and the losing inspector is never told
- **Assuming device clocks are close** — they are not, and a fast clock is indistinguishable from a later edit
- **Reporting no conflicts and calling it conflict-free** — a strategy that cannot detect a conflict reports none by construction
- **Treating manual merge as a failure of automation** — for some fields it is the only correct behaviour
- **One strategy for the whole record** — a photo caption and a defect classification do not deserve the same treatment
- **Discarding the losing version** — even when a winner is chosen automatically, the other edit is evidence somebody did work
- **Comparing version vectors as numbers** — domination is per-counter, and a vector with a larger total can still be concurrent

## Further Reading
- [Version vector](https://en.wikipedia.org/wiki/Version_vector) — the structure, its domination rule, and how it differs from a vector clock
- [Vector clock](https://en.wikipedia.org/wiki/Vector_clock) — the related mechanism, and why the distinction matters when a device can be added
- [RFC 7231 — HTTP/1.1 Semantics and Content](https://datatracker.ietf.org/doc/html/rfc7231) — conditional requests, which are how a version is carried over HTTP without inventing a protocol

```recall
- q: "Explain what last-write-wins actually decides on."
  must:
    - "it sorts by timestamp and keeps the latest value per field"
    - "the timestamps come from unsynchronised device clocks"
    - "so a fast clock wins, and that is indistinguishable from a later edit"

- q: "What is a version vector's domination rule, and what does 'concurrent' mean?"
  must:
    - "one version dominates another when all its counters are at least as high — its history includes the other's"
    - "when neither dominates, the edits are concurrent"
    - "that is causality rather than time, and it needs no clock"

- q: "State the rule for choosing a strategy."
  must:
    - "automatic resolution is fine where a wrong choice is cheap"
    - "unacceptable where the value carries a professional judgement"
    - "and the choice is per field, not per record"
```
