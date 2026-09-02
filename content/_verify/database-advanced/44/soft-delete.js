// The three soft-delete problems the lesson names, run against a real Postgres
// engine — pglite is Postgres compiled to WASM, not a mock. Byte-stable output:
// fixed rows, fixed timestamps, every SELECT ordered, and no version- or
// timing-dependent value printed. pglite resolves from the repo's own
// node_modules (CI runs `npm ci` before stamp-verify).
const { PGlite } = require('@electric-sql/pglite');

const err = (e) => String(e.message || e).split('\n')[0];

(async () => {
  const db = await PGlite.create();

  console.log('--- problem 1: a plain unique index still sees the deleted row ---');
  await db.exec(`
    CREATE TABLE users (
      id int primary key,
      email text,
      deleted_at timestamptz,
      CONSTRAINT users_email_key UNIQUE (email)
    );
    INSERT INTO users VALUES (1, 'alice@example.com', NULL);
    UPDATE users SET deleted_at = '2026-01-01T00:00:00Z' WHERE id = 1;
  `);
  console.log("alice soft-deleted; her row is still in the table");
  try {
    await db.exec("INSERT INTO users VALUES (2, 'alice@example.com', NULL);");
    console.log('re-registration succeeded  <- not what happens');
  } catch (e) {
    console.log(`re-registration -> ${err(e)}`);
  }

  console.log('');
  console.log('--- the fix: a partial unique index, scoped to live rows ---');
  await db.exec(`
    ALTER TABLE users DROP CONSTRAINT users_email_key;
    CREATE UNIQUE INDEX users_email_live ON users (email) WHERE deleted_at IS NULL;
    INSERT INTO users VALUES (2, 'alice@example.com', NULL);
  `);
  const both = await db.query('SELECT id, email, (deleted_at IS NULL) AS live FROM users ORDER BY id');
  for (const r of both.rows) console.log(`  id ${r.id}  ${r.email}  live=${r.live}`);
  console.log('the deleted row and the new one coexist, and a second live alice is still rejected:');
  try {
    await db.exec("INSERT INTO users VALUES (3, 'alice@example.com', NULL);");
    console.log('  second live alice accepted  <- not what happens');
  } catch (e) {
    console.log(`  second live alice -> ${err(e)}`);
  }

  console.log('');
  console.log('--- problem 2: forget the filter once and deleted data is exposed ---');
  const all = await db.query('SELECT count(*)::int AS n FROM users');
  const live = await db.query('SELECT count(*)::int AS n FROM users WHERE deleted_at IS NULL');
  console.log(`SELECT ... FROM users                          -> ${all.rows[0].n} rows`);
  console.log(`SELECT ... FROM users WHERE deleted_at IS NULL -> ${live.rows[0].n} rows`);
  console.log('no error, no warning — the first query just quietly includes the deleted account');

  console.log('');
  console.log('--- problem 3: soft deleted is not erased ---');
  const pii = await db.query("SELECT email FROM users WHERE id = 1");
  console.log(`the soft-deleted row still holds: ${pii.rows[0].email}`);
  await db.exec("UPDATE users SET email = '[deleted]' WHERE id = 1");
  const anon = await db.query('SELECT id, email FROM users ORDER BY id');
  console.log('after anonymization, the row survives for referential integrity but carries no PII:');
  for (const r of anon.rows) console.log(`  id ${r.id}  ${r.email}`);

  await db.close();
})();
