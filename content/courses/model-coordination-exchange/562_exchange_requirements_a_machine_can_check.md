# 562. Exchange Requirements a Machine Can Check

## What It Is
Lesson 438 makes a remark in passing that this whole lesson is about: *"georeferenced" is too vague to check*. A requirement written that way cannot be satisfied deliberately or refused honestly. Both sides sign it, both sides believe different things, and the disagreement surfaces months later when somebody's query returns nothing.

A requirement that can be checked has four parts, and writing them down is most of the work. **The entity** — which things this applies to, named in the schema's terms rather than in project language: `IfcUnitaryEquipment`, not "the plant". **The property** — where the value must be, by property set and name, because a value in the wrong set is invisible to the consumer that needs it (Lesson 561). **The value domain** — the type, the unit, and the permitted range or enumeration, since "a fire rating" and "a fire rating in minutes, one of 30/60/90/120" are different requirements. **The cardinality** — whether this must hold for every instance, for at least one, or for those matching some filter.

Once those four exist, the fifth part writes itself: **the check**. It is a small program over the delivered file, it produces a count and a list of offenders, and it is the artefact that makes the requirement real. A requirement shipped without its check is an opinion; a requirement shipped with one is a gate that both sides can run before anybody argues. Ship the check with the requirement, in the same document, and run it on your own exports first.

Two boundaries are worth stating plainly. This is not a lesson about **information-delivery processes** — the frameworks that govern who asks for what and when are a different discipline with a different audience, and this corpus deliberately does not teach them. And a checkable requirement is not a complete one: it says nothing about whether the model is *good*, only about whether the delivered file contains what was agreed. **Mechanical checking eliminates the arguments that should never have happened**, which leaves room for the ones that should.

```quiz
- q: "Why is \"the model must be georeferenced\" not a usable requirement?"
  anchor: "cannot be satisfied deliberately or refused honestly"
  options:
    - text: "Because georeferencing is optional in IFC"
      correct: false
      why: "Its optionality is exactly why it must be required — but the requirement still has to say what it means."
    - text: "Because it names no entity, no property, no value domain and no cardinality, so nobody can check it"
      correct: true
      why: "Both sides sign it believing different things, and the disagreement surfaces months later."
    - text: "Because coordinate systems differ by country"
      correct: false
      why: "That is a reason to name the expected system in the requirement, not a reason the requirement fails."

- q: "What are the four parts of a checkable exchange requirement?"
  anchor: "The entity"
  options:
    - text: "Purpose, author, deadline and format"
      correct: false
      why: "Those are delivery-process concerns and none of them can be evaluated against a file."
    - text: "Entity, property, value domain and cardinality"
      correct: true
      why: "Together they let a small program produce a count and a list of offenders."
    - text: "Schema version, file size, element count and naming convention"
      correct: false
      why: "All measurable, none of them a statement about the information that had to be delivered."

- q: "What makes a requirement real rather than an opinion?"
  anchor: "A requirement shipped without its check is an opinion"
  options:
    - text: "Both parties signing it"
      correct: false
      why: "Signing a vague requirement is how the disagreement gets deferred rather than resolved."
    - text: "Shipping the check alongside it, so both sides can run the same gate before arguing"
      correct: true
      why: "And running it on your own exports first, which is where it is cheapest to fail."
    - text: "Referencing a published standard by number"
      correct: false
      why: "A citation locates the intent; it does not tell a program what to look for in the file."
```

## Key Concepts
- **"Too vague to check" is a defect in the requirement**, not a limitation of the file (Lesson 438)
- **Entity**: named in schema terms, not project language
- **Property**: property set and name, because location decides visibility (Lesson 561)
- **Value domain**: type, unit, and the permitted range or enumeration
- **Cardinality**: every instance, at least one, or those matching a filter
- **The check is the fifth part** — a small program producing a count and a list of offenders
- **Run it on your own exports first**, where failing is cheapest
- **Delivery processes and frameworks are out of scope** — this is the file-level contract only

## Example Code
The order in which a requirement gets written, and the questions each step has to answer:

```md
## 1. Name the entity, in the schema's terms
- [ ] Which IFC class or classes does this apply to? (`IfcUnitaryEquipment`, not "the plant")
- [ ] Is the set defined by class alone, or by class plus a filter (a system, a storey, a type)?
- [ ] Would two people, reading only this line, select the same elements from the file?

## 2. Name the property, by set and name
- [ ] Which property set — a standard one, or a named custom one? (Lesson 436)
- [ ] Exact property name, spelled as it must appear in the file
- [ ] If a custom set: is the consumer's query written against that same set? (Lesson 561)

## 3. Name the value domain
- [ ] Type: text, number, boolean, enumeration
- [ ] Unit, explicitly — and note that IFC declares units per file (Lesson 437)
- [ ] Permitted range or permitted values; state whether empty is acceptable

## 4. Name the cardinality
- [ ] Every instance of the entity, at least one, or a stated fraction?
- [ ] What happens to elements outside the filter — silently ignored, or reported?
- [ ] Is the requirement per file, or per federated set? (Lesson 556)

## 5. Ship the check with the requirement
- [ ] A program that reads a delivered file and prints a count plus a list of offenders
- [ ] Run against your own exports before it is sent to anyone else
- [ ] Versioned with the requirement, so a change to one is visibly a change to both
- [ ] Failing output readable by a person who has never seen the code
```

Item 5 is the one that gets dropped under time pressure, and it is the one that makes the other four worth writing. A check that exists converts a disagreement about intent into a disagreement about a number, which is the only kind a project can settle quickly.

## When to Use
- When writing any exchange requirement, at the point where the phrase "must be" appears
- When receiving a requirement written vaguely, where the productive response is to propose the checkable version rather than to sign it
- Before an export leaves your system, since the check you wrote for others runs equally well on you (Lesson 559)
- When a delivery is disputed, where a check both sides can run replaces an argument about what was meant
- When a consumer's query returns nothing, since the requirement was probably silent about which property set (Lesson 561)

## Common Mistakes
- **Requiring a quality rather than a fact** — "coordinated", "complete", "georeferenced" cannot be evaluated by a program
- **Naming the property without the set** — the value can be present and unreachable
- **Omitting the unit** — IFC declares units per file, so a bare number is not a requirement (Lesson 437)
- **Leaving cardinality implicit** — "elements must carry a fire rating" is satisfied by one element carrying one
- **Shipping the requirement without the check** — it stays an opinion until somebody writes the program
- **Writing the check only for incoming files** — the same program is the cheapest possible test of your own export

## Further Reading
- [buildingSMART IFC4.3 documentation](https://ifc43-docs.standards.buildingsmart.org/) — the entity and property-set names a requirement has to be written in
- [Lesson 438](/courses/bim-ifc-data-models/georeferencing-a-model) — the source of this lesson's example: what "georeferenced" has to say to be checkable
- [Lesson 559](/courses/model-coordination-exchange/writing-ifc) — the same checks pointed at your own output, before it ships
- [Lesson 560](/courses/model-coordination-exchange/cobie-as-a-schema) — the same argument for a spreadsheet delivery, where the checkable facts are the name joins

```recall
- q: "What are the four parts of a checkable exchange requirement, plus the fifth thing that makes it real?"
  must:
    - "entity (in schema terms), property (set and name), value domain (type, unit, permitted values), cardinality"
    - "and the check: a small program that reads a delivered file and reports a count and the offenders"
    - "shipped and versioned with the requirement, and run against your own exports first"

- q: "Why is 'the model must be georeferenced' unusable as written?"
  must:
    - "it names no entity, no property, no value domain and no cardinality"
    - "so it cannot be satisfied deliberately or refused honestly"
    - "both sides sign it believing different things and find out months later"

- q: "What does mechanical checking buy, and what does it not?"
  must:
    - "it converts a disagreement about intent into a disagreement about a number"
    - "it says nothing about whether the model is good -- only whether the file contains what was agreed"
    - "it eliminates the arguments that should never have happened, leaving room for the ones that should"
```
