# 121. SQL Fundamentals — Joins, Normalization, Core CRUD

## Coverage Level
**Not assessed** — added during the roadmap gap review. Self-check: can you write a query with two joins and a GROUP BY without an ORM autocomplete helping you?

## What It Is
Everything from N+1 Query Problem (#16) to PostgreSQL MVCC (#41) assumes fluency with plain SQL — the ORM is a convenience layer on top, not a replacement for understanding what query it generates. The relational model itself is simple: data lives in tables (rows × columns), rows are related to other rows via foreign keys, and joins are how you recombine related data at query time instead of duplicating it at write time.

Normalization is the discipline of structuring tables so each fact lives in exactly one place (up through 3NF: no partial or transitive dependencies on a non-key column). It prevents update anomalies — a customer's address changing in one order row but not another. Denormalization is the deliberate, informed reversal of that for read performance, and it should be a decision, not a default.

NULL deserves special attention: it means "unknown," not "empty" or "zero," and it propagates through comparisons in a way that surprises people the first time (`NULL = NULL` is `NULL`, not `true`).

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

## When to Use
- Any time you write a raw query, or want to reason about what an ORM call actually executes
- Debugging a slow endpoint before reaching for indexing (#17) or query plan analysis (#18)
- Modeling a new table — decide primary/foreign keys and normalization level deliberately

## Common Mistakes
- Joining without a condition (accidental cross join) — silently multiplies row counts
- Comparing to `NULL` with `=` instead of `IS NULL`, silently dropping rows
- Normalizing a hot-path read query into oblivion, causing 5-way joins for a simple page load
- Not understanding what the ORM generates, then "fixing" performance by guessing instead of reading the query (see #18)

## Further Reading
- "SQL Performance Explained" by Markus Winand (also at use-the-index-luke.com)
- PostgreSQL official tutorial (postgresql.org/docs — "Tutorial" section)
- "Learning SQL" by Alan Beaulieu
