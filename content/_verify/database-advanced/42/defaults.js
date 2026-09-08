// The defaults lesson 42's `numbers` table states, read out of a real
// PostgreSQL rather than quoted from memory or from a blog.
//
// `pg_settings.boot_val` is the value compiled into the server -- what you get
// with no postgresql.conf, no ALTER SYSTEM and no session override. That is
// precisely the "default" a lesson is entitled to claim, and it is the one
// number in the table nobody has to take on trust: if a future PostgreSQL
// changes it, this proof fails in CI and the lesson is corrected instead of
// quietly ageing.
//
// PGlite embeds an actual PostgreSQL build (compiled to WebAssembly), and the
// repo's own node_modules resolves from inside content/_verify/<course>/<id>/
// -- the same arrangement security/30 and fundamentals-tools/121 already use
// to run real SQL in a proof. No new dependency.
//
// Determinism: boot_val is compiled in, the settings are listed in the query
// and the result is ordered by name. The PGlite version is pinned by
// package-lock.json, so a version bump is a deliberate, reviewable change.
const { PGlite } = require('@electric-sql/pglite');

const SETTINGS = ['deadlock_timeout', 'idle_in_transaction_session_timeout', 'lock_timeout'];

async function main() {
  const db = new PGlite();

  const version = await db.query('SELECT current_setting($1) AS v', ['server_version']);
  console.log(`PostgreSQL ${version.rows[0].v} (embedded build)`);
  console.log('');

  const result = await db.query(
    `SELECT name, boot_val, unit, short_desc
     FROM pg_settings
     WHERE name = ANY($1)
     ORDER BY name`,
    [SETTINGS]
  );

  console.log('compiled-in defaults (boot_val), which is what "default" means:');
  console.log('');
  for (const row of result.rows) {
    const value = row.unit ? `${row.boot_val} ${row.unit}` : row.boot_val;
    console.log(`  ${row.name.padEnd(37)} ${value}`);
  }

  console.log('');
  const lock = result.rows.find((r) => r.name === 'lock_timeout');
  const deadlock = result.rows.find((r) => r.name === 'deadlock_timeout');
  console.log(`lock_timeout ships as ${lock.boot_val}, and 0 does not mean "no waiting" -- it means`);
  console.log('no limit. A statement that wants a row lock waits for as long as the holder');
  console.log('keeps it, holding its own connection the entire time.');
  console.log('');
  console.log(`deadlock_timeout ships as ${deadlock.boot_val} ${deadlock.unit}, and it is not a limit on waiting either: it`);
  console.log('is how long the server waits before it starts LOOKING for a deadlock. Every');
  console.log('lock wait pays it before detection can begin.');
  console.log('');
  console.log('Neither number is quoted here. Both were read from the server above.');

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
