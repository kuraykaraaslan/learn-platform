# 448. PostGIS: The Geometry Type, the Index, and What the Extension Costs

## What It Is
PostGIS turns PostgreSQL into a spatial database, and it does it by adding three things: a **type**, an **index access method that understands that type**, and several hundred functions that operate on it. Understanding those three separately is what makes the rest of it predictable.

The type is `geometry`, and it carries an SRID — an EPSG code stored with every value. That single detail is the difference between this and a pair of `double precision` columns: the reference system travels with the data, so the database can refuse to compare two geometries in different systems instead of silently returning a wrong number. There is a second type, `geography`, which stores the same shapes but computes on the ellipsoid rather than on a plane; it is slower and it is right about distances, and choosing between them is a real decision rather than a preference.

The index is a **GiST index over the bounding box** of each geometry. That is the same two-stage query as lesson 447 — the index narrows to candidates by box, and the exact predicate runs on the survivors. PostGIS does not make the two-stage shape go away; it makes the first stage a real multi-dimensional index instead of one btree plus a filter, and it makes the second stage a correct geometric test instead of your own arithmetic.

The cost is not the disk space. It is that PostGIS is a C extension with its own dependency chain — GEOS, PROJ, GDAL — pinned to a PostgreSQL major version. That constrains where the database can run, how upgrades are scheduled, and which managed services are available to you. It is a good trade for a system whose core is spatial and a poor one for a system with a single proximity search in it, which is the trade lesson 447 exists to price.

> **No Run button in this lesson, and that is the point.** The SQL runtime this
> site uses is PGlite — real PostgreSQL compiled to WebAssembly — and it does
> not carry the PostGIS extension. Every `ST_` call below is therefore shown,
> not executed. A greyed-out Run button or a faked result would teach you less
> than this sentence does.

```quiz
- q: "What does the `geometry` type carry that two `double precision` columns do not?"
  anchor: "an SRID — an EPSG code stored with every value"
  options:
    - text: "Higher precision, since it stores coordinates as exact decimals"
      correct: false
      why: "It stores the same floating-point numbers. What it adds is the system they are in."
    - text: "An SRID, so the reference system travels with the value and mismatches can be refused"
      correct: true
      why: "That is the difference lesson 441 spent its whole length on, made into a column."
    - text: "An index, since the type is indexed by definition"
      correct: false
      why: "The index is a separate thing you create — a GiST index over the bounding box."
```

## Key Concepts
- **`geometry`**: planar type carrying an SRID, so the reference system is stored with each value
- **`geography`**: the same shapes computed on the ellipsoid — correct distances, slower, fewer functions
- **SRID**: the EPSG code, checked by the database rather than remembered by the application
- **GiST index over the bounding box**: the first stage of the same two-stage query lesson 447 builds by hand
- **Index-aware operators**: `&&` is the bounding-box overlap that the index answers; `ST_Intersects` is the exact test
- **`ST_DWithin` is the one to reach for**: it is written so the index can serve the box stage, which a hand-written distance comparison is not
- **The real cost is operational**: a C extension with GEOS, PROJ and GDAL behind it, pinned to a PostgreSQL major version
- **Not every database can have it**: managed services, embedded engines and WebAssembly builds frequently cannot

## Example Code
What the three additions look like. None of this runs here:

```sql
-- The extension, and what it brings with it.
CREATE EXTENSION postgis;

-- The type. 4326 is the SRID: the geometry knows it is in WGS 84 geographic,
-- so a comparison against something in EPSG:3857 is an error rather than a
-- wrong answer.
CREATE TABLE asset (
  id       bigint PRIMARY KEY,
  name     text NOT NULL,
  location geometry(Point, 4326) NOT NULL
);

-- The index. GiST, over the bounding box of each geometry — which is exactly
-- the pre-filter stage lesson 447 assembles from two btrees.
CREATE INDEX asset_location ON asset USING gist (location);
```

```sql
-- The geography type, for when the distances have to be right rather than
-- fast. Same shapes, computed on the ellipsoid, answers in metres.
CREATE TABLE asset_geog (
  id       bigint PRIMARY KEY,
  location geography(Point, 4326) NOT NULL
);

-- On `geometry` in EPSG:4326, ST_Distance answers in DEGREES, because that is
-- what the coordinate system's units are. On `geography` it answers in metres.
-- The same function name, two different quantities — this is the single most
-- common PostGIS surprise, and the type is what decides it.
```

## When to Use
- When spatial questions are part of the system's core rather than one feature at the edge — routing, coverage, containment, overlay
- When correctness of geometric predicates matters more than avoiding a dependency: `ST_Intersects` on a real polygon is not something to reimplement
- When data arrives in several reference systems and you want the database to enforce the difference rather than the application to remember it
- When you already run PostgreSQL somewhere the extension is available and supported through your upgrade path

## Common Mistakes
- **Assuming `ST_Distance` returns metres** — on a `geometry` in EPSG:4326 it returns degrees, because degrees are that system's units; only `geography` answers in metres
- **Creating the table and forgetting the GiST index** — every spatial predicate then scans, and the extension's main performance benefit is simply absent
- **Using `ST_Distance(a, b) < 500` for a proximity query** — that form cannot use the index; `ST_DWithin(a, b, 500)` is written so the box stage can
- **Storing everything as `geography` because it is "more correct"** — it supports fewer functions and costs more per operation; the choice depends on whether you are measuring or overlaying
- **Treating the extension as a schema decision** — it is an infrastructure one, pinned to a PostgreSQL major version with GEOS, PROJ and GDAL behind it
- **Mixing SRIDs and expecting a conversion** — the database raises an error rather than guessing, which is the feature; the fix is `ST_Transform`, explicitly

## Further Reading
- [PostGIS 3.4 manual](https://postgis.net/docs/manual-3.4/) — pinned to a version deliberately, because function behaviour and defaults do change between them
- [PostGIS 3.4: database management](https://postgis.net/docs/manual-3.4/using_postgis_dbmanagement.html) — the types, SRIDs, and what a spatial column actually is
- [PostGIS 3.4: ST_DWithin](https://postgis.net/docs/manual-3.4/ST_DWithin.html) — including the note about which forms can use an index
- [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html) — what GiST is, underneath the spatial vocabulary

```recall
- q: "Name the three things PostGIS adds, and what each one does."
  must:
    - "a type — geometry, carrying an SRID so the reference system travels with the value"
    - "an index access method — GiST over the bounding box, which is the pre-filter stage"
    - "several hundred functions that operate on the type"

- q: "Distinguish geometry from geography, and give the surprise that follows."
  must:
    - "geometry is planar; geography computes on the ellipsoid"
    - "ST_Distance on geometry in EPSG:4326 returns degrees, because those are the system's units"
    - "on geography it returns metres"

- q: "What is the actual cost of adopting PostGIS?"
  must:
    - "not disk space — it is a C extension with GEOS, PROJ and GDAL behind it"
    - "pinned to a PostgreSQL major version"
    - "which constrains where the database can run and how it is upgraded"
```
