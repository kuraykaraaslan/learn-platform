# 503. Validating Field Data Against the Model It Describes

## What It Is
Field data describes something that already exists in a model, and that gives you a validation source most forms never get: **the model itself**. A form can check that an asset tag looks like an asset tag. Only a join against the register can check that it *is* one.

Three checks matter and they are progressively harder to see.

The first is **existence**: an asset tag that is not in the register at all. Mistyped, or an asset nobody modelled — and the two are worth distinguishing, because one is a data-entry problem and the other is a model gap that the field team just discovered for you.

The second is the one that earns the lesson: **a valid pair of invalid values**. An inspector records a real asset on a real storey, and the model says that asset is on a different storey. Every individual value passes every check a form could apply. Only the relationship between them is wrong, and only a join can see it. This is the same argument Lesson 435 makes about IFC containment — the relationship carries information neither end does.

The third is **positional plausibility**: a submission whose reported accuracy (Lesson 497) is too coarse to have placed the asset. This is not invalid data. It is a real measurement, honestly reported by the device, that happens not to be evidence of location. Rejecting it loses the finding; accepting it as a location is a fabrication; recording it as a finding **without** a location is correct and is the option a boolean schema does not have.

What all three have in common is that **the response is not rejection**. A field record represents work somebody did at a place they have now left. So a failed validation produces a **quarantine with a reason** — the record is stored, flagged, and routed to whoever can resolve it, which for a model gap is not the inspector.

```quiz
- q: "An inspector records asset AT-0181 on storey L02. Both exist. The model says AT-0181 is on L03. What kind of defect is this?"
  anchor: "a valid pair of invalid values"
  options:
    - text: "A data-entry error the form should have caught"
      correct: false
      why: "No form could: both values are individually valid, and a form has no access to the register."
    - text: "A valid pair of invalid values — only the relationship is wrong, and only a join sees it"
      correct: true
      why: "The same argument Lesson 435 makes about containment: the relationship carries information neither end does."
    - text: "A model error, since the register may be out of date"
      correct: false
      why: "Possibly, and that is the point of quarantining rather than rejecting — somebody has to decide which side is wrong."

- q: "A submission's reported position accuracy is 900 metres. What should happen to it?"
  anchor: "recording it as a finding **without** a location is correct"
  options:
    - text: "Reject it — the position is unusable"
      correct: false
      why: "That discards the finding along with the position, and the finding is the part somebody travelled to collect."
    - text: "Store the finding and record that it has no usable location"
      correct: true
      why: "The measurement is honest and it is not evidence of location. Those are separable."
    - text: "Store it and use the position anyway, flagged"
      correct: false
      why: "A flagged fabrication is still a fabrication — it will be read by something that ignores the flag."
```

## Key Concepts
- **The model is a validation source** a form does not have
- **Existence**: an asset tag not in the register — mistyped, or a model gap
- **Distinguishing the two matters**: one is data entry, the other is a discovery
- **A valid pair of invalid values**: every value passes, the relationship fails
- **Only a join can see it** — the same argument as Lesson 435's containment
- **Positional plausibility**: a real measurement that is not evidence of location (Lesson 497)
- **A finding without a location is a valid record** — the two are separable
- **The response is never rejection**: the work has been done and the site has been left
- **Quarantine with a reason**, routed to whoever can resolve it
- **A model gap is not the inspector's to fix**, so the routing matters as much as the flag

## Example Code
The three checks, as joins against the register:

```sql run seed=field_submissions
-- Validating field data against the model it describes. Three checks, and only
-- the first is the kind a form could have caught.

-- 1. An asset tag that is not in the register at all.
SELECT s.client_id, s.asset_tag, s.finding
FROM field_submission s
LEFT JOIN asset_register r ON r.asset_tag = s.asset_tag
WHERE r.asset_tag IS NULL
ORDER BY s.client_id;

-- 2. A real asset recorded on the wrong storey. Both values are individually
-- valid — the tag exists, the storey exists — and the PAIR is wrong, which is
-- the only kind of defect a join can find and a form cannot.
SELECT s.client_id, s.asset_tag, s.storey_id AS recorded_on, r.storey_id AS model_says
FROM field_submission s
JOIN asset_register r ON r.asset_tag = s.asset_tag
WHERE s.storey_id <> r.storey_id
ORDER BY s.client_id;

-- 3. Submissions whose reported position is too imprecise to have placed the
-- asset. Not invalid data — a real measurement, reported honestly by the
-- device (Lesson 497) — but not evidence of location either.
SELECT client_id, asset_tag, accuracy_m
FROM field_submission
WHERE accuracy_m > 25
ORDER BY accuracy_m DESC;
```

The first query finds a tag that does not exist. The second finds a real asset on the wrong storey — and note that no form could have caught it, because both values are valid on their own. The third finds two submissions whose positions are too coarse to place anything, both of which are honest measurements from a device that was indoors (Lesson 498).

```typescript
/** The outcome of validating one submission. `reject` is deliberately absent:
 *  a field record is work somebody did at a place they have left, so the only
 *  options are accept, accept-with-a-gap, and quarantine. */
export type Validation =
  | { state: 'accepted' }
  /** The finding is good and the position is not. Separable, and separating
   *  them is what keeps the finding. */
  | { state: 'accepted-without-location'; accuracyM: number }
  | { state: 'quarantined'; reason: QuarantineReason; owner: Owner };

type QuarantineReason =
  /** The tag is not in the register. */
  | { kind: 'unknown-asset'; assetTag: string }
  /** Both values valid, relationship wrong. */
  | { kind: 'storey-mismatch'; recorded: string; modelSays: string };

/** Who can actually resolve it. An unknown asset may be a typo (the field
 *  team) or a genuine model gap (whoever owns the model), and routing it to
 *  the wrong one is how a quarantine queue stops being looked at. */
type Owner = 'field-team' | 'model-owner' | 'either-needs-triage';

const MAX_USABLE_ACCURACY_M = 25;

export function validate(
  submission: { assetTag: string; storeyId: string; accuracyM: number | null },
  register: Map<string, { storeyId: string }>
): Validation {
  const asset = register.get(submission.assetTag);
  if (asset === undefined) {
    // Not decidable from here: a near-miss on an existing tag suggests a typo,
    // a well-formed unknown tag suggests a model gap. Triage rather than guess.
    return {
      state: 'quarantined',
      reason: { kind: 'unknown-asset', assetTag: submission.assetTag },
      owner: 'either-needs-triage',
    };
  }
  if (asset.storeyId !== submission.storeyId) {
    return {
      state: 'quarantined',
      reason: { kind: 'storey-mismatch', recorded: submission.storeyId, modelSays: asset.storeyId },
      owner: 'either-needs-triage',
    };
  }
  if (submission.accuracyM === null || submission.accuracyM > MAX_USABLE_ACCURACY_M) {
    return { state: 'accepted-without-location', accuracyM: submission.accuracyM ?? Infinity };
  }
  return { state: 'accepted' };
}
```

## When to Use
- Any field workflow whose records reference a model or a register, which is most asset and inspection work
- On ingest, where a join is cheap and catches what no form can
- When a quarantine queue is not being worked, where the routing is usually the problem rather than the volume
- When the field team keeps reporting assets that "do not exist", which is a model-gap signal worth acting on

## Common Mistakes
- **Rejecting a failed submission** — the work is done and the site has been left; a quarantine keeps the record recoverable
- **Validating only individual values** — the interesting defect is a valid pair whose relationship is wrong
- **Not distinguishing a typo from a model gap** — one is the field team's and one is not, and sending both to the same queue means neither gets fixed
- **Discarding a finding because its position is unusable** — the finding and the location are separable, and only one of them was unusable
- **Storing an unusable position as if it were a location** — a flag does not prevent a later reader from using it
- **Assuming the model is right** — the field team is standing in front of the asset and the register may be out of date, which is exactly why it is a triage rather than a correction
- **A quarantine with no reason** — an unexplained flag is a queue nobody can work

## Further Reading
- [IfcRelContainedInSpatialStructure](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelContainedInSpatialStructure.htm) — the relationship the storey check is validating against, and Lesson 435's subject
- [IfcSpace](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcSpace.htm) — where a storey's spaces come from, when the check needs to go finer than a floor
- [Geolocation API specification](https://w3c.github.io/geolocation-api/) — the accuracy field the positional check reads (Lesson 497)
- [PostgreSQL INSERT](https://www.postgresql.org/docs/current/sql-insert.html) — for writing a quarantined row alongside an accepted one in the same transaction

```recall
- q: "Name the three validation checks and which one a form could do."
  must:
    - "existence — an asset tag not in the register"
    - "relationship — a real asset recorded on the wrong storey, where both values are individually valid"
    - "positional plausibility — a reported accuracy too coarse to place anything"
    - "a form could only approximate the first, since it has no access to the register"

- q: "Why is a valid pair of invalid values the interesting case?"
  must:
    - "every individual value passes every check a form could apply"
    - "only the relationship between them is wrong"
    - "and only a join against the model can see it — the same argument as Lesson 435's containment"

- q: "Why is rejection never the response?"
  must:
    - "a field record is work somebody did at a place they have now left"
    - "so a failure produces a quarantine with a reason, not a rejection"
    - "and the reason has to route to whoever can resolve it — a model gap is not the inspector's to fix"
```
