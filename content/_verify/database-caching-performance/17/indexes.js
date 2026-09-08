// Two claims lesson #17 made about indexes, put to a real PostgreSQL.
//
// Both are the kind of statement that reads as settled knowledge and is
// version-dependent or simply wrong, which is why this file exists: the
// lesson is `verified: true`, and what verified means in this repo is that
// nothing in it rests on an author's recollection alone.
//
// Determinism: fixed rows, fixed values, no clock, no random. TIMING/COSTS/
// BUFFERS off — those are what differ between two runs; node types, row counts
// and index-search counts do not. timezone pinned to UTC because a plan
// containing a timestamptz literal otherwise prints in the host's zone.
const { PGlite } = require('@electric-sql/pglite');

const ROWS = 50000;

async function plan(db, sql) {
  const r = await db.query(`EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, COSTS OFF, BUFFERS OFF) ${sql}`);
  return r.rows.map((row) => row['QUERY PLAN']);
}

async function main() {
  const db = new PGlite();
  await db.exec("SET timezone = 'UTC';");

  const v = await db.query('SELECT current_setting($1) AS v', ['server_version']);
  console.log(`PostgreSQL ${v.rows[0].v} (PGlite, the same build the lesson's run buttons use)`);
  console.log('');

  await db.exec(`
    CREATE TABLE user_sessions (
      id bigserial PRIMARY KEY,
      tenant_id int NOT NULL,
      status text NOT NULL,
      expires_at timestamptz NOT NULL
    );
    INSERT INTO user_sessions (tenant_id, status, expires_at)
    SELECT g % 100,
           CASE WHEN g % 10 = 0 THEN 'active' ELSE 'expired' END,
           timestamptz '2026-01-01 00:00:00+00' + (g * interval '1 hour')
    FROM generate_series(1, ${ROWS}) g;
  `);

  console.log('1. A partial index whose predicate calls now().');
  console.log('');
  try {
    await db.exec("CREATE INDEX sessions_live_idx ON user_sessions (tenant_id) WHERE expires_at > NOW();");
    console.log('   accepted');
  } catch (error) {
    console.log(`   $ CREATE INDEX ... ON user_sessions (tenant_id) WHERE expires_at > NOW();`);
    console.log(`   ERROR:  ${error.message}`);
  }
  console.log('');
  console.log('   There is no snapshot-at-creation-time behaviour to reason about, because');
  console.log('   the statement does not execute. A partial index predicate must be IMMUTABLE,');
  console.log('   and now() is STABLE. The fix is a real cutoff value, not a call:');
  await db.exec(
    "CREATE INDEX sessions_live_idx ON user_sessions (tenant_id) WHERE expires_at > timestamptz '2026-03-01 00:00:00+00';"
  );
  const partial = await db.query(
    "SELECT pg_size_pretty(pg_relation_size('sessions_live_idx')) AS partial, pg_size_pretty(pg_relation_size('user_sessions')) AS whole"
  );
  console.log(`   WHERE expires_at > timestamptz '2026-03-01 00:00:00+00'  -> accepted`);
  console.log(`   index ${partial.rows[0].partial} against a ${partial.rows[0].whole} table`);

  console.log('');
  console.log('2. The leading column rule, on a composite index (status, tenant_id).');
  console.log('');
  await db.exec('CREATE INDEX sessions_status_tenant_idx ON user_sessions (status, tenant_id); ANALYZE user_sessions;');
  console.log('   filtering on tenant_id alone — the NON-leading column:');
  for (const line of await plan(db, 'SELECT count(*) FROM user_sessions WHERE tenant_id = 42')) {
    console.log('     ' + line);
  }
  console.log('');
  console.log('   The index is used. It is not free, and the plan says where the cost went:');
  console.log('   "Index Searches" counts how many separate descents the scan had to make,');
  console.log('   because the filter does not constrain the leading column. Compare an index');
  console.log('   whose leading column IS the filter:');
  await db.exec('CREATE INDEX sessions_tenant_idx ON user_sessions (tenant_id); ANALYZE user_sessions;');
  for (const line of await plan(db, 'SELECT count(*) FROM user_sessions WHERE tenant_id = 42')) {
    console.log('     ' + line);
  }
  console.log('');
  console.log('   One search instead of several. That difference is what the leading column');
  console.log('   rule is actually about.');
  console.log('   The rule survives as advice about column order; it does not survive as a');
  console.log('   statement about what this version of the planner is capable of.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
