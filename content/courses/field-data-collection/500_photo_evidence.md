# 500. Photo Evidence: Hashing, Deduplication, and Metadata You Must Not Trust

## What It Is
A photograph is the most common attachment in field capture and the one most often treated as self-evident. It is not. **This lesson is technical and stops at the technical boundary**: what a hash gives you, what deduplication costs, and which metadata fields are claims rather than facts. It draws no conclusions about evidential weight — that is a legal question, it varies by jurisdiction, and nothing here should be read as an answer to it.

The technical foundation is a **content hash**, computed on the device, at capture, before the file moves anywhere. It gives you three things and only three. It identifies the bytes, so the same photo submitted twice is recognisably the same photo. It **detects change in transit or at rest** — a re-encode, a truncation, a corrupted upload all change it. And it lets a later reader check that the file they hold is the file that was hashed. What it does *not* give you is any statement about when, where, or by whom the photo was taken. A hash is about bytes.

**Deduplication** on that hash is nearly free and has a subtlety worth knowing: two photographs of the same thing are not the same bytes, and the same photograph re-encoded by an upload pipeline is also not the same bytes. So a content hash deduplicates **exact copies of one file** — a retried upload, a queue reloaded from disk, the same attachment linked twice — and nothing else. Perceptual hashing addresses the near-duplicate case and brings false positives with it, which is a different trade and a different lesson.

Then the metadata, and the part to be careful about. EXIF is **written by the device and editable by anything afterwards**. The timestamp is the device's own clock, unsynchronised, and Lesson 474's whole argument applies. The GPS block may be absent, may be a network-derived position of the kind Lesson 498 describes, and may have been stripped by a photo library or an upload pipeline before your server ever sees it. The orientation tag is routinely ignored by viewers and routinely respected by others, which is why a photo appears rotated in one place and not another.

So the practical position is: **hash on the device, store the hash and the raw file, and record metadata as claims rather than as facts** — with the source of each claim kept alongside it, so a later reader can tell what was measured from what was asserted.

```quiz
- q: "What does a content hash of a photograph establish?"
  anchor: "A hash is about bytes"
  options:
    - text: "That the photo was taken at the time and place its metadata says"
      correct: false
      why: "Nothing about a hash speaks to time or place. It identifies bytes."
    - text: "That the file is the file that was hashed, and that it has not changed since"
      correct: true
      why: "Identity, change detection, and later verification — and no more than that."
    - text: "That the photo has not been edited before capture"
      correct: false
      why: "It cannot: the hash is computed on whatever bytes it was given."

- q: "Two inspectors photograph the same defect. Does content-hash deduplication catch it?"
  anchor: "two photographs of the same thing are not the same bytes"
  options:
    - text: "Yes — the images show the same thing"
      correct: false
      why: "Different bytes entirely. A content hash sees files, not subjects."
    - text: "No — it deduplicates exact copies of one file, such as a retried upload"
      correct: true
      why: "Near-duplicates need perceptual hashing, which brings false positives."
    - text: "Only if both used the same camera model"
      correct: false
      why: "Even the same camera produces different bytes for two exposures."
```

## Key Concepts
- **This lesson is technical** and states no evidential or legal conclusion
- **Hash on the device, at capture**, before the file moves
- **A hash gives three things**: identity, change detection, later verification
- **A hash says nothing about when, where or by whom** — it is about bytes
- **Deduplication catches exact copies**: a retried upload, a reloaded queue, a doubly-linked attachment
- **Two photos of one subject are different bytes**, and a re-encode of one photo is too
- **Perceptual hashing** addresses near-duplicates and introduces false positives
- **EXIF is device-written and afterwards editable**
- **The EXIF timestamp is an unsynchronised device clock** (Lesson 474)
- **The GPS block may be absent, network-derived, or stripped** by a library or pipeline (Lesson 498, Lesson 499)
- **Record metadata as claims with their source**, not as facts

## Example Code
There is no runtime here: hashing a real file needs a file, and a page cannot honestly produce one. What is worth writing down is the shape that keeps a claim distinguishable from a measurement.

```typescript
/** A claim, with where it came from. The `source` field is the entire point:
 *  a position the app measured through the Geolocation API and a position
 *  read out of a photo's EXIF are different kinds of thing, and a schema that
 *  stores them in one column has thrown that away permanently. */
type Claim<T> = {
  value: T;
  source:
    /** The app asked the platform at capture time. */
    | 'measured-by-app'
    /** Read out of the file's own metadata. Device-written, then editable. */
    | 'exif'
    /** A person typed it. */
    | 'entered-by-user'
    /** Derived from something else — e.g. snapped to a graph node. */
    | 'derived';
  /** Only meaningful for a measured position (Lesson 497). Null elsewhere,
   *  because an EXIF position carries no accuracy estimate at all. */
  accuracyM: number | null;
};

export type PhotoRecord = {
  /** Generated on the device (Lesson 495), so a retry is a no-op. */
  clientId: string;
  /** SHA-256 of the bytes as captured, computed before the file moved.
   *  This is the only field here that is a fact about the file. */
  contentHash: string;
  byteLength: number;
  /** Everything below is a CLAIM. Note that each may be absent, and absent
   *  is a different fact from wrong. */
  capturedAt: Claim<string> | null;
  position: Claim<{ lat: number; lon: number }> | null;
  /** EXIF orientation, which viewers respect inconsistently — the reason a
   *  photo appears rotated in one place and upright in another. */
  orientation: Claim<number> | null;
};

/** What deduplication can and cannot conclude, as a type rather than a
 *  boolean, so a caller cannot read "not a duplicate" as "a different
 *  subject". */
export type DedupeResult =
  | { verdict: 'same-file'; existingClientId: string }
  | { verdict: 'different-bytes'; note: 'may still be the same subject — a content hash cannot tell' };

export function dedupe(seen: Map<string, string>, record: PhotoRecord): DedupeResult {
  const existing = seen.get(record.contentHash);
  if (existing !== undefined) return { verdict: 'same-file', existingClientId: existing };
  seen.set(record.contentHash, record.clientId);
  return { verdict: 'different-bytes', note: 'may still be the same subject — a content hash cannot tell' };
}

/** The check a later reader runs. It answers one question — are these the
 *  bytes that were hashed — and it is worth being explicit that it answers
 *  only that one. */
export function verifyIntegrity(record: PhotoRecord, recomputedHash: string): { intact: boolean; establishes: string } {
  return {
    intact: recomputedHash === record.contentHash,
    establishes: 'that the bytes match the hash recorded at capture; nothing about time, place or authorship',
  };
}
```

## When to Use
- Any capture path that attaches photographs, which is most inspection and maintenance work
- When storage cost matters, where exact-copy deduplication is cheap and worth having
- When an upload pipeline re-encodes images, where the hash has to be computed before that happens or it describes the wrong bytes
- When designing the schema, where separating a measurement from a claim is a decision that cannot be made retroactively

## Common Mistakes
- **Hashing after upload** — the pipeline may have re-encoded the file, so the hash describes the server's bytes rather than the device's
- **Storing EXIF values as facts** — they are device-written and subsequently editable, and the column loses that distinction forever
- **Treating an absent GPS block as a zero position** — `0, 0` is a real place, and Lesson 499 covers why datasets accumulate points there
- **Expecting content-hash dedupe to find near-duplicates** — it finds exact copies, and two photos of one defect are not that
- **Adding perceptual hashing without accounting for false positives** — it merges photographs that are merely similar, which loses evidence rather than storage
- **Ignoring the orientation tag** — the photo then appears rotated in some viewers and not others, and the file is not wrong
- **Drawing an evidential conclusion from an integrity check** — it establishes that the bytes match a hash, and the rest is a question this lesson does not answer

## Further Reading
- [Exif](https://en.wikipedia.org/wiki/Exif) — the metadata structure, the GPS group, and the orientation tag
- [CIPA standards](https://www.cipa.jp/e/std/std-sec.html) — where Exif is published as DC-008, with the version to cite
- [Exif 2.32 (DC-008-2019) translation](https://www.cipa.jp/std/documents/download_e.html?DC-008-Translation-2019-E) — the tag definitions, including which fields are optional
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — the measured-position source, for contrast with an EXIF-claimed one

```recall
- q: "What does a content hash establish, and what does it not?"
  must:
    - "it establishes identity of the bytes, change detection, and later verification"
    - "it says nothing about when, where or by whom the photo was taken"
    - "and it has to be computed on the device before the file moves, or it describes different bytes"

- q: "What does content-hash deduplication catch?"
  must:
    - "exact copies of one file — a retried upload, a reloaded queue, a doubly-linked attachment"
    - "not two photographs of the same subject, which are different bytes"
    - "and not a re-encoded copy of the same photograph"

- q: "Why store EXIF values as claims rather than facts?"
  must:
    - "EXIF is device-written and editable afterwards"
    - "the timestamp is an unsynchronised device clock"
    - "the GPS block may be absent, network-derived, or stripped by a library or pipeline"
```
