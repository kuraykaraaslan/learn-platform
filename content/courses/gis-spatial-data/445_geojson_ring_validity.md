# 445. GeoJSON: Ring Winding, Closed Rings, and Invalid Geometry

## What It Is
GeoJSON is the format spatial data arrives in when it arrives over HTTP, and it is deceptively easy: JSON, a `type`, a `coordinates` array. What makes it worth a lesson is that **the rules a polygon has to obey are not expressible in JSON Schema**, so every validator in the usual toolchain accepts geometry that is broken.

A polygon is an array of linear rings. The first is the exterior ring; the rest are holes. RFC 7946 requires each ring to be **closed** — the last position repeats the first — which means a triangle has four positions, not three. It also requires a **winding order**: exterior rings counterclockwise, interior rings clockwise, following the right-hand rule. And it forbids a ring from crossing itself.

Winding matters because it is the only thing distinguishing an outline from a hole when both trace the same corners. A renderer that follows the spec will draw a clockwise exterior ring as a hole in nothing; a renderer that ignores winding draws it fine, which is worse, because the file passes through your system looking correct and fails in someone else's. The check is the shoelace formula: sum the cross products of consecutive positions and look at the sign. Twenty lines, no dependency.

Two more things the spec is explicit about and toolchains routinely get wrong: positions are `[longitude, latitude]` (Lesson 442), and the coordinate reference system is **always** WGS 84 geographic — RFC 7946 removed the `crs` member that earlier drafts had. A GeoJSON file with projected coordinates in it is not GeoJSON, whatever the extension says.

```quiz
- q: "A triangle in GeoJSON has how many positions in its ring?"
  anchor: "the last position repeats the first"
  options:
    - text: "Three — one per corner"
      correct: false
      why: "The ring must be closed, so the first position is repeated at the end."
    - text: "Four — three corners plus the repeat that closes the ring"
      correct: true
      why: "Closure is a requirement, not a convention, and a three-position ring is invalid."
    - text: "Either, since the closure is implied"
      correct: false
      why: "RFC 7946 requires it explicitly. A reader that infers it is being lenient, and the next reader may not be."

- q: "What does the winding order of a ring decide?"
  anchor: "the only thing distinguishing an outline from a hole when both trace the same corners"
  options:
    - text: "Which way the renderer draws the outline stroke"
      correct: false
      why: "Stroke direction is invisible. What winding decides is what the ring means."
    - text: "Whether it is an outline or a hole — the same corners in the other order mean the opposite"
      correct: true
      why: "Exterior rings are counterclockwise and interior rings clockwise; the sign of the signed area is the whole test."
    - text: "Nothing — the array position decides, since the first ring is always exterior"
      correct: false
      why: "The array position says which ring is which; the winding is a separate requirement, and a conforming reader uses it."
```

## Key Concepts
- **Linear ring**: a closed line string — the last position repeats the first, so a triangle has four positions
- **Exterior then interiors**: a polygon's first ring is the outline, the rest are holes
- **Winding order**: exterior counterclockwise, interior clockwise, per RFC 7946's right-hand rule
- **Shoelace formula**: the signed area of a ring; its sign is the winding, and it costs one pass
- **A degenerate ring has zero area**: collinear or duplicated positions, which is valid JSON and not a polygon
- **Always WGS 84**: RFC 7946 fixed the reference system and removed the `crs` member; projected coordinates in a `.geojson` file are a lie the format cannot express
- **`[longitude, latitude]`**: the order, restated because it is the other half of every GeoJSON bug
- **JSON Schema cannot express any of this** — which is why "it validated" says nothing about the geometry

## Example Code
The whole check, on four rings — one correct outline, one correct hole, and two of the failures:

```typescript run
type Position = [number, number];
type Ring = Position[];

/** Twice the signed area of a ring (the shoelace formula). Positive is
 *  counterclockwise, which RFC 7946 §3.1.6 asks for on an exterior ring. */
function signedArea(ring: Ring): number {
  let sum = 0;
  for (let i = 0; i < ring.length - 1; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[i + 1];
    sum += x1 * y2 - x2 * y1;
  }
  return sum / 2;
}

const isClosed = (ring: Ring) =>
  ring.length > 0 && ring[0][0] === ring[ring.length - 1][0] && ring[0][1] === ring[ring.length - 1][1];

type Problem = { ring: string; problem: string };

function checkRing(name: string, ring: Ring, kind: 'exterior' | 'interior'): Problem[] {
  const out: Problem[] = [];
  if (!isClosed(ring)) out.push({ ring: name, problem: 'not closed — the last position must repeat the first' });
  // A closed ring has 4 positions minimum: three corners plus the repeat.
  if (ring.length < 4) out.push({ ring: name, problem: `only ${ring.length} positions — a closed ring needs at least 4` });
  const area = signedArea(ring);
  if (area === 0) out.push({ ring: name, problem: 'zero area — the positions are collinear or duplicated' });
  const wound = area > 0 ? 'counterclockwise' : 'clockwise';
  const want = kind === 'exterior' ? 'counterclockwise' : 'clockwise';
  if (area !== 0 && wound !== want) {
    out.push({ ring: name, problem: `${kind} ring is ${wound}, RFC 7946 asks for ${want}` });
  }
  return out;
}

const exterior: Ring = [
  [0, 0],
  [2, 0],
  [2, 2],
  [0, 2],
  [0, 0],
];
// The same four corners in the other direction — this is the hole.
const hole: Ring = [
  [0.5, 0.5],
  [0.5, 1.5],
  [1.5, 1.5],
  [1.5, 0.5],
  [0.5, 0.5],
];
// The bug: an exterior ring digitised the wrong way round.
const reversed: Ring = [...exterior].reverse();
const unclosed: Ring = exterior.slice(0, -1);

for (const [name, ring, kind] of [
  ['exterior', exterior, 'exterior'],
  ['hole', hole, 'interior'],
  ['reversed', reversed, 'exterior'],
  ['unclosed', unclosed, 'exterior'],
] as const) {
  const area = signedArea(ring);
  const problems = checkRing(name, ring, kind);
  console.log(`${name.padEnd(9)} signed area ${area.toFixed(2).padStart(7)}   ${problems.length === 0 ? 'ok' : ''}`);
  for (const p of problems) console.log(`          ! ${p.problem}`);
}

console.log('');
console.log('`exterior` and `reversed` trace the same four corners. The sign of the area is');
console.log('the only thing that says which is an outline and which would be read as a hole.');
console.log('');
console.log('JSON.parse accepts all four. A JSON Schema that checks "array of arrays of two');
console.log('numbers" accepts all four. Winding and closure are not expressible there.');
```

## When to Use
- When accepting GeoJSON from anywhere you do not control — an upload, a partner API, an export from a desktop tool
- When producing GeoJSON, where getting winding right at the source saves every downstream consumer from guessing
- When a polygon renders as a hole, renders inverted, or covers the whole world — the classic winding signatures
- When a spatial predicate returns the opposite of what you expect, since an inverted ring inverts every containment test built on it

## Common Mistakes
- **Relying on JSON Schema validation** — it can check that positions are pairs of numbers and nothing beyond that; closure, winding and self-intersection are all outside what it can say
- **Emitting a three-position triangle** — the ring is unclosed, and lenient readers hide it until a strict one does not
- **Ignoring winding because "the renderer copes"** — some do, and the file then leaves your system looking fine and breaks in the next one
- **Putting projected coordinates in a `.geojson` file** — RFC 7946 fixes the system as WGS 84 geographic and deleted the member that used to let a file say otherwise
- **Assuming a ring with zero area is harmless** — it is a valid JSON array and not a polygon, and it will make a containment test return something arbitrary
- **Checking only the exterior ring's winding** — holes have the opposite requirement, and a hole wound the same way as its outline is the second most common form of this bug

## Further Reading
- [RFC 7946 — The GeoJSON Format](https://datatracker.ietf.org/doc/html/rfc7946) — sections 3.1.6 on polygons and 3.1.1 on positions, both short and worth reading whole
- [OGC Simple Features (SFA)](https://www.ogc.org/standard/geopackage/) — the wider standards family whose validity rules GeoJSON's are a subset of
- [PostGIS: ST_Intersects](https://postgis.net/docs/manual-3.4/ST_Intersects.html) — what a predicate does with a ring, and why an inverted one inverts the answer

```recall
- q: "Name the two structural requirements RFC 7946 puts on a linear ring."
  must:
    - "it must be closed — the last position repeats the first, so a triangle has four positions"
    - "winding order: exterior counterclockwise, interior clockwise"
    - "and it must not cross itself"

- q: "How do you check winding, and what does the answer mean?"
  must:
    - "the shoelace formula — the signed area of the ring"
    - "positive is counterclockwise, which is what an exterior ring needs"
    - "the same corners in the other order would be read as a hole"

- q: "What does GeoJSON fix about the coordinate reference system, and why does it matter?"
  must:
    - "it is always WGS 84 geographic"
    - "RFC 7946 removed the crs member earlier drafts had"
    - "a file with projected coordinates cannot say so and is not GeoJSON"
```
