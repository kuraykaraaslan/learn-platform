# 495. Client-Generated Ids and Idempotent Submission

## What It Is
At the moment a record is captured there is no network, so there is nothing to ask for an identity. That single fact rules out the id scheme almost every system uses, and everything else here follows from it.

A **server sequence cannot exist at capture time**, which is precisely when the identity is needed. A record with no id cannot be referenced by an edit, cannot be deduplicated on retry, and cannot be linked to a photo captured a second later. So the id comes from the device, and the question becomes which device-generated scheme survives contact with reality.

A **local counter** collides: device A and device B both produce 1, 2, 3. A **device id plus a counter** works, and pushes the problem onto having a device id that is itself unique and survives a reinstall. A **random UUID** needs no coordination at all and is the usual answer; a **time-ordered UUID** additionally sorts by creation time, which an index likes and which leaks the capture time to anyone who sees the id. A **content hash** is the interesting failure: offline, collision-free, and not an identity — editing the record changes it, and an id that changes when the thing changes cannot be what the thing *is*.

With the id fixed at capture, submission becomes idempotent for free: the id is the primary key, and a retry is a no-op. This is (#7)'s pattern with one difference worth naming — an HTTP idempotency key is generated for a *request*, while this id belongs to the *record*. It survives the app restarting, the queue being reloaded from disk, and a replay run by hand from a backup, because it was never about the request.

The part that gets left out is that there are **three outcomes, not two**. `created` and `already present` are both successes, and the client should stop retrying on either. But **same id, different content** is neither: either the client reused an id or two devices collided, and accepting it silently means one of the two records is gone. Collapsing that into "OK" makes a collision look like a successful submission.

```quiz
- q: "Why can a server-assigned id not work here?"
  anchor: "A **server sequence cannot exist at capture time**, which is precisely when the identity is needed"
  options:
    - text: "Because it would be slow to fetch"
      correct: false
      why: "It cannot be fetched at all — there is no network at capture time."
    - text: "Because it cannot exist until the record reaches the server, and the identity is needed before that"
      correct: true
      why: "An edit, a photo link, and a retry all need the id while the device is still offline."
    - text: "Because server sequences are not globally unique"
      correct: false
      why: "They are unique. The problem is when they become available."

- q: "A submission arrives with a known id and different content. What should the server return?"
  anchor: "**same id, different content** is neither"
  options:
    - text: "Success — the id has been seen, so it is a duplicate"
      correct: false
      why: "It is not a duplicate: the content differs. Accepting it silently loses one of the two records."
    - text: "A distinct conflict response, because either an id was reused or two devices collided"
      correct: true
      why: "Three outcomes, not two — and the client must not treat this one as delivered."
    - text: "Success, and overwrite the stored record"
      correct: false
      why: "That resolves an unexplained collision by discarding data, without anyone deciding to."
```

## Key Concepts
- **No network at capture** means no server id, ever
- **The id is needed before submission**: for edits, attachments, and retries
- **Local counters collide** across devices
- **Device id plus counter** works, and needs a durable unique device id
- **Random UUID** needs no coordination; **time-ordered UUID** also sorts, and leaks capture time
- **A content hash is not an identity** — it changes when the record is edited
- **The id is the primary key**, so a retry is a no-op
- **This is (#7)'s pattern for a record rather than a request** — it survives restarts, reloads and manual replays
- **Three outcomes**: created, already present, and conflict
- **Conflict must not be reported as success** — that is how a collision loses a record

## Example Code
Which schemes survive the constraint, and the three-outcome submission:

```typescript run
// ask. That single constraint decides which id schemes are usable.
type IdScheme = {
  name: string;
  /** Can the device produce it with no network and no coordination? */
  offline: boolean;
  /** Does it stay the same across an app restart, a queue reload, a retry? */
  stable: boolean;
  /** Two devices, both offline, both capturing. Can they collide? */
  collisionRisk: 'none' | 'negligible' | 'likely';
  note: string;
};

const SCHEMES: IdScheme[] = [
  { name: 'server sequence', offline: false, stable: true, collisionRisk: 'none',
    note: 'cannot be obtained at capture time, which is when it is needed' },
  { name: 'local counter', offline: true, stable: true, collisionRisk: 'likely',
    note: 'device A and device B both produce 1, 2, 3' },
  { name: 'device id + counter', offline: true, stable: true, collisionRisk: 'none',
    note: 'needs a device id that is itself unique and survives a reinstall' },
  { name: 'random UUID (v4)', offline: true, stable: true, collisionRisk: 'negligible',
    note: 'no coordination at all; unordered, so it indexes worse' },
  { name: 'time-ordered UUID (v7)', offline: true, stable: true, collisionRisk: 'negligible',
    note: 'sorts by creation time, which an index likes — and leaks capture time' },
  { name: 'hash of the content', offline: true, stable: false, collisionRisk: 'none',
    note: 'changes when the record is edited, so it is not an identity' },
];

console.log('id schemes against the constraint that matters:');
console.log('');
console.log('  scheme                   offline   stable   collisions');
for (const s of SCHEMES) {
  console.log(
    `  ${s.name.padEnd(22)} ${(s.offline ? 'yes' : 'NO').padStart(7)}   ${(s.stable ? 'yes' : 'NO').padStart(6)}   ${s.collisionRisk.padStart(10)}`
  );
}
console.log('');
for (const s of SCHEMES) console.log(`  ${s.name}: ${s.note}`);
console.log('');
console.log('The content hash is the interesting failure: it is offline and collision-free');
console.log('and it is not an identity, because editing the record changes it. An id that');
console.log('changes when the thing changes cannot be what the thing IS.');
console.log('');

// The submission, with the idempotency the id makes possible.
type Submission = { clientId: string; assetTag: string; finding: string; capturedAt: string };

type SubmitResult =
  | { outcome: 'created' }
  /** A duplicate is a SUCCESS. Returning an error makes the client retry
   *  what it already delivered — the same argument as the idempotency key
   *  pattern, and Lesson 471's for a broker. */
  | { outcome: 'already-present' }
  /** Same id, different content. This is the one case that must NOT be
   *  silently accepted: either the client reused an id, or two devices
   *  collided, and both are bugs worth surfacing. */
  | { outcome: 'conflict'; storedFinding: string };

function submit(store: Map<string, Submission>, record: Submission): SubmitResult {
  const existing = store.get(record.clientId);
  if (existing === undefined) {
    store.set(record.clientId, record);
    return { outcome: 'created' };
  }
  if (existing.finding === record.finding && existing.assetTag === record.assetTag) {
    return { outcome: 'already-present' };
  }
  return { outcome: 'conflict', storedFinding: existing.finding };
}

const store = new Map<string, Submission>();
const ATTEMPTS: Submission[] = [
  { clientId: 'f3a1-0001', assetTag: 'AT-0141', finding: 'corrosion on flange', capturedAt: '2026-03-01T08:12:00Z' },
  { clientId: 'f3a1-0002', assetTag: 'AT-0141', finding: 'gasket weeping', capturedAt: '2026-03-01T08:19:00Z' },
  // The retry after a lost response.
  { clientId: 'f3a1-0002', assetTag: 'AT-0141', finding: 'gasket weeping', capturedAt: '2026-03-01T08:19:00Z' },
  // Same id, different content: an id was reused. Not a duplicate.
  { clientId: 'f3a1-0002', assetTag: 'AT-0141', finding: 'flange bolts loose', capturedAt: '2026-03-01T08:31:00Z' },
  { clientId: 'f3a1-0003', assetTag: 'AT-0155', finding: 'label illegible', capturedAt: '2026-03-01T09:41:00Z' },
];

console.log('submitting the queue, including a retry and a reused id:');
for (const a of ATTEMPTS) {
  const r = submit(store, a);
  const text =
    r.outcome === 'conflict'
      ? `CONFLICT — stored "${r.storedFinding}", got "${a.finding}"`
      : r.outcome;
  console.log(`  ${a.clientId}  ${text}`);
}
console.log('');
console.log(`stored: ${store.size} records from ${ATTEMPTS.length} attempts`);
console.log('');
console.log('Three outcomes, not two. "Already present" is a success and the client should');
console.log('stop retrying; "conflict" is a real problem and the client must not treat it as');
console.log('delivered. Collapsing them into one response makes an id collision look like a');
console.log('successful submission, and the losing record is gone.');
```

The same replay against real Postgres. The seed holds an upload log of twelve attempts covering eight records, with the duplicates injected by cause:

```sql run seed=field_submissions
-- What the upload log holds, by cause. Every one of these is correct behaviour
-- for a client that cannot tell a lost request from a lost response.
SELECT cause, count(*) AS attempts
FROM submission_attempt
GROUP BY cause
ORDER BY attempts DESC, cause;

-- And the difference the client-generated id makes. `ON CONFLICT DO NOTHING`
-- on the device's own id turns every retry into a no-op — no application code
-- inspects anything, and the same protection covers a manual replay.
INSERT INTO field_submission (client_id, asset_tag, storey_id, finding, captured_at, accuracy_m)
SELECT client_id, asset_tag, storey_id, finding, captured_at, accuracy_m
FROM submission_attempt
ON CONFLICT (client_id) DO NOTHING;

SELECT
  (SELECT count(*) FROM submission_attempt) AS attempts,
  (SELECT count(*) FROM field_submission)   AS stored,
  (SELECT count(*) FROM submission_attempt) - (SELECT count(*) FROM field_submission) AS collapsed_by_the_key;
```

Four attempts collapsed, and no application code inspected anything. The constraint did it, which means the same protection covers a backfill, a replay from a device backup, and a second sync process nobody remembered to disable.

And the proof, run and stamped on a fixed attempt log:

```proof sha=dae358604be28590 at=2026-09-03 commit=05579ba
$ node replay.js
6 captures, 10 submission attempts:
  f3a1-0001  AT-0141  first attempt, succeeded
  f3a1-0002  AT-0141  first attempt, succeeded
  f3a1-0002  AT-0141  retry: response lost, server already had it
  f3a1-0003  AT-0155  first attempt, succeeded
  f3a1-0003  AT-0155  batch resent: connection dropped mid-upload
  f3a1-0004  AT-0163  batch resent: connection dropped mid-upload
  f3a1-0005  AT-0163  first attempt, succeeded
  f3a1-0004  AT-0163  app relaunched, queue reloaded from disk
  f3a1-0005  AT-0163  app relaunched, queue reloaded from disk
  f3a1-0006  AT-0170  first attempt, succeeded

server-assigned ids   10 rows stored
client-generated ids  6 rows stored, 4 attempts rejected as already seen

findings per asset, from the two tables:
  asset      server ids   client ids   truth
  AT-0141           3            2       2
  AT-0155           2            1       1
  AT-0163           4            2       2
  AT-0170           1            1       1

AT-0163 has two real findings and the naive table reports four. Nobody typed
anything twice and no request failed: the app retried a lost response, resent an
interrupted batch, and reloaded its queue after a crash. All three are correct.

Why the id has to come from the device: at capture time there is no network, so
there is nothing to ask for an id. A server-assigned id cannot exist until the
record reaches the server — which is exactly when the identity is needed.

And the ids stay stable across everything the device does to the queue:
  captured offline, ids fixed at capture:  f3a1-0001, f3a1-0002, f3a1-0003, f3a1-0004, f3a1-0005, f3a1-0006
  after 10 attempts, distinct records stored: 6
  every stored id came from the device:    true
```

## When to Use
- Every offline-capable capture path, without exception
- When designing the table, since the client id is a primary-key decision and retrofitting one over duplicated data is a migration
- When a count from the field disagrees with what an inspector remembers submitting — a duplicate count is the first thing to check
- Alongside (#7) when an online path writes the same records, so both land on the same key

## Common Mistakes
- **Server-assigned ids** — unavailable at the only moment they are needed
- **A local counter without a device id** — two devices produce the same ids and the collision is silent
- **A content hash as the id** — it changes on edit, so the record's identity changes with its content
- **Two outcomes instead of three** — a reused or collided id then reads as a successful duplicate
- **Returning an error for a genuine duplicate** — the client reads it as a failed delivery and retries forever (Lesson 471 makes the same point for a broker)
- **Deduplicating in application code** — check-then-insert is not atomic, and two concurrent copies both pass the check
- **Regenerating the id on retry** — every attempt then looks like a new record, which is the naive behaviour with extra steps

## Further Reading
- [RFC 7231 — HTTP/1.1 Semantics and Content](https://datatracker.ietf.org/doc/html/rfc7231) — method semantics, and what idempotent means for a request rather than a record
- [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — `ON CONFLICT DO NOTHING` and `DO UPDATE`, and the row counts each returns
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — for the position that usually accompanies a capture, and its own caveats (Lesson 497)

```recall
- q: "Why must the id come from the device?"
  must:
    - "there is no network at capture time, so there is nothing to ask"
    - "the id is needed before submission — for edits, attachments and retries"
    - "a server id cannot exist until the record reaches the server"

- q: "Why is a content hash not an identity?"
  must:
    - "it is offline and collision-free, so it looks like a candidate"
    - "editing the record changes the hash"
    - "an id that changes when the thing changes cannot be what the thing is"

- q: "Name the three submission outcomes and the mistake of merging two of them."
  must:
    - "created, already present, and conflict"
    - "created and already-present are both successes; the client stops retrying"
    - "same id with different content is a collision or a reused id, and calling it success loses a record"
```
