# 505. Asset Hierarchies: Recursive Trees, Materialised Paths, and the Weekly Query

## What It Is
The register is a tree: a site contains systems, a system contains subsystems, a subsystem contains components. The parent field from Lesson 504 is the only thing that stores this, and almost every non-trivial question asked of the register is a question about a **subtree** — "everything under the water system", "the criticality of every component below this AHU", "which board feeds this breaker".

There are two ways to store the tree and they trade the same way they do anywhere. An **adjacency list** — each row holds its parent's tag — is trivial to write and to keep correct, and every subtree query is a recursive `WITH RECURSIVE` walk. A **materialised path** — each row also stores `ST-NORTH/SYS-WATER/PMP-SET-01/PMP-1001A` as a string — makes the subtree query a single `LIKE 'prefix%'` with no recursion, and makes a move expensive: relocating one subsystem rewrites the path of everything beneath it.

The **weekly query** is the one that decides which you pick. If the recurring report is "give me the state of everything under system X" and it runs often enough to notice, the materialised path earns its keep. If the tree changes shape regularly — assets re-parented as the site is re-surveyed — the adjacency list's cheap writes matter more, and you pay the recursion each read. Most registers start as an adjacency list and add a path column later, populated by a trigger or a nightly job, once the read cost is real rather than imagined.

The failure that is specific to trees is the **cycle**: asset A's parent is B, B's parent is A, usually from a bulk re-parenting script that did not check. An adjacency-list recursive query without a depth guard or a visited set runs forever; a materialised path built over a cycle either loops in the builder or produces a path that contains a tag twice. Either storage needs a constraint that the parent chain terminates at a row with no parent.

```quiz
- q: "When does a materialised path column earn its cost over a plain adjacency list?"
  anchor: "If the recurring report is \"give me the state of everything under system X\" and it runs often enough to notice"
  options:
    - text: "Always — recursion is slow and should be avoided"
      correct: false
      why: "Recursion over a few thousand rows is cheap. The path only pays off when subtree reads are frequent and the tree is fairly stable."
    - text: "When subtree reads are frequent and the tree does not change shape often, so the write cost of maintaining the path is rare"
      correct: true
      why: "The path turns a recursive read into a prefix scan, at the cost of rewriting descendants' paths on every move."
    - text: "When the tree is more than four levels deep"
      correct: false
      why: "Depth barely affects the recursive query. Read frequency and tree stability are what decide it."

- q: "What does an adjacency-list recursive query do when the parent data contains a cycle?"
  anchor: "An adjacency-list recursive query without a depth guard or a visited set runs forever"
  options:
    - text: "It returns an empty result"
      correct: false
      why: "It does not detect the cycle to return empty — it keeps expanding the frontier."
    - text: "Without a depth guard or a cycle check, it never terminates"
      correct: true
      why: "Each iteration re-discovers the same rows through the cycle. Postgres has a CYCLE clause; you have to use it."
    - text: "Postgres rejects the query at plan time"
      correct: false
      why: "The query is valid SQL. Nothing about the plan knows the data loops."
```

## Key Concepts
- **Almost every register question is a subtree question** — "everything under X"
- **Adjacency list**: parent tag per row; cheap writes, recursive reads
- **Materialised path**: a `site/system/subsystem/component` string per row; prefix-scan reads, expensive moves
- **The weekly query decides** — a frequent subtree report justifies the path; a frequently re-shaped tree justifies the list
- **Start as a list, add a path column later** when the read cost is measured rather than assumed
- **Cycles are the tree-specific failure** — a bulk re-parent with no check, and an unguarded recursion runs forever
- **`WITH RECURSIVE` needs a `CYCLE` clause or a depth cap** — the data will not police itself
- **Depth in a real register tops out around six** — Site, System, Subsystem, Component, plus room for two more

## Example Code
The tree, walked with a recursive CTE. The base case is the subtree root; each step joins children onto the frontier, carrying a depth counter and a path string as it goes:

```sql run seed=asset_register
-- Everything under the water system, with depth and a built path. This is the
-- "weekly query" — run it against SYS-HVAC-B2 or SYS-ELEC by changing one tag.
WITH RECURSIVE subtree AS (
  SELECT tag, name, parent_id, asset_class, criticality,
         0 AS depth, tag::text AS path
  FROM asset
  WHERE tag = 'SYS-WATER'
  UNION ALL
  SELECT a.tag, a.name, a.parent_id, a.asset_class, a.criticality,
         s.depth + 1, s.path || '/' || a.tag
  FROM asset a
  JOIN subtree s ON a.parent_id = s.tag
)
SELECT repeat('  ', depth) || tag AS tree, asset_class, criticality, path
FROM subtree
ORDER BY path;
```

```sql run seed=asset_register
-- The aggregate the report actually wants: for each system, how many
-- components sit anywhere beneath it and how critical the worst one is.
WITH RECURSIVE descendants AS (
  SELECT tag AS root, tag, asset_class, criticality
  FROM asset WHERE parent_id = 'ST-NORTH'
  UNION ALL
  SELECT d.root, a.tag, a.asset_class, a.criticality
  FROM asset a JOIN descendants d ON a.parent_id = d.tag
)
SELECT root AS system,
       count(*) FILTER (WHERE asset_class = 'component') AS components,
       max(criticality) AS worst_case
FROM descendants
GROUP BY root
ORDER BY worst_case DESC, system;
```

```sql run seed=asset_register
-- The cycle guard. Postgres's CYCLE clause stops the walk the moment it
-- revisits a tag, and flags the row where it happened. On clean data (this
-- seed) is_cycle is false everywhere; on a bad re-parent it is your only warning.
WITH RECURSIVE walk AS (
  SELECT tag, parent_id, 1 AS depth FROM asset WHERE parent_id IS NULL
  UNION ALL
  SELECT a.tag, a.parent_id, w.depth + 1
  FROM asset a JOIN walk w ON a.parent_id = w.tag
) CYCLE tag SET is_cycle USING trail
SELECT max(depth) AS deepest_level, bool_or(is_cycle) AS any_cycle FROM walk;
```

The same tree as the register carries it — decomposition edges, with the functional-location tag recorded on each component in the `AMS_AssetTag` property set so a viewer and the register agree on identity:

```spatial
title: "One system's subtree, as the register stores it"
ask: "The report 'every component under SYS-WATER' runs weekly. Which stored field turns it from a recursive walk into a single prefix scan, and what does maintaining that field cost when a subsystem is re-parented?"
reveal: "each row also stores `ST-NORTH/SYS-WATER/PMP-SET-01/PMP-1001A` as a string"
root:
  id: "ST-NORTH"
  type: IfcSite
  name: "North Campus"
  children:
    - id: "SYS-WATER"
      type: IfcSystem
      name: "Domestic Water"
      rel: aggregates
      children:
        - id: "PMP-SET-01"
          type: IfcDistributionSystem
          name: "Booster Pump Set 01"
          rel: aggregates
          children:
            - id: "PMP-1001A"
              type: IfcPump
              name: "Booster Pump 1001A"
              rel: aggregates
              flag: focus
              props:
                - set: AMS_AssetTag
                  name: FunctionalLocation
                  value: "PMP-1001A"
                - set: AMS_AssetTag
                  name: Serial
                  value: "SN-P-55019"
            - id: "PMP-1001B"
              type: IfcPump
              name: "Booster Pump 1001B"
              rel: aggregates
              props:
                - set: AMS_AssetTag
                  name: FunctionalLocation
                  value: "PMP-1001B"
            - id: "PRV-1001"
              type: IfcValve
              name: "Pressure Reducing Valve 1001"
              rel: aggregates
              props:
                - set: AMS_AssetTag
                  name: FunctionalLocation
                  value: "PRV-1001"
        - id: "TNK-01"
          type: IfcTank
          name: "Break Tank 01"
          rel: aggregates
```

## When to Use
- Whenever a report is scoped to "under" something — a system, a building, a board — which is most asset reports
- When deciding storage for a new register: adjacency list unless a subtree read is already known to be hot
- After any bulk re-parenting operation, to run the cycle check before trusting the next report
- When a register's subtree queries have become the slow part of a dashboard, as the trigger to add and backfill a path column

## Common Mistakes
- **A recursive CTE with no cycle clause and no depth cap** — correct on clean data and an infinite loop the first time a re-parent script makes a mistake
- **Materialised paths kept by hand** — they drift the moment one move is done directly in the database, and nothing flags the drift
- **Re-parenting a subtree by updating only the top node's parent** — with a path column, every descendant's path is now wrong until it is rebuilt
- **Storing depth as a column and trusting it** — it is derived, and it goes stale on the same moves the path does
- **Assuming the tree is shallow enough to left-join a fixed number of times** — a four-join query breaks silently when someone adds a fifth level
- **No constraint that the parent chain ends** — a row whose parent is itself passes every column check and breaks every recursive read

## Further Reading
- [PostgreSQL: WITH Queries (Common Table Expressions)](https://www.postgresql.org/docs/current/queries-with.html) — the `RECURSIVE` and `CYCLE` syntax, with the search-order and cycle-detection sections
- [Managing Hierarchical Data in MySQL](https://mikehillyer.com/articles/managing-hierarchical-data-in-mysql/) — the classic write-up of adjacency list vs nested set vs path, storage-engine-agnostic
- [SQL Antipatterns, "Naive Trees"](https://pragprog.com/titles/bksqla/sql-antipatterns/) — the chapter on why adjacency-list-only schemas hurt and the alternatives
- [PostgreSQL: `ltree` module](https://www.postgresql.org/docs/current/ltree.html) — a purpose-built materialised-path type with its own operators and GiST indexing, if the register lives in Postgres and moves are rare

```recall
- q: "Contrast the adjacency list and the materialised path for storing the register tree."
  must:
    - "adjacency list: each row holds its parent tag — cheap writes, recursive subtree reads"
    - "materialised path: each row also holds a path string — prefix-scan reads, expensive moves"
    - "a move under a path rewrites every descendant's path"

- q: "What is the 'weekly query' and how does it decide the storage choice?"
  must:
    - "the recurring subtree report — 'the state of everything under system X'"
    - "if it runs often and the tree is stable, the materialised path pays off"
    - "if the tree is re-shaped often, the adjacency list's cheap writes win"

- q: "How does a cycle get into the parent data and what does it do to a recursive read?"
  must:
    - "usually a bulk re-parenting script that did not check"
    - "an unguarded recursive CTE never terminates — it re-discovers the same rows"
    - "Postgres's CYCLE clause or a depth cap is the fix"
```
