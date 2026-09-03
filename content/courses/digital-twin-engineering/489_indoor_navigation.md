# 489. Indoor Navigation: A Routing Graph from IFC Spaces and Doors

## What It Is
This is where model data stops being a description and becomes an application. An IFC model already contains everything a router needs: the spaces are in the spatial structure of Lesson 434, and the doors between them are relationships. Turn spaces into nodes and doors into edges and you have a routing graph — no geometry, no viewer, and nothing rendered.

**No map is drawn in this lesson.** The graph is taught as data, because that is what it is and because the questions worth asking of it are all data questions. Visualisation is left where Lesson 453 left it: a style spec is a document, a graph is a graph, and neither needs a canvas to be reasoned about.

Two facts about such a graph are invisible on a floor plan and are the reason this lesson exists.

The first is **directionality**. A door with a self-closing latch and no handle on the inside is a *directed* edge, and almost every graph built from a door list is built undirected because the door table has two space ids and no direction column. The result routes someone out of a plant room through a door that does not open from that side. The route is short, plausible, and the person is locked in.

The second is **connectivity**. A space that exists in the model with no door modelled against it is unreachable, and a router reports "no route" without saying why. That is not a routing failure — it is a **model defect**, and the difference matters because one is fixed in code and the other is fixed by whoever drew the building. Distinguishing them is a query, and it is the check worth running on every model you receive.

Both checks need only the spaces and the doors. That is the argument for treating this as data: neither needs geometry, a render, or a human looking at a plan.

```quiz
- q: "A route is computed out of a plant room through a self-closing door. What went wrong?"
  anchor: "almost every graph built from a door list is built undirected"
  options:
    - text: "The cost on that edge was too low"
      correct: false
      why: "The cost is fine. The edge should not have existed in that direction at all."
    - text: "The graph was built undirected, so a one-way door became a two-way edge"
      correct: true
      why: "The door table has two space ids and usually no direction column, so undirected is the default and it is wrong."
    - text: "The door was modelled in the wrong space"
      correct: false
      why: "It is modelled correctly. What is missing is the fact that it only opens one way."

- q: "A router returns 'no route' to a space that is clearly on the plan. Whose problem is it?"
  anchor: "it is a **model defect**"
  options:
    - text: "The router's — it should find a way through"
      correct: false
      why: "There is no way through in the data. A router that invents one is worse."
    - text: "The model's — a space with no door relationship is unreachable, and that is fixed by whoever drew the building"
      correct: true
      why: "Which is why distinguishing the two is worth a query rather than a debugging session."
    - text: "Neither — some spaces are legitimately sealed"
      correct: false
      why: "True of a few, and it means the model should say so explicitly rather than by omission."
```

## Key Concepts
- **Spaces are nodes, doors are edges** — the graph is already in the model (Lesson 434)
- **No render**: the graph is data, and every question here is a data question (Lesson 453)
- **Edge cost** comes from the space centroids, so it is derived rather than guessed
- **Directionality**: a one-way door is a directed edge, and undirected is the wrong default
- **The door table usually has no direction column**, which is why the default is wrong
- **Connectivity**: a space with no door relationship is unreachable
- **"No route" has two causes** — a graph with no path, and a model with no door
- **One is a code fix and the other is a model fix**, and telling them apart is a query
- **Both checks need only spaces and doors** — no geometry at all

## Example Code
The graph, and the two questions, in plain TypeScript:

```typescript run
// nodes are IFC spaces; the edges are the door relationships between them. No
// geometry, no render — just a graph, and two facts about it that a floor plan
// cannot show you.
type Edge = { to: string; costM: number };
type Graph = Map<string, Edge[]>;

type DoorRelation = {
  from: string;
  to: string;
  costM: number;
  /** False for a door that opens one way. Building the graph undirected is the
   *  default, and it is wrong for at least one door in every building. */
  bidirectional: boolean;
};

// A corridor spine with rooms off it, a stair at one end and a lift at the
// other — the shape of one floor plate, cut down so it fits on a screen.
const DOORS: DoorRelation[] = [
  { from: 'stair-01', to: 'corr-01', costM: 5, bidirectional: true },
  { from: 'corr-01', to: 'corr-02', costM: 4, bidirectional: true },
  { from: 'corr-02', to: 'corr-03', costM: 4, bidirectional: true },
  { from: 'corr-01', to: 'room-001', costM: 6, bidirectional: true },
  { from: 'room-001', to: 'room-002', costM: 5, bidirectional: true },
  { from: 'corr-02', to: 'room-003', costM: 6, bidirectional: true },
  { from: 'corr-03', to: 'lift-01', costM: 5, bidirectional: true },
  // A self-closing door with no handle on the inside.
  { from: 'lift-01', to: 'plant-01', costM: 4, bidirectional: false },
];
// A space that exists in the model and has no door modelled against it.
const ISOLATED = 'riser-01';
const SPACES = [
  'stair-01', 'corr-01', 'corr-02', 'corr-03', 'room-001', 'room-002', 'room-003',
  'lift-01', 'plant-01', ISOLATED,
];

function buildGraph(doors: DoorRelation[], spaces: string[]): Graph {
  const g: Graph = new Map(spaces.map((s) => [s, []]));
  for (const d of doors) {
    g.get(d.from)!.push({ to: d.to, costM: d.costM });
    // The whole content of the `bidirectional` flag. Dropping this condition
    // is the bug, and the graph it produces is more connected than the
    // building is.
    if (d.bidirectional) g.get(d.to)!.push({ to: d.from, costM: d.costM });
  }
  return g;
}

type Route = { path: string[]; costM: number } | null;

/** Dijkstra. A linear scan for the nearest unvisited node rather than a heap:
 *  a floor plate is tens of spaces, and the clearer loop is worth more here
 *  than the asymptotics. */
function shortestPath(graph: Graph, from: string, to: string): Route {
  const dist = new Map<string, number>([[from, 0]]);
  const prev = new Map<string, string>();
  const unvisited = new Set(graph.keys());

  while (unvisited.size > 0) {
    let current: string | null = null;
    let best = Infinity;
    for (const node of unvisited) {
      const d = dist.get(node) ?? Infinity;
      if (d < best) {
        best = d;
        current = node;
      }
    }
    // Everything still unvisited is unreachable from `from`. Stopping here
    // rather than continuing is what lets the caller be told "no route"
    // instead of being handed an infinite cost.
    if (current === null || best === Infinity) break;
    if (current === to) break;
    unvisited.delete(current);

    for (const edge of graph.get(current) ?? []) {
      const candidate = best + edge.costM;
      if (candidate < (dist.get(edge.to) ?? Infinity)) {
        dist.set(edge.to, candidate);
        prev.set(edge.to, current);
      }
    }
  }

  if ((dist.get(to) ?? Infinity) === Infinity) return null;
  const path = [to];
  while (path[0] !== from) path.unshift(prev.get(path[0])!);
  return { path, costM: dist.get(to)! };
}

const graph = buildGraph(DOORS, SPACES);
const undirected = buildGraph(DOORS.map((d) => ({ ...d, bidirectional: true })), SPACES);

const show = (r: Route) => (r === null ? 'no route' : `${r.costM} m via ${r.path.join(' -> ')}`);

console.log('routes on the graph the model actually describes:');
for (const [from, to] of [
  ['stair-01', 'room-002'],
  ['stair-01', 'plant-01'],
  ['plant-01', 'stair-01'],
  ['stair-01', ISOLATED],
] as const) {
  console.log(`  ${from} -> ${to.padEnd(9)}  ${show(shortestPath(graph, from, to))}`);
}
console.log('');

console.log('the same two questions on a graph built undirected:');
for (const [from, to] of [['plant-01', 'stair-01'], ['stair-01', ISOLATED]] as const) {
  console.log(`  ${from} -> ${to.padEnd(9)}  ${show(shortestPath(undirected, from, to))}`);
}
console.log('');
console.log('The undirected graph routes someone OUT of the plant room through a door with');
console.log('no handle on that side. The route is short, plausible, and the person is stuck.');
console.log('');
console.log(`And ${ISOLATED} is unreachable on both, because the model has no door against it.`);
console.log('That is not a routing failure — it is a model defect, and the difference matters:');
console.log('one is fixed in code and the other is fixed by whoever drew the building.');
console.log('');

// The check worth running on delivery, which is a graph question rather than a
// geometry one.
const unreachable = SPACES.filter((s) => s !== 'stair-01' && shortestPath(graph, 'stair-01', s) === null);
const oneWay = DOORS.filter((d) => !d.bidirectional);
console.log('model checks:');
console.log(`  spaces unreachable from the stair core: ${unreachable.join(', ') || 'none'}`);
console.log(`  one-way doors: ${oneWay.map((d) => `${d.from} -> ${d.to}`).join(', ') || 'none'}`);
console.log('');
console.log('Both are answerable from the spaces and doors alone. Neither needs geometry, a');
console.log('viewer, or anything rendered — which is why this lesson has a graph and no map.');
```

The same graph in the database, where the shortest path is a recursive CTE. Forty spaces from one floor plate, with the two defects in them:

```sql run seed=indoor_graph
-- The graph as the model gave it: 40 spaces, 38 door and opening relationships.
SELECT usage, count(*) AS spaces FROM space_node GROUP BY usage ORDER BY spaces DESC;

-- Every edge, in both directions where the door allows it. This view is the
-- one a router walks, and building it is where the `bidirectional` column
-- either gets honoured or quietly ignored.
CREATE VIEW traversable AS
  SELECT from_space, to_space, cost_m FROM space_edge
  UNION ALL
  SELECT to_space, from_space, cost_m FROM space_edge WHERE bidirectional;

SELECT count(*) AS directed_arcs FROM traversable;
```

Seventy-five directed arcs from thirty-eight relationships — every bidirectional door counted twice, and the one-way door counted once. That difference is the `bidirectional` column doing its job.

```sql run seed=indoor_graph
-- Which spaces can be reached from the stair core, and at what cost. A
-- recursive CTE is Postgres's shortest-path: the `path` array is what stops it
-- looping, and `cost_m` accumulates along the way.
WITH RECURSIVE reachable AS (
  SELECT 'stair-01'::text AS space_id, 0::double precision AS cost_m, ARRAY['stair-01']::text[] AS path
  UNION ALL
  SELECT t.to_space, r.cost_m + t.cost_m, r.path || t.to_space
  FROM reachable r
  JOIN traversable t ON t.from_space = r.space_id
  WHERE NOT t.to_space = ANY (r.path)
)
SELECT space_id, round(min(cost_m)::numeric, 1) AS shortest_m
FROM reachable
GROUP BY space_id
ORDER BY shortest_m, space_id
LIMIT 12;
```

And the two model checks, as queries you can run on delivery:

```sql run seed=indoor_graph
-- The query that finds the first defect: a space with no edge at all. This is
-- the check worth running on every model you receive, because a floor plan
-- does not show it and a router only reports "no route".
SELECT n.space_id, n.name, n.usage
FROM space_node n
LEFT JOIN space_edge e ON e.from_space = n.space_id OR e.to_space = n.space_id
WHERE e.from_space IS NULL
ORDER BY n.space_id;

-- And the second: every one-way door. Each of these is a place where a route
-- computed on an undirected graph would send someone through a door that does
-- not open from the other side.
SELECT from_space, to_space, via, cost_m
FROM space_edge
WHERE NOT bidirectional
ORDER BY from_space;
```

## When to Use
- Wayfinding, evacuation planning, and asset access routing — the applications the graph exists for
- On model delivery, where both checks are cheap and catch defects a plan review does not
- When a route is wrong rather than missing, where directionality is the first thing to look at
- When deciding what to model, since a door that is not in the model is a door the router does not have

## Common Mistakes
- **Building the graph undirected** — the door table has no direction column, so this is the default, and it is wrong for at least one door in every building
- **Treating "no route" as a routing bug** — it is usually a model defect, and the two are fixed by different people
- **Guessing edge costs** — the space centroids give a real distance, and a constant per door makes a longer corridor look the same as a short one
- **Skipping the connectivity check on delivery** — an unreachable space is invisible on a plan and shows up as a support ticket months later
- **Rendering the graph to check it** — both defects are found by querying, and a picture of forty spaces will not show either
- **Routing between spaces without modelling the doors as spaces' relationships** — a graph built from adjacency rather than from doors routes through walls

## Further Reading
- [IfcRelSpaceBoundary](https://ifc43-docs.standards.buildingsmart.org/IFC/RELEASE/IFC4x3/HTML/lexical/IfcRelSpaceBoundary.htm) — how a space's boundaries, including the openings in them, are related in IFC
- [IndoorGML (OGC)](https://www.ogc.org/standard/indoorgml/) — a standard built specifically for indoor navigation graphs, worth comparing against one derived from IFC
- [PostgreSQL `WITH` queries](https://www.postgresql.org/docs/current/queries-with.html) — recursive CTEs, and the cycle-detection the path array provides
- [Dijkstra's algorithm](https://en.wikipedia.org/wiki/Dijkstra%27s_algorithm) — the algorithm the snippet implements, and where A\* differs when a heuristic is available

```recall
- q: "How does an IFC model already contain a routing graph?"
  must:
    - "spaces from the spatial structure are the nodes"
    - "door relationships between them are the edges"
    - "edge cost comes from the space centroids"

- q: "State the directionality problem and why it is the default."
  must:
    - "a self-closing door with no inside handle is a directed edge"
    - "the door table has two space ids and usually no direction column"
    - "so the graph is built undirected and routes people out through doors that do not open"

- q: "'No route' has two causes. Name them and say why the distinction matters."
  must:
    - "a graph with no path, and a model with no door modelled against a space"
    - "the first is a code fix and the second is a model fix"
    - "and both are answerable by query, with no geometry"
```
