# 502. Sync Windows, Partial Uploads, and Resumable Transfer

## What It Is
Connectivity in the field is not a state, it is a **window**: a few minutes at a site gate, a passing signal on a road, the office wifi at the end of a shift. A sync designed for a connection assumes it will finish. A sync designed for a window assumes it will be interrupted, and the difference shows up in whether a day's work uploads.

Three things follow.

**Order matters, and it is a product decision.** A queue holds small records and large attachments. Uploading in capture order means one large photo can consume a whole window while forty text records wait behind it. Uploading records first gets the findings into the system — which is what somebody schedules work from — and leaves the photos to follow. That is usually right, and it is a choice rather than a default.

**Every transfer must be resumable, and the state belongs in the row.** An interrupted upload has a byte count, and the only place that survives the app being killed is persistent storage. Note the off-by-one worth getting right: **having N bytes means resuming AT offset N**, because offsets are zero-based — so the number to send is the count you hold, not the difference.

**A window has a size, and the queue's shape decides whether it fits.** Bytes outstanding is a number you can compute, and comparing it against what a window realistically delivers is how you find out that a device needs three windows to clear rather than one. That is a question to ask before an inspector discovers it.

The property that makes all of this safe is the one from Lesson 495: **submission is idempotent on the client-generated id**, so a record uploaded twice because the window closed just before the acknowledgement is a no-op rather than a duplicate. Without that, a resumable sync is a duplicate generator.

```quiz
- q: "An upload has received 1,245,184 of 3,145,728 bytes. What offset does the resume request ask for?"
  anchor: "having N bytes means resuming AT offset N"
  options:
    - text: "1,900,544 — the bytes remaining"
      correct: false
      why: "That is how many are left to send, not where to start. Sending from there skips the middle of the file."
    - text: "1,245,184 — the count already held, because offsets are zero-based"
      correct: true
      why: "Bytes 0 through 1,245,183 are held, so the next byte wanted is number 1,245,184."
    - text: "1,245,185 — the next byte after the last one held"
      correct: false
      why: "The last byte held is number 1,245,183. Zero-based indexing makes the next one 1,245,184."

- q: "Why upload small records before large attachments?"
  anchor: "one large photo can consume a whole window while forty text records wait behind it"
  options:
    - text: "Because small records are more likely to succeed"
      correct: false
      why: "Both succeed or fail with the window. The issue is what a window's worth of bandwidth buys."
    - text: "Because the findings are what work is scheduled from, and one photo can consume an entire window"
      correct: true
      why: "Getting forty findings in beats getting one photo in — usually, and it is a decision to make rather than inherit."
    - text: "Because attachments can be regenerated"
      correct: false
      why: "They cannot — the inspector has left the site."
```

## Key Concepts
- **Connectivity is a window, not a state** — assume interruption rather than completion
- **Upload order is a product decision**: records before attachments, usually
- **One large photo can consume a whole window**, blocking everything behind it
- **Every transfer is resumable**, and the byte count lives in persistent storage
- **Having N bytes means resuming at offset N** — offsets are zero-based
- **Bytes outstanding is computable**, and it tells you how many windows a device needs
- **Idempotency on the client id** is what makes a retried record a no-op (Lesson 495)
- **Without idempotency a resumable sync duplicates** — the two features are one design
- **A window closing just before an acknowledgement** is the ordinary case, not the edge case
- **Progress belongs to the record**, not to the session — the app will be killed

## Example Code
Which uploads are incomplete, where each resumes, and what the queue still owes:

```sql run seed=field_submissions
-- Which photo uploads are incomplete, and exactly where to resume each one.
-- The byte offset is the whole state a resumable transfer needs, and it lives
-- in the row rather than in the client's memory — so it survives the app being
-- killed, which is the case it exists for.
SELECT
  client_id,
  photo_bytes_received AS have,
  photo_bytes_total    AS total,
  round((photo_bytes_received::numeric / photo_bytes_total) * 100, 1) AS percent,
  -- The byte to ask for next is the count already held, not the difference:
  -- offsets are zero-based, so having N bytes means resuming AT N.
  photo_bytes_received                     AS resume_at_offset,
  photo_bytes_total - photo_bytes_received  AS bytes_remaining
FROM field_submission
WHERE photo_bytes_total IS NOT NULL
  AND photo_bytes_received < photo_bytes_total
ORDER BY percent;

-- And the queue's own shape, which is what decides how long a sync window
-- needs to be: total bytes still owed, and how many records are waiting.
SELECT
  count(*) FILTER (WHERE photo_bytes_total IS NULL)                          AS no_photo,
  count(*) FILTER (WHERE photo_bytes_received = photo_bytes_total)           AS complete,
  count(*) FILTER (WHERE photo_bytes_received < photo_bytes_total)           AS partial,
  coalesce(sum(photo_bytes_total - photo_bytes_received) FILTER (WHERE photo_bytes_received < photo_bytes_total), 0) AS bytes_outstanding
FROM field_submission;
```

Note that `resume_at_offset` equals the bytes already held. That is the number the next request asks for, and getting it wrong by one either skips a byte or repeats one — both of which corrupt the file in a way that only shows up when somebody opens it.

```typescript
/** The sync plan. Everything here is computed from the queue before a single
 *  byte moves, which is what lets a window be spent deliberately. */
type QueueItem = {
  clientId: string;
  /** Bytes of payload — small for a record, large for a photo. */
  recordBytes: number;
  attachmentBytes: number;
  attachmentSent: number;
};

export type UploadUnit =
  | { kind: 'record'; clientId: string; bytes: number }
  /** A resumption, with the offset stated rather than derived at the call
   *  site — the one place the off-by-one can live. */
  | { kind: 'attachment'; clientId: string; fromOffset: number; bytes: number };

/** Records first, then attachments, and attachments in ascending size so a
 *  window clears as many as it can rather than starting the largest. Both
 *  choices are arguable and both should be stated somewhere. */
export function plan(queue: QueueItem[]): UploadUnit[] {
  const records: UploadUnit[] = queue.map((q) => ({ kind: 'record', clientId: q.clientId, bytes: q.recordBytes }));
  const attachments: UploadUnit[] = queue
    .filter((q) => q.attachmentSent < q.attachmentBytes)
    .map((q) => ({
      kind: 'attachment' as const,
      clientId: q.clientId,
      // The count held IS the offset. Zero-based.
      fromOffset: q.attachmentSent,
      bytes: q.attachmentBytes - q.attachmentSent,
    }))
    .sort((a, b) => a.bytes - b.bytes);
  return [...records, ...attachments];
}

/** How much of the plan a window of a given size clears. Answering this
 *  before the window opens is the difference between a sync strategy and
 *  hope. */
export function fitsInWindow(units: UploadUnit[], windowBytes: number): { cleared: number; remainingBytes: number } {
  let spent = 0;
  let cleared = 0;
  for (const u of units) {
    if (spent + u.bytes > windowBytes) break;
    spent += u.bytes;
    cleared++;
  }
  return { cleared, remainingBytes: units.slice(cleared).reduce((s, u) => s + u.bytes, 0) };
}
```

## When to Use
- Any field sync, since a window that completes is the exception rather than the rule
- When a day's captures are not reaching the system, where upload order is the first thing to look at
- When sizing a sync window requirement — bytes outstanding is a measurement, not an estimate
- Alongside Lesson 495's idempotent submission, because a resumable sync without it duplicates

## Common Mistakes
- **Resuming from the remaining-bytes figure** — it skips the middle of the file, and the corruption surfaces when somebody opens it
- **Keeping upload progress in memory** — the app is killed, and the transfer restarts from zero
- **Uploading in capture order** — one large photo consumes the window and forty findings wait
- **Assuming the window will finish** — partial state is the normal case and has to be a first-class state
- **A resumable sync without idempotency** — every interrupted-then-retried record becomes a duplicate
- **Not computing bytes outstanding** — a device that needs three windows to clear looks identical to one that needs half of one, until it does not
- **Treating a closed window as an error** — it is the expected end of a sync, and reporting it as a failure trains people to ignore the report

## Further Reading
- [RFC 7231 — HTTP/1.1 Semantics and Content](https://datatracker.ietf.org/doc/html/rfc7231) — range requests and partial content, which is the mechanism a resumable upload is built on
- [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — `ON CONFLICT`, which is what makes a re-sent record a no-op (Lesson 495)
- [MQTT 5.0 specification](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html) — session state for a client that disconnects mid-exchange, as a comparison from the device side

```recall
- q: "State the resume offset rule and the cost of getting it wrong."
  must:
    - "having N bytes means resuming at offset N, because offsets are zero-based"
    - "the number to send is the count held, not the difference"
    - "off by one either skips a byte or repeats one, and the file is corrupt in a way that only shows when opened"

- q: "Why does upload order matter, and what is the usual answer?"
  must:
    - "a queue holds small records and large attachments"
    - "one large photo can consume a whole window while many records wait"
    - "records first, because the findings are what work is scheduled from — and it is a decision, not a default"

- q: "Why are resumability and idempotency one design?"
  must:
    - "a window can close just before an acknowledgement arrives"
    - "so a record gets re-sent on the next window"
    - "without idempotency on the client-generated id, a resumable sync is a duplicate generator"
```
