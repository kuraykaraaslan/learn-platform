# 449. Spatial SQL: Predicates, Joins, and the Query That Scans Everything

## What It Is
Lesson 448 was about what the extension is. This one is about the queries, and about the single distinction that decides whether they finish: **which forms the index can serve, and which ones it cannot**.

Spatial SQL has two layers that look alike and are not. The `&&` operator asks whether two bounding boxes overlap; it is cheap, it is what the GiST index stores, and it is allowed to say yes when the real shapes do not touch. `ST_Intersects` asks whether the actual geometries meet; it is exact and expensive. The planner's job is to use the first to shrink the candidate set and the second to decide, and PostGIS's index-aware functions are written so that happens automatically — `ST_Intersects` internally includes the `&&` the index can answer.

The forms that break this are the ones where the geometry is computed rather than compared. `ST_Distance(a.geom, b.geom) < 500` computes a distance for every pair before anything can be filtered, so it is a cross join with a `WHERE` on the result. `ST_DWithin(a.geom, b.geom, 500)` expresses the same question in a form that starts with a box, and it is a different query plan entirely on the same data. Likewise, wrapping the indexed column in a function — `ST_Transform(location, 3857) && ...` — removes the index from consideration, because the index was built on `location`, not on that expression.

A spatial join amplifies all of this. Joining a hundred thousand points against a thousand polygons is a hundred million exact predicate evaluations if the box stage does not run, and roughly a hundred thousand if it does. That is the difference between a query that returns and one that does not, and it is usually one function name.

> **No Run button here either.** PGlite, the in-browser PostgreSQL this site
> runs, does not carry PostGIS, so nothing below is executed. The plan shapes
> described are what `EXPLAIN` shows on a real server; the row counts are not
> quoted, because a number nobody ran is not evidence.

```quiz
- q: "Why is `ST_DWithin(a, b, 500)` a different query from `ST_Distance(a, b) < 500`?"
  anchor: "expresses the same question in a form that starts with a box"
  options:
    - text: "ST_DWithin is more accurate at short ranges"
      correct: false
      why: "They answer the same question. The difference is what the planner can do before answering it."
    - text: "ST_DWithin can start from the index's bounding-box stage; the distance comparison has to compute every pair first"
      correct: true
      why: "One is a filter the index can serve, the other is a computation over the cross product."
    - text: "ST_Distance does not work on geography, so the comparison is invalid"
      correct: false
      why: "It works on both. The problem is the shape of the expression, not the type."

- q: "You wrap an indexed geometry column in ST_Transform inside the WHERE clause. What happens?"
  anchor: "removes the index from consideration, because the index was built on `location`"
  options:
    - text: "The index is still used, since ST_Transform is deterministic"
      correct: false
      why: "Determinism is not the requirement. The index stores values of the column, not of an expression over it."
    - text: "The index cannot be used, because it indexes the column and not that expression"
      correct: true
      why: "Either transform the other side of the comparison, or build an index on the expression."
    - text: "It errors, because indexed columns cannot appear in function calls"
      correct: false
      why: "It runs. It just scans, which is the harder failure to notice."
```

## Key Concepts
- **`&&`**: bounding-box overlap; cheap, index-served, allowed to over-select
- **`ST_Intersects`**: exact geometric intersection; expensive, and internally includes the `&&` so the index still helps
- **Index-aware functions**: `ST_Intersects`, `ST_DWithin`, `ST_Contains` are written to expose a box stage
- **`ST_Distance(...) < x` is not one of them**: it computes before it can filter, so it starts from the cross product
- **Functions on the indexed column disable the index**: transform the constant side, or index the expression
- **Spatial joins multiply**: the box stage is what stands between a hundred thousand predicate evaluations and a hundred million
- **`ST_Intersects` versus `ST_Contains` versus `ST_Within`**: different questions with different answers on boundary cases, and boundary cases are most of the interesting rows
- **Read the plan**: a spatial query's problem is almost always visible as a missing index scan, not as a slow function

## Example Code
The same question in the form that scans and the form that does not:

```sql
-- Every pair's distance is computed, and only then filtered. On a real server
-- this is a nested loop over the cross product: no index can help, because
-- there is no comparison to serve until the function has already run.
SELECT a.id, b.id
FROM asset a
JOIN asset b ON a.id < b.id
WHERE ST_Distance(a.location, b.location) < 500;

-- The same question, asked so the GiST index can do the first stage. The
-- planner starts from a bounding-box overlap and evaluates the exact
-- predicate only on what survives.
SELECT a.id, b.id
FROM asset a
JOIN asset b ON a.id < b.id
WHERE ST_DWithin(a.location, b.location, 500);
```

```sql
-- A spatial join: which zone is each asset in? ST_Intersects is index-aware,
-- so this starts from box overlaps between the points and the zone boxes.
SELECT a.id, z.name
FROM asset a
JOIN zone z ON ST_Intersects(a.location, z.boundary);

-- The same join with the indexed column wrapped in a function. It returns the
-- same rows and it cannot use asset_location, because that index holds values
-- of `location`, not of `ST_Transform(location, 3857)`.
SELECT a.id, z.name
FROM asset a
JOIN zone z ON ST_Intersects(ST_Transform(a.location, 3857), z.boundary_3857);

-- Transform the other side instead, so the indexed column is compared as it
-- is stored — or build an index on the expression and keep this form.
SELECT a.id, z.name
FROM asset a
JOIN zone z ON ST_Intersects(a.location, ST_Transform(z.boundary_3857, 4326));
```

## When to Use
- When a spatial query is slow and you need to know whether the box stage is running at all
- When writing a spatial join, where the choice of predicate function decides the plan
- When reviewing spatial SQL, where `ST_Distance(...) <` in a `WHERE` clause is the single highest-yield thing to look for
- When choosing between `ST_Intersects`, `ST_Contains` and `ST_Within`, which differ exactly on the boundary rows that make the query interesting

## Common Mistakes
- **`ST_Distance(...) < radius` in a `WHERE` clause** — the distance is computed over the cross product before anything is filtered; `ST_DWithin` asks the same question in an indexable form
- **Wrapping the indexed column in a function** — `ST_Transform(location, 3857)` is not what the index holds, so the query silently falls back to a scan
- **Assuming a spatial index makes any spatial query fast** — it accelerates the box stage only, and a query with no box stage is unaffected by it
- **Using `ST_Intersects` where `ST_Contains` was meant** — a point on the boundary of a polygon intersects it and is not contained by it, and boundary rows are where the disagreements live
- **Not reading the plan** — the difference between the two forms above is a whole different plan shape, and it is visible before the query is slow enough to notice
- **Joining without a bounding-box-friendly predicate and blaming the data volume** — a hundred thousand by one thousand join is fine with the box stage and impossible without it

## Further Reading
- [PostGIS 3.4: ST_DWithin](https://postgis.net/docs/manual-3.4/ST_DWithin.html) — the index-usage note is the whole lesson in one paragraph
- [PostGIS 3.4: ST_Intersects](https://postgis.net/docs/manual-3.4/ST_Intersects.html) — including how the `&&` is folded in
- [PostGIS 3.4: performance tips](https://postgis.net/docs/manual-3.4/performance_tips.html) — the version-pinned list of what the planner can and cannot use
- [PostGIS 3.4: special functions index](https://postgis.net/docs/manual-3.4/PostGIS_Special_Functions_Index.html) — which functions are index-aware, listed as such
- [PostgreSQL index types](https://www.postgresql.org/docs/current/indexes-types.html) — GiST, underneath all of the above

```recall
- q: "Distinguish `&&` from `ST_Intersects` and say how they work together."
  must:
    - "&& is bounding-box overlap — cheap, index-served, allowed to over-select"
    - "ST_Intersects is the exact geometric test"
    - "ST_Intersects internally includes the && so the index still serves the first stage"

- q: "Why does `ST_Distance(a, b) < 500` behave so differently from `ST_DWithin(a, b, 500)`?"
  must:
    - "the distance form computes over the cross product before anything can be filtered"
    - "ST_DWithin exposes a bounding-box stage the index can serve"
    - "same answer, different plan shape"

- q: "Name two ways to lose the index without any error being raised."
  must:
    - "wrapping the indexed column in a function, so the index holds different values than the query compares"
    - "using a form with no box stage at all, such as a distance comparison"
    - "the fix is to transform the constant side, or index the expression"
```
