// Which lock every step of the capstone's migration plan actually takes.
//
// The reference walkthrough names three lock modes and claims which of them
// block a live checkout path. Those are the kind of claim this repo does not
// let an author simply make: they are read here out of pg_locks, on a real
// PostgreSQL, inside the same transaction that took the lock.
//
// The second half proves the other property the plan depends on — that the
// batched backfill is resumable. It runs the same statement twice and reports
// the row counts; a second pass over an already-filled table must update
// nothing, or "re-running the plan after a partial failure" is not a claim the
// walkthrough is entitled to make.
//
// PGlite embeds a real PostgreSQL build and the repo's node_modules resolves
// from inside content/_verify/<...>/, the same arrangement security/30 uses.
//
// Determinism: fixed table, fixed row count, fixed batch size, results ordered.
// No clock, no random.
const { PGlite } = require('@electric-sql/pglite');

const ROWS = 40;
const BATCH = 15;

async function locksOn(db, relation) {
  const result = await db.query(
    `SELECT DISTINCT mode FROM pg_locks WHERE relation = $1::regclass ORDER BY mode`,
    [relation]
  );
  return result.rows.map((r) => r.mode).join(', ');
}

/** Runs one statement inside a transaction and reports the locks it left on
 *  the table while still holding them. */
async function lockFor(db, label, statement) {
  await db.exec('BEGIN');
  await db.exec(statement);
  const modes = await locksOn(db, 'orders');
  await db.exec('ROLLBACK');
  console.log(`  ${label.padEnd(34)} ${modes}`);
}

async function main() {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE orders (id bigserial PRIMARY KEY, total_cents int NOT NULL, currency text);
    INSERT INTO orders (total_cents) SELECT 100 + g FROM generate_series(1, ${ROWS}) g;
  `);

  console.log('locks each migration step holds, read from pg_locks inside its own transaction:');
  console.log('');
  await lockFor(db, 'ADD COLUMN', 'ALTER TABLE orders ADD COLUMN IF NOT EXISTS note text');
  await lockFor(db, 'SET DEFAULT', "ALTER TABLE orders ALTER COLUMN currency SET DEFAULT 'GBP'");
  await lockFor(db, 'SELECT ... FOR UPDATE', 'SELECT id FROM orders WHERE id = 1 FOR UPDATE');

  // VALIDATE needs the constraint to exist first, so it is set up outside the
  // measured transaction.
  await db.exec("ALTER TABLE orders ADD CONSTRAINT orders_currency_present CHECK (currency IS NOT NULL) NOT VALID");
  await db.exec("UPDATE orders SET currency = 'GBP'");
  await lockFor(db, 'VALIDATE CONSTRAINT', 'ALTER TABLE orders VALIDATE CONSTRAINT orders_currency_present');

  console.log('');
  console.log('AccessExclusiveLock blocks every reader and writer of the table for as long as');
  console.log('it is held. ShareUpdateExclusiveLock blocks neither. That difference is the');
  console.log('whole reason the plan validates a NOT VALID constraint instead of running');
  console.log('SET NOT NULL, and it is why the two ALTERs above belong in quiet deploys.');
  console.log('');

  // --- the backfill is resumable -------------------------------------------
  // The constraint validated above would (correctly) reject the reset below,
  // so it comes off first: this half is about the backfill, which in the plan
  // runs before any constraint exists.
  await db.exec('ALTER TABLE orders DROP CONSTRAINT orders_currency_present');
  await db.exec('UPDATE orders SET currency = NULL');
  console.log(`backfill in batches of ${BATCH}, over ${ROWS} rows:`);
  let pass = 0;
  for (;;) {
    pass++;
    const result = await db.query(
      `UPDATE orders SET currency = 'GBP'
       WHERE id IN (SELECT id FROM orders WHERE currency IS NULL ORDER BY id LIMIT ${BATCH})`
    );
    console.log(`  pass ${pass}: ${result.affectedRows} rows updated`);
    if (result.affectedRows === 0) break;
  }

  const remaining = await db.query('SELECT count(*)::int AS n FROM orders WHERE currency IS NULL');
  console.log('');
  console.log(`rows left NULL: ${remaining.rows[0].n}`);
  console.log('The last pass updates nothing, which is what makes the plan safe to re-run:');
  console.log('the WHERE clause excludes every row an earlier pass already touched, so an');
  console.log('interrupted backfill resumes rather than starting over.');

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
