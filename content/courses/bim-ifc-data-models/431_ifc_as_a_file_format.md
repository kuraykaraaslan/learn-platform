# 431. IFC as a File Format — STEP Physical File and the EXPRESS Schema

## What It Is
IFC — Industry Foundation Classes — is the open data model the construction industry uses to move a building between the tools that made it. For a developer, the useful framing is that IFC is two separate things wearing one name. The first is a **schema**, written in a data-modelling language called EXPRESS, that declares every entity type (`IfcWall`, `IfcBuildingStorey`, `IfcRelAggregates`), its attributes in a fixed order, and the rules those attributes obey. The second is a **serialization**, and the one you will actually receive is the STEP Physical File — a plain-text format standardised as ISO 10303-21, with the extension `.ifc`.

That split is the whole reason a `.ifc` file looks the way it does. Open one and you get a header section, then a `DATA;` section of lines like `#42= IFCWALL('3Xt7zPfNb2vgqR1YkEwNsq',#5,'Bay wall',...);`. Nothing in that line says which attribute is the name and which is the placement. The positions are the schema's job, and the header's `FILE_SCHEMA` line is what tells you which version of the schema to read them against. A parser that does not know the schema version cannot know what slot 8 means, because slot 8 does not mean the same thing in IFC2X3 and IFC4.

The format is deliberately dull, and that dullness is the feature. It is text, so it diffs, greps and streams; it has no compression, no binary offsets and no index, so a 400 MB model is 400 MB of lines you can walk with a for-loop. There are other serializations of the same schema — ifcXML, ifcJSON, and the zipped `.ifcZIP` — but the STEP file is what exporters emit by default and what every downstream tool is expected to read.

```quiz
- q: "A `.ifc` file's DATA section gives you `#42= IFCWALL('3Xt...',#5,'Bay wall',...)`. What tells you which attribute is which?"
  anchor: "The positions are the schema's job, and the header's `FILE_SCHEMA` line is what tells you which version of the schema to read them against"
  options:
    - text: "The attribute names, which appear earlier in the same line"
      correct: false
      why: "There are no attribute names anywhere in a STEP file. Every attribute is positional, which is exactly why the schema is not optional."
    - text: "The EXPRESS schema, at the version the file's FILE_SCHEMA header declares"
      correct: true
      why: "Slot order is declared by the schema, and the same slot number can mean different things across schema versions."
    - text: "The order they were written by the exporting application"
      correct: false
      why: "Then two exporters could disagree about the same file and both be right. The schema is what removes that freedom."

- q: "Why is 'IFC is a file format' an incomplete description?"
  anchor: "IFC is two separate things wearing one name"
  options:
    - text: "Because IFC is a schema plus a serialization, and the STEP file is only the second half"
      correct: true
      why: "The same schema also serializes as ifcXML and ifcJSON; the schema is the part that carries the meaning."
    - text: "Because IFC files are binary and the text you see is a viewer's rendering"
      correct: false
      why: "A STEP Physical File is plain text end to end — no compression, no binary offsets, no index."
    - text: "Because the format changes per vendor"
      correct: false
      why: "The serialization is standardised as ISO 10303-21. What varies across files is the schema version, not the encoding."
```

## Key Concepts
- **EXPRESS**: the data-modelling language (ISO 10303-11) the IFC schema itself is written in — it declares entities, their attribute order, their types, and the rules between them
- **STEP Physical File (SPF)**: the plain-text serialization, ISO 10303-21, that a `.ifc` file actually is; also called "Part 21"
- **Entity instance line**: `#<id>= <ENTITYNAME>(<attributes>);` — an id, a type in capitals, and a positional attribute list
- **Positional attributes**: attributes have no names in the file; slot order comes from the schema, so the same slot can mean different things in different schema versions
- **`FILE_SCHEMA`**: the header line naming the schema version (`IFC2X3`, `IFC4`, `IFC4X3_ADD2`) that the DATA section must be read against
- **`$` and `*`**: `$` is an attribute that was not provided; `*` is one the schema derives, so the file leaves it blank on purpose
- **Uppercase in the file, CamelCase in the docs**: the file writes `IFCWALL`, the schema and every documentation page write `IfcWall` — the same entity, two spellings
- **Other serializations**: ifcXML (ISO 10303-28), ifcJSON, and `.ifcZIP` all carry the same schema; the STEP file is the default an exporter produces

## Example Code
The tokenizer is the part people get wrong first, because a STEP attribute list is not a comma-separated list. Commas appear inside quoted strings, and parentheses nest. Run this and watch both traps in one line:

```typescript run
// One entity instance line, exactly as it sits in a .ifc file.
const LINE = "#42= IFCWALL('3Xt7zPfNb2vgqR1YkEwNsq',#5,'Bay wall, north','Load-bearing (300mm)',$,#118,#204,'Wall-042',.SOLIDWALL.);";

type Entity = { id: number; type: string; args: string[] };

// Split on commas at depth 0 only, and never inside a quoted string — the
// two reasons String.split(',') is wrong for this format.
function splitArgs(body: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let inString = false;
  let current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      current += ch;
      // '' is an escaped single quote inside a STEP string, not a close.
      if (ch === "'" && body[i + 1] === "'") { current += "'"; i++; }
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; current += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim() !== '') out.push(current.trim());
  return out;
}

function parseEntityLine(line: string): Entity | null {
  const head = /^#(\d+)=\s*([A-Z0-9_]+)\s*\(/.exec(line);
  if (!head) return null;
  const body = line.slice(head[0].length, line.lastIndexOf(')'));
  return { id: Number(head[1]), type: head[2], args: splitArgs(body) };
}

const entity = parseEntityLine(LINE)!;
console.log(`#${entity.id} is an ${entity.type} with ${entity.args.length} attributes`);
entity.args.forEach((arg, i) => {
  const kind = arg === '$' ? 'unset' : arg.startsWith('#') ? 'reference' : arg.startsWith("'") ? 'string' : arg.startsWith('.') ? 'enum' : 'other';
  console.log(`  [${i}] ${kind.padEnd(9)} ${arg}`);
});
```

Nine attributes, and the naive split would have found eleven: one extra from the comma in `'Bay wall, north'` and one from the parentheses in `'Load-bearing (300mm)'`.

## When to Use
- You are receiving models from a design tool you do not control and need a format that does not depend on that tool's version or licence
- You need to grep, diff or stream a model without loading it into a viewer — the text serialization is what makes that possible
- You are building an integration that has to survive the other side changing authoring software, which is the case IFC exists for
- You need to read a model in an environment with no CAD kernel available at all: a server, a CI job, a Lambda

## Common Mistakes
- **Treating a `.ifc` file as self-describing** — the entity names are in the file but the attribute meanings are not; without the schema version from `FILE_SCHEMA`, reading slot 8 is guessing
- **Splitting an attribute list on commas** — commas appear inside quoted strings and inside nested parenthesised lists, so a plain split silently shifts every attribute after the first quoted name
- **Reading `$` as an empty string** — it means the attribute was not provided at all, which is a different fact from a name that is genuinely blank, and collapsing the two loses the distinction downstream
- **Assuming entity names are case-consistent** — the file writes `IFCWALL` and every documentation page writes `IfcWall`, so a lookup table keyed on the documentation spelling misses every line in the file
- **Expecting an index** — a STEP file has no table of contents and no offsets; anything you want to look up by id has to be indexed by your own first pass

## Further Reading
- [IFC 4.3 documentation](https://ifc43-docs.standards.buildingsmart.org/) — buildingSMART's own schema reference, free and permanently addressable per entity
- [ISO 10303-21 (STEP Physical File)](https://en.wikipedia.org/wiki/ISO_10303-21) — the encoding rules the DATA section follows
- [Part 21 edition 3 text](https://www.steptools.com/stds/step/IS_final_p21e3.html) — the clause-level detail on strings, escapes and value types
- [EXPRESS (data modeling language)](https://en.wikipedia.org/wiki/EXPRESS_(data_modeling_language)) — what the schema half of IFC is actually written in

```recall
- q: "Name the two halves of what people call 'IFC', and say which one a .ifc file is."
  must:
    - "a schema written in EXPRESS, declaring entities and their fixed attribute order"
    - "a serialization — the STEP Physical File, ISO 10303-21, which is what a .ifc file is"
    - "the schema carries the meaning; the same schema also serializes as ifcXML and ifcJSON"

- q: "Why can you not split a STEP attribute list on commas?"
  must:
    - "commas appear inside quoted strings"
    - "parenthesised lists nest, so a comma can be at depth greater than zero"
    - "a naive split shifts every attribute after the first quoted name"

- q: "What does the FILE_SCHEMA header line decide, and what breaks without it?"
  must:
    - "which version of the schema the DATA section is read against"
    - "attributes are positional, so a slot number means nothing without a schema version"
    - "the same slot can mean different things in IFC2X3 and IFC4"
```
