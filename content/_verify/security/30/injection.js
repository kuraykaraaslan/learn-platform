// A real SQL injection against a real Postgres engine — pglite is Postgres
// compiled to WASM, not a mock or a hand-typed transcript. The output is
// byte-stable because the seed rows are fixed, every SELECT is ORDER BY id,
// and nothing timing-, path- or version-dependent is printed. pglite resolves
// from the repo's own node_modules (CI runs `npm ci` before stamp-verify).
const { PGlite } = require('@electric-sql/pglite');

const ATTACK = "' OR '1'='1' --";

(async () => {
  const db = await PGlite.create();
  await db.exec(`
    CREATE TABLE users (id int primary key, email text, password text, role text);
    INSERT INTO users VALUES
      (1, 'ada@example.com',   'hunter2',   'admin'),
      (2, 'linus@example.com', 'correct-h', 'user'),
      (3, 'grace@example.com', 'batch-42',  'user');
  `);

  console.log(`attacker submits this as the email: ${ATTACK}`);
  console.log('(password box left empty)');

  console.log('');
  console.log('--- concatenated into the SQL string ---');
  const injected = `SELECT id, email, role FROM users WHERE email = '${ATTACK}' AND password = '' ORDER BY id`;
  console.log(injected);
  const bad = await db.query(injected);
  console.log(`rows returned: ${bad.rows.length}`);
  for (const r of bad.rows) console.log(`  ${r.id}  ${r.email}  ${r.role}`);
  console.log("the trailing -- commented the password check out of existence");

  console.log('');
  console.log('--- same input, sent as a parameter ---');
  console.log("SELECT id, email, role FROM users WHERE email = $1 AND password = $2 ORDER BY id");
  const good = await db.query(
    'SELECT id, email, role FROM users WHERE email = $1 AND password = $2 ORDER BY id',
    [ATTACK, ''],
  );
  console.log(`rows returned: ${good.rows.length}`);
  console.log('the engine looked for a user whose email is literally that string, and found none');

  await db.close();
})();
