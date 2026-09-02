# 121. SQL Fundamentals — Joins, Normalization, Core CRUD

## What It Is
Everything from N+1 Query Problem (#16) to PostgreSQL MVCC (#41) assumes fluency with plain SQL — the ORM is a convenience layer on top, not a replacement for understanding what query it generates. The relational model itself is simple: data lives in tables (rows × columns), rows are related to other rows via foreign keys, and joins are how you recombine related data at query time instead of duplicating it at write time.

Normalization is the discipline of structuring tables so each fact lives in exactly one place (up through 3NF: no partial or transitive dependencies on a non-key column). It prevents update anomalies — a customer's address changing in one order row but not another. Denormalization is the deliberate, informed reversal of that for read performance, and it should be a decision, not a default.

NULL deserves special attention: it means "unknown," not "empty" or "zero," and it propagates through comparisons in a way that surprises people the first time (`NULL = NULL` is `NULL`, not `true`).


```quiz
- q: "A soft-delete filter ships as `WHERE deleted_at = NULL` and the endpoint starts returning nothing. Why is there no error?"
  anchor: "it means \"unknown,\" not \"empty\" or \"zero,\""
  options:
    - text: "`= NULL` is a syntax error that the driver silently swallows"
      correct: false
      why: "It is valid SQL. Nothing is swallowed \u2014 the comparison runs and simply never evaluates to true."
    - text: "NULL means unknown, so `deleted_at = NULL` evaluates to unknown for every row and WHERE keeps none of them"
      correct: true
      why: "Three-valued logic: comparing to an unknown yields unknown, and WHERE only keeps rows where the predicate is true."
    - text: "The column has no index, so the planner skips the rows"
      correct: false
      why: "Indexes affect how rows are found, never which rows match. This result is identical on an unindexed table."

- q: "What is the correct way to ask \"has this row not been soft-deleted?\""
  anchor: "use `IS NULL`, never `= NULL`"
  options:
    - text: "`WHERE deleted_at IS NULL`"
      correct: true
      why: "IS NULL is the operator that actually tests for the absence of a value, and it returns a real boolean rather than unknown."
    - text: "`WHERE deleted_at = NULL`"
      correct: false
      why: "This is the exact mistake \u2014 it evaluates to unknown for every row and returns nothing at all."
    - text: "`WHERE NOT deleted_at`"
      correct: false
      why: "Negating an unknown is still unknown, so this has the same silent-empty-result problem, and it also treats a timestamp as a boolean."
```

## Key Concepts
- **Primary key**: uniquely identifies a row; **foreign key**: references a primary key in another table, enforcing referential integrity
- **Joins**: INNER (only matching rows), LEFT (all left rows + matches), RIGHT, FULL OUTER (all rows from both sides)
- **GROUP BY / aggregate functions**: collapse rows into summaries (`COUNT`, `SUM`, `AVG`); `HAVING` filters *after* aggregation, `WHERE` filters *before*
- **Normalization (1NF–3NF)**: atomic columns → no partial key dependency → no transitive dependency
- **NULL semantics**: three-valued logic (`true`/`false`/`unknown`); use `IS NULL`, never `= NULL`
- **Transactions**: `BEGIN` / `COMMIT` / `ROLLBACK` — a unit of work that's all-or-nothing

## Example Code
```sql
-- Customers who placed more than 2 orders in the last 30 days, with their total spend
SELECT c.id, c.name, COUNT(o.id) AS order_count, SUM(o.total_cents) AS total_spent
FROM customers c
JOIN orders o ON o.customer_id = c.id
WHERE o.created_at >= now() - interval '30 days'
GROUP BY c.id, c.name
HAVING COUNT(o.id) > 2
ORDER BY total_spent DESC;
```

```typescript
// The equivalent Prisma query — useful to recognize what SQL it will generate
const topCustomers = await prisma.customer.findMany({
  where: { orders: { some: { createdAt: { gte: thirtyDaysAgo } } } },
  include: { _count: { select: { orders: true } } },
});
// Note: replicating the HAVING + SUM exactly often needs a raw query or a materialized view (see #13)
```

The NULL claims above, run for real against a real Postgres engine seeded with three posts, two of them live. Predict what `WHERE deleted_at = NULL` returns before revealing it — an error, every row, or something else?

```proof sha=d8f2a1c229fd23cc at=2026-09-02 commit=9614387
$ node nulls.js
--- NULL is unknown, not a value ---
NULL = NULL   -> NULL
NULL <> NULL  -> NULL
NULL IS NULL  -> true
only the third one is a boolean; the first two are unknown, and WHERE drops unknown rows

--- the soft-delete filter everyone writes first ---
WHERE deleted_at = NULL  -> 0 rows
WHERE deleted_at IS NULL -> 2 rows: 1, 3
no error, no warning — the first query just quietly returns nothing

--- and NOT IN with a NULL in the list matches nothing at all ---
WHERE id IN (1, 2, NULL)  -> 2 rows: 1, 2
WHERE id NOT IN (2, NULL) -> 0 rows
id 1 and 3 are obviously not 2, but "1 <> NULL" is unknown, so NOT IN can never be true

--- COUNT(*) and COUNT(column) are different questions ---
COUNT(*)          -> 3
COUNT(deleted_at) -> 1
```

## When to Use
- Any time you write a raw query, or want to reason about what an ORM call actually executes
- Debugging a slow endpoint before reaching for indexing (#17) or query plan analysis (#18)
- Modeling a new table — decide primary/foreign keys and normalization level deliberately

## Common Mistakes
- Joining without a condition (accidental cross join) — silently multiplies row counts
- **`WHERE deleted_at = NULL` runs in production, silently returning zero rows instead of the expected ones** — Comparing to `NULL` with `=` instead of `IS NULL`, silently dropping rows
- **A simple page load requires a 5-way join, because the schema was normalized without any regard for what the hot-path query actually needs** — Normalizing a hot-path read query into oblivion, causing 5-way joins for a simple page load
- **A slow endpoint gets "fixed" by adding a random index, without anyone actually reading the query the ORM generated** — Not understanding what the ORM generates, then "fixing" performance by guessing instead of reading the query (see #18)

## Further Reading
- "SQL Performance Explained" by Markus Winand (also at use-the-index-luke.com)
- PostgreSQL official tutorial (postgresql.org/docs — "Tutorial" section)
- "Learning SQL" by Alan Beaulieu

```recall
- q: "Explain why `WHERE deleted_at = NULL` returns nothing, without using the word NULL as a value."
  must:
    - "NULL means unknown, not empty and not zero"
    - "comparing anything to an unknown yields unknown, not true or false"
    - "WHERE keeps only rows whose predicate is true, so unknown rows are dropped"
    - "IS NULL is the operator that actually tests for absence"

- q: "What makes `NOT IN` with a NULL in the list dangerous?"
  must:
    - "NOT IN expands to a chain of not-equal comparisons"
    - "any comparison against the NULL is unknown, so the whole chain can never be true"
    - "the query returns zero rows with no error"

- q: "How do COUNT(*) and COUNT(column) differ, and why does it matter?"
  must:
    - "COUNT(*) counts rows"
    - "COUNT(column) counts rows where that column is not NULL"
    - "they answer different questions and silently disagree on a nullable column"
```
