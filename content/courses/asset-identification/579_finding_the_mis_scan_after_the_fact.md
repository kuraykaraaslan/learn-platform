# 579. Finding the Mis-Scan After the Fact

## What It Is
Lesson 577's checks run while the technician is present and catch what they can. Some wrong attributions get through anyway, and this lesson is about what is left: finding them in the data, weeks or years later, with nobody available to ask.

The first thing to accept is that **you cannot detect a mis-scan directly**. A record against the wrong asset is a well-formed record: a real asset, a real inspector, a real timestamp, a plausible value. There is no column that is wrong. Everything that follows is therefore indirect — either a *population* where the error is possible, or a *consequence* that should not have been.

The population is the more useful of the two, and it is computable from the register alone. Assets whose identifiers differ by a single character are the ones a mis-scan can plausibly confuse, and they cluster: plant rooms are built in pairs, panels are numbered in sequence, pumps come as A and B. **Knowing which pairs are confusable turns an unbounded search into a short list**, and that list is worth computing once and keeping, because it also tells you where to spend effort on tag placement and on Lesson 577's checks.

The consequence approach looks for records that could not be true: a condition score that improved with no work done, an asset serviced while it was decommissioned, two readings for one asset at the same moment from different people. These are genuinely useful and they have a property worth understanding before relying on them — **most of what they return will have an innocent explanation**, and the explanation is usually a join away. A condition score that improved because a work order was completed in between is not a finding; the same improvement with nothing recorded is.

The honest summary is that after-the-fact detection is a screen, not a test. It narrows an estate to a handful of pairs and a handful of implausible rows, and somebody then has to look. That is why every cheap check at the moment of the scan is worth more than a clever query afterwards: **the query finds candidates, the technician found facts**.

```quiz
- q: "Why can a mis-scan not be detected directly in the data?"
  anchor: "There is no column that is wrong"
  options:
    - text: "Because the record is usually deleted before analysis"
      correct: false
      why: "It is not deleted — it is indistinguishable from a correct record."
    - text: "Because it is a well-formed record: real asset, real inspector, real time, plausible value"
      correct: true
      why: "Everything after this is indirect — a population where it is possible, or a consequence that should not be."
    - text: "Because timestamps are unreliable in field capture"
      correct: false
      why: "They are recoverable (Lesson 474); the attribution is the part with no evidence."

- q: "What makes the confusable-pair population worth computing?"
  anchor: "turns an unbounded search into a short list"
  options:
    - text: "It identifies which records are wrong"
      correct: false
      why: "It identifies where a wrong record is possible, which is a much weaker and still useful claim."
    - text: "It turns an unbounded search into a short list, and shows where tag placement and scan checks should be improved"
      correct: true
      why: "The pairs cluster: plant rooms in pairs, panels in sequence, pumps as A and B."
    - text: "It is the only query that needs no history"
      correct: false
      why: "True, and incidental — the value is the narrowing."

- q: "A condition score improved with no work order recorded. What is it?"
  anchor: "most of what they return will have an innocent explanation"
  options:
    - text: "A confirmed mis-scan"
      correct: false
      why: "It is a candidate. Unrecorded work, a different inspector's judgement and a genuine improvement all explain it."
    - text: "A candidate worth looking at, after ruling out completed work in the same interval"
      correct: true
      why: "The explanation is usually one join away, which is what makes the screen usable."
    - text: "Evidence that the condition scale is being used inconsistently"
      correct: false
      why: "Possible, and one more innocent explanation to rule out."
```

## Key Concepts
- **A mis-scan cannot be detected directly** — the record is well-formed in every column
- **Two indirect routes**: the population where it is possible, and consequences that should not be
- **Confusable pairs** — identifiers differing by one character — are computable from the register alone
- **They cluster**: paired plant, sequential panels, A/B pumps
- **The list narrows an unbounded search** and shows where tagging and scan checks need attention
- **Consequence screens mostly return innocent rows** — rule out the explanation with a join before escalating
- **This is a screen, not a test** — a moment-of-scan check is worth more than a query afterwards

## Example Code
First the population, from the register alone:

```sql run seed=asset_register
-- Every pair of assets whose identifiers differ in exactly one character.
-- These are the confusions a mis-scan or a typo can produce.
WITH pairs AS (
  SELECT a.tag AS tag_a, b.tag AS tag_b
  FROM asset a
  JOIN asset b ON a.tag < b.tag AND length(a.tag) = length(b.tag)
),
scored AS (
  SELECT tag_a, tag_b,
         (SELECT COUNT(*) FROM generate_series(1, length(tag_a)) g
          WHERE substr(tag_a, g, 1) <> substr(tag_b, g, 1)) AS differing_chars
  FROM pairs
)
SELECT tag_a, tag_b
FROM scored
WHERE differing_chars = 1
ORDER BY tag_a, tag_b;
```

Five pairs, in a register this small. They are exactly the ones you would predict — the two air handling units, their two fans, their two coils, two distribution boards, and the A/B pump set. That is the estate's whole exposure to this class of error, and it is a list somebody can act on: better tag placement, different labels, or simply Lesson 577's location check configured for those systems.

Now narrow it to where a confusion actually could have happened — both assets of a pair recorded by the same person on the same visit:

```sql run seed=asset_register
-- Confusable pairs where both assets received a condition reading from the
-- same inspector on the same day. If those two records were swapped, nothing
-- in the data would say so.
WITH pairs AS (
  SELECT a.tag AS tag_a, b.tag AS tag_b
  FROM asset a
  JOIN asset b ON a.tag < b.tag AND length(a.tag) = length(b.tag)
),
confusable AS (
  SELECT tag_a, tag_b FROM (
    SELECT tag_a, tag_b,
           (SELECT COUNT(*) FROM generate_series(1, length(tag_a)) g
            WHERE substr(tag_a, g, 1) <> substr(tag_b, g, 1)) AS differing_chars
    FROM pairs
  ) s WHERE differing_chars = 1
)
SELECT c.tag_a, c.tag_b, ra.inspector, ra.observed_on,
       ra.score AS score_a, rb.score AS score_b
FROM confusable c
JOIN condition_reading ra ON ra.asset_tag = c.tag_a
JOIN condition_reading rb ON rb.asset_tag = c.tag_b
     AND rb.inspector = ra.inspector
     AND rb.observed_on = ra.observed_on
ORDER BY ra.observed_on;
```

One row, and it is not evidence of anything: two pumps, one inspector, one day, scores of 3 and 2. Nothing here says the records were swapped. What the query establishes is that **if they had been, this estate contains no other signal that would show it** — and that is the finding. It tells you where the data cannot defend itself, which is where the effort at scan time belongs.

## When to Use
- Once per estate, to compute the confusable-pair list and act on it — it is cheap and it does not change often
- After a tagging or re-tagging exercise, where a new numbering scheme can create pairs that did not exist (Lesson 580)
- When a value looks wrong for one asset and right for its neighbour, which is the shape of the human report
- When condition or maintenance history is about to feed a decision, where a wrong attribution has been believed
- As a periodic screen, understanding that it produces candidates for a person rather than findings

## Common Mistakes
- **Looking for the mis-scan directly** — there is no column that is wrong
- **Treating screen output as findings** — most of it has an innocent explanation one join away
- **Skipping the join that explains it** — a condition improvement with a completed work order is not a candidate
- **Computing confusable pairs and not acting on them** — the list's value is in tag placement and scan checks
- **Assuming a clean screen means clean data** — it means the data contains no signal, which is different
- **Relying on this instead of Lesson 577** — a query finds candidates; the technician found facts

## Further Reading
- [Lesson 508](/courses/asset-management-systems/work-orders-and-maintenance-history) — the maintenance history that explains most of what a consequence screen returns
- [Lesson 569](/courses/condition-monitoring/labels-come-from-maintenance-history) — the same absence of ground truth, one domain over
- [Lesson 577](/courses/asset-identification/the-scan-that-fails-and-the-scan-that-lies) — the checks that make this lesson's job smaller
- [Lesson 515](/courses/smart-infrastructure/identity-resolution-across-systems) — reconciling identifiers across systems, where the same confusable pairs cause different damage
- [Lesson 573](/courses/asset-identification/what-goes-on-the-tag) — where confusable identifiers come from, and the moment they can still be changed

```recall
- q: "Why is a mis-scan undetectable directly?"
  must:
    - "the record is well-formed: a real asset, a real inspector, a real timestamp and a plausible value"
    - "no column is wrong"
    - "so detection is indirect -- a population where it is possible, or a consequence that should not be"

- q: "What is the confusable-pair population and why compute it?"
  must:
    - "pairs of assets whose identifiers differ by a single character"
    - "it is computable from the register alone and turns an unbounded search into a short list"
    - "and it shows where tag placement and moment-of-scan checks should be improved"

- q: "How should the output of a consequence screen be treated?"
  must:
    - "as candidates rather than findings -- most rows have an innocent explanation"
    - "rule out the explanation with a join first, such as a completed work order in the interval"
    - "and a clean screen means the data contains no signal, not that the data is correct"
```
