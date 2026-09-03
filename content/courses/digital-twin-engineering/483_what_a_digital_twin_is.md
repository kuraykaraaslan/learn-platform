# 483. What a Digital Twin Is, in Data Terms: Model, State, History

## What It Is
"Digital twin" is one of the most worn-out phrases in the industry, and it has a precise and useful meaning underneath the marketing. A twin is **three data structures and the work of keeping them from disagreeing**.

The **model** is the structure: what exists, how it is arranged, what it is made of. In this domain that is usually an IFC file or something derived from one — the spatial hierarchy of Lesson 434 and the property sets of Lesson 436. It changes rarely, in discrete versions, by someone deliberately editing it.

The **state** is what is true now: temperatures, positions, open or closed, running or stopped. It changes constantly and it arrives from outside, which means it is late, incomplete and occasionally wrong in the ways Lesson 469's path describes. State is not part of the model, and putting it there is the first mistake — a model that is rewritten every time a sensor reports is not a model.

The **history** is every state the thing has been in. It is append-only, it is much larger than the other two put together, and it is what makes a twin worth building — a twin that only knows the present is a dashboard.

The fourth part is not a structure but a job: **reconciliation**. The model says a room has a sensor; the state says nothing has been heard from it for an hour; the history says it was reporting fine until 11:00. Which of the three is wrong is the question the twin exists to answer, and Lesson 486 is about doing it honestly.

Several ontologies exist for describing all this — DTDL, NGSI-LD, the Asset Administration Shell among them. **This course does not nominate one.** They differ in what they make easy, they are all live standards with their own version histories, and choosing between them is a decision about your consumers rather than about correctness. Lesson 493 is about the boundary of the whole idea, which is where that choice actually gets made.

```quiz
- q: "Where does a sensor reading belong: model, state, or history?"
  anchor: "State is not part of the model, and putting it there is the first mistake"
  options:
    - text: "The model, since the sensor is a model element"
      correct: false
      why: "The sensor is a model element; its reading is not. A model rewritten on every reading is not a model."
    - text: "State when it is current, and history permanently — never the model"
      correct: true
      why: "Three structures with three change rates, and mixing the fastest into the slowest is the first mistake."
    - text: "History only, with state derived by querying it"
      correct: false
      why: "Defensible as an implementation and it does not change the distinction — the current-value query is still answering a different question from the range query."

- q: "Why does this course not pick one twin ontology?"
  anchor: "choosing between them is a decision about your consumers rather than about correctness"
  options:
    - text: "Because they are all equivalent"
      correct: false
      why: "They are not — they differ in what they make easy, which is precisely why the choice depends on who is consuming the twin."
    - text: "Because the choice depends on your consumers, and all three are live standards with their own version histories"
      correct: true
      why: "Nominating one would be a recommendation with a shelf life."
    - text: "Because none of them is mature enough to build on"
      correct: false
      why: "All are in production use. Maturity is not the issue."
```

## Key Concepts
- **Model**: what exists and how it is arranged — changes rarely, in deliberate versions
- **State**: what is true now — arrives from outside, late and incomplete (Lesson 469)
- **History**: every state it has been in — append-only, and the largest of the three
- **Reconciliation**: the work of deciding which of the three is wrong (Lesson 486)
- **A twin with no history is a dashboard** — the history is what makes it worth building
- **State does not belong in the model**: a model rewritten per reading is not a model
- **Three change rates**: versions, seconds, and never — which is why they are three stores
- **Several ontologies exist** (DTDL, NGSI-LD, Asset Administration Shell) and this course nominates none
- **The boundary is part of the definition** (Lesson 493), and it is where the ontology choice is really made

## Example Code
The three structures as three types, with the change rate of each stated where it cannot be missed:

```typescript
/** MODEL — changes in deliberate versions. Everything here comes from an
 *  export, and the `modelVersion` is what a binding is valid against. */
type ModelElement = {
  elementId: string;
  ifcType: string;
  /** The spatial container, per Lesson 435. */
  storeyId: string;
  modelVersion: string;
};

/** STATE — changes constantly, arrives from outside, and carries when it was
 *  measured rather than when it was received. Lesson 474's rule, as a type. */
type PointState = {
  pointId: string;
  value: number;
  measuredAt: string;
  /** Null when nothing has ever been heard. A genuinely different fact from
   *  a value of zero, and the distinction Lesson 486 is built on. */
  reportedBy: string | null;
};

/** HISTORY — append-only, and much larger than the other two. Never a field
 *  on the element: it is a table, and Lesson 487 is about its shape. */
type StateSample = { pointId: string; value: number; measuredAt: string };

/** The binding is the twin. It is the only structure here that is neither
 *  model nor state, and it is the one that breaks when the model is
 *  re-exported (Lesson 490). */
export type Binding = {
  elementId: string;
  pointId: string;
  /** Which model version this binding was made against. A binding with no
   *  version is a binding you cannot audit after a re-export. */
  modelVersion: string;
};

/** What a twin can actually say about one element, expressed so that "we do
 *  not know" is a value rather than a null someone will misread as zero. */
export type ElementView =
  | { known: false; reason: 'not-bound' | 'never-reported' | 'stale' }
  | { known: true; value: number; measuredAt: string };
```

## When to Use
- At the start of a twin project, where separating the three structures is the decision everything else follows from
- When a stakeholder says "digital twin" and the scope needs to become concrete
- When choosing storage, since three change rates mean three different storage problems (Lesson 487)
- When writing an interface, where "we do not know" has to be expressible or it will be reported as zero

## Common Mistakes
- **Storing state on the model element** — the model then changes on every reading, and its version number stops meaning anything
- **Building a twin with no history** — that is a dashboard, and the questions people actually ask a twin are about change over time
- **Treating a missing value as zero** — a sensor that has never reported and a sensor reporting zero are different facts, and only one of them is a reading
- **Nominating an ontology first** — the choice depends on consumers, and making it before they are known is a decision made in the dark
- **Leaving the model version out of a binding** — after a re-export there is no way to tell which bindings were made against what (Lesson 490)
- **Calling a viewer a twin** — a rendered model with live values on it is a display of a twin, and everything in this lesson is upstream of it

## Further Reading
- [Digital Twin Definition Language (DTDL)](https://github.com/Azure/opendigitaltwins-dtdl) — one ontology's model, versioned in the open, useful as a concrete example rather than as a recommendation
- [NGSI-LD specifications (FIWARE)](https://github.com/FIWARE/specifications) — a second ontology, with a different emphasis, for comparison
- [Asset Administration Shell (Industrial Digital Twin Association)](https://industrialdigitaltwin.org/en/content-hub) — a third, from the manufacturing side, versioned in the open
- [IFC 4.3 documentation](https://ifc43-docs.standards.buildingsmart.org/) — where the model half of a built-environment twin comes from (Lesson 434, Lesson 436)

```recall
- q: "Name the three data structures and the change rate of each."
  must:
    - "model — what exists and how it is arranged, changing in deliberate versions"
    - "state — what is true now, arriving from outside, changing constantly"
    - "history — every state it has been in, append-only and the largest"

- q: "What is the fourth part, and what question does it answer?"
  must:
    - "reconciliation — not a structure but a job"
    - "when model, state and history disagree, which of the three is wrong"

- q: "Why does this course nominate no twin ontology?"
  must:
    - "they differ in what they make easy rather than in correctness"
    - "all are live standards with their own version histories"
    - "the choice depends on the twin's consumers, which Lesson 493's boundary discussion is where it gets made"
```
