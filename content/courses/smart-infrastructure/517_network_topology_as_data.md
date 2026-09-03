# 517. Network Topology as Data: Nodes, Edges, and Connectivity Queries

## What It Is
Infrastructure is a network: a water main feeds district meters through valves and segments, an electrical feeder supplies boards through breakers, a road network connects junctions. The questions asked of it are connectivity questions — "what is downstream of this valve", "which meters lose supply if this segment is isolated", "is there a path from the source to this point" — and none of them are answerable unless the topology is stored as **nodes and edges** rather than as a drawing.

The minimal model is two tables. A **node** table with an id, a kind (source, feeder, segment, meter) and an optional link to a canonical asset. An **edge** table with a `from_node`, a `to_node` and a relation. Direction matters: `feeds` is directed, and a query for "what is downstream" follows edges forward while "what supplies this" follows them backward. An undirected model cannot answer either without ambiguity.

Connectivity queries are recursive: `WITH RECURSIVE`, starting from the node in question and walking edges until the frontier is empty — the same shape as the asset-hierarchy walk in Lesson 505, but over a graph that can have more than one path to a node rather than a strict tree. That difference matters: a meter fed from two directions stays supplied when one segment is isolated, and a query that assumes a tree will report it as lost.

The topology-specific data-quality problem is the **dangling edge**: an edge whose `from_node` or `to_node` is not in the node table, usually because a node was deleted from one table and not the other. It is invisible on a map render and it breaks every traversal that passes through it — the walk either stops early or throws. A referential check between the two tables is cheap and belongs in the same quality gate as everything else (Lesson 519). This course's seed has exactly one, on purpose.

```quiz
- q: "Why must the edge model be directed rather than undirected?"
  anchor: "a query for \"what is downstream\" follows edges forward while \"what supplies this\" follows them backward"
  options:
    - text: "Directed graphs are faster to query"
      correct: false
      why: "Performance is not the reason. An undirected model cannot distinguish upstream from downstream at all."
    - text: "Downstream and upstream are opposite traversals of the same edges, and an undirected model cannot tell them apart"
      correct: true
      why: "\"What does this feed\" and \"what feeds this\" are the two core questions, and both need direction."
    - text: "Because SQL recursive queries require a direction column"
      correct: false
      why: "They do not. The direction is a modelling requirement, not a syntax one."

- q: "What is a dangling edge and why does it matter?"
  anchor: "an edge whose `from_node` or `to_node` is not in the node table"
  options:
    - text: "An edge with no relation type — it is ignored by queries"
      correct: false
      why: "That is a different defect. A dangling edge has a valid relation but an endpoint that does not exist."
    - text: "An edge pointing at a node that is not in the node table — invisible on a map, and it breaks any traversal passing through it"
      correct: true
      why: "Usually a node deleted from one table and not the other; a referential check between the tables catches it cheaply."
    - text: "An edge that forms a cycle in the graph"
      correct: false
      why: "Cycles are a separate concern and networks legitimately have them (a ring main)."
```

## Key Concepts
- **Infrastructure is a graph** and its questions are connectivity questions
- **Two tables**: nodes (id, kind, optional asset link) and edges (from, to, relation)
- **Edges are directed** — `feeds` forward is downstream, backward is upstream
- **Connectivity queries are recursive** — `WITH RECURSIVE` from the node, walking until the frontier empties
- **A network is a graph, not a tree** — a node can have several paths to it, and redundancy depends on that
- **A tree-assuming query mis-reports a redundantly-fed node** as lost when one path is cut
- **The dangling edge is the topology-specific defect** — an endpoint missing from the node table
- **A referential check between the two tables** finds it, and belongs in the quality gate (Lesson 519)

## Example Code
The network in this course: one source, two feeders, segments, three meters — and one deliberately broken edge.

```sql run seed=crosswalk
-- Everything downstream of feeder N-FD-1, with hop count and the path taken.
WITH RECURSIVE reach AS (
  SELECT node_id, 0 AS hops, node_id::text AS path
  FROM topo_node WHERE node_id = 'N-FD-1'
  UNION ALL
  SELECT e.to_node, r.hops + 1, r.path || ' > ' || e.to_node
  FROM topo_edge e
  JOIN reach r ON e.from_node = r.node_id
)
SELECT r.hops, r.path, n.kind, n.asset_key
FROM reach r
LEFT JOIN topo_node n ON n.node_id = r.node_id
ORDER BY r.path;
```

```sql run seed=crosswalk
-- The dangling-edge check: any edge whose endpoint is not a known node.
SELECT e.from_node, e.to_node, e.relation,
       CASE WHEN a.node_id IS NULL THEN e.from_node END AS missing_from,
       CASE WHEN b.node_id IS NULL THEN e.to_node   END AS missing_to
FROM topo_edge e
LEFT JOIN topo_node a ON a.node_id = e.from_node
LEFT JOIN topo_node b ON b.node_id = e.to_node
WHERE a.node_id IS NULL OR b.node_id IS NULL;
```

```sql run seed=crosswalk
-- "Which meters lose supply if segment N-SG-1 is isolated?" — walk down from
-- the source with that node removed, then list meters not reached.
WITH RECURSIVE supplied AS (
  SELECT node_id FROM topo_node WHERE node_id = 'N-SRC'
  UNION ALL
  SELECT e.to_node
  FROM topo_edge e
  JOIN supplied s ON e.from_node = s.node_id
  WHERE e.to_node <> 'N-SG-1'          -- the isolated node
    AND e.from_node <> 'N-SG-1'
)
SELECT n.node_id, n.kind
FROM topo_node n
WHERE n.kind = 'meter'
  AND n.node_id NOT IN (SELECT node_id FROM supplied)
ORDER BY n.node_id;
```

## When to Use
- Whenever a question is about what connects to what — isolation planning, outage impact, loss allocation, routing
- When importing a network from a GIS or a CAD drawing — the import has to produce nodes and edges, not just geometry
- When modelling redundancy — a second feed is only real if the graph records both paths
- As input to the quality gate (Lesson 519), where the dangling-edge and unreachable-node checks live

## Common Mistakes
- **Storing the network as geometry only** — a set of lines on a map cannot answer "what is downstream" without a topology built from it
- **An undirected edge model** — upstream and downstream then require heuristics, and the heuristics are wrong at every loop
- **Assuming the network is a tree** — a recursive walk that does not expect multiple paths mis-reports redundant supply
- **Ignoring dangling edges** — the traversal fails silently or partially, and the map still looks fine
- **No `hops` or visited guard on the recursion** — a ring main is a legitimate cycle and an unguarded walk loops on it
- **Deleting a node without its edges (or vice versa)** — the two tables drift, and the dangling edge is the result

## Further Reading
- [PostgreSQL: WITH RECURSIVE](https://www.postgresql.org/docs/current/queries-with.html) — the traversal mechanism, including the `CYCLE` clause for networks that legitimately loop
- [pgRouting](https://pgrouting.org/) — when connectivity becomes shortest-path and cost-weighted routing, the extension that adds it
- [OGC: Utility Network (ArcGIS) concept overview](https://www.ogc.org/standard/utilitynetwork/) — one industry model for utility topology, for comparison with a plain node/edge schema
- [Lesson 505](/courses/asset-management-systems/asset-hierarchies) — the same recursive-CTE walk over a strict tree, and why a graph with multiple paths needs more care

```recall
- q: "What is the minimal model for network topology and why must edges be directed?"
  must:
    - "a node table (id, kind, optional asset link) and an edge table (from, to, relation)"
    - "edges are directed — forward is downstream, backward is upstream"
    - "an undirected model cannot answer 'what feeds this' vs 'what does this feed'"

- q: "Why does it matter that a network is a graph rather than a tree?"
  must:
    - "a node can have more than one path to it"
    - "redundant supply depends on the graph recording both paths"
    - "a tree-assuming query mis-reports a redundantly-fed node as lost when one path is cut"

- q: "What is a dangling edge, how does it arise, and how is it found?"
  must:
    - "an edge whose from or to node is not in the node table"
    - "usually a node deleted from one table and not the other"
    - "a referential check between the two tables finds it cheaply, in the quality gate"
```
