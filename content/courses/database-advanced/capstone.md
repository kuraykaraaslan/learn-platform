# Capstone — The Column You Cannot Add

## Brief
An `orders` table holds 40 million rows and is written to continuously by a
checkout path that runs on every request. Finance needs a `currency` column on
it: not null, defaulting to `GBP`, and backfilled correctly for every existing
row. The change has to ship without a maintenance window.

The migration a team would normally write is four statements long and takes
the site down. Your job is the version that does not — and, more importantly,
being able to say *why* each step is safe rather than believing it is.

You have the lessons in this course and nothing else: no staging clone of
production, no DBA on call, and no opportunity to try it twice.

## Deliverable
A migration plan, written as SQL plus a short justification per step. It is
done when it contains:

1. **The ordered list of statements**, split into the deploys they belong to.
   A step that must not share a deploy with another says so and says why.
2. **The lock each statement takes**, named exactly (`AccessExclusiveLock`,
   `ShareUpdateExclusiveLock`, `RowExclusiveLock`), and what that lock blocks.
3. **The backfill**, written so it cannot hold one transaction open across the
   whole table, with the batch boundary stated as a query rather than a guess.
4. **The rollback position for every step** — either "this is reversible by
   running X" or "this is the point of no return, and here is what we do
   instead if it goes wrong".
5. **What you would watch while it runs**, as queries, not as feelings.

Write it as you would hand it to a colleague who will run it at 06:00 without
you. That constraint is the whole exercise.

## Rubric
Score yourself honestly against each row. Every one is a mistake this course
already documents, taken verbatim from the lesson named beside it — none of
them was invented for this exercise.

```rubric
rows:
  - lead: "Running tenant migrations without verification"
    lesson: 50
    looks_like: "Your plan has never been run against anything the size of production. The step that takes four seconds on 40,000 rows is the one that takes forty minutes on 40 million, and nothing in the plan says which step that is."
  - lead: "`WHERE deleted_at IS NULL` in some queries but not all"
    lesson: 44
    looks_like: "The same partial-adoption failure, one deploy earlier: some code paths read the new column and some do not. Between your two deploys both behaviours are live at once, and your plan does not say which reads are allowed to see NULL."
  - lead: "Long transactions with pessimistic locks"
    lesson: 42
    looks_like: "The backfill is one statement over the whole table. It holds its transaction — and whatever locks it took — for as long as it runs, and the checkout path waits behind it."
  - lead: "Pessimistic locking outside a transaction"
    lesson: 42
    looks_like: "A step in your plan names a lock without naming the transaction that scopes it. A lock's duration is its transaction's duration; a plan that states one without the other has not stated anything."
  - lead: "Never testing restores"
    lesson: 49
    looks_like: "Your rollback position is a sentence rather than a rehearsed procedure. \"We can drop the column\" is a claim about a database under load at 06:00, and it is worth exactly as much as the last time somebody did it."
  - lead: "Growing table size from never cleaning up"
    lesson: 44
    looks_like: "The backfill leaves a dead row version behind for every row it touches. Your plan says nothing about who removes them, how long that takes, or what the table looks like on disk when it is over."
```

## Reference Walkthrough
This is one correct shape, not the only one. Read it after you have scored
yourself; comparing your plan against it is the exercise, and reading it first
turns the whole thing into a comprehension test.

**Deploy 1 — add the column, nullable, no default value computed per row.**

```sql
ALTER TABLE orders ADD COLUMN IF NOT EXISTS currency text;
```

Since PostgreSQL 11 an `ADD COLUMN` with a constant default no longer rewrites
the table, but it still takes an `AccessExclusiveLock` for the duration of the
catalogue change. That is brief, and "brief" is a claim you should check rather
than accept: run the statement inside a transaction and read `pg_locks` for the
relation before committing. The lock is the reason this statement goes on its
own, at a quiet moment, rather than behind a slow one in the same deploy.

Application code in this deploy writes `currency` on every new row and tolerates
`NULL` when reading. That tolerance is what lets the two deploys be separate.

**Deploy 1, after the schema change — backfill in batches.**

```sql
-- Repeatable: each pass only touches rows that are still NULL, so an
-- interrupted run resumes rather than restarting.
UPDATE orders
SET currency = 'GBP'
WHERE id IN (
  SELECT id FROM orders WHERE currency IS NULL ORDER BY id LIMIT 5000
);
```

Run until it reports zero rows. Each statement is its own transaction, so no
single one holds a snapshot open across the table, and vacuum can keep up with
the dead tuples each batch produces. The batch size is a number to measure, not
to copy: time one batch, and choose a size whose duration you would accept as a
pause on the checkout path.

**Deploy 2 — only once the backfill has finished.**

```sql
ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'GBP';
ALTER TABLE orders ADD CONSTRAINT orders_currency_not_null
  CHECK (currency IS NOT NULL) NOT VALID;
ALTER TABLE orders VALIDATE CONSTRAINT orders_currency_not_null;
```

The `NOT VALID` constraint is added without scanning the table; `VALIDATE`
scans it under a `ShareUpdateExclusiveLock`, which does not block reads or
writes. That two-step is the whole reason to prefer a `CHECK` here over `SET
NOT NULL`, which scans the table under an `AccessExclusiveLock`.

**The rollback position.** Everything up to and including the backfill is
reversible by dropping the column. Once application code depends on `currency`
being present, the reversible step is a deploy, not a migration — which is why
"drop the old column" belongs in a third deploy, weeks later, and never in the
same one that added the new.

**The lock claims above are not this author's.** Each statement was run inside
a transaction against a real PostgreSQL and its locks were read out of
`pg_locks` while it still held them; the batched backfill was run to
exhaustion to show that a second pass over the same rows updates nothing.
Before opening it, predict which of the four statements does *not* take an
`AccessExclusiveLock`:

```proof sha=3b68c485087d9246 at=2026-09-08 commit=393ce83
$ node locks.js
locks each migration step holds, read from pg_locks inside its own transaction:

  ADD COLUMN                         AccessExclusiveLock
  SET DEFAULT                        AccessExclusiveLock
  SELECT ... FOR UPDATE              RowShareLock
  VALIDATE CONSTRAINT                ShareUpdateExclusiveLock

AccessExclusiveLock blocks every reader and writer of the table for as long as
it is held. ShareUpdateExclusiveLock blocks neither. That difference is the
whole reason the plan validates a NOT VALID constraint instead of running
SET NOT NULL, and it is why the two ALTERs above belong in quiet deploys.

backfill in batches of 15, over 40 rows:
  pass 1: 15 rows updated
  pass 2: 15 rows updated
  pass 3: 10 rows updated
  pass 4: 0 rows updated

rows left NULL: 0
The last pass updates nothing, which is what makes the plan safe to re-run:
the WHERE clause excludes every row an earlier pass already touched, so an
interrupted backfill resumes rather than starting over.
```

**What to watch, as queries rather than as feelings.**

```sql
-- Is anything waiting on a lock this migration holds?
SELECT pid, wait_event_type, wait_event, left(query, 60) AS query
FROM pg_stat_activity
WHERE wait_event_type = 'Lock';

-- How much of the backfill is left, and is autovacuum keeping up?
SELECT count(*) FILTER (WHERE currency IS NULL) AS remaining FROM orders;
SELECT n_dead_tup, last_autovacuum FROM pg_stat_user_tables WHERE relname = 'orders';
```
