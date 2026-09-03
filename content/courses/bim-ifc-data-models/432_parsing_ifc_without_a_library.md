# 432. Parsing IFC Without a Library: Entity Lines, References, Forward Declarations

## What It Is
You do not always need a full IFC toolkit. A large share of real integration work — pull the storey names, list every element with its GlobalId, count the doors, find which wall an opening belongs to — is answered by walking the text. Writing that walk yourself is a few dozen lines, and doing it once teaches you what the toolkits are actually doing on your behalf.

Three properties of the format decide the shape of the parser. First, **an entity instance ends at a semicolon, not at a newline**: a single instance may legally wrap across many lines, and a quoted string may legally contain a semicolon, so the tokenizer has to track whether it is inside a string. Second, **references are unordered**: `#310` may reference `#40` while `#40` is defined forty lines further down. A file is a set of instances that happens to be written in some order, not a dependency-sorted list, so a single-pass resolver returns `undefined` for every forward reference it meets. Two passes fix it — index everything by id first, resolve afterwards.

Third, and the one that surprises people coming from object databases: **the relationships you want to traverse are not attributes of the things they relate**. A wall does not carry a "storey" field. A separate `IfcRelContainedInSpatialStructure` instance names the storey and the elements in it, and the wall-to-storey direction exists in the schema only as an *inverse* attribute — something derived, never written to the file. To go from an element back to its container you have to build the reverse index yourself, which is one more pass over the relationship objects.

```quiz
- q: "Your parser resolves `#310`'s reference to `#40` and gets undefined, even though `#40` exists in the file. Why?"
  anchor: "A file is a set of instances that happens to be written in some order, not a dependency-sorted list"
  options:
    - text: "The file is corrupt — a reference must appear after its target"
      correct: false
      why: "Forward references are legal and ordinary in IFC. Nothing requires an exporter to topologically sort its output."
    - text: "`#40` is defined later in the file, and a single-pass resolver has not seen it yet"
      correct: true
      why: "Index every instance by id in one pass, then resolve in a second."
    - text: "`#310` is a relationship object, and relationship objects cannot be resolved directly"
      correct: false
      why: "Relationship objects resolve like any other instance. The problem here is ordering, not entity kind."

- q: "You want the storey a given wall sits on. Where is that stored?"
  anchor: "the relationships you want to traverse are not attributes of the things they relate"
  options:
    - text: "On the wall, as an attribute naming its container"
      correct: false
      why: "A wall carries no storey field. That direction exists only as an inverse attribute, which is derived and never written to the file."
    - text: "In a separate relationship instance that names the storey and its elements, which you have to index in reverse"
      correct: true
      why: "IfcRelContainedInSpatialStructure holds both ends, and only the container-to-element direction is written down."
    - text: "In the storey, as an ordered list you can binary-search"
      correct: false
      why: "The storey does not list its elements either. Both ends live in the relationship object."
```

## Key Concepts
- **Statement boundary**: an entity instance ends at a `;` that is outside a quoted string — never assume one instance per line
- **Two-pass resolution**: pass one indexes `id -> instance` with nothing resolved; pass two follows references, by which point every id is known
- **Forward reference**: a reference to an id defined later in the file; legal, common, and the reason one pass is not enough
- **Relationship objects**: `IfcRelAggregates`, `IfcRelContainedInSpatialStructure` and friends are instances in their own right, holding both ends of a relation
- **Inverse attribute**: a schema-level convenience (element to its container) that is *derived*, never serialized — you build it as a reverse index or you do not have it
- **Attribute slot order matters twice**: within an entity, and between similar entities — `IfcRelContainedInSpatialStructure` puts `RelatedElements` before `RelatingStructure`, the opposite way round from most relations
- **Escaped quotes**: `''` inside a STEP string is one literal quote, not the end of the string followed by another one

## Example Code
Here is the whole thing, run for real against a hand-written model file. The tree is derived from the relationship instances, not from the order of the lines.

```proof sha=4958dbf73f325af0 at=2026-09-03 commit=0b76cd0
$ bash run.sh
$ node parse.js
parsed 13 entity instances, in file order: 10 20 30 310 40 50 60 70 300 320 400 410 420

IFCPROJECT Riverside Depot
  IFCSITE Depot site  <- aggregates
    IFCBUILDING Depot  <- aggregates
      IFCBUILDINGSTOREY Ground floor  <- aggregates
        IFCWALL Bay wall, north  <- contained
        IFCWINDOW W-11  <- contained

not in the spatial tree: IFCOPENINGELEMENT Opening for W-11 — placed by an element relationship, not by containment

IFCOPENINGELEMENT Opening for W-11  voids  IFCWALL Bay wall, north
IFCWINDOW W-11  fills  IFCOPENINGELEMENT Opening for W-11
Neither line moved anything in the tree above: both ends are already placed.

instances referencing an id defined later in the file: #310
A single-pass resolver returns undefined for those. Two passes cost one extra walk.
```

The file it read declares `#310` before `#40`, so the forward-reference line at the bottom is not a hypothetical — it is that instance, found by comparing each reference against the file order.

## When to Use
- You need a handful of facts out of a model and do not want a toolkit, a build step or a native dependency in the path
- You are running somewhere a compiled IFC library cannot go: a serverless function, a CI check, an environment with no native module support
- You are writing a validation gate — "every element has a GlobalId", "no storey is empty" — where the answer is textual and the cost of a full model load is not worth paying
- You are debugging what a toolkit told you, and want to see the bytes it read

## Common Mistakes
- **Splitting the DATA section on newlines** — an instance ends at a semicolon outside a string, and long instances wrap; line-splitting silently truncates them
- **Resolving references in a single pass** — forward references are ordinary, and a one-pass resolver reports them as missing entities rather than as its own ordering bug
- **Looking for the element-to-container direction in the file** — it is an inverse attribute, derived by the schema and never serialized, so it has to be built as a reverse index
- **Reading `IfcRelContainedInSpatialStructure`'s attributes in the same order as every other relation** — it lists `RelatedElements` before `RelatingStructure`, and swapping them puts every element under itself
- **Assuming instance ids are stable** — `#42` identifies a line inside one file only; the identity that survives a re-export is the GlobalId, not the number
- **Trusting a regex over the whole file** — a pattern that matches `IFCWALL\(` will also match it inside a quoted description, which is exactly the case a string-aware tokenizer exists to exclude

## Further Reading
- [IfcRelContainedInSpatialStructure](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelContainedInSpatialStructure.htm) — attribute order, and the inverse attribute on the element side
- [IfcRoot](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRoot.htm) — the supertype every instance with a GlobalId derives from
- [IfcOpenShell](https://github.com/IfcOpenShell/IfcOpenShell) — the open-source toolkit worth reaching for once the text walk stops being enough
- [Part 21 edition 3 text](https://www.steptools.com/stds/step/IS_final_p21e3.html) — string escapes, value types and the exact statement grammar

```recall
- q: "Describe the two passes and what each one is for."
  must:
    - "pass one indexes every instance by id, resolving nothing"
    - "pass two follows references, by which point every id is known"
    - "one pass fails on forward references, which are legal and common"

- q: "A wall needs to report its storey. What do you have to build, and why is it not in the file?"
  must:
    - "a reverse index over the relationship instances"
    - "the element-to-container direction is an inverse attribute, derived by the schema"
    - "a derived attribute is never serialized, so only the container-to-element direction is written"

- q: "Name two tokenizer traps that a newline- or comma-based split walks straight into."
  must:
    - "an instance ends at a semicolon outside a string, and may wrap across lines"
    - "commas inside quoted strings and inside nested parenthesised lists"
    - "'' inside a string is an escaped quote, not the end of the string"
```
