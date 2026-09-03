# 451. Vector Tiles: Zoom-Dependent Simplification and the Feature That Disappears

## What It Is
A raster tile is a picture: the styling was decided when it was generated. A **vector tile** is the geometry, encoded as protocol buffers, styled in the client at draw time. That shift is what makes a web map restylable, queryable and interactive without a round trip, and it introduces a class of bug that raster tiles do not have.

The encoding is compact by construction. Coordinates inside a tile are integers on a local grid — 4096 units across by convention, so a coordinate is two small integers rather than two doubles — and geometry is written as a command stream of moves and lines with a zig-zag encoding for the deltas. Feature attributes are stored once in a per-layer key and value table and referenced by index, so a thousand features sharing a property name pay for that name once.

The bug lives in **generation**, not in the format. A tileset is built per zoom level, and at low zoom a road that is a metre wide on the ground is a fraction of a pixel, so the generator simplifies geometry, drops small features, and merges what remains. Every one of those is correct as a rendering decision and destructive as a data decision. The feature you queried at zoom 16 may not exist at zoom 12, and the same feature's geometry at the two zooms may not be the same shape. Attributes get dropped too, because a tileset that carries every field at every zoom is not small any more.

The consequence for anyone building on top: **a vector tile is a rendering artefact, not a data source.** Reading an attribute out of a rendered feature to drive business logic works at the zoom you tested and fails elsewhere. The tile carries an identifier; the identifier is what you look the real record up by.

```quiz
- q: "A feature is present at zoom 16 and absent at zoom 12 in the same tileset. What happened?"
  anchor: "the generator simplifies geometry, drops small features, and merges what remains"
  options:
    - text: "The tile at zoom 12 failed to build"
      correct: false
      why: "Dropping features at low zoom is what the generator is supposed to do — a metre-wide feature is a fraction of a pixel there."
    - text: "Generation dropped it, because at that zoom it is smaller than a pixel"
      correct: true
      why: "Correct as a rendering decision, destructive as a data decision — which is the whole lesson."
    - text: "The client's style has a minzoom on that layer"
      correct: false
      why: "That is a different and also-common cause, but it would leave the feature in the tile. This question is about the tile's contents."

- q: "Why should an attribute read from a vector tile not drive business logic?"
  anchor: "a vector tile is a rendering artefact, not a data source"
  options:
    - text: "Because protocol buffers cannot represent all types"
      correct: false
      why: "The encoding handles strings, numbers and booleans. The problem is what generation chose to include."
    - text: "Because generation decides per zoom what geometry and which attributes survive, so the value depends on the zoom you read it at"
      correct: true
      why: "The tile carries an identifier; look the real record up by it."
    - text: "Because tiles are cached and may be stale"
      correct: false
      why: "Staleness is real and separate. Even a perfectly fresh tile has been simplified for its zoom."
```

## Key Concepts
- **Vector tile**: geometry and attributes as protocol buffers, styled in the client rather than baked in
- **Local integer grid**: coordinates are integers across a tile extent, 4096 units by convention
- **Command stream**: geometry as move-to and line-to commands with zig-zag encoded deltas
- **Shared key/value tables**: attribute names and values stored once per layer and referenced by index
- **Generation is per zoom**: simplification, dropping and merging happen when the tileset is built
- **Geometry is not stable across zooms**: the same feature can have a different shape at each level
- **Attributes are dropped too**: carrying every field at every zoom defeats the point of the format
- **Carry an id, look up the record**: the tile identifies, the database answers

## Example Code
No runtime here: producing a tileset means running a real generator over a real dataset, which is a build step rather than something a page can execute honestly. What is worth reading is the shape of the decision the generator makes.

```json
{
  "name": "assets",
  "format": "pbf",
  "minzoom": 6,
  "maxzoom": 14,
  "vector_layers": [
    {
      "id": "asset_point",
      "minzoom": 12,
      "maxzoom": 14,
      "fields": { "asset_id": "String", "status": "String" }
    },
    {
      "id": "asset_cluster",
      "minzoom": 6,
      "maxzoom": 11,
      "fields": { "count": "Number" }
    }
  ]
}
```

Two layers, not one, because the answer at zoom 8 is a count and the answer at zoom 13 is an asset. The tileset metadata says so explicitly, which is what lets a client know when to stop asking the tile and start asking the database.

```typescript
/** What a click on a rendered feature may be trusted for. The identifier is
 *  carried through; everything else is a rendering detail that depended on
 *  the zoom the tile was generated at. */
type RenderedFeature = {
  layer: string;
  properties: Record<string, string | number | boolean>;
};

export type AssetRef = { assetId: string };

export function refFrom(feature: RenderedFeature): AssetRef | null {
  const id = feature.properties.asset_id;
  // A cluster has a count and no id: at that zoom the tileset genuinely does
  // not know which asset was clicked, and inventing one would be worse.
  return typeof id === 'string' ? { assetId: id } : null;
}
```

## When to Use
- When a map has to be restyled, filtered or interacted with in the client without regenerating imagery
- When the same underlying data is drawn several ways, since one tileset can serve all of them
- When bandwidth matters more than generation time — vector tiles are small, and building them is the expensive half
- When you need the client to know what it is looking at, which raster tiles cannot express at all

## Common Mistakes
- **Treating tile attributes as the record** — generation decided which fields survive at which zoom, so the value depends on where the user was looking
- **Assuming geometry is identical across zooms** — simplification changes it, and a coordinate read at zoom 12 is not the coordinate in the database
- **Debugging a missing feature in the style first** — check whether it is in the tile before checking why it was not drawn; those are different failures with the same symptom
- **Generating one tileset for every zoom with every attribute** — that is a database served over HTTP, and it is large, slow to build and expensive to serve
- **Ignoring the tileset's own metadata** — `minzoom`, `maxzoom` and the per-layer fields are the contract, and a client that does not read them guesses
- **Forgetting that a cluster is not a feature** — at low zoom the honest answer to "what did I click" is a count, and manufacturing an id from it is a fabrication

## Further Reading
- [Mapbox Vector Tile specification 2.1](https://github.com/mapbox/vector-tile-spec/blob/master/2.1/README.md) — the encoding, the command stream and the key/value tables
- [MapLibre style spec: sources](https://maplibre.org/maplibre-style-spec/sources/) — how a client declares a vector source and what it expects from the metadata
- [OGC standards](https://www.ogc.org/standard/geopackage/) — the standards family that formalised tiled feature delivery

```recall
- q: "What does a vector tile carry that a raster tile does not, and what does that enable?"
  must:
    - "geometry and attributes as protocol buffers, not a rendered picture"
    - "styling happens in the client at draw time"
    - "so the map can be restyled, filtered and interacted with without regenerating imagery"

- q: "Explain what tileset generation does per zoom, and why it is not a bug."
  must:
    - "it simplifies geometry, drops features too small to draw, and merges what remains"
    - "at low zoom a feature can be a fraction of a pixel"
    - "correct as a rendering decision, destructive as a data decision"

- q: "State the rule about reading data out of a vector tile."
  must:
    - "a vector tile is a rendering artefact, not a data source"
    - "which attributes and what geometry survive depends on the zoom"
    - "carry an identifier in the tile and look the real record up by it"
```
