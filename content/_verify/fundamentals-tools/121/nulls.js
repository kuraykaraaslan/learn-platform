// Real three-valued logic from a real Postgres engine — pglite is Postgres
// compiled to WASM, not a mock. Byte-stable output: the seed rows are fixed,
// every SELECT is ORDER BY id, and nothing timing- or version-dependent is
// printed. pglite resolves from the repo's own node_modules (CI runs `npm ci`
// before stamp-verify).
const { PGlite } = require('@electric-sql/pglite');

const show = (v) => (v === null ? 'NULL' : String(v));

(async () => {
  const db = await PGlite.create();
  await db.exec(`
    CREATE TABLE posts (id int primary key, title text, deleted_at timestamptz);
    INSERT INTO posts VALUES
      (1, 'live post',    NULL),
      (2, 'deleted post', '2026-01-01T00:00:00Z'),
      (3, 'another live', NULL);
  `);

  console.log('--- NULL is unknown, not a value ---');
  const cmp = await db.query(
    "SELECT (NULL = NULL) AS eq, (NULL <> NULL) AS neq, (NULL IS NULL) AS is_null"
  );
  const { eq, neq, is_null } = cmp.rows[0];
  console.log(`NULL = NULL   -> ${show(eq)}`);
  console.log(`NULL <> NULL  -> ${show(neq)}`);
  console.log(`NULL IS NULL  -> ${show(is_null)}`);
  console.log('only the third one is a boolean; the first two are unknown, and WHERE drops unknown rows');

  console.log('');
  console.log('--- the soft-delete filter everyone writes first ---');
  const wrong = await db.query('SELECT id FROM posts WHERE deleted_at = NULL ORDER BY id');
  const right = await db.query('SELECT id FROM posts WHERE deleted_at IS NULL ORDER BY id');
  console.log(`WHERE deleted_at = NULL  -> ${wrong.rows.length} rows`);
  console.log(`WHERE deleted_at IS NULL -> ${right.rows.length} rows: ${right.rows.map((r) => r.id).join(', ')}`);
  console.log('no error, no warning — the first query just quietly returns nothing');

  console.log('');
  console.log('--- and NOT IN with a NULL in the list matches nothing at all ---');
  const inList = await db.query('SELECT id FROM posts WHERE id IN (1, 2, NULL) ORDER BY id');
  const notInList = await db.query('SELECT id FROM posts WHERE id NOT IN (2, NULL) ORDER BY id');
  console.log(`WHERE id IN (1, 2, NULL)  -> ${inList.rows.length} rows: ${inList.rows.map((r) => r.id).join(', ')}`);
  console.log(`WHERE id NOT IN (2, NULL) -> ${notInList.rows.length} rows`);
  console.log('id 1 and 3 are obviously not 2, but "1 <> NULL" is unknown, so NOT IN can never be true');

  console.log('');
  console.log('--- COUNT(*) and COUNT(column) are different questions ---');
  const counts = await db.query('SELECT COUNT(*) AS all_rows, COUNT(deleted_at) AS with_value FROM posts');
  console.log(`COUNT(*)          -> ${counts.rows[0].all_rows}`);
  console.log(`COUNT(deleted_at) -> ${counts.rows[0].with_value}`);

  await db.close();
})();
