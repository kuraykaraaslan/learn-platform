# 122. OOP & Basic Data Structures

## What It Is
SOLID Principles (#64) assumes you already have this vocabulary: classes as a bundle of state + behavior, encapsulation as hiding internal state behind a controlled interface, and the inheritance-vs-composition choice as the first real design decision you make when two classes share behavior. Inheritance ("is-a") is tempting because it's built into the language, but it creates tight coupling — a change to the base class can silently break every subclass (the "fragile base class" problem). Composition ("has-a") — building a class out of smaller, injected collaborators — is more verbose up front but far more flexible, which is exactly the shape Dependency Injection (#66) formalizes.

The data structures underneath it are just as foundational. An array is a contiguous, ordered collection — great for iteration, O(n) to search by value. A hash map (`Map`, or a plain object) trades that for O(1) average-case lookup by key, at the cost of no guaranteed order (in most languages; `Map` in JS does preserve insertion order). A `Set` is a hash map with only keys — the right tool the moment you're asking "have I seen this before?" in a loop.


```quiz
- q: "Why does the lesson treat inheritance as the riskier of the two options when sharing behavior?"
  anchor: "a change to the base class can silently break every subclass"
  options:
    - text: "It is slower at runtime than composition"
      correct: false
      why: "Performance is not the argument. The concern is coupling \u2014 what a later edit to the base class does to code you are not looking at."
    - text: "It couples subclasses to the base class, so one edit there can silently break all of them"
      correct: true
      why: "That is the fragile base class problem: the breakage is distant from the change and nothing at the edit site warns you."
    - text: "Most languages do not support it well"
      correct: false
      why: "It is built into the language, which is exactly why it is tempting. Availability is not the problem; coupling is."

- q: "You are looping over records and need to know whether you have already seen an id. Which structure does the lesson point at?"
  anchor: "the right tool the moment you're asking \"have I seen this before?\" in a loop"
  options:
    - text: "An array, checking with includes() each time"
      correct: false
      why: "That is O(n) per check inside a loop, which makes the whole pass O(n squared) \u2014 the shape the lesson is steering you away from."
    - text: "A Set"
      correct: true
      why: "A Set is a hash map with only keys, giving O(1) average membership checks. The lesson names this exact question as its trigger."
    - text: "A sorted array with binary search"
      correct: false
      why: "That works but costs a sort plus re-sorting on every insert. A Set answers membership directly with no ordering to maintain."
```

## Key Concepts
- **Class vs instance**: the class is the blueprint, the instance is the concrete object with its own state
- **Encapsulation**: expose behavior through methods, hide the internal representation so it can change later
- **Inheritance ("is-a")**: subclass gets the parent's shape for free, but is tightly coupled to it
- **Composition ("has-a")**: a class holds references to other objects and delegates to them — favored by default
- **Array**: ordered, O(1) index access, O(n) search/insert-at-front
- **Map/hash map**: O(1) average lookup/insert by key, no guaranteed order in most languages
- **Set**: a Map with only keys — the right structure for membership checks and de-duplication

## Example Code
```typescript
// Composition over inheritance: NotificationSender doesn't extend EmailSender/SmsSender,
// it's composed of interchangeable channel implementations (also see #64 SOLID / DIP)
interface Channel {
  send(to: string, message: string): Promise<void>;
}

class EmailChannel implements Channel {
  async send(to: string, message: string) { /* ... */ }
}

class NotificationSender {
  constructor(private readonly channels: Channel[]) {}

  async notify(to: string, message: string) {
    await Promise.all(this.channels.map((c) => c.send(to, message)));
  }
}

// Set for O(1) membership checks instead of array.includes() in a loop
function dedupeActiveUserIds(events: { userId: string }[]): string[] {
  const seen = new Set<string>();
  for (const e of events) seen.add(e.userId);
  return [...seen];
}
```

The "no guaranteed order" claim above, run for real: the same four keys inserted into a plain object and into a `Map`. Predict the two key orders before revealing them — and what `map.get("4")` returns when the key was inserted as the number `4`.

```proof sha=4f7d5514b4f281d5 at=2026-09-02 commit=9614387
$ node keys.js
inserted in this order: 30, 4, 100, 4.5

--- plain object as a lookup table ---
Object.keys(obj): ["4","30","100","4.5"]
the integer-like keys were sorted numerically; "4.5" is not integer-like, so it kept its slot

--- Map with the same insertions ---
[...map.keys()]: [30,4,100,4.5]
insertion order preserved, and the keys are still numbers, not strings

--- and the key type is not the same either ---
typeof Object.keys(obj)[0]: string
typeof [...map.keys()][0]:  number
obj[4] and obj["4"] are the same slot: true
map.get(4) is a hit, map.get("4") is: undefined
```

## When to Use
- Reach for composition first; only use inheritance for a genuinely stable "is-a" relationship (rare in application code)
- Use a `Map`/`Set` the moment you're checking membership or looking up by key inside a loop — an `array.includes()` there is a silent O(n²)
- Use encapsulation to hide a representation you expect to change (e.g., internal caching) behind a stable method signature

## Common Mistakes
- **Understanding one class means reading through four levels of ancestors first, none of which behave quite the way their name suggests** — Deep inheritance chains (3+ levels) that make it impossible to reason about behavior without reading every ancestor
- Using `array.find()`/`array.includes()` inside a loop over another array — an accidental O(n²) that a `Map` fixes in one line
- **A function mutates the config object it was passed, and a completely unrelated part of the app starts behaving differently** — Mutating a shared object passed by reference instead of returning a new one, causing surprising action-at-a-distance bugs
- **A public field gets read directly all over the codebase, and now changing its type breaks a dozen unrelated call sites** — Exposing internal mutable state directly (public fields) instead of through methods, making future refactors breaking changes

## Further Reading
- "Head First Design Patterns" — early chapters, "favor composition over inheritance"
- [MDN: `Map`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map) — and the `Set` reference alongside it; read the complexity notes, not just the method list
- Sandi Metz — "Practical Object-Oriented Design" (language-agnostic principles)

```recall
- q: "Give the argument for composition over inheritance when two classes share behavior."
  must:
    - "inheritance is an is-a relationship and couples the subclass to the base"
    - "a change to the base class can silently break every subclass"
    - "composition is a has-a relationship built from injected collaborators"
    - "it is more verbose up front but far easier to change later"

- q: "When do you reach for a Map or a Set instead of an array?"
  must:
    - "a Map when you need O(1) average lookup by key rather than O(n) search by value"
    - "a Set the moment the question is have I seen this before"
    - "an array when order and iteration matter more than keyed lookup"

- q: "What surprises people about key order and key types in a plain object?"
  must:
    - "integer-like keys are enumerated in ascending numeric order, not insertion order"
    - "object keys are always strings, so obj[4] and obj['4'] are the same slot"
    - "a Map preserves insertion order and keeps the key's original type"
```
