# 485. Binding a Model Element to a Live Data Point

## What It Is
The model says a plant room contains an air terminal. The telemetry stream says `ahu-1/supply-temp` was 18.2 degrees a minute ago. **Nothing connects those two statements**, and supplying that connection is the entire substance of a twin — the rest is storage.

A binding is a small record: a model element id, a data point id, and the model version the pairing was made against. That third field is not bookkeeping. Lesson 490 is about what happens when a model is re-exported and the ids change; a binding without a version stamp cannot be audited afterwards, because there is no way to tell which model it was true of.

Where the binding **lives** is the design decision, and there are three options with different consequences. In the **model**, as a property set on the element: it travels with the file, which is good, and it means every binding change is a model edit by whoever owns the model, which is usually not you. In your **own database**: you control it, and it is now a second source of truth that has to be reconciled against the model on every export. In the **naming convention** — deriving the point id from the element's own asset tag: no record to maintain at all, and it fails silently the moment one element is named inconsistently.

Most working systems use the first two together: the model carries the binding where the modelling team owns it, your database carries an override table for the ones you had to fix, and the reconciliation between them is a job that runs on every model import.

What makes this hard is that **a binding can be wrong in four ways and only one of them looks like an error**. It can point at an element that no longer exists; at a point that has never reported; at the wrong element entirely, which produces plausible readings attributed to the wrong room; or at nothing, because the element was never bound. Only the first is likely to raise anything.

```quiz
- q: "Which of these binding failures is hardest to detect?"
  anchor: "at the wrong element entirely, which produces plausible readings attributed to the wrong room"
  options:
    - text: "The element no longer exists in the model"
      correct: false
      why: "The easiest: a lookup fails, and something can be raised."
    - text: "The binding points at the wrong element, so real readings are attributed to the wrong room"
      correct: true
      why: "Every value is valid, every lookup succeeds, and the twin is confidently wrong."
    - text: "The point has never reported"
      correct: false
      why: "Detectable by asking, and it shows up as an absence rather than as a wrong answer."

- q: "Why does a binding need a model version?"
  anchor: "there is no way to tell which model it was true of"
  options:
    - text: "For audit logging"
      correct: false
      why: "Useful and not the reason. The reason is that ids can change between exports."
    - text: "Because a re-export can change element ids, and without a version you cannot tell which model the pairing was true of"
      correct: true
      why: "Which is Lesson 490's whole subject."
    - text: "Because the point id changes with the model"
      correct: false
      why: "Point ids come from the telemetry side and are unaffected by a model export."
```

## Key Concepts
- **Nothing connects the model and the stream** — the binding is the twin
- **A binding is three fields**: element id, point id, and the model version it was made against
- **Three places it can live**: the model, your database, or a naming convention
- **In the model**: travels with the file; changing it is a model edit by someone else
- **In your database**: you control it, and it becomes a second source of truth to reconcile
- **In a naming convention**: nothing to maintain, and it fails silently on the first inconsistency
- **Most systems use the first two together**, with reconciliation on every import
- **Four failure modes**: missing element, silent point, wrong element, never bound
- **Only the wrong-element case produces plausible answers** — and it is therefore the one worth designing against
- **Custom property sets must not use the `Pset_` prefix** (Lesson 436), which is why a project's own set carries its own name

## Example Code
One floor's bindings, carried in the model as a custom property set. The set is called `Depot_TwinBinding` rather than `Pset_TwinBinding` for the reason Lesson 436 gives — the `Pset_` namespace belongs to buildingSMART:

```spatial
title: "Where a binding lives in the model"
ask: "Two of these three sensors will still be bound after the model is re-exported with new GlobalIds, and one will not. Which one is at risk, and what makes the difference?"
reveal: "a binding without a version stamp cannot be audited afterwards, because there is no way to tell which model it was true of"
root:
  id: "2rSuRi_lD5$O4Op8DVOCkd"
  type: IfcBuildingStorey
  name: "Ground floor"
  children:
    - id: "1Kd4mYpQb7vTAeZrLs9wXc"
      type: IfcSpace
      name: "Plant room"
      rel: aggregates
      children:
        - id: "3Xt7zPfNb2vgqR1YkEwNsq"
          type: IfcAirTerminal
          name: "Supply diffuser 1"
          rel: contained
          props:
            - set: Depot_TwinBinding
              name: PointId
              value: "ahu-1/supply-temp"
            - set: Depot_TwinBinding
              name: AssetTag
              value: "AT-0141"
        - id: "2Kd9WpYbn0OQAzUcRt6mLh"
          type: IfcSensor
          name: "Room sensor A"
          rel: contained
          flag: focus
          props:
            - set: Depot_TwinBinding
              name: PointId
              value: "ahu-1/room-temp"
    - id: "0Vb4NsHkD1EQfXpTr8wLmY"
      type: IfcSpace
      name: "Corridor 1"
      rel: aggregates
      children:
        - id: "1MvQ7cRkT4vAWmDpLs2nXe"
          type: IfcSensor
          name: "Corridor sensor"
          rel: contained
          props:
            - set: Depot_TwinBinding
              name: PointId
              value: "ahu-2/room-temp"
            - set: Depot_TwinBinding
              name: AssetTag
              value: "AT-0155"
```

The two elements carrying an `AssetTag` alongside the `PointId` are the ones that survive a re-export — the tag is an organisation-controlled shared parameter and nobody else can renumber it, which is Lesson 459's argument and Lesson 490's mechanism.

```typescript
type Binding = {
  elementId: string;
  pointId: string;
  /** Which model this pairing was made against. Lesson 490's subject. */
  modelVersion: string;
  /** Where the binding came from. When the model and an override disagree,
   *  knowing which is which is the difference between resolving a conflict
   *  and picking one at random. */
  source: 'model' | 'override';
};

/** The four ways a binding fails, as a type, so a caller has to handle the
 *  case that produces plausible-but-wrong answers rather than falling into
 *  it. */
export type BindingCheck =
  | { ok: true }
  | { ok: false; problem: 'element-missing' }
  | { ok: false; problem: 'point-never-reported' }
  | { ok: false; problem: 'element-unbound' }
  /** Not detectable from the binding alone — it needs a second signal, such
   *  as a reading that disagrees with its neighbours or an asset tag that
   *  does not match. Named here so it is at least visible in the type. */
  | { ok: false; problem: 'suspected-wrong-element'; evidence: string };

export function checkBinding(
  binding: Binding | null,
  elementExists: boolean,
  pointHasReported: boolean
): BindingCheck {
  if (binding === null) return { ok: false, problem: 'element-unbound' };
  if (!elementExists) return { ok: false, problem: 'element-missing' };
  if (!pointHasReported) return { ok: false, problem: 'point-never-reported' };
  return { ok: true };
}

/** Model and override together, with the override winning and the conflict
 *  reported rather than swallowed — an override that silently shadows a
 *  model binding is how a fix outlives the problem it fixed. */
export function resolve(
  fromModel: Binding | null,
  fromOverride: Binding | null
): { binding: Binding | null; conflict: boolean } {
  if (fromOverride === null) return { binding: fromModel, conflict: false };
  if (fromModel === null) return { binding: fromOverride, conflict: false };
  return { binding: fromOverride, conflict: fromModel.pointId !== fromOverride.pointId };
}
```

## When to Use
- Every twin, since the binding is the part that makes it a twin rather than two systems
- When deciding where bindings live, which is a question about who owns the model rather than a technical one
- When a twin shows a plausible wrong value, where a mis-bound element is the first thing to suspect
- After any model re-export, where the reconciliation between model bindings and overrides is the job that catches what moved

## Common Mistakes
- **Deriving the point id from a naming convention alone** — it works until one element is named inconsistently, and then it fails silently for that one element
- **Leaving the model version off the binding** — after a re-export nothing can be audited, because no binding says which model it was true of
- **Letting an override shadow a model binding silently** — the fix then outlives the problem, and nobody knows the model was ever corrected
- **Assuming a successful lookup means a correct binding** — the wrong-element case succeeds at every step and reports a real reading for the wrong room
- **Using the `Pset_` prefix for a project's own set** — that namespace is reserved (Lesson 436), and the collision arrives in someone else's tool
- **Binding to an element id when an asset tag exists** — the tag is the id nobody else can renumber (Lesson 459)

## Further Reading
- [IfcPropertySet](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcPropertySet.htm) — where a binding carried in the model lives, and the naming rule for custom sets
- [IfcRelDefinesByProperties](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelDefinesByProperties.htm) — how the set reaches the element
- [Digital Twin Definition Language (DTDL)](https://github.com/Azure/opendigitaltwins-dtdl) — one ontology's way of expressing the same relationship, for comparison

```recall
- q: "What is a binding, and what are its three fields?"
  must:
    - "the record connecting a model element to a live data point — the thing that makes a twin"
    - "an element id, a point id, and the model version the pairing was made against"

- q: "Name the three places a binding can live and the cost of each."
  must:
    - "in the model — travels with the file, and changing it is a model edit by whoever owns the model"
    - "in your own database — you control it, and it is a second source of truth to reconcile"
    - "in a naming convention — nothing to maintain, and it fails silently on the first inconsistency"

- q: "Give the four binding failure modes and say which one is dangerous."
  must:
    - "missing element, point that never reported, unbound element, and bound to the wrong element"
    - "the wrong-element case is the dangerous one"
    - "because every lookup succeeds and real readings are attributed to the wrong place"
```
