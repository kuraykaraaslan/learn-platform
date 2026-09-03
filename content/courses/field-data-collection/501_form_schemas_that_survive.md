# 501. Form Schemas That Survive a Version Change in the Field

## What It Is
A field app's forms change: a question is added, an option is renamed, a field becomes mandatory. Meanwhile there is a device in a basement with a queue of forty submissions captured against last month's schema, and it will reconnect in a week. **The schema change and the offline queue are the same problem**, and the only place to solve it is before the change ships.

The foundation is that **every submission carries the schema version it was captured against**. That one field turns an unanswerable question — what shape is this? — into a lookup. Without it, the server has to guess from the payload's keys, which works until two versions have the same keys with different meanings.

Then the change itself, and the useful classification is by what it does to old data rather than by what it looks like in a form builder. **Additive** changes — a new optional field, a new option in a list — leave every old submission valid. **Widening** changes — mandatory becoming optional, a narrower type becoming broader — also do. **Narrowing** changes are the problem: making a field mandatory invalidates every queued submission that omitted it, and removing an option invalidates every submission that chose it. Those are the ones that need a decision, and the decision cannot be "reject them".

The three honest options for a narrowing change are: **accept and mark incomplete**, so the record lands and somebody sees what is missing; **migrate on arrival**, mapping the old shape to the new one with an explicit rule that is written down and testable; or **hold the old version open**, keeping the previous schema readable for as long as any device might still be carrying it. Most systems need all three at different times, and what they all have in common is that **the old shape is read rather than refused**.

The one thing not to do is validate the queue against the *current* schema on the device. A device that fetches a new schema and finds its own queue invalid has trapped the data it was holding — the records cannot be submitted and cannot be edited into the new shape without the inspector redoing work they already did.

```quiz
- q: "A field is made mandatory. What happens to the queued submissions that omitted it?"
  anchor: "making a field mandatory invalidates every queued submission that omitted it"
  options:
    - text: "Nothing — they were valid when captured"
      correct: false
      why: "They were, and validation happens against a schema at submission time. Which schema is the whole question."
    - text: "They become invalid against the new schema, and the server has to accept them anyway"
      correct: true
      why: "Accept and mark incomplete, migrate on arrival, or keep the old version readable — but not refuse."
    - text: "The device should re-prompt for the missing field"
      correct: false
      why: "Only if the inspector is still standing there. Days later, re-prompting asks them to invent data."

- q: "Why must a device not validate its own queue against a newly fetched schema?"
  anchor: "has trapped the data it was holding"
  options:
    - text: "Because validation is expensive on a phone"
      correct: false
      why: "It is cheap. The problem is what happens when it fails."
    - text: "Because the queued records then cannot be submitted or fixed without the inspector redoing work"
      correct: true
      why: "The data is trapped: too old for the new schema and no longer re-capturable."
    - text: "Because the device may have an outdated schema cache"
      correct: false
      why: "The scenario here is the opposite — the device has just fetched the newest one."
```

## Key Concepts
- **The schema change and the offline queue are one problem**
- **Every submission carries its schema version** — turning a guess into a lookup
- **Classify changes by their effect on old data**, not by how they look in a builder
- **Additive**: a new optional field, a new option — old data stays valid
- **Widening**: mandatory to optional, narrower type to broader — old data stays valid
- **Narrowing**: new mandatory field, removed option — old data becomes invalid
- **Three options for a narrowing change**: accept and mark incomplete, migrate on arrival, or keep the old version readable
- **All three read the old shape** rather than refusing it
- **Never validate the device's queue against a new schema** — it traps the data
- **A migration rule must be written and testable**, not applied ad hoc at the ingest

## Example Code
The classification, and what each kind of change does to a queued submission:

```typescript
type FieldType = 'text' | 'number' | 'choice' | 'photo';

type FieldDef = {
  key: string;
  type: FieldType;
  required: boolean;
  /** Only for `choice`. Removing a value from this list is a narrowing change. */
  options?: string[];
};

type Schema = { version: number; fields: FieldDef[] };

/** The classification that matters: what does this change do to data already
 *  captured? A form builder's vocabulary ("edited a field") does not answer
 *  that, and this does. */
export type ChangeKind = 'additive' | 'widening' | 'narrowing';

export function classify(before: Schema, after: Schema): { kind: ChangeKind; reasons: string[] } {
  const reasons: string[] = [];
  let kind: ChangeKind = 'additive';
  const note = (k: ChangeKind, reason: string) => {
    reasons.push(reason);
    // Narrowing dominates: one narrowing change makes the whole release one.
    if (k === 'narrowing') kind = 'narrowing';
    else if (k === 'widening' && kind === 'additive') kind = 'widening';
  };

  const beforeByKey = new Map(before.fields.map((f) => [f.key, f]));
  const afterByKey = new Map(after.fields.map((f) => [f.key, f]));

  for (const [key, f] of afterByKey) {
    const old = beforeByKey.get(key);
    if (old === undefined) {
      // A new REQUIRED field invalidates every queued submission.
      if (f.required) note('narrowing', `new required field "${key}"`);
      else note('additive', `new optional field "${key}"`);
      continue;
    }
    if (f.required && !old.required) note('narrowing', `"${key}" became required`);
    if (!f.required && old.required) note('widening', `"${key}" became optional`);
    if (f.type !== old.type) note('narrowing', `"${key}" changed type ${old.type} -> ${f.type}`);
    const removed = (old.options ?? []).filter((o) => !(f.options ?? []).includes(o));
    if (removed.length > 0) note('narrowing', `"${key}" lost options: ${removed.join(', ')}`);
    const added = (f.options ?? []).filter((o) => !(old.options ?? []).includes(o));
    if (added.length > 0) note('additive', `"${key}" gained options: ${added.join(', ')}`);
  }

  for (const key of beforeByKey.keys()) {
    // A removed field does not invalidate old data — the value is simply no
    // longer asked for. It does mean the old value has nowhere to go, which
    // is a retention decision rather than a validation one.
    if (!afterByKey.has(key)) note('widening', `field "${key}" removed`);
  }

  return { kind, reasons };
}

/** What the server does with a submission captured against an older schema.
 *  Note that `reject` is not one of the outcomes: a rejected submission is
 *  data the inspector already collected and cannot collect again. */
export type Acceptance =
  | { accept: true; complete: true }
  | { accept: true; complete: false; missing: string[] }
  | { accept: true; complete: true; migratedBy: string };

export function accept(
  submission: { schemaVersion: number; values: Record<string, unknown> },
  current: Schema,
  migrations: Map<number, { to: number; rule: string; apply: (v: Record<string, unknown>) => Record<string, unknown> }>
): Acceptance {
  // An explicit, named migration is preferred: the rule is written down and
  // can be tested against a real old payload.
  const migration = migrations.get(submission.schemaVersion);
  if (migration !== undefined && migration.to === current.version) {
    return { accept: true, complete: true, migratedBy: migration.rule };
  }
  // Otherwise accept it and say what is missing, so the gap is visible to
  // whoever has to act on the record rather than hidden in a validation log.
  const missing = current.fields.filter((f) => f.required && submission.values[f.key] === undefined).map((f) => f.key);
  return missing.length === 0 ? { accept: true, complete: true } : { accept: true, complete: false, missing };
}
```

## When to Use
- Before shipping any form change, where the classification decides whether a migration is needed at all
- When a release adds a mandatory field, which is the change that always needs a decision
- When submissions arrive that fail validation, where accepting-and-marking is almost always better than rejecting
- When retiring an old schema version, where the question is how long a device might have been offline

## Common Mistakes
- **No schema version on the submission** — the server has to infer the shape, which works until two versions share keys
- **Rejecting old-shaped submissions** — that discards work an inspector already did and cannot redo
- **Validating the device's queue against a freshly fetched schema** — the queued data becomes unsubmittable and unfixable
- **Making a field mandatory without a migration plan** — every queued submission that omitted it is now a decision nobody made
- **Removing a choice option** — every submission that chose it is invalid, and the option's meaning is gone with it
- **Migrating implicitly at the ingest** — a rule that is not written down is a rule that cannot be tested or explained later
- **Retiring an old version on a calendar** — the question is how long a device can be offline, which is a measurement rather than a policy

## Further Reading
- [RFC 7231 — HTTP/1.1 Semantics and Content](https://datatracker.ietf.org/doc/html/rfc7231) — content negotiation and media types, one way to carry a schema version that is not a body field
- [PostgreSQL JSON types](https://www.postgresql.org/docs/current/datatype-json.html) — for storing a submission whose shape is a version rather than a table
- [Exif 2.32 (DC-008-2019) translation](https://www.cipa.jp/std/documents/download_e.html?DC-008-Translation-2019-E) — an example of a long-lived versioned schema where optional fields are the rule

```recall
- q: "What single field makes a schema change tractable, and why?"
  must:
    - "the schema version the submission was captured against"
    - "it turns 'what shape is this?' from a guess into a lookup"
    - "without it the server infers from the payload's keys, which breaks when two versions share keys"

- q: "Classify schema changes by their effect on queued data."
  must:
    - "additive — a new optional field or a new option; old data stays valid"
    - "widening — mandatory to optional, or a broader type; old data stays valid"
    - "narrowing — a new required field or a removed option; old data becomes invalid"

- q: "Name the three responses to a narrowing change, and the thing never to do."
  must:
    - "accept and mark incomplete, migrate on arrival with a written rule, or keep the old version readable"
    - "all three read the old shape rather than refusing it"
    - "never validate the device's own queue against a newly fetched schema — it traps the data"
```
