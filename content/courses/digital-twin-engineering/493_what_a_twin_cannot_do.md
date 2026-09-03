# 493. What a Twin Cannot Do: Naming the Boundary Before a Client Does

## What It Is
Every lesson so far has been about building a twin. This one is about the sentence you say when someone asks it a question it cannot answer, and the argument for saying that sentence **before** the question is asked rather than after.

The boundary has four parts and they are all knowable in advance.

**A twin knows what it was told.** It has a model of what somebody drew, state from the points somebody instrumented, and history from when the collection started. A pipe that is not in the model does not exist to the twin; a room with no sensor has no state; nothing before the first reading has a history. Every one of those is a scope statement, and each of them will be discovered by a stakeholder eventually — the only choice is whether they hear it from you first.

**A twin is as current as its slowest input.** Lesson 486's staleness window makes this explicit, and it also makes it a number: a twin whose points report every fifteen minutes cannot answer a question about the last five, and dressing that up as real-time is a claim that will be tested.

**A twin's predictions are as good as their assumptions.** Lesson 491 keeps simulation and observation apart in the schema precisely so this stays sayable. A residual is the difference between two uncertain things, and reporting it as a model error attributes all of the uncertainty to one side.

**A twin does not make decisions.** It answers questions, and someone else decides. That distinction sounds pedantic until a twin's output is wired into a control loop, at which point the question of what happens when the twin is stale, or wrong, or bound to the wrong element (Lesson 485) becomes a safety question rather than a data question.

The reason to write all four down at the start is not modesty. It is that **a twin's credibility is spent once**. A twin that has been caught confidently reporting a stale value, or attributing a reading to the wrong room, is a twin nobody consults again — and the four sentences above are what turn each of those from a broken promise into a documented limit.

```quiz
- q: "Why state the boundary before a client asks rather than when they do?"
  anchor: "a twin's credibility is spent once"
  options:
    - text: "It manages expectations, which makes the project easier to deliver"
      correct: false
      why: "True and not the argument. The argument is about what happens after the first wrong answer."
    - text: "Because a twin caught reporting a stale or misattributed value is not consulted again, and a stated limit is not a broken promise"
      correct: true
      why: "Credibility is spent once, and the four limits are what turn a failure into a documented boundary."
    - text: "Because the boundary is impossible to determine later"
      correct: false
      why: "It is determinable at any point. What cannot be recovered later is the trust."

- q: "A twin's points report every fifteen minutes. What can it not answer?"
  anchor: "cannot answer a question about the last five"
  options:
    - text: "Nothing — fifteen minutes is close enough to real time"
      correct: false
      why: "Close enough for some questions and not for others, and calling it real-time is a claim someone will test."
    - text: "Any question about a period shorter than its slowest input's interval"
      correct: true
      why: "The staleness window of Lesson 486 makes this a number rather than an impression."
    - text: "Questions about the future, which need simulation"
      correct: false
      why: "It cannot answer those either, and for the separate reason Lesson 491 gives about assumptions."
```

## Key Concepts
- **A twin knows what it was told** — the model somebody drew, the points somebody instrumented, the history since collection began
- **Not in the model means it does not exist** to the twin
- **No sensor means no state**, and no amount of querying produces one
- **Nothing before the first reading has a history** — and that date is a scope statement
- **A twin is as current as its slowest input** — a number, from Lesson 486's window
- **Predictions are as good as their assumptions** (Lesson 491)
- **A residual is the difference between two uncertain things**, not a model error
- **A twin answers questions; it does not decide** — and wiring it to a control loop changes the class of the problem
- **Credibility is spent once**: a stated limit is a boundary, an unstated one is a broken promise

## Example Code
There is nothing to run here, and the artefact worth producing is not code. It is four sentences, written down where the twin's consumers will see them, with the project's own numbers in place of the placeholders:

```text
WHAT THIS TWIN KNOWS ABOUT

  Model coverage      Which disciplines' models are loaded, at which version,
                      and what is therefore absent. "MEP is not modelled" is a
                      sentence, and it belongs here rather than in a meeting.

  Instrumented points N points across M assets. The list is available. An asset
                      not on it has no state, and asking produces "not bound"
                      rather than a value.

  History from        The date collection began, per point. Earlier than that,
                      the answer is "we were not looking".

HOW CURRENT IT IS

  Slowest input       The longest reporting interval among the points, in
                      minutes. No question about a shorter period than this has
                      a current answer.

  Staleness window    The age at which a value stops being reported as current
                      and starts being reported as unknown. A number, agreed in
                      advance, not a judgement made per query.

WHAT ITS PREDICTIONS REST ON

  Models in use       Which, at which version, computed how often.

  Assumptions         The ones that would change the answer if they were wrong.
                      Named, because a residual is the difference between two
                      uncertain things and attributing it all to one side is a
                      claim.

WHAT IT DOES NOT DO

  Decide              It answers questions. If an output is wired into a control
                      loop, the behaviour when the twin is stale, unbound or
                      wrong is a safety requirement and belongs to whoever owns
                      that loop.
```

```typescript
/** The boundary, as a type the API can actually return. A twin that can say
 *  "I do not know, and here is which kind of not-knowing" is a twin that
 *  survives its first wrong answer. */
export type TwinAnswer =
  | { known: true; value: number; measuredAt: string; origin: 'observed' | 'simulated' }
  /** Not in the model. A scope fact, not a fault. */
  | { known: false; because: 'not-modelled' }
  /** In the model, no point bound to it (Lesson 485). */
  | { known: false; because: 'not-instrumented' }
  /** Bound, never reported. */
  | { known: false; because: 'never-reported' }
  /** Bound and reporting, but not recently enough (Lesson 486). */
  | { known: false; because: 'stale'; lastKnownAt: string; ageSeconds: number }
  /** Before collection began. The one answer a twin can never improve
   *  retroactively, and therefore the one most worth stating up front. */
  | { known: false; because: 'before-history-began'; historyStartsAt: string };

/** Five kinds of not-knowing, and each has a different response: one is a
 *  modelling job, one is a procurement job, one is a device fault, one is a
 *  transport problem, and one is nobody's fault at all. Collapsing them into
 *  `null` throws away the only useful part of the answer. */
export function isActionable(answer: TwinAnswer): boolean {
  return answer.known === false && answer.because !== 'before-history-began';
}
```

## When to Use
- At the start of a twin project, in the document the client actually reads
- When scoping instrumentation, where the point list is the boundary and it is negotiable while the budget is
- When designing the API, where five kinds of not-knowing are the difference between a usable answer and a `null`
- Before any twin output is wired into a control loop, where the failure behaviour becomes a safety requirement

## Common Mistakes
- **Returning `null` for every kind of not-knowing** — five different situations with five different owners collapse into one uninformative value
- **Describing a fifteen-minute twin as real-time** — it is a claim, and the first person to test it stops trusting the rest
- **Reporting a stale value as current** — this is the single failure that costs a twin its credibility, and Lesson 486's window exists to prevent it
- **Presenting a residual as a model error** — it is the gap between two uncertain quantities, and attributing it to one is an unstated assumption
- **Leaving the history start date out of the scope** — it is the one limit that can never be fixed retroactively
- **Letting a twin output drive an actuator without a defined stale behaviour** — the twin's uncertainty becomes the control loop's, and nobody owns it
- **Writing the boundary after the first hard question** — by then it reads as an excuse rather than as a specification

## Further Reading
- [Digital Twin Definition Language (DTDL)](https://github.com/Azure/opendigitaltwins-dtdl) — an ontology's own vocabulary for what a twin models, useful for stating coverage precisely
- [NGSI-LD specifications (FIWARE)](https://github.com/FIWARE/specifications) — a second vocabulary, with a different treatment of what is known and when
- [Asset Administration Shell (Industrial Digital Twin Association)](https://industrialdigitaltwin.org/en/content-hub) — a third, from a domain where the control-loop boundary is taken most seriously

```recall
- q: "Name the four parts of a twin's boundary."
  must:
    - "it knows what it was told — the model drawn, the points instrumented, the history since collection began"
    - "it is as current as its slowest input"
    - "its predictions are as good as their assumptions"
    - "it answers questions and does not decide"

- q: "Why write the boundary down before it is asked about?"
  must:
    - "a twin's credibility is spent once"
    - "a twin caught reporting a stale or misattributed value is not consulted again"
    - "a stated limit is a boundary; an unstated one is a broken promise"

- q: "Why is `null` the wrong answer for a value a twin does not have?"
  must:
    - "there are five kinds of not-knowing: not modelled, not instrumented, never reported, stale, and before history began"
    - "each has a different owner and a different response"
    - "and one of them — before history began — can never be fixed retroactively"
```
