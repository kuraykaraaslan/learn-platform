// The three arrivals the capstone's reference describes, on a real PostgreSQL.
//
// The walkthrough claims that a unique key plus ON CONFLICT DO NOTHING settles
// the concurrent case without a read-then-write window: the first arrival gets
// a row back, a retry while the first is still running gets nothing, and a
// retry after completion gets the original response rather than a fresh one.
// Those are three claims about what a database returns, so they are executed
// rather than asserted.
//
// The fourth case is the one the walkthrough spends its last paragraph on: a
// key reused with a different request body is a conflict, not a replay, and
// the stored request hash is what tells them apart.
//
// PGlite embeds a real PostgreSQL and resolves from the repo's node_modules,
// as security/30 does. Determinism: fixed keys, fixed hashes, fixed order, and
// no timestamps are printed — created_at exists in the schema and is never
// selected, precisely because it would move between runs.
const { PGlite } = require('@electric-sql/pglite');

const KEY = 'idem-9f2';
const BODY_HASH = 'sha256:ab12';

const claim = (db, key, requester, hash) =>
  db.query(
    `INSERT INTO payment_attempt (idempotency_key, requester_id, request_hash)
     VALUES ($1, $2, $3)
     ON CONFLICT (idempotency_key) DO NOTHING
     RETURNING idempotency_key, status`,
    [key, requester, hash]
  );

async function main() {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE payment_attempt (
      idempotency_key text PRIMARY KEY,
      requester_id    text        NOT NULL,
      request_hash    text        NOT NULL,
      status          text        NOT NULL DEFAULT 'in_progress',
      provider_ref    text,
      response_body   jsonb,
      created_at      timestamptz NOT NULL DEFAULT now()
    );
  `);

  const first = await claim(db, KEY, 'cust-41', BODY_HASH);
  console.log(`arrival 1 (first)            rows returned: ${first.rows.length}  status: ${first.rows[0].status}`);

  const concurrent = await claim(db, KEY, 'cust-41', BODY_HASH);
  console.log(`arrival 2 (retry, in flight) rows returned: ${concurrent.rows.length}  -> 409, do not charge again`);

  await db.query(
    `UPDATE payment_attempt
     SET status = 'succeeded', provider_ref = $2, response_body = $3::jsonb
     WHERE idempotency_key = $1`,
    [KEY, 'ch_77', JSON.stringify({ payment_id: 'pay_77', amount_cents: 4200 })]
  );

  const afterDone = await claim(db, KEY, 'cust-41', BODY_HASH);
  const stored = await db.query(
    'SELECT status, response_body FROM payment_attempt WHERE idempotency_key = $1',
    [KEY]
  );
  console.log(`arrival 3 (retry, completed) rows returned: ${afterDone.rows.length}  status: ${stored.rows[0].status}`);
  console.log(`                             replays: ${JSON.stringify(stored.rows[0].response_body)}`);

  const mismatch = await db.query(
    `SELECT request_hash = $2 AS same_request FROM payment_attempt WHERE idempotency_key = $1`,
    [KEY, 'sha256:DIFFERENT']
  );
  console.log(`same key, different body     same_request: ${mismatch.rows[0].same_request}  -> reject, not replay`);

  const rows = await db.query('SELECT count(*)::int AS n FROM payment_attempt');
  console.log('');
  console.log(`rows in payment_attempt after three arrivals: ${rows.rows[0].n}`);
  console.log('');
  console.log('That is the whole concurrency control. There is no read-then-write, no');
  console.log('advisory lock and no window: the primary key decides which arrival owns the');
  console.log('operation, and the two that do not own it are told so by getting nothing back.');
  console.log('');
  console.log('Note what is NOT proven here. Nothing above shows what happens when the');
  console.log('process dies between calling the provider and writing the result — that row');
  console.log('stays in_progress with no provider_ref, and no schema resolves it. The');
  console.log('walkthrough says so, and this run cannot say otherwise.');

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
