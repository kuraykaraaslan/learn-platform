#!/bin/bash
# Runs a real parser over a real (small, hand-written) IFC-SPF file. Nothing
# here is a hand-typed transcript, and nothing is installed: the parser uses
# Node builtins only, which is the whole reason lesson 432 can prove its claim
# at all — scripts/stamp-verify.ts runs the command and never runs `npm install`.
#
# Determinism: the input file is fixed, the parser walks it in file order, and
# every printed line is derived from that file. No clock, no duration, no
# random id, no tool version — the P5 criterion for a proof block.
set -e
WORK=$(mktemp -d)
cd "$WORK"

# A minimal but legal STEP Physical File. Note #310: it references #40, which
# is only DEFINED forty lines further down. A one-pass resolver breaks here.
cat > depot.ifc <<'EOF'
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [ReferenceView]'),'2;1');
FILE_NAME('depot.ifc','2026-01-01T00:00:00',('A. Author'),('Riverside'),'','','');
FILE_SCHEMA(('IFC4X3_ADD2'));
ENDSEC;
DATA;
#10= IFCPROJECT('1xS3BCk291UvhgP2a6eflL',$,'Riverside Depot',$,$,$,$,$,$);
#20= IFCSITE('0Nq7bTx4T9YR5Fn2WmKcJp',$,'Depot site',$,$,$,$,$,.ELEMENT.,$,$,$,$,$);
#30= IFCBUILDING('2wLpH8dGz3nQBcVsRt1eMf',$,'Depot',$,$,$,$,$,.ELEMENT.,$,$,$);
#310= IFCRELAGGREGATES('3aQ5rNjWv7pKDmXtYc9uSb',$,$,$,#30,(#40));
#40= IFCBUILDINGSTOREY('2rSuRi_lD5$O4Op8DVOCkd',$,'Ground floor',$,$,$,$,$,.ELEMENT.,0.);
#50= IFCWALL('3Xt7zPfNb2vgqR1YkEwNsq',$,'Bay wall, north','Load-bearing (300mm)',$,$,$,'Wall-042',.SOLIDWALL.);
#60= IFCOPENINGELEMENT('1Hs9vKcQn4tMAeZpLb7wRx',$,'Opening for W-11',$,$,$,$,'Op-011',.OPENING.);
#70= IFCWINDOW('0Vb4NsHkD1EQfXpTr8wLmY',$,'W-11',$,$,$,$,'Win-011',1200.,900.,.WINDOW.,$,$);
#300= IFCRELAGGREGATES('1Ck8mYdBf2vJHqWnPs6tLe',$,$,$,#10,(#20));
#320= IFCRELAGGREGATES('0Tz3wFhLp6bNCxRkQm4vDa',$,$,$,#20,(#30));
#400= IFCRELCONTAINEDINSPATIALSTRUCTURE('2Mj6qXvCn8rPBtYwZd5uKf',$,$,$,(#50,#70),#40);
#410= IFCRELVOIDSELEMENT('3Rf2pWkTb9nLDvXcHq7mYs',$,$,$,#50,#60);
#420= IFCRELFILLSELEMENT('1Nd5tGyQm3vKAwZrPc8bXh',$,$,$,#60,#70);
ENDSEC;
END-ISO-10303-21;
EOF

cat > parse.js <<'EOF'
const { readFileSync } = require('node:fs');

const source = readFileSync('depot.ifc', 'utf-8');

// An entity instance ends at a ';' that is OUTSIDE a quoted string, not at a
// newline: a single instance may legally wrap across many lines, and a
// string may legally contain a ';'.
function statements(text) {
  const out = [];
  let current = '';
  let inString = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      current += ch;
      if (ch === "'" && text[i + 1] === "'") { current += "'"; i++; }
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; current += ch; continue; }
    if (ch === ';') { out.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  return out.filter((s) => s !== '');
}

function splitArgs(body) {
  const out = [];
  let depth = 0, inString = false, current = '';
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (inString) {
      current += ch;
      if (ch === "'" && body[i + 1] === "'") { current += "'"; i++; }
      else if (ch === "'") inString = false;
      continue;
    }
    if (ch === "'") { inString = true; current += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) { out.push(current.trim()); current = ''; continue; }
    current += ch;
  }
  if (current.trim() !== '') out.push(current.trim());
  return out;
}

// PASS 1 — index every instance by id, resolving nothing. This pass is the
// answer to forward references: after it, every id in the file is known.
const byId = new Map();
const order = [];
for (const statement of statements(source)) {
  const head = /^#(\d+)\s*=\s*([A-Z0-9_]+)\s*\(/.exec(statement);
  if (!head) continue;
  const id = Number(head[1]);
  const body = statement.slice(head[0].length, statement.lastIndexOf(')'));
  byId.set(id, { id, type: head[2], args: splitArgs(body) });
  order.push(id);
}

const refs = (arg) => [...arg.matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
const label = (id) => {
  const e = byId.get(id);
  const name = e.args[2] && e.args[2] !== '$' ? e.args[2].slice(1, -1) : '(unnamed)';
  return `${e.type} ${name}`;
};

console.log(`parsed ${byId.size} entity instances, in file order: ${order.join(' ')}`);
console.log('');

// PASS 2 — the relationships. None of these are attributes of the wall: IFC
// keeps them in separate objects, and the reverse direction (wall -> storey)
// is an INVERSE attribute that is never written to the file at all.
const parent = new Map();
const how = new Map();
for (const e of byId.values()) {
  if (e.type === 'IFCRELAGGREGATES') {
    for (const child of refs(e.args[5])) { parent.set(child, refs(e.args[4])[0]); how.set(child, 'aggregates'); }
  }
  if (e.type === 'IFCRELCONTAINEDINSPATIALSTRUCTURE') {
    // RelatedElements comes BEFORE RelatingStructure in this entity. Read
    // them the other way round and every element lands under itself.
    for (const child of refs(e.args[4])) { parent.set(child, refs(e.args[5])[0]); how.set(child, 'contained'); }
  }
}

// Voiding and filling are element-to-element, NOT spatial placement: the
// window still hangs off the storey by containment. Folding them into the
// same parent map would move the window under the opening and quietly lose
// the fact the tree exists to show.
const elementLinks = [];
for (const e of byId.values()) {
  if (e.type === 'IFCRELVOIDSELEMENT') elementLinks.push(['voids', refs(e.args[5])[0], refs(e.args[4])[0]]);
  if (e.type === 'IFCRELFILLSELEMENT') elementLinks.push(['fills', refs(e.args[5])[0], refs(e.args[4])[0]]);
}

// Exactly one IfcProject per file — a schema rule, so the tree has one root.
const seen = new Set();
function print(id, depth) {
  seen.add(id);
  const via = how.has(id) ? `  <- ${how.get(id)}` : '';
  console.log(`${'  '.repeat(depth)}${label(id)}${via}`);
  for (const child of [...byId.keys()].filter((c) => parent.get(c) === id)) print(child, depth + 1);
}
print([...byId.keys()].find((id) => byId.get(id).type === 'IFCPROJECT'), 0);

const unplaced = [...byId.keys()].filter((id) => !seen.has(id) && !byId.get(id).type.startsWith('IFCREL'));
console.log('');
console.log(`not in the spatial tree: ${unplaced.map(label).join(', ')} — placed by an element relationship, not by containment`);

console.log('');
for (const [kind, from, to] of elementLinks) console.log(`${label(from)}  ${kind}  ${label(to)}`);
console.log('Neither line moved anything in the tree above: both ends are already placed.');

console.log('');
const forward = order.filter((id) => refs(byId.get(id).args.join(',')).some((r) => order.indexOf(r) > order.indexOf(id)));
console.log(`instances referencing an id defined later in the file: ${forward.map((id) => '#' + id).join(', ')}`);
console.log('A single-pass resolver returns undefined for those. Two passes cost one extra walk.');
EOF

echo '$ node parse.js'
node parse.js

rm -rf "$WORK"
