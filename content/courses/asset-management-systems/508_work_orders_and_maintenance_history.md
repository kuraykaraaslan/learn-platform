# 508. Work Orders and Maintenance History: The Anti-Join That Finds Neglect

## What It Is
A work order is one record of one intervention: which asset, what kind (planned or corrective), when it was raised, when it was completed. Accumulated over years, the work-order table is the maintenance history, and almost every useful question about it is a question about **which assets are missing from it**.

That is the anti-join. "Show me every asset with a completed PPM this year" is a normal join and it produces a list somebody feels good about. "Show me every asset with **no** PPM this year" is a `LEFT JOIN ... WHERE work_order.wo_id IS NULL`, and it produces the list that matters — because a query that starts `FROM work_order` can only ever see assets that already have activity. Neglect is an absence, and an absence is invisible to any query built from the presence side.

The anti-join has one hard problem: **most of the NULLs are not neglect**. A site row has no work order and never should. A system and a subsystem are groupings, not maintainable units. A filter bank on run-to-failure is a deliberate NULL. The query is only useful once it is filtered down to *maintainable, in-service assets above a criticality threshold* — and even then the output is a review list, not an alarm. In this course's register the filtered anti-join surfaces two criticality-5 components with no work order of any kind — a booster pump and a fire-water tank: not groupings, not run-to-failure, just missed.

The second question is staleness rather than absence: an asset that had a PPM two years ago and nothing since. That is `MAX(completed_on)` per asset compared against a policy interval, which is the same anti-join with a date predicate instead of a NULL check. Both are cheap to run weekly and neither gets run unless someone builds it, because nothing in a CMMS's default screens shows you what is not there.

```quiz
- q: "Why can't a query starting FROM work_order find neglected assets?"
  anchor: "a query that starts `FROM work_order` can only ever see assets that already have activity"
  options:
    - text: "Because the work_order table is usually too large to scan"
      correct: false
      why: "Size is not the issue. The issue is that the table only contains assets that have work orders."
    - text: "Because it can only return assets that appear in that table, and a neglected asset by definition does not"
      correct: true
      why: "The anti-join has to start FROM asset and LEFT JOIN, then keep the rows where the join found nothing."
    - text: "Because work orders do not store the asset tag"
      correct: false
      why: "They do — that is the join key. The problem is which side of the join you start from."

- q: "What makes a raw 'assets with no work order' anti-join almost useless without filtering?"
  anchor: "most of the NULLs are not neglect"
  options:
    - text: "The query is too slow to run on a real register"
      correct: false
      why: "It is cheap. The problem is the output, not the runtime."
    - text: "Sites, systems, subsystems and run-to-failure assets are all legitimate NULLs, so the raw list is mostly noise"
      correct: true
      why: "It has to be filtered to maintainable, in-service assets above a criticality threshold before the remaining rows are worth a review."
    - text: "Work orders raised but not completed are missed"
      correct: false
      why: "A real concern for a different query. It does not explain why the raw anti-join is noisy."
```

## Key Concepts
- **A work order is one intervention** — asset, type, raised date, completed date
- **The work-order table is the maintenance history** once it has years in it
- **The useful questions are anti-joins** — which assets are *missing* from the history
- **`LEFT JOIN work_order ... WHERE wo_id IS NULL`** is the shape; `FROM work_order` can never answer it
- **Most NULLs are legitimate** — sites, systems, subsystems, run-to-failure assets
- **Filter to maintainable, in-service, above a criticality threshold** before the list means anything
- **The output is a review list, not an alarm**
- **Staleness is the same query with a date predicate** — `MAX(completed_on)` against a policy interval
- **Nothing runs these by default** — a CMMS shows you what happened, not what did not

## Example Code
The raw anti-join first, to see the noise:

```sql run seed=asset_register
-- Every asset with no work order, ever. Most of this is not neglect.
SELECT a.tag, a.asset_class, a.criticality, a.status
FROM asset a
LEFT JOIN work_order w ON w.asset_tag = a.tag
WHERE w.wo_id IS NULL
ORDER BY a.criticality DESC, a.tag;
```

```sql run seed=asset_register
-- The same anti-join, filtered to what a reviewer should actually look at:
-- a maintainable unit (component-level), in service, and critical enough that
-- a missing PPM is a finding.
SELECT a.tag, a.name, a.criticality
FROM asset a
LEFT JOIN work_order w ON w.asset_tag = a.tag
WHERE w.wo_id IS NULL
  AND a.asset_class = 'component'
  AND a.status = 'in-service'
  AND a.criticality >= 4
ORDER BY a.criticality DESC, a.tag;
```

```sql run seed=asset_register
-- Staleness rather than absence: the last completed PPM per component, and how
-- long ago that was. A NULL last_ppm means it has never had one. Compare
-- months_since against the organisation's policy interval for that asset class.
SELECT a.tag,
       a.criticality,
       max(w.completed_on) FILTER (WHERE w.wo_type = 'PPM') AS last_ppm,
       (DATE '2024-10-01' - max(w.completed_on) FILTER (WHERE w.wo_type = 'PPM')) / 30 AS months_since
FROM asset a
LEFT JOIN work_order w ON w.asset_tag = a.tag
WHERE a.asset_class = 'component' AND a.status = 'in-service'
GROUP BY a.tag, a.criticality
ORDER BY months_since DESC NULLS FIRST, a.criticality DESC;
```

```sql run seed=asset_register
-- The corrective-to-planned ratio per asset: a high CM count against a low PPM
-- count is an asset that is being run to failure by accident rather than by
-- decision.
SELECT a.tag,
       count(*) FILTER (WHERE w.wo_type = 'PPM') AS ppm,
       count(*) FILTER (WHERE w.wo_type = 'CM')  AS cm
FROM asset a
JOIN work_order w ON w.asset_tag = a.tag
GROUP BY a.tag
HAVING count(*) FILTER (WHERE w.wo_type = 'CM') > 0
ORDER BY cm DESC, ppm;
```

## When to Use
- As a weekly or monthly scheduled report — the anti-join and the staleness query, filtered, into a review queue
- After a handover, to check that every asset the register received has been brought into a maintenance schedule
- When a critical asset fails unexpectedly, to ask whether it was on the missing-PPM list beforehand
- When auditing a CMMS migration — assets whose history did not come across show up here as false neglect, which is its own finding

## Common Mistakes
- **Reporting from the work-order table** — every number is about assets that already get attention, and the neglected ones are structurally absent
- **Running the anti-join unfiltered** — the list is 80% sites, systems and run-to-failure assets, and the real findings drown
- **Treating the output as an alarm** — a missing PPM has many innocent explanations; the list is where a human starts looking
- **Ignoring `NULL` in the staleness query** — an asset that has *never* had a PPM sorts differently from one that had one long ago, and `NULLS FIRST` is deliberate
- **Comparing `MAX(completed_on)` without a `wo_type` filter** — a corrective repair is not a planned service, and counting it as one hides a gap
- **No policy interval to compare against** — "months since last PPM" is only a finding relative to what that asset class is supposed to get

## Further Reading
- [PostgreSQL: FILTER clause and aggregate expressions](https://www.postgresql.org/docs/current/sql-expressions.html#SYNTAX-AGGREGATES) — the `count(*) FILTER (WHERE ...)` form these queries lean on
- [Use The Index, Luke: anti-joins and NOT EXISTS](https://use-the-index-luke.com/sql/where-clause/null/not-null) — how the planner handles `IS NULL` after a `LEFT JOIN` and when `NOT EXISTS` is clearer
- [buildingSMART COBie documentation](https://www.thenbs.com/knowledge/what-is-cobie) — the handover data whose completeness the post-handover anti-join checks
- [SAE JA1011 scope — RCM criteria](https://www.sae.org/standards/content/ja1011_200908/) — where a planned-maintenance interval is supposed to come from, so "months since last PPM" has a policy number to be measured against
- [Marginal Cost of Ownership / P-F interval (reliability literature overview)](https://en.wikipedia.org/wiki/Reliability-centered_maintenance) — why a rising corrective-to-planned ratio is a signal and not just noise

```recall
- q: "What is the anti-join for finding neglect, and why is the direction of the join essential?"
  must:
    - "LEFT JOIN from asset to work_order, keeping rows where wo_id IS NULL"
    - "a query FROM work_order can only return assets that already have activity"
    - "neglect is an absence, invisible to the presence side"

- q: "Why is the raw anti-join output mostly noise, and how is it made useful?"
  must:
    - "sites, systems, subsystems and run-to-failure assets are all legitimate NULLs"
    - "filter to maintainable (component), in-service, above a criticality threshold"
    - "and treat the result as a review list, not an alarm"

- q: "How does the staleness query differ from the absence query?"
  must:
    - "MAX(completed_on) filtered to PPM, per asset"
    - "compared against a policy interval instead of checked for NULL"
    - "an asset that never had a PPM (NULL) is ranked first"
```
