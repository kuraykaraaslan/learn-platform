# 510. Merging Two Asset Registers: Fuzzy Matching and the Review Queue It Needs

## What It Is
Two registers have to become one: an acquisition, a facilities-management contract change, a CAFM system replaced with the old data carried across. Both describe the same physical site, both were maintained by different people in different tools, and the tags do not line up. An exact-string join between them matches a fraction of the rows, and the fraction it misses is not random — it is every tag someone typed with a space instead of a hyphen, or in lower case, or with a leading zero dropped.

The merge is a three-stage funnel. **Normalise** both sides to a canonical tag (Lesson 506) and join on that — this recovers the separator and case differences for free. **Match on serial** where a tag has no counterpart but the serial does — this catches assets that were renamed between the two systems, and it is the only signal that a rename happened. What is left after those two stages is the **fuzzy** part: tags that are close but not equal, scored by edit distance, and here the rule is the one from Lesson 506 — a match is automatic only when the best candidate is clearly better than the second. Everything else goes to a person.

That person is not optional, and the review queue is part of the design, not a failure of it. A merge with no queue has made every ambiguous call silently, and the wrong ones are now indistinguishable from the right ones. A merge with a queue has a number attached — "310 auto-matched, 40 for review" — and the 40 is a morning's work with an outcome anyone can audit. The queue also holds the genuine non-matches: an asset in the incoming register that is simply new to the target, which is a create, not a match.

The asymmetry to hold onto: a **missed match** costs a duplicate row that a later pass or a human catches. A **wrong match** has already merged two assets' histories before anyone looked, and unpicking that means knowing which work order belonged to which — which the merge just destroyed. The funnel is tuned to send anything doubtful to the queue.

```quiz
- q: "Why does an exact-string join between two registers miss a non-random set of rows?"
  anchor: "it is every tag someone typed with a space instead of a hyphen, or in lower case, or with a leading zero dropped"
  options:
    - text: "Because one register is always larger than the other"
      correct: false
      why: "Size difference is expected and handled by the funnel. The misses are formatting differences in the tag."
    - text: "Because the misses are exactly the tags that differ only in separators, case or zero-padding — human formatting variation"
      correct: true
      why: "Normalising to a canonical tag before joining recovers most of them in one step."
    - text: "Because serial numbers are not unique between manufacturers"
      correct: false
      why: "That is a serial-matching concern, not why the tag join misses rows."

- q: "Why is the review queue part of the merge design rather than a sign it failed?"
  anchor: "the review queue is part of the design"
  options:
    - text: "Because auditors require a manual sign-off step"
      correct: false
      why: "Audit is a benefit, not the reason. The reason is what a queue-less merge does with ambiguity."
    - text: "Because a merge with no queue has made every ambiguous call silently, and the wrong ones are now unrecoverable"
      correct: true
      why: "A queue turns ambiguity into a bounded, auditable task instead of a set of hidden decisions."
    - text: "Because fuzzy matching is too slow to run on the whole register"
      correct: false
      why: "It is fast enough. The queue exists for correctness, not performance."
```

## Key Concepts
- **Two registers of the same site rarely share tag spellings** — different tools, different people
- **An exact join misses a predictable set**: separator, case and zero-padding differences
- **Stage one — normalise both sides** to a canonical tag and join on that
- **Stage two — match on serial** where the tag has no counterpart; the only signal a rename occurred
- **Stage three — fuzzy match** the remainder by edit distance, auto-accepting only a clear best candidate
- **The review queue is designed in** — it turns silent ambiguous calls into a bounded auditable task
- **The queue also holds genuine non-matches** — an incoming asset new to the target is a create
- **Missed match vs wrong match is asymmetric** — a duplicate is recoverable, a merged history is not
- **Tune the funnel to over-refer** — anything doubtful goes to a person

## Example Code
The naive join first — how little matches when the strings have to be identical:

```sql run seed=asset_register
-- Exact string join between the incoming register and the target.
SELECT i.import_tag, a.tag AS matched
FROM asset_import i
LEFT JOIN asset a ON a.tag = i.import_tag
ORDER BY i.import_tag;
```

```sql run seed=asset_register
-- Stage one and two together: normalise the tag on both sides and join, then
-- also try the serial. `regexp_replace(upper(x), '[^A-Z0-9]+', '-', 'g')` is
-- the canonical form.
WITH norm AS (
  SELECT import_tag, import_serial,
         regexp_replace(upper(btrim(import_tag)), '[^A-Z0-9]+', '-', 'g') AS canon
  FROM asset_import
),
target AS (
  SELECT tag, serial, regexp_replace(upper(tag), '[^A-Z0-9]+', '-', 'g') AS canon
  FROM asset
)
SELECT n.import_tag, n.canon,
       t.tag AS matched_by_tag,
       s.tag AS matched_by_serial
FROM norm n
LEFT JOIN target t ON t.canon = n.canon
LEFT JOIN asset s  ON s.serial = n.import_serial AND s.serial IS NOT NULL
ORDER BY n.import_tag;
```

```sql run seed=asset_register
-- What stages one and two leave behind: the rows that go to the fuzzy stage
-- and then, if still unresolved, to the review queue.
WITH norm AS (
  SELECT import_tag, import_serial,
         regexp_replace(upper(btrim(import_tag)), '[^A-Z0-9]+', '-', 'g') AS canon
  FROM asset_import
),
target AS (
  SELECT tag, regexp_replace(upper(tag), '[^A-Z0-9]+', '-', 'g') AS canon FROM asset
)
SELECT n.import_tag
FROM norm n
LEFT JOIN target t ON t.canon = n.canon
LEFT JOIN asset s  ON s.serial = n.import_serial
WHERE t.canon IS NULL AND s.tag IS NULL
ORDER BY n.import_tag;
```

The fuzzy stage, which SQL without an extension cannot do well — an iterative Levenshtein and the auto-accept rule:

```typescript run
/** Canonical tag, as in Lesson 506 — case and separators only, numbers left
 *  alone. */
function canon(t: string): string {
  return t.trim().toUpperCase().replace(/[\s_./]+/g, '-').replace(/-{2,}/g, '-').replace(/^-|-$/g, '');
}

/** Levenshtein edit distance, iterative two-row. */
function editDistance(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

const target = ['FAN-B2-01', 'FAN-B2-02', 'COIL-B2-01', 'PMP-1001A'];
const leftovers = ['FAN-B2-1', 'CHW-CHILLER-01'];

for (const incoming of leftovers) {
  const ranked = target
    .map((t) => ({ tag: t, d: editDistance(canon(t), canon(incoming)) }))
    .sort((x, y) => x.d - y.d);
  const [best, second] = ranked;
  // Auto-accept only when the best is within 1 AND clearly ahead of the next.
  const auto = best.d <= 1 && (second === undefined || second.d - best.d >= 2);
  console.log(
    `${incoming.padEnd(16)} best ${best.tag}(d${best.d}) next ${second ? second.tag + '(d' + second.d + ')' : '-'}  -> ${auto ? 'AUTO' : best.d <= 3 ? 'REVIEW' : 'UNMATCHED'}`
  );
}
console.log('');
console.log('FAN-B2-1 is distance 1 from FAN-B2-01 and distance 2 from FAN-B2-02 — too close');
console.log('to auto-merge two real fans. CHW-CHILLER-01 matches nothing: it is a new asset.');
```

The same funnel run end to end over two fixed registers, as a proof:

```proof sha=5e0ca9496262d85d at=2026-09-03 commit=c868807
$ node match.js
Register A: 7 assets   Register B: 8 incoming

auto-accepted: 6   review queue: 1   unmatched: 1

AUTO-ACCEPTED
  coil-b2-01       -> COIL-B2-01   (exact tag after normalisation)
  FAN B2 01        -> FAN-B2-01    (exact tag after normalisation)
  FIRE-PUMP-1      -> FP-PUMP-01   (serial match, tag differs)
  PMP-1001A        -> PMP-1001A    (exact tag after normalisation)
  PMP-1001B        -> PMP-1001B    (exact tag after normalisation)
  PRV 1001         -> PRV-1001     (exact tag after normalisation)

REVIEW QUEUE  (a human picks, or creates a new asset)
  FAN-B2-1         ?  FAN-B2-01(d1)  FAN-B2-02(d2)   — best edit distance 1, second 2 — too close to call

UNMATCHED  (likely a genuinely new asset for register A)
  CHW-CHILLER-01      nearest is COIL-B2-01 at edit distance 8

The two automatic wins that a naive exact-string join would miss: PRV 1001 and
FAN B2 01 (separators), and FIRE-PUMP-1, which matches FP-PUMP-01 on serial alone.
FAN-B2-1 stays in the queue: distance 1 from FAN-B2-01 but only distance 2 from
FAN-B2-02, and a wrong auto-merge of two real fans is not worth saving one click.
```

## When to Use
- Any register-to-register migration: an acquisition, an FM contract handover, a CAFM or CMMS replacement
- When a field-data import keeps failing to match the register on tag — the same normalise-then-fuzzy funnel applies
- When estimating a data-migration effort — the auto/review split is the number that turns "merge the registers" into a scheduled task
- Before trusting any report that spans both registers — an un-reconciled merge double-counts every asset that matched fuzzily and was left as two rows

## Common Mistakes
- **Joining on the raw tag** — matches the minority of rows that happen to share a spelling and silently drops the rest
- **Auto-accepting the nearest fuzzy match** — the nearest is sometimes one of two near-equal candidates, and picking one merges two histories
- **No review queue** — every ambiguous call is made silently and the wrong ones cannot be found afterwards
- **Treating every non-match as an error** — some incoming assets are genuinely new and belong as creates, not forced matches
- **Merging histories before the match is confirmed** — do the match, get it reviewed, *then* move the work orders and readings
- **Not recording which tag came from which register** — when a fuzzy match turns out wrong, the provenance is what lets you unpick it

## Further Reading
- [PostgreSQL fuzzystrmatch (levenshtein, soundex)](https://www.postgresql.org/docs/current/fuzzystrmatch.html) — the extension that adds edit distance in SQL where it is available to install
- [pg_trgm — trigram similarity](https://www.postgresql.org/docs/current/pgtrgm.html) — an index-backed alternative to edit distance for the candidate-generation step
- [Record linkage (Fellegi–Sunter model overview)](https://en.wikipedia.org/wiki/Record_linkage) — the statistical framing of match/non-match/possible-match, which is the review queue formalised

```recall
- q: "Describe the three stages of the register merge funnel."
  must:
    - "normalise both sides to a canonical tag and join on that"
    - "match on serial where the tag has no counterpart — the only rename signal"
    - "fuzzy match the remainder by edit distance, auto-accepting only a clear best"

- q: "Why is the review queue part of the design?"
  must:
    - "a merge with no queue makes every ambiguous call silently"
    - "the wrong calls are then indistinguishable from the right ones"
    - "a queue gives a bounded, auditable task and holds the genuine new-asset creates"

- q: "State the asymmetry that tunes the funnel."
  must:
    - "a missed match costs a duplicate row, which is recoverable"
    - "a wrong match has already merged two histories, which is not"
    - "so anything doubtful is sent to a person"
```
