# 453. MapLibre: Style Spec, Sources, and the Client-Side Budget

## What It Is
A MapLibre style is a **JSON document**, not a program. It declares `sources` — where data comes from — and `layers` — how to draw it, each naming exactly one source. That is nearly the whole model, and its being a document is what makes the interesting questions answerable without a browser: how many layers are live at the zoom people actually use, which source layer is drawn more than once, what is declared and never drawn.

Those questions are the client-side budget. A style's cost is not the number of layers in the file; it is the number **active at the current zoom**, because a layer outside its `minzoom`/`maxzoom` range is not drawn at all. A style with forty layers of which eight are live at zoom 14 costs eight. A style with twelve layers all live everywhere costs twelve, everywhere. Zoom ranges are the main lever, and they are one field.

The second lever is how often the same source layer is drawn. The casing-plus-fill pattern that gives roads an outline draws the same geometry twice by design, and that is a legitimate two-layer cost for one visual result. Knowing which pairs are deliberate and which are accidental duplicates is a question about the graph, and the graph is in the file.

There is no map rendered in this lesson. MapLibre is a browser library with WebGL underneath: a self-contained snippet cannot import it, and shipping a runnable one would mean a runtime this site has not verified. The style spec's **data model** is the part that transfers anyway — the performance mistakes people actually make are declared in the document, not written in JavaScript.

```quiz
- q: "What determines a style's cost at a given moment?"
  anchor: "the number **active at the current zoom**"
  options:
    - text: "The total number of layers in the style"
      correct: false
      why: "A layer outside its zoom range is not drawn. The total is an upper bound and often a loose one."
    - text: "The number of layers whose zoom range includes the current zoom"
      correct: true
      why: "Which makes minzoom and maxzoom the main lever, and each is one field."
    - text: "The number of sources, since each is a network connection"
      correct: false
      why: "Sources matter for fetching; layers are what gets drawn, and one source can back many layers."

- q: "A style declares a source that no layer references. What is that?"
  anchor: "what is declared and never drawn"
  options:
    - text: "Harmless — an unused source is not fetched"
      correct: false
      why: "Whether it is fetched depends on the source type and the implementation, and either way it is a claim in the document that nothing honours."
    - text: "A structural defect worth reporting: something is declared that nothing draws"
      correct: true
      why: "It is exactly the kind of thing reading the graph finds and reading the map never does."
    - text: "A base layer, drawn implicitly"
      correct: false
      why: "There is no implicit drawing in the spec. A layer draws, or nothing does."
```

## Key Concepts
- **A style is a document**: version, `sources`, `layers`, and nothing that executes
- **Source**: where data comes from — a vector tileset, a GeoJSON blob, a raster tileset
- **Layer**: how to draw it, naming exactly one source and, for vector sources, one `source-layer`
- **`minzoom` / `maxzoom` on a layer**: the main cost lever, and one field each
- **Active layer count**: the layers whose zoom range includes the current zoom — the number that costs
- **Casing and fill**: two layers over one source layer, drawing the same geometry twice on purpose
- **Structural defects are readable**: a layer with a missing source, a source nothing draws, a `source-layer` that is not in the tileset
- **The style does not carry the data**: what a layer can draw is decided by the tileset (lesson 451), not by the style

## Example Code
Walking the graph and counting the budget — no map, no browser, no library:

```typescript run
// from, layers say how to draw it, and every layer names exactly one source.
// That graph is what a budget is counted against, and it can be read without a
// browser or a map.
type Source = { type: 'vector' | 'geojson' | 'raster'; url?: string; maxzoom?: number };

type Layer = {
  id: string;
  type: 'fill' | 'line' | 'symbol' | 'circle' | 'raster' | 'background';
  source?: string;
  'source-layer'?: string;
  minzoom?: number;
  maxzoom?: number;
};

type Style = { version: 8; sources: Record<string, Source>; layers: Layer[] };

const STYLE: Style = {
  version: 8,
  sources: {
    basemap: { type: 'vector', url: 'https://example.invalid/tiles.json', maxzoom: 14 },
    assets: { type: 'geojson' },
    orthophoto: { type: 'raster', maxzoom: 19 },
  },
  layers: [
    { id: 'bg', type: 'background' },
    { id: 'imagery', type: 'raster', source: 'orthophoto', minzoom: 15 },
    { id: 'landuse', type: 'fill', source: 'basemap', 'source-layer': 'landuse' },
    { id: 'roads-casing', type: 'line', source: 'basemap', 'source-layer': 'road' },
    { id: 'roads', type: 'line', source: 'basemap', 'source-layer': 'road' },
    { id: 'buildings', type: 'fill', source: 'basemap', 'source-layer': 'building', minzoom: 14 },
    { id: 'asset-dots', type: 'circle', source: 'assets' },
    { id: 'asset-labels', type: 'symbol', source: 'assets', minzoom: 16 },
    { id: 'orphan', type: 'line', source: 'missing-source' },
  ],
};

/** Layers whose zoom range includes z — the count that actually costs
 *  something, because a layer outside its range is not drawn at all. */
function activeAt(style: Style, z: number): Layer[] {
  return style.layers.filter((l) => z >= (l.minzoom ?? 0) && z < (l.maxzoom ?? 24));
}

const problems: string[] = [];
for (const layer of STYLE.layers) {
  if (layer.type === 'background') continue;
  if (!layer.source) problems.push(`${layer.id}: no source`);
  else if (!(layer.source in STYLE.sources)) problems.push(`${layer.id}: source "${layer.source}" is not declared`);
}
const usedSources = new Set(STYLE.layers.map((l) => l.source).filter(Boolean));
for (const name of Object.keys(STYLE.sources)) {
  if (!usedSources.has(name)) problems.push(`source "${name}" is declared but no layer draws it`);
}

console.log(`${STYLE.layers.length} layers, ${Object.keys(STYLE.sources).length} sources`);
console.log('');
console.log('active layers by zoom:');
for (const z of [0, 10, 14, 15, 16, 18]) {
  const active = activeAt(STYLE, z);
  console.log(`  z${String(z).padStart(2)}  ${String(active.length).padStart(2)}   ${active.map((l) => l.id).join(', ')}`);
}
console.log('');

// Two layers, one source-layer, drawn twice — the casing/fill pattern that
// doubles the work for a road network without adding a source.
const bySourceLayer = new Map<string, string[]>();
for (const l of STYLE.layers) {
  if (!l['source-layer']) continue;
  const key = `${l.source}/${l['source-layer']}`;
  bySourceLayer.set(key, [...(bySourceLayer.get(key) ?? []), l.id]);
}
console.log('drawn more than once from the same source layer:');
for (const [key, ids] of bySourceLayer) {
  if (ids.length > 1) console.log(`  ${key}  ->  ${ids.join(', ')}`);
}
console.log('');

console.log(problems.length === 0 ? 'no structural problems' : 'structural problems:');
for (const p of problems) console.log(`  ! ${p}`);
console.log('');
console.log('None of that needed a map to be rendered. A style is a document with a graph in');
console.log('it, and the questions that decide client cost — how many layers are live at the');
console.log('zoom people actually use, which source-layer is drawn twice, what is declared');
console.log('and never drawn — are all answerable by reading it.');
```

## When to Use
- When a map is slow and you need to know what is actually being drawn at the zoom where it is slow
- When reviewing a style, where the graph questions are mechanical and the visual ones are not
- When a layer does not appear and you need to distinguish "not in the tile" (lesson 451) from "not in the style" from "outside its zoom range"
- When generating styles programmatically, where a structural check belongs in the build rather than in someone's eye

## Common Mistakes
- **Counting layers rather than active layers** — the number that costs is the one whose zoom range includes where the user is
- **Leaving `minzoom` off a detail layer** — it then draws at every zoom, including the ones where it is a fraction of a pixel and invisible
- **Debugging a missing feature in the style first** — check the tile, then the style, then the zoom range; three failures, one symptom
- **Naming a `source-layer` that the tileset does not have** — the layer draws nothing and reports nothing, and only the tileset metadata says so
- **Duplicating a layer instead of using two paint properties** — sometimes correct, as with casing and fill, and often just an accidental double draw
- **Treating the style as the place to fix a data problem** — if generation dropped the feature, no amount of styling brings it back

## Further Reading
- [MapLibre style specification](https://maplibre.org/maplibre-style-spec/) — the document format, versioned, with every property listed
- [MapLibre style spec: layers](https://maplibre.org/maplibre-style-spec/layers/) — layer types, `minzoom`/`maxzoom`, and what each paint property costs
- [MapLibre style spec: sources](https://maplibre.org/maplibre-style-spec/sources/) — source types and the metadata a client reads from each
- [Mapbox Vector Tile specification 2.1](https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md) — the other half of the contract, since a `source-layer` names something in the tile

```recall
- q: "Describe the MapLibre style data model in one sentence, and say why it matters that it is a document."
  must:
    - "sources say where data comes from; layers say how to draw it, each naming exactly one source"
    - "it is JSON, not code"
    - "so the budget questions can be answered by reading it, without a browser"

- q: "What is the client-side budget actually counting?"
  must:
    - "layers whose zoom range includes the current zoom"
    - "a layer outside its minzoom/maxzoom is not drawn at all"
    - "so zoom ranges are the main lever, and each is one field"

- q: "Name three structural defects a style graph walk can find."
  must:
    - "a layer whose source is not declared"
    - "a source no layer draws"
    - "the same source layer drawn more than once — deliberate for casing and fill, accidental otherwise"
```
