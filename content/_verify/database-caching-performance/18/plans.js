// What the planner actually does with two predicates that look equivalent.
//
// Lesson #18 teaches reading a plan, and its `sql run` fences let the reader
// produce one themselves. What it could not do until now is make a claim about
// what they will see and have that claim checked: prose asserting "this
// becomes a Seq Scan" is exactly the hand-typed transcript this repo does not
// accept. So the two plans below are read out of a real PostgreSQL (PGlite),
// and the `breaks` fence in the lesson quotes these lines verbatim.
//
// Determinism, deliberately:
//  - TIMING OFF, SUMMARY OFF, COSTS OFF, BUFFERS OFF: milliseconds, cost
//    estimates and buffer counts are what differ between two runs of the same
//    query — buffers because they depend on what the cache already held. Node
//    types and actual row counts do not differ, and they are the whole claim.
//  - SET timezone = 'UTC': without it a timestamptz literal in a plan prints
//    in the HOST's zone, so this file would stamp differently on a laptop in
//    +03 than in CI. Measured, not assumed (docs/phases/44-how-it-breaks.md).
//  - Fixed row count, fixed seed values, no clock, no random.
const { PGlite } = require('@electric-sql/pglite');

const ROWS = 50000;

async function plan(db, sql) {
  const r = await db.query(`EXPLAIN (ANALYZE, TIMING OFF, SUMMARY OFF, COSTS OFF, BUFFERS OFF) ${sql}`);
  return r.rows.map((row) => row['QUERY PLAN']);
}

async function main() {
  const db = new PGlite();
  await db.exec("SET timezone = 'UTC';");
  await db.exec(`
    CREATE TABLE readings (
      id bigserial PRIMARY KEY,
      device_id int NOT NULL,
      at timestamptz NOT NULL,
      value double precision NOT NULL
    );
    INSERT INTO readings (device_id, at, value)
    SELECT g % 200, timestamptz '2026-01-01 00:00:00+00' + (g * interval '1 minute'), g % 97
    FROM generate_series(1, ${ROWS}) g;
    CREATE INDEX readings_at_idx ON readings (at);
    ANALYZE readings;
  `);

  const HOUR_START = "timestamptz '2026-01-05 09:00:00+00'";
  const HOUR_END = "timestamptz '2026-01-05 10:00:00+00'";

  console.log(`${ROWS} rows, one index: readings_at_idx on (at). Both queries return the same rows.`);
  console.log('');
  console.log('A) the predicate written as a range on the column itself:');
  for (const line of await plan(db, `SELECT count(*) FROM readings WHERE at >= ${HOUR_START} AND at < ${HOUR_END}`)) {
    console.log('   ' + line);
  }
  console.log('');
  console.log("B) the same hour, written as date_trunc('hour', at) = ...:");
  for (const line of await plan(db, `SELECT count(*) FROM readings WHERE date_trunc('hour', at) = ${HOUR_START}`)) {
    console.log('   ' + line);
  }

  const a = await db.query(`SELECT count(*) AS n FROM readings WHERE at >= ${HOUR_START} AND at < ${HOUR_END}`);
  const b = await db.query(`SELECT count(*) AS n FROM readings WHERE date_trunc('hour', at) = ${HOUR_START}`);
  console.log('');
  console.log(`Both answers: A = ${a.rows[0].n}, B = ${b.rows[0].n} rows.`);
  console.log('The index exists, the query is selective, and B does not use it. Wrapping the');
  console.log('column in a function means the index on that column no longer describes the');
  console.log('expression being filtered on, so every row must be read and tested.');

  console.log('');
  console.log('--- what a stale statistic looks like');
  await db.exec(`INSERT INTO readings (device_id, at, value)
    SELECT 999, timestamptz '2026-02-01 00:00:00+00' + (g * interval '1 second'), 1
    FROM generate_series(1, 20000) g;`);
  const stalePlan = await plan(db, 'SELECT count(*) FROM readings WHERE device_id = 999');
  const before = await db.query(
    "SELECT reltuples::bigint AS planner_thinks FROM pg_class WHERE relname = 'readings'"
  );
  console.log(`   pg_class.reltuples before ANALYZE : ${before.rows[0].planner_thinks}`);
  await db.exec('ANALYZE readings;');
  const after = await db.query(
    "SELECT reltuples::bigint AS planner_thinks FROM pg_class WHERE relname = 'readings'"
  );
  const real = await db.query('SELECT count(*) AS n FROM readings');
  console.log(`   pg_class.reltuples after ANALYZE  : ${after.rows[0].planner_thinks}`);
  console.log(`   rows actually in the table        : ${real.rows[0].n}`);
  console.log(`   plan for device_id = 999          : ${stalePlan[1].trim()}`);
  console.log('');
  console.log('The planner does not count rows; it reads a statistic that ANALYZE last wrote.');
  console.log('Between the insert and the next ANALYZE it is planning against a table that no');
  console.log('longer exists, and no amount of reading the query will show you that.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
