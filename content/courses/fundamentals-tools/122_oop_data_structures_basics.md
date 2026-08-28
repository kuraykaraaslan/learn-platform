# 122. OOP & Basic Data Structures

## What It Is
SOLID Principles (#64) assumes you already have this vocabulary: classes as a bundle of state + behavior, encapsulation as hiding internal state behind a controlled interface, and the inheritance-vs-composition choice as the first real design decision you make when two classes share behavior. Inheritance ("is-a") is tempting because it's built into the language, but it creates tight coupling — a change to the base class can silently break every subclass (the "fragile base class" problem). Composition ("has-a") — building a class out of smaller, injected collaborators — is more verbose up front but far more flexible, which is exactly the shape Dependency Injection (#66) formalizes.

The data structures underneath it are just as foundational. An array is a contiguous, ordered collection — great for iteration, O(n) to search by value. A hash map (`Map`, or a plain object) trades that for O(1) average-case lookup by key, at the cost of no guaranteed order (in most languages; `Map` in JS does preserve insertion order). A `Set` is a hash map with only keys — the right tool the moment you're asking "have I seen this before?" in a loop.

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
