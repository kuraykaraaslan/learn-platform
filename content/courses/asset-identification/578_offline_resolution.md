# 578. Offline Resolution: The Scanner That Cannot Ask

## What It Is
A scan produces a string. Turning that string into an asset — a name, a class, a location, a last known state — is a lookup, and the place where scanning happens is reliably the place with no network: a basement plant room, a riser, a roof, a site with no coverage. Lesson 494 establishes that the capture path has to work offline; this lesson is about the specific piece of it that everyone leaves until last, which is **the catalogue the device resolves against**.

The catalogue is a slice of the register carried on the device. It does not need to be the whole estate — a technician on a site needs that site — and it does not need every column: an identifier, a name, a class, a parent and a last known state is enough for the checks in Lesson 577 and for showing the person that they scanned what they meant to. **Getting the slice right is a scoping decision, not a synchronisation problem**, and it is the difference between a 200-row download and a 200,000-row one.

Then there is the case that decides whether the design is any good: **an identifier that resolves to nothing**. It has three quite different causes and they need different responses. The asset is new and the catalogue is stale — the device has not synced since it was tagged. The catalogue's scope was wrong — the technician was sent to a building the slice does not cover. Or the identifier is genuinely not an asset — a mis-scan, a supplier's own label, a code from another system entirely.

The wrong response to all three is to refuse. A technician standing in front of a machine with a work order to complete will not stop; they will write it on paper, or attach it to the nearest asset that does resolve, and that second option is exactly the wrong-attribution failure this course exists to prevent. **The right response is to accept the record and mark it unresolved**, carrying the raw scanned string, the timestamp and the location, so the record can be reconciled later against a fresh register. An unresolved record is a known gap; a record attached to a plausible neighbour is a silent lie.

Staleness deserves its own decision rather than a default. The catalogue has an age, that age should be visible to the technician, and the app should say when it was last synced — because "this asset does not exist" and "this asset did not exist eleven days ago" are different statements and only one of them is the device's to make.

```quiz
- q: "What is the right response when a scanned identifier resolves to nothing?"
  anchor: "accept the record and mark it unresolved"
  options:
    - text: "Refuse the record until the device can sync"
      correct: false
      why: "The technician will not stop working; they will use paper or the nearest asset that resolves."
    - text: "Accept it, mark it unresolved, and carry the raw string, time and location for later reconciliation"
      correct: true
      why: "An unresolved record is a known gap; one attached to a neighbour is a silent lie."
    - text: "Attach it to the parent asset, which is certain to exist"
      correct: false
      why: "That is a wrong attribution with extra steps, and it will be believed."

- q: "What does the on-device catalogue need to contain?"
  anchor: "Getting the slice right is a scoping decision"
  options:
    - text: "The whole register, so no scan can fail to resolve"
      correct: false
      why: "That turns a 200-row download into a 200,000-row one to cover a case the unresolved path already handles."
    - text: "A scoped slice — the site being visited — with identifier, name, class, parent and last known state"
      correct: true
      why: "Enough for Lesson 577's checks and for showing the technician what they scanned."
    - text: "Only the identifiers, since names can be fetched later"
      correct: false
      why: "Then the technician cannot confirm they scanned the right thing, which was the point."

- q: "Why does the catalogue's age have to be visible?"
  anchor: "are different statements and only one of them is the device's to make"
  options:
    - text: "So the technician knows when to sync"
      correct: false
      why: "Useful, but not the reason it matters for correctness."
    - text: "Because 'this asset does not exist' and 'this asset did not exist eleven days ago' are different claims"
      correct: true
      why: "Only the second is one an offline device is entitled to make."
    - text: "Because stale catalogues are a security risk"
      correct: false
      why: "Staleness here is a correctness question, not a security one."
```

## Key Concepts
- **Scanning happens where there is no network** — basements, risers, roofs, remote sites (Lesson 494)
- **The device carries a scoped slice of the register**, not the estate
- **Enough columns**: identifier, name, class, parent, last known state — for Lesson 577's checks and for confirmation
- **Three causes of an unresolved code**: a stale catalogue, a wrong scope, or a code that is not an asset
- **Never refuse** — the technician will use paper or the nearest asset that resolves
- **Accept and mark unresolved**, carrying the raw string, time and location for reconciliation
- **Show the catalogue's age** — an offline device can only say the asset did not exist as of its last sync

## Example Code
What the slice looks like, taken from the register with a scope:

```sql run seed=asset_register
-- The catalogue for a visit to one system: everything under it, with the few
-- columns the device actually needs. This is the whole download.
WITH RECURSIVE scope AS (
  SELECT tag, name, asset_class, parent_id
  FROM asset
  WHERE tag = 'SYS-HVAC-B2'
  UNION ALL
  SELECT a.tag, a.name, a.asset_class, a.parent_id
  FROM asset a
  JOIN scope s ON a.parent_id = s.tag
)
SELECT tag, name, asset_class, parent_id
FROM scope
ORDER BY tag;
```

Now the resolution itself, including the case that matters. Four scanned strings arrive from a session; two are in the slice, one is a real asset outside it, and one is not an asset at all:

```sql run seed=asset_register
-- Resolving four scanned identifiers against the on-device slice.
WITH RECURSIVE scope AS (
  SELECT tag, name, asset_class, parent_id FROM asset WHERE tag = 'SYS-HVAC-B2'
  UNION ALL
  SELECT a.tag, a.name, a.asset_class, a.parent_id
  FROM asset a JOIN scope s ON a.parent_id = s.tag
),
scanned(raw) AS (
  VALUES ('FAN-B2-01'), ('COIL-B2-02'), ('PMP-1001A'), ('FAN-B2-99')
)
SELECT s.raw,
       COALESCE(sc.name, '(not in this catalogue)')                   AS resolves_to,
       CASE
         WHEN sc.tag IS NOT NULL                        THEN 'resolved'
         WHEN EXISTS (SELECT 1 FROM asset a WHERE a.tag = s.raw)
                                                        THEN 'real asset, outside the downloaded scope'
         ELSE                                                'unknown identifier'
       END                                                            AS outcome
FROM scanned s
LEFT JOIN scope sc ON sc.tag = s.raw
ORDER BY s.raw;
```

The third row is the interesting one. `PMP-1001A` is a perfectly real asset with a perfectly valid identifier, and the device cannot resolve it because nobody expected this technician to be near it. On the device those two unresolved cases are indistinguishable — which is precisely why the record has to carry the raw string rather than a guess, and why the reconciliation happens against the full register, later, where the distinction is one query.

## When to Use
- In every field app, because the network is absent exactly where the scanning is
- When scoping the download, where the slice is a decision about the visit rather than a sync problem
- When designing the unresolved path, which is the part that decides whether wrong attributions happen
- When a technician reports "the app would not let me record it", which means the refuse path was built
- When reconciling submissions, where the raw string and the timestamp are what make an unresolved record recoverable

## Common Mistakes
- **Refusing an unresolved scan** — the work continues on paper or against the wrong asset
- **Downloading the whole estate** — expensive, slow, and it does not remove the unresolved case
- **Storing the resolved asset instead of the raw string** — the resolution was a guess and the evidence is gone
- **Not showing the catalogue's age** — the device then makes a claim about existence it cannot support
- **Treating "not in my slice" as "does not exist"** — they are different, and the device cannot tell them apart
- **Reconciling by name** — names are not identifiers and are the thing most likely to have been edited

## Further Reading
- [Lesson 494](/courses/field-data-collection/offline-first-capture) — the offline-first argument this lesson applies to the resolution step
- [Lesson 504](/courses/asset-management-systems/the-asset-register) — the register the slice is taken from, and what a row actually holds
- [Lesson 505](/courses/asset-management-systems/asset-hierarchies) — the parent relationship the scoped download is built on
- [Lesson 577](/courses/asset-identification/the-scan-that-fails-and-the-scan-that-lies) — the checks that run against this same local catalogue

```recall
- q: "What does a device need in order to resolve a scan offline?"
  must:
    - "a scoped slice of the register -- the site or system being visited, not the estate"
    - "identifier, name, class, parent and last known state"
    - "which is enough for the moment-of-scan checks and to let the technician confirm what they scanned"

- q: "What are the three causes of an identifier that resolves to nothing?"
  must:
    - "the catalogue is stale and the asset was tagged after the last sync"
    - "the downloaded scope was wrong and the asset is real but elsewhere"
    - "or the identifier is not an asset at all -- a mis-scan or another system's label"

- q: "Why must an unresolved scan be accepted rather than refused?"
  must:
    - "the technician will not stop -- they will use paper, or attach the record to the nearest asset that resolves"
    - "that second option is the silent wrong attribution the whole course is about"
    - "accepting it as unresolved, with the raw string, time and location, leaves a known gap that can be reconciled"
```
