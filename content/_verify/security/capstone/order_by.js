// Why the capstone's first rubric row is not solved by parameterisation.
//
// The pull request under review sorts a list by a column name taken from the
// query string, and the author's defence is that the value is passed as a
// parameter. This run shows what a parameter in ORDER BY position actually
// does, on a real PostgreSQL: nothing at all.
//
// Nothing here demonstrates an attack. It prints the order four queries
// return, and the interesting result is that two of them return the same
// order as no ORDER BY clause at all — a placeholder there is a constant, and
// sorting by a constant is not a sort. So the sort silently stops working,
// which is how this survives review: the feature looks fine on a page where
// the rows happened to be inserted in a plausible order.
//
// The allowlist in lesson 30 is not the safer of two working options. It is
// the only one that sorts.
//
// Determinism: three fixed rows whose titles are deliberately in the reverse
// of their insertion order, so "did it sort?" is unambiguous. No clock, no
// random.
const { PGlite } = require('@electric-sql/pglite');

const ALLOWED_SORTS = { title: 'title', newest: 'id DESC' };

async function main() {
  const db = new PGlite();
  await db.exec(`
    CREATE TABLE doc (id int PRIMARY KEY, tenant text NOT NULL, title text NOT NULL);
    INSERT INTO doc VALUES (1, 'acme', 'Zulu'), (2, 'acme', 'Mike'), (3, 'acme', 'Alpha');
  `);

  const order = async (label, sql, params) => {
    const result = await db.query(sql, params);
    console.log(`  ${label.padEnd(44)} ${result.rows.map((r) => r.title).join(', ')}`);
  };

  console.log('rows are inserted Zulu, Mike, Alpha — so a working sort by title is visible:');
  console.log('');
  await order('no ORDER BY at all', `SELECT title FROM doc WHERE tenant = $1`, ['acme']);
  await order('ORDER BY $1, parameter is "title"', `SELECT title FROM doc WHERE tenant = $2 ORDER BY $1`, [
    'title',
    'acme',
  ]);
  await order('ORDER BY $1, parameter is "id DESC"', `SELECT title FROM doc WHERE tenant = $2 ORDER BY $1`, [
    'id DESC',
    'acme',
  ]);
  await order(
    `ORDER BY ${ALLOWED_SORTS.title} from an allowlist`,
    `SELECT title FROM doc WHERE tenant = $1 ORDER BY ${ALLOWED_SORTS.title}`,
    ['acme']
  );

  console.log('');
  console.log('The two parameterised rows are byte-identical to the unsorted one. PostgreSQL');
  console.log('accepted the query, raised nothing, and sorted by a constant — which is not a');
  console.log('sort. The reviewer\'s finding is therefore not "this is injectable" alone; it');
  console.log('is that the only way to make ORDER BY work is to put the column name into the');
  console.log('SQL text, and the only safe way to do that is to choose it from a fixed list.');
  console.log('');
  console.log(`allowlist in this run: ${Object.entries(ALLOWED_SORTS).map(([k, v]) => `${k} -> ${v}`).join(', ')}`);
  console.log('Anything not in it is rejected before a query is built, which is the whole');
  console.log('mechanism — no escaping, no sanitising, no cleverness.');

  await db.close();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
