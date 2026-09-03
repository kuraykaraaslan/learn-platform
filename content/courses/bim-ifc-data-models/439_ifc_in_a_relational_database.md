# 439. IFC in a Relational Database: Entities, Psets, and the Join You Will Regret

## What It Is
Sooner or later the model stops being a file you parse on demand and becomes rows you query. The import is easy to start and easy to get wrong, and the reason is the shape of a property set: it is open-ended. Nobody can enumerate the properties a project will use, so the obvious relational answer is a key-value table — one row per element, one row per property — and that answer is correct right up until someone asks a question with three conditions in it.

The entity table is uncontroversial: a row per element, keyed on the GlobalId, with the columns that really are fixed — the entity type, the storey the element reaches by spatial containment, the name. The property table is where the decision lives. As `(global_id, pset, property, value)` it stores anything, indexes cheaply, and imports in one pass. But every property you filter on is another join back to the same table, because each row holds one property and the filter needs three of them on the *same* element. Three conditions, three self-joins, and the query gets longer and slower with every requirement someone adds.

The alternative is to keep the openness but stop splitting the row: one JSONB document per element holding its property sets, with a GIN index over containment. The three conditions become one containment test against a literal document, which the index can answer directly. What you give up is per-property typing and the ability to constrain a single property with a foreign key — real costs, worth paying knowingly rather than discovering the key-value join at the point where the report is already slow.

```quiz
- q: "Your element_properties table is (global_id, pset, property, value). A report needs external, load-bearing, REI 60 walls. What does the query look like?"
  anchor: "Three conditions, three self-joins"
  options:
    - text: "One WHERE clause with three ANDs"
      correct: false
      why: "Those three ANDs would have to hold on one ROW, and each row holds one property. They are conditions on three different rows for the same element."
    - text: "Three joins back to the same table, one per property"
      correct: true
      why: "Each condition needs its own row, matched on the element, which is a self-join per condition."
    - text: "A GROUP BY with a HAVING count of matching properties"
      correct: false
      why: "That works and is sometimes the better plan, but it is still a scan per condition inside the aggregate — the row-per-property shape is what costs, either way."

- q: "What does the JSONB document per element give up compared with the key-value table?"
  anchor: "What you give up is per-property typing and the ability to constrain a single property with a foreign key"
  options:
    - text: "The ability to store arbitrary properties"
      correct: false
      why: "Both shapes store anything. Openness is not what the trade is about."
    - text: "Per-property typing and the ability to put a constraint on one property"
      correct: true
      why: "A document is validated as a whole or not at all; a column can carry a type and a foreign key."
    - text: "Index support — JSONB cannot be indexed"
      correct: false
      why: "A GIN index over the document is exactly what makes the containment query fast."
```

## Key Concepts
- **Entity table**: one row per element, keyed on the GlobalId, holding only the genuinely fixed columns — type, spatial container, name
- **Key-value property table**: `(global_id, pset, property, value)`; open-ended, easy to import, and one self-join per filtered property
- **The join you will regret**: three property conditions on one element means three joins back to the same table, and it grows with every new requirement
- **JSONB document per element**: property sets kept whole, queried with the containment operator
- **GIN index**: what makes containment a lookup rather than a scan of every document
- **What the document costs**: no per-property type, no per-property constraint, and a value that is whatever was written
- **The GlobalId is the key**: the instance number is a position in one file, not an identity, so the primary key is the 22-character GlobalId
- **Value typing is the hard part either way**: IFC property values carry their own types, and flattening everything to text moves that problem into every query

## Example Code
Both shapes, the same data, the same question. Run it and compare the two SELECTs:

```sql run
-- One row per element, one row per (element, property set, property) triple:
-- the shape almost every IFC-to-SQL import lands on, because a property set
-- is open-ended and a column per property is not.
CREATE TABLE ifc_element (
  global_id char(22) PRIMARY KEY,
  ifc_type  text NOT NULL,
  storey    text NOT NULL,
  name      text NOT NULL
);

CREATE TABLE ifc_property (
  global_id  char(22) NOT NULL REFERENCES ifc_element (global_id),
  pset       text NOT NULL,
  prop       text NOT NULL,
  value_text text NOT NULL,
  PRIMARY KEY (global_id, pset, prop)
);

INSERT INTO ifc_element (global_id, ifc_type, storey, name) VALUES
  ('3Xt7zPfNb2vgqR1YkEwNsq', 'IfcWall', 'Ground floor', 'Bay wall, north'),
  ('1MvQ7cRkT4vAWmDpLs2nXe', 'IfcWall', 'Ground floor', 'Corridor partition'),
  ('2Kd9WpYbn0OQAzUcRt6mLh', 'IfcWall', 'Ground floor', 'Yard wall, east'),
  ('0Vb4NsHkD1EQfXpTr8wLmY', 'IfcWall', 'First floor',  'Bay wall, north (L1)');

INSERT INTO ifc_property (global_id, pset, prop, value_text) VALUES
  ('3Xt7zPfNb2vgqR1YkEwNsq', 'Pset_WallCommon', 'IsExternal',  'true'),
  ('3Xt7zPfNb2vgqR1YkEwNsq', 'Pset_WallCommon', 'LoadBearing', 'true'),
  ('3Xt7zPfNb2vgqR1YkEwNsq', 'Pset_WallCommon', 'FireRating',  'REI 60'),
  ('1MvQ7cRkT4vAWmDpLs2nXe', 'Pset_WallCommon', 'IsExternal',  'false'),
  ('1MvQ7cRkT4vAWmDpLs2nXe', 'Pset_WallCommon', 'LoadBearing', 'false'),
  ('1MvQ7cRkT4vAWmDpLs2nXe', 'Pset_WallCommon', 'FireRating',  'REI 30'),
  ('2Kd9WpYbn0OQAzUcRt6mLh', 'Pset_WallCommon', 'IsExternal',  'true'),
  ('2Kd9WpYbn0OQAzUcRt6mLh', 'Pset_WallCommon', 'LoadBearing', 'false'),
  ('0Vb4NsHkD1EQfXpTr8wLmY', 'Pset_WallCommon', 'IsExternal',  'true'),
  ('0Vb4NsHkD1EQfXpTr8wLmY', 'Pset_WallCommon', 'LoadBearing', 'true'),
  ('0Vb4NsHkD1EQfXpTr8wLmY', 'Pset_WallCommon', 'FireRating',  'REI 60');

-- External, load-bearing, REI 60, on the ground floor. Three property
-- conditions means three joins back to the same table. This is the join.
SELECT e.name, p3.value_text AS fire_rating
FROM ifc_element e
JOIN ifc_property p1 ON p1.global_id = e.global_id
  AND p1.pset = 'Pset_WallCommon' AND p1.prop = 'IsExternal'  AND p1.value_text = 'true'
JOIN ifc_property p2 ON p2.global_id = e.global_id
  AND p2.pset = 'Pset_WallCommon' AND p2.prop = 'LoadBearing' AND p2.value_text = 'true'
JOIN ifc_property p3 ON p3.global_id = e.global_id
  AND p3.pset = 'Pset_WallCommon' AND p3.prop = 'FireRating'  AND p3.value_text = 'REI 60'
WHERE e.storey = 'Ground floor';

-- The same facts, one JSONB document per element, with a GIN index that
-- indexes containment rather than one column per property.
CREATE TABLE ifc_element_doc (
  global_id char(22) PRIMARY KEY,
  ifc_type  text  NOT NULL,
  storey    text  NOT NULL,
  name      text  NOT NULL,
  psets     jsonb NOT NULL
);
CREATE INDEX ifc_element_doc_psets ON ifc_element_doc USING gin (psets jsonb_path_ops);

INSERT INTO ifc_element_doc (global_id, ifc_type, storey, name, psets)
SELECT e.global_id, e.ifc_type, e.storey, e.name,
       jsonb_build_object(p.pset, jsonb_object_agg(p.prop, p.value_text))
FROM ifc_element e
JOIN ifc_property p ON p.global_id = e.global_id
GROUP BY e.global_id, e.ifc_type, e.storey, e.name, p.pset;

-- Three conditions, one operator, no self-joins at all.
SELECT name, psets #>> '{Pset_WallCommon,FireRating}' AS fire_rating
FROM ifc_element_doc
WHERE storey = 'Ground floor'
  AND psets @> '{"Pset_WallCommon": {"IsExternal": "true", "LoadBearing": "true", "FireRating": "REI 60"}}';
```

Same single row from both. The difference is not the answer — it is what the query looks like when the fourth condition arrives.

## When to Use
- You are importing models into a database that other systems query, rather than parsing files on demand
- You are supporting ad-hoc reporting over model data, where the questions are not known when the schema is designed
- You are joining model elements to non-model rows — work orders, sensor readings, cost lines — and need a stable key to join on
- You are choosing a storage shape and want the choice made before the first three-condition report, not after

## Common Mistakes
- **Keying on the instance number** — `#42` is a position in one file and changes on re-export; the primary key is the GlobalId
- **Flattening every value to text and moving on** — IFC property values carry their own types, and the cast then has to be repeated, correctly, in every query that touches a number
- **Adding a column per property** — it works for the first ten properties and then becomes a migration for every new requirement, which is the reason nobody does it twice
- **Storing the property table without a composite primary key** — `(global_id, pset, prop)` is the natural key, and without it a re-import silently doubles every property
- **Reaching for JSONB without an index** — containment over unindexed documents scans every row, which is slower than the joins it replaced
- **Importing without a storey column** — almost every report groups by floor, and deriving it per query from the relationship rows is the one join genuinely worth denormalising away

## Further Reading
- [JSON types in PostgreSQL](https://www.postgresql.org/docs/current/datatype-json.html) — `jsonb` containment, and why `jsonb` rather than `json`
- [GIN indexes](https://www.postgresql.org/docs/current/gin.html) — including `jsonb_path_ops` and what it trades away
- [JSON functions and operators](https://www.postgresql.org/docs/current/functions-json.html) — the `@>` and `#>>` operators this lesson uses
- [IfcPropertySet](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcPropertySet.htm) — the source shape both storage designs are trying to represent

```recall
- q: "Why does a key-value property table need one join per filtered property?"
  must:
    - "each row holds one property"
    - "three conditions on the same element are conditions on three different rows"
    - "so each condition is a self-join matched on the element"

- q: "State what the JSONB document buys and what it costs."
  must:
    - "three conditions become one containment test, answerable from a GIN index"
    - "it gives up per-property typing"
    - "and the ability to constrain a single property with a foreign key"

- q: "What is the primary key of the element table, and what is not?"
  must:
    - "the 22-character GlobalId"
    - "not the instance number, which is a position in one file and changes on re-export"
```
