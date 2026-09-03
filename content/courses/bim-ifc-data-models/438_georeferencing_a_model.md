# 438. Project Base Point, Survey Point, True North: Georeferencing a Model

## What It Is
Everything in the previous lesson is relative. A model has an internal origin, and every coordinate in it eventually resolves against that origin. Georeferencing is the extra piece that says where that origin actually is on Earth, and which way is north — the piece that has to be right before a model can be laid over a map, joined to survey data, or handed to anyone working in a national coordinate system.

Authoring tools express this with their own vocabulary. A project base point is the tool's internal origin, the one modellers work around; a survey point is a known real-world position the site is tied to. **Those are authoring-tool concepts, not IFC entities.** What reaches the file is the result: a placement, and a declaration of the coordinate system that placement is expressed in.

IFC4 gives that declaration two entities. `IfcProjectedCRS` names the target coordinate reference system — usually as an EPSG code such as `EPSG:25832` — along with its datum and its map unit. `IfcMapConversion` is the transform from the model's engineering coordinates into that system: eastings, northings, an orthogonal height, a scale, and the model's X axis expressed as a direction in map space. Together they answer both questions exactly once, in a place a reader can find. Separately, `IfcGeometricRepresentationContext.TrueNorth` gives the direction of true north within the model's own plan, which is not the same statement and is often the only one present.

This is the lesson where the schema version matters most, so the version-dependent claims for this whole course are collected here. `IfcMapConversion` and `IfcProjectedCRS` arrived in **IFC4**; a file whose `FILE_SCHEMA` header says `IFC2X3` has neither, and its georeferencing is limited to `IfcSite`'s reference latitude, longitude and elevation plus the site's own placement. Those latitude and longitude attributes are compound integer arrays — degrees, minutes, seconds and millionths of a second — not decimal degrees, and reading them as decimals puts the building in the wrong country. In **IFC4.3** the coordinate-operation entities are generalised under `IfcCoordinateOperation`, which is worth knowing before you write a reader that assumes exactly one shape.

```quiz
- q: "An IFC2X3 file arrives and you need its position on a map. What do you have to work with?"
  anchor: "a file whose `FILE_SCHEMA` header says `IFC2X3` has neither"
  options:
    - text: "IfcMapConversion, as in any other IFC file"
      correct: false
      why: "That entity arrived in IFC4. In IFC2X3 it does not exist at all."
    - text: "IfcSite's reference latitude, longitude and elevation, plus the site's placement"
      correct: true
      why: "That is the whole georeferencing surface IFC2X3 offers, which is why models of that vintage are usually positioned by convention instead."
    - text: "The TrueNorth direction, which encodes the position as a bearing"
      correct: false
      why: "TrueNorth gives a direction, not a position. It cannot tell you where the origin is."

- q: "Why is 'project base point' not something to look for in the file?"
  anchor: "Those are authoring-tool concepts, not IFC entities"
  options:
    - text: "It is there but named IfcProjectBasePoint"
      correct: false
      why: "No such entity exists. The vocabulary belongs to the authoring application."
    - text: "It is an authoring-tool concept; the file records the resulting placement and CRS declaration"
      correct: true
      why: "The two points are how a modeller sets it up. What is exported is the outcome."
    - text: "It only exists in IFC4.3 and later"
      correct: false
      why: "It exists in no version of the schema, because it is not a schema concept."
```

## Key Concepts
- **Project base point / survey point**: authoring-tool vocabulary for the internal origin and the surveyed tie point — neither is an IFC entity
- **`IfcProjectedCRS`**: names the target coordinate reference system, typically by EPSG code, with its datum and map unit
- **`IfcMapConversion`**: the transform from model coordinates to that system — eastings, northings, orthogonal height, scale, and the X axis as a map direction
- **`TrueNorth`**: a direction on `IfcGeometricRepresentationContext`, saying which way north points inside the model's plan; a different statement from where the origin is
- **`IfcSite` reference position**: latitude, longitude and elevation as compound integers — degrees, minutes, seconds, millionths — not decimal degrees
- **Version boundary**: `IfcMapConversion` and `IfcProjectedCRS` are IFC4 and later; IFC2X3 has only the site attributes
- **IFC4.3 generalisation**: coordinate operations sit under `IfcCoordinateOperation`, so a reader that assumes a single concrete entity will need widening
- **Large coordinates as a smell**: a model whose internal origin is a survey coordinate carries values in the millions, which costs single-precision geometry visible accuracy

## Example Code
There is no snippet to run here, because the decision this lesson supports is not a computation. It is whether the model is positioned at its survey coordinates or at a local origin with the offset declared:

```tradeoff
question: "Model at the site's real survey coordinates, or at a local origin with an IfcMapConversion offset?"
sides:
  - name: "Model at survey coordinates"
    wins_when:
      - signal: "the model is consumed mainly by GIS and survey tools that expect map coordinates directly, and you can name those consumers"
      - signal: "no viewer or exchange in the chain uses single-precision floats — check one, do not assume, because the accuracy loss appears as visibly wobbly geometry rather than as an error"
      - signal: "the site sits within a single projected zone, so no consumer has to re-project on the way in"
  - name: "Local origin plus a declared conversion"
    wins_when:
      - signal: "coordinates stay small enough that single-precision consumers are safe — the standard reason this is the default recommendation in most exchange guidance"
      - signal: "the model is authored and reviewed mostly in design tools, where a modeller working near a million-unit origin is the failure you are avoiding"
      - signal: "you can verify the conversion is actually written: open the file and find the IfcMapConversion instance, because an undeclared offset is worse than no offset"
```

The check that decides it is the same in either case: open the exported file, find the entity, and read the numbers. An offset that lives only in a modeller's memory is not georeferencing.

```typescript
/** IfcSite's RefLatitude and RefLongitude: degrees, minutes, seconds, and
 *  optionally millionths of a second — an integer array, never a decimal. */
type CompoundAngle = [number, number, number] | [number, number, number, number];

export function toDecimalDegrees(angle: CompoundAngle): number {
  const [degrees, minutes, seconds, millionths = 0] = angle;
  // The sign lives on the degrees component and has to be carried onto every
  // other term, or a southern latitude comes out north of the equator.
  const sign = degrees < 0 ? -1 : 1;
  const magnitude =
    Math.abs(degrees) + minutes / 60 + seconds / 3600 + millionths / 3_600_000_000;
  return sign * magnitude;
}
```

## When to Use
- You are overlaying a model on a map, a site plan, or anything produced by a surveyor
- You are joining model data to a spatial database, where the coordinate reference system is a column, not an assumption
- You are federating models from several disciplines and need to know whether they share an origin before you trust the overlay
- You are writing an exchange requirement, where "georeferenced" is too vague to check and "an `IfcMapConversion` with a named `IfcProjectedCRS`" is not

## Common Mistakes
- **Looking for a project base point entity** — the two points are authoring-tool vocabulary, and what the file carries is the resulting placement plus a coordinate-system declaration
- **Reading `IfcSite`'s reference latitude as decimal degrees** — it is a compound integer array of degrees, minutes, seconds and millionths, and misreading it moves the building by degrees, not metres
- **Treating `TrueNorth` as a position** — it is a direction within the model plan, and a model can declare it while saying nothing about where its origin is
- **Assuming `IfcMapConversion` is present** — it is an IFC4 entity, absent by construction from every IFC2X3 file, and frequently omitted even where the schema has it
- **Modelling at survey coordinates without checking the consumers** — coordinates in the millions lose visible accuracy in any single-precision viewer downstream
- **Recording the offset outside the file** — an offset kept in a spreadsheet or in someone's head is not georeferencing, and the next recipient has no way to discover it

## Further Reading
- [IfcMapConversion](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcMapConversion.htm) — the offset, rotation and scale attributes, in the schema's own words
- [IfcProjectedCRS](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcProjectedCRS.htm) — naming the target system, its datum and its map unit
- [IfcCoordinateOperation](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcCoordinateOperation.htm) — the IFC4.3 generalisation a reader should expect
- [IfcSite](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcSite.htm) — the reference latitude, longitude and elevation attributes and their compound form
- [EPSG registry browser](https://epsg.io/) — for resolving the code an `IfcProjectedCRS` names into an actual projection

```recall
- q: "Name the two IFC4 entities that georeference a model, and what each one states."
  must:
    - "IfcProjectedCRS names the target coordinate reference system, usually by EPSG code"
    - "IfcMapConversion is the transform: eastings, northings, orthogonal height, scale and the X axis direction"
    - "TrueNorth is a separate statement — a direction, not a position"

- q: "What is the version boundary this lesson collects, and what does a pre-boundary file offer instead?"
  must:
    - "IfcMapConversion and IfcProjectedCRS arrived in IFC4"
    - "IFC2X3 has only IfcSite's reference latitude, longitude and elevation plus the site placement"
    - "IFC4.3 generalises coordinate operations under IfcCoordinateOperation"

- q: "Why are 'project base point' and 'survey point' the wrong things to search a file for?"
  must:
    - "they are authoring-tool concepts, not IFC entities"
    - "the file records the resulting placement and the coordinate-system declaration"
```
