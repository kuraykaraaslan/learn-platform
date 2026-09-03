# 456. Revit's Object Model: Documents, Elements, Parameters, Transactions

## What It Is
**Mode: add-in.** Everything here needs a running Revit process and a live document; none of it exists in the cloud services from Lesson 461 onwards.

A Revit model is a graph of **elements**, and an element is anything with an id: a wall, a level, a view, a family type, a schedule. That breadth is the first surprise — a view is an element, so is a material, so is the project information. `Document` is the root: it owns the elements, and every element is reached through it by id.

Data on an element lives in **parameters**, not in fields. A wall does not have a `.FireRating` property; it has a parameter you look up, and what you look it up by is the next lesson's subject. The shape is the same one IFC uses for the same reason — an open-ended data model needs an open-ended container — which is why Lesson 436's property sets and this lesson's parameters describe the same problem twice.

The rule that has no equivalent in ordinary application code is the **transaction**. Any modification to the model must happen inside a `Transaction` that you open, name and commit; outside one, a write throws. The name matters because it becomes the undo entry the user sees. Transactions cannot be nested — a `SubTransaction` is a different type for a different job — and a `TransactionGroup` is what wraps several into one undoable step.

The last piece is that **the model is single-threaded**. Revit's API must be called from the main thread, so background work means computing off-thread and applying on it. That constraint decides the architecture of any add-in that does real work, and it is not negotiable.

```quiz
- q: "What happens if you modify an element outside a Transaction?"
  anchor: "outside one, a write throws"
  options:
    - text: "The change is applied and committed with the next transaction"
      correct: false
      why: "There is no implicit transaction. The write is rejected."
    - text: "It throws — every modification must be inside a Transaction you opened"
      correct: true
      why: "And the transaction's name becomes the user's undo entry, so it is not a formality."
    - text: "It applies to an in-memory copy that is discarded"
      correct: false
      why: "Nothing silently succeeds. The API refuses the write."

- q: "Why does a wall have no `FireRating` field?"
  anchor: "Data on an element lives in **parameters**, not in fields"
  options:
    - text: "It does, but only on certain wall subclasses"
      correct: false
      why: "No element type exposes discipline data as fields. The parameter container is how all of it travels."
    - text: "Discipline data lives in parameters — an open-ended container, for the same reason IFC uses property sets"
      correct: true
      why: "A fixed class surface cannot carry the thousands of data points a project defines."
    - text: "Because fire rating is a type property, not an instance one"
      correct: false
      why: "It can be either, which Lesson 459 is about — and both are parameters."
```

## Key Concepts
- **`Document`**: the open model, and the root through which every element is reached
- **Element**: anything with an id — geometry, views, materials, family types, project information
- **`ElementId`**: identity within one document; not stable across models, and not the identity an external system should join on
- **Parameter**: the open-ended container discipline data travels in, looked up rather than accessed as a field
- **`Transaction`**: required for every modification, named, and the name becomes the undo entry
- **`SubTransaction` and `TransactionGroup`**: the two things a nested `Transaction` is not
- **Main-thread only**: the API must be called from Revit's main thread; background work computes off it and applies on it
- **Type versus instance**: a family type is itself an element carrying its own parameters, exactly as Lesson 436 describes for IFC

## Example Code
The shape of a read and the shape of a write. Neither can run outside Revit:

```csharp
// Revit 2025 API. A read needs no Transaction — only modifications do.
Document doc = commandData.Application.ActiveUIDocument.Document;
Element element = doc.GetElement(new ElementId(184032));
Parameter mark = element.LookupParameter("Mark");
string value = mark?.AsString();
```

```csharp
// Revit 2025 API. The write, with the transaction that makes it legal.
// The string is what the user will see in their undo list.
using (Transaction t = new Transaction(doc, "Set door marks"))
{
    t.Start();
    foreach (Element door in doors)
    {
        door.LookupParameter("Mark")?.Set(NextMark());
    }
    t.Commit();
}
```

One transaction around the whole loop, not one per door: a transaction is the user's undo step, and three hundred undo entries for one command is a defect the API will happily let you ship.

## When to Use
- Any add-in that reads or writes model data, which is all of them
- When deciding transaction granularity, where the question is "what should one undo do" rather than "what is efficient"
- When designing an integration's identity strategy, where `ElementId` is the wrong choice and Lesson 459's shared parameters are the discussion
- When an add-in has to do slow work, where the main-thread constraint decides the whole design

## Common Mistakes
- **One transaction per element in a loop** — it works, and it gives the user hundreds of undo entries for one action
- **Holding an `Element` reference across a transaction boundary** — the model can change underneath it; re-fetch by id instead
- **Using `ElementId` as an external key** — it identifies within one document and does not survive a round trip through another model
- **Calling the API from a background thread** — it is main-thread only, so the work splits into compute-off, apply-on
- **Expecting a nested `Transaction`** — that is what `SubTransaction` and `TransactionGroup` are for, and using the wrong one throws
- **Naming a transaction after its implementation** — the name is user-facing text in the undo menu, not a log line

## Further Reading
- [Revit API Developer's Guide (Revit 2025)](https://help.autodesk.com/view/RVT/2025/ENU/?guid=Revit_API_Revit_API_Developers_Guide_html) — the object model, transactions and the threading rules, version-stamped
- [Revit API documentation index](https://www.revitapidocs.com/) — a searchable class reference, useful because class and method names move between versions
- [C# documentation](https://learn.microsoft.com/en-us/dotnet/csharp/) — including `using` and `IDisposable`, which is what the transaction block above relies on

```recall
- q: "State the transaction rule and why the name matters."
  must:
    - "every modification must happen inside a Transaction you open and commit"
    - "a write outside one throws — there is no implicit transaction"
    - "the transaction's name becomes the undo entry the user sees"

- q: "What is an element in Revit, and what is the identity trap?"
  must:
    - "anything with an id — geometry, views, materials, family types, project information"
    - "ElementId identifies within one document only"
    - "it does not survive a round trip, so it is the wrong external key"

- q: "Why is data in parameters rather than in fields, and what does that echo?"
  must:
    - "a fixed class surface cannot carry the data a project defines"
    - "parameters are an open-ended container, looked up rather than accessed"
    - "the same argument IFC's property sets make in Lesson 436"
```
