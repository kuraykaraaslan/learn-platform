# 458. FilteredElementCollector: Querying a Model Without Freezing Revit

## What It Is
**Mode: add-in.** `FilteredElementCollector` is the Revit API's query interface, and how you build the query decides whether a command returns instantly or freezes the application for a minute.

A collector is constructed against a document and then narrowed by chained filters. The important property is that **narrowing happens inside Revit rather than in your loop**: `OfCategory` and `WhereElementIsNotElementType` are applied by the API before elements are handed to you, so an element rejected by them is never materialised. Pull everything and filter in a `foreach` and you have paid to materialise the whole model to keep a few hundred elements.

Filters come in two families, and the distinction is the one worth learning. **Quick filters** (`OfClass`, `OfCategory`, `WhereElementIsElementType`, `WhereElementIsNotElementType`) can be answered from an element's record without loading it. **Slow filters** (anything geometric, `ElementIntersectsElementFilter`, anything with a predicate you supplied) require the element itself. Applying a quick filter first is not a micro-optimisation: it decides how many elements the slow filter ever has to see.

The measurable part of that is shown below, in TypeScript, on a stand-in model — because the number is the argument and a C# fence that cannot be compiled or run has no business carrying a performance claim. The C# fence carries only the API call shape.

The other freezing cause has nothing to do with filters: **a collector is lazy, and enumerating it twice enumerates it twice**. `ToElements()` once, into a list, is what you want; two `Count()` calls on the same collector are two passes over the model.

```quiz
- q: "Why is `OfCategory` before a geometric filter not a micro-optimisation?"
  anchor: "it decides how many elements the slow filter ever has to see"
  options:
    - text: "It is — both filters run over the same set, just in a different order"
      correct: false
      why: "Each stage only sees what the previous one passed, so the order changes the input size of every later stage."
    - text: "A quick filter is answered from the element record without loading the element, so it shrinks what the slow filter has to materialise"
      correct: true
      why: "The two families cost different amounts, and the cheap one belongs first."
    - text: "Because geometric filters cannot be chained after other filters"
      correct: false
      why: "They can be chained in any order. The order is a cost decision, not a legality one."

- q: "What does calling `.Count()` twice on one collector do?"
  anchor: "a collector is lazy, and enumerating it twice enumerates it twice"
  options:
    - text: "Nothing extra — the count is cached after the first call"
      correct: false
      why: "There is no caching. The collector is an enumeration, and each pass is a pass."
    - text: "Two full passes over the model, because a collector is lazy and holds no results"
      correct: true
      why: "Materialise once with ToElements() and work from the list."
    - text: "Throws, because a collector can only be enumerated once"
      correct: false
      why: "It does not throw. It quietly does the work again, which is why the mistake survives."
```

## Key Concepts
- **`FilteredElementCollector`**: constructed against a document, narrowed by chained filters
- **Narrowing happens inside Revit**: a filtered-out element is never materialised for you
- **Quick filters**: `OfClass`, `OfCategory`, `WhereElementIsElementType`, `WhereElementIsNotElementType` — answered from the element record
- **Slow filters**: geometric filters and your own predicates — need the element itself
- **Order by selectivity, cheap first**: each stage only sees survivors
- **Lazy enumeration**: a collector holds no results; every pass over it is a pass over the model
- **`ToElements()` once**: materialise, then work from the list
- **Scoped construction**: a collector built against a view or a set of ids starts smaller than one built against the document

## Example Code
The cost of the ordering, measured. Nothing Revit-specific here — the arithmetic is the argument:

```typescript run
// run is the arithmetic that decides whether narrowing is worth doing and in
// what order — which is the part people settle by guessing.
type Element = { id: number; category: string; isType: boolean; level: string };

const CATEGORIES = ['Walls', 'Doors', 'Windows', 'Floors', 'Pipes', 'Ducts', 'Furniture', 'Generic'];
const LEVELS = ['L01', 'L02', 'L03', 'L04'];

/** A cheap deterministic mix, so the three attributes are independent of each
 *  other. Deriving them all from `i % n` would make category and level
 *  perfectly correlated and quietly rig the comparison below. */
function mix(n: number): number {
  let x = (n ^ 0x9e3779b9) >>> 0;
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b) >>> 0;
  x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35) >>> 0;
  return (x ^ (x >>> 16)) >>> 0;
}

// A model of the size where this stops being a style question.
const model: Element[] = Array.from({ length: 240_000 }, (_, i) => ({
  id: i,
  category: CATEGORIES[mix(i) % CATEGORIES.length],
  level: LEVELS[mix(i + 7919) % LEVELS.length],
  // Roughly one type definition per hundred occurrences.
  isType: mix(i + 104729) % 100 === 0,
}));

type Stage = { name: string; keep: (e: Element) => boolean };

const STAGES: Stage[] = [
  { name: 'WhereElementIsNotElementType', keep: (e) => !e.isType },
  { name: 'OfCategory(Doors)', keep: (e) => e.category === 'Doors' },
  { name: 'ElementLevelFilter(L02)', keep: (e) => e.level === 'L02' },
];

/** Total elements each stage has to LOOK at — the number filter ordering
 *  changes. Each stage only sees what the previous one passed. */
function costOf(order: Stage[]): { visited: number; kept: number } {
  let current = model;
  let visited = 0;
  for (const stage of order) {
    visited += current.length;
    current = current.filter(stage.keep);
  }
  return { visited, kept: current.length };
}

function permutations<T>(items: T[]): T[][] {
  if (items.length <= 1) return [items];
  return items.flatMap((item, i) =>
    permutations([...items.slice(0, i), ...items.slice(i + 1)]).map((rest) => [item, ...rest])
  );
}

console.log(`model: ${model.length.toLocaleString('en-US')} elements`);
const wanted = model.filter((e) => !e.isType && e.category === 'Doors' && e.level === 'L02').length;
console.log(`elements the query actually wants: ${wanted.toLocaleString('en-US')}`);
console.log('');

console.log('pull everything and filter in your own code:');
console.log(`  ${model.length.toLocaleString('en-US')} elements across the API boundary for ${wanted.toLocaleString('en-US')} results`);
console.log(`  ${(model.length / wanted).toFixed(0)}x more than needed`);
console.log('');

console.log('every ordering of the same three filters, by elements visited:');
const results = permutations(STAGES)
  .map((order) => ({ order, ...costOf(order) }))
  .sort((a, b) => a.visited - b.visited);
for (const r of results) {
  console.log(`  ${String(r.visited).padStart(7)}   ${r.order.map((s) => s.name.replace(/\(.*/, '')).join(' -> ')}`);
}
console.log('');

const best = results[0];
const worst = results[results.length - 1];
console.log(`every ordering returns the same ${best.kept.toLocaleString('en-US')} elements.`);
console.log(`best order visits ${best.visited.toLocaleString('en-US')}, worst visits ${worst.visited.toLocaleString('en-US')} — ${(worst.visited / best.visited).toFixed(2)}x.`);
console.log('Most selective first, because every later stage only sees survivors.');
console.log('');
console.log('That ratio is the argument. It is not large enough to matter on a small model,');
console.log('which is exactly why the habit is formed on one and paid for on another.');
```

And the API call shape that arithmetic is about. Fifteen lines that cannot be compiled by anything in this repository, which is why they carry no numbers:

```csharp
// Revit 2025 API. Quick filters first, then the list, then your own predicate
// on what survived. One enumeration, not three.
FilteredElementCollector collector = new FilteredElementCollector(doc)
    .OfCategory(BuiltInCategory.OST_Doors)
    .WhereElementIsNotElementType();

IList<Element> doors = collector.ToElements();

List<Element> onLevel2 = doors
    .Where(d => d.LevelId == level2Id)
    .ToList();
```

## When to Use
- Every add-in that reads more than one element, which is nearly all of them
- When a command is slow and the cause is not obvious — filter order and repeated enumeration are the first two things to look at
- When writing an audit or a report over a whole model, where the collector is the entire performance story
- When scoping a query to a view or a selection, where constructing the collector narrower is cheaper than filtering afterwards

## Common Mistakes
- **Collecting everything and filtering in a `foreach`** — every element is materialised to keep a few, which on a large model is the difference between instant and frozen
- **Putting a slow filter first** — a geometric filter that runs over the whole model instead of over a category's worth of it does the same work many times over
- **Enumerating a collector more than once** — it is lazy, so `.Count()` then `.ToElements()` is two passes; materialise once
- **Constructing against the document when a view would do** — the narrower constructor is free and the filter is not
- **Assuming `OfClass` and `OfCategory` are interchangeable** — one filters by .NET type and the other by Revit category, and for several elements those disagree
- **Attributing slowness to the model size** — the same model answers the same question quickly under a better-ordered query, which is what the run above measures

## Further Reading
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the filtering chapter, including which filters are quick and which are slow, version-stamped
- [Revit API documentation index](https://www.revitapidocs.com/) — `FilteredElementCollector` and the filter classes, searchable because names move between versions
- [C# documentation](https://learn.microsoft.com/en-us/dotnet/csharp/) — LINQ's deferred execution, which is the same laziness the collector has

```recall
- q: "Distinguish quick filters from slow ones and say what follows."
  must:
    - "quick filters are answered from the element record without loading the element"
    - "slow filters — geometric ones and your own predicates — need the element itself"
    - "so the cheap, selective filter goes first, because every later stage only sees survivors"

- q: "What does laziness cost here, and what is the fix?"
  must:
    - "a collector holds no results, so every enumeration is another pass over the model"
    - "two .Count() calls are two passes"
    - "materialise once with ToElements() and work from the list"

- q: "Why does this lesson measure in TypeScript rather than in C#?"
  must:
    - "nothing in this repository can compile or run a C# fence"
    - "so a C# fence cannot carry a performance claim anyone can check"
    - "the arithmetic that decides the ordering is language-independent and can be run"
```
