# 515. Identity Resolution Across Systems: One Asset, Five Ids

## What It Is
A single booster pump is, simultaneously: a `GlobalId` in the IFC model, a feature id in the GIS, a functional-location tag in the CMMS, an RTU address in SCADA, and a sensor slug on the public portal. None of these systems is wrong. Each id is the right identifier *for that system*. The integration's job is to hold the fact that they are the same pump, and that fact belongs in a table of its own — a **crosswalk**.

The crosswalk has one row per (canonical asset, system, external id), and it is not a one-time mapping. Ids change: a GIS re-survey renumbers features, a SCADA re-tag moves `RTU-06` to `RTU-07`, a model re-export regenerates GlobalIds (Lesson 490 in the twin course). So each row carries **validity time** — `valid_from` and `valid_to` — and "resolve this id" always means "resolve it *as of* a moment", defaulting to now. That temporal column is what makes Lesson 520's historical replay possible.

The canonical key is the integration's own invention. It must be **controlled by the integration, not borrowed from a member system**, for the same reason Lesson 506 gives about the register: borrow SCADA's tag as the canonical key and a SCADA re-tag breaks every other join. A meaningless surrogate — `A-0003` — that never changes is correct precisely because it carries no information anyone would want to edit.

Two failure modes are specific to a crosswalk and both are in this course's seed. **One external id mapped to two canonical assets**: `RTU-07` points at `A-0003` and, through a stale un-closed row, still at `A-0006`. A resolve then returns two assets, or silently one. **One asset with overlapping rows in a single system**: two `valid_to IS NULL` rows for the same (asset, system), usually because a re-tag set the new row but never closed the old one. Both are found by the same overlap query, and both are a data-quality finding, not something the resolve logic should paper over.

```quiz
- q: "Why does the canonical key in a crosswalk have to be the integration's own invention rather than one member system's id?"
  anchor: "borrow SCADA's tag as the canonical key and a SCADA re-tag breaks every other join"
  options:
    - text: "Because member-system ids are too long to index efficiently"
      correct: false
      why: "Length is not the issue. The issue is that a change in the borrowed-from system propagates into every join."
    - text: "Because any member id can change, and if the canonical key changes with it every other mapping breaks"
      correct: true
      why: "A meaningless surrogate that never changes is correct precisely because nobody has a reason to edit it."
    - text: "Because the integration needs a numeric key for performance"
      correct: false
      why: "The key can be any stable token. Stability, not type, is what matters."

- q: "Why does every crosswalk row carry `valid_from` and `valid_to`?"
  anchor: "resolve this id\" always means \"resolve it *as of* a moment"
  options:
    - text: "For audit logging of who changed the mapping"
      correct: false
      why: "Audit is separate. The temporal columns are so a resolve can be answered as of a past moment."
    - text: "Because ids change over time — re-surveys, re-tags, re-exports — so a resolve is always relative to an instant, defaulting to now"
      correct: true
      why: "It is also what makes historical replay (Lesson 520) possible."
    - text: "Because the database requires a timestamp on every row"
      correct: false
      why: "It does not. The columns are there for the resolve semantics."
```

## Key Concepts
- **One asset, one id per system** — model, GIS, CMMS, SCADA, portal — each right for its own system
- **The crosswalk holds the sameness** — one row per (canonical asset, system, external id)
- **The canonical key is the integration's own surrogate** — meaningless, stable, never edited
- **Every row is time-bounded** — `valid_from` / `valid_to`, and resolve means "as of a moment", default now
- **Ids change**: GIS re-survey, SCADA re-tag, model re-export (Lesson 490, twin course)
- **Failure mode 1** — one external id mapped to two canonical assets (a stale un-closed row)
- **Failure mode 2** — one asset with two open rows in one system (a re-tag that never closed the old row)
- **Both are found by one overlap query** and are a data-quality finding, not a resolve-logic problem

## Example Code
Resolving one id, then fanning out to every system's current id for the same asset:

```sql run seed=crosswalk
-- Start from a CMMS functional-location tag; end with every system's current id.
WITH hit AS (
  SELECT asset_key FROM id_crosswalk
  WHERE system = 'CMMS' AND external_id = 'FL-SG-07' AND valid_to IS NULL
)
SELECT x.system, x.external_id, x.valid_from
FROM id_crosswalk x JOIN hit ON hit.asset_key = x.asset_key
WHERE x.valid_to IS NULL
ORDER BY x.system;
```

```sql run seed=crosswalk
-- Failure mode 1: one external id, more than one canonical asset, right now.
SELECT system, external_id,
       count(DISTINCT asset_key) AS canonical_assets,
       string_agg(DISTINCT asset_key, ', ' ORDER BY asset_key) AS which
FROM id_crosswalk
WHERE valid_to IS NULL
GROUP BY system, external_id
HAVING count(DISTINCT asset_key) > 1;
```

```sql run seed=crosswalk
-- Both failure modes at once: any two rows for the same (system, external_id)
-- whose validity windows overlap. Self-join on the pair, with the standard
-- interval-overlap test (a.from < b.to AND b.from < a.to).
SELECT a.system, a.external_id,
       a.asset_key AS asset_a, b.asset_key AS asset_b,
       a.valid_from AS a_from, COALESCE(a.valid_to::text, 'open') AS a_to,
       b.valid_from AS b_from, COALESCE(b.valid_to::text, 'open') AS b_to
FROM id_crosswalk a
JOIN id_crosswalk b
  ON a.system = b.system AND a.external_id = b.external_id
 AND a.xwalk_id < b.xwalk_id
 AND a.valid_from < COALESCE(b.valid_to, 'infinity'::timestamptz)
 AND b.valid_from < COALESCE(a.valid_to, 'infinity'::timestamptz)
ORDER BY a.system, a.external_id;
```

The resolve logic itself, with the ambiguity surfaced rather than swallowed:

```typescript run
type XwalkRow = {
  assetKey: string;
  system: string;
  externalId: string;
  validFrom: string;
  validTo: string | null;
};

const CROSSWALK: XwalkRow[] = [
  { assetKey: 'A-0003', system: 'SCADA', externalId: 'RTU-06', validFrom: '2019-01-01', validTo: '2023-03-15' },
  { assetKey: 'A-0003', system: 'SCADA', externalId: 'RTU-07', validFrom: '2023-03-15', validTo: null },
  { assetKey: 'A-0006', system: 'SCADA', externalId: 'RTU-07', validFrom: '2022-11-01', validTo: null },
];

type Resolution =
  | { ok: true; assetKey: string }
  | { ok: false; reason: 'not-found' }
  | { ok: false; reason: 'ambiguous'; candidates: string[] };

/** Resolve an external id to a canonical asset, as of an instant. */
function resolve(system: string, externalId: string, asOf: string): Resolution {
  const matches = CROSSWALK.filter(
    (r) =>
      r.system === system &&
      r.externalId === externalId &&
      r.validFrom <= asOf &&
      (r.validTo === null || asOf < r.validTo)
  );
  const assets = [...new Set(matches.map((r) => r.assetKey))];
  if (assets.length === 0) return { ok: false, reason: 'not-found' };
  if (assets.length > 1) return { ok: false, reason: 'ambiguous', candidates: assets };
  return { ok: true, assetKey: assets[0] };
}

for (const asOf of ['2023-01-01', '2023-06-01', '2024-03-01']) {
  console.log(`resolve SCADA/RTU-07 as of ${asOf}:`, JSON.stringify(resolve('SCADA', 'RTU-07', asOf)));
}
console.log('');
console.log('Before 2023-03-15, RTU-07 is unambiguously A-0006. After, it resolves to two');
console.log('assets — because the A-0006 row was never closed when the re-tag happened. The');
console.log('resolve returns "ambiguous" instead of quietly picking one.');
```

## When to Use
- Whenever an integration query starts from an id in one system and needs data from another
- When onboarding a new source system — its ids become a new set of crosswalk rows, with a `valid_from` of the onboarding date
- After any re-survey, re-tag or model re-export in a member system — to add the new rows and, critically, close the old ones
- When building historical replay (Lesson 520), which reads the same table with an explicit `as of`

## Common Mistakes
- **Borrowing a member system's id as the canonical key** — that system's next re-tag breaks every other join
- **A crosswalk with no validity time** — a resolve can then only answer "now", and every historical question is unanswerable
- **Adding the new row on a re-tag without closing the old one** — the id now resolves to two assets forever
- **Letting resolve silently pick one candidate** — the ambiguity is a real finding and hiding it means acting on the wrong asset
- **Assuming the mapping is one-to-one in both directions** — one asset can legitimately have several sensor ids; one sensor id must map to one asset
- **Treating the crosswalk as reference data that rarely changes** — it changes every time any member system renumbers anything

## Further Reading
- [Lesson 506](/courses/asset-management-systems/asset-identity) — the same "the key is a position, not the hardware" argument for a single register
- [W3C: Architecture of the World Wide Web — URIs and identity](https://www.w3.org/TR/webarch/#identification) — the general problem of one thing with many identifiers, and why a stable canonical one helps
- [Temporal database concepts (SQL:2011 valid-time overview)](https://en.wikipedia.org/wiki/SQL:2011) — the `valid_from` / `valid_to` pattern this lesson uses and its standard forms

```recall
- q: "What does a crosswalk store, and what is the canonical key?"
  must:
    - "one row per (canonical asset, system, external id), each row time-bounded"
    - "the canonical key is the integration's own meaningless, stable surrogate"
    - "not borrowed from any member system, because member ids change"

- q: "Why is every crosswalk row time-bounded, and what does 'resolve' mean as a result?"
  must:
    - "ids change — re-surveys, re-tags, re-exports"
    - "resolve always means 'resolve as of an instant', defaulting to now"
    - "the temporal columns are what make historical replay possible"

- q: "Name the two crosswalk-specific failure modes and their common cause."
  must:
    - "one external id mapped to two canonical assets"
    - "one asset with two open rows in a single system"
    - "both usually from a re-tag that added the new row without closing the old one"
```
