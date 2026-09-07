# 569. Labels Come From Maintenance History, and You Probably Do Not Have Them

## What It Is
Every claim about predicting a failure rests on the same foundation, and it is worth saying plainly before any of them is evaluated: **you cannot tell whether an indicator predicts a failure without a record of failures**. Not a record of visits, not a record of work orders raised — a record of what was actually found, against which asset, at a known time. That record is the **label**, and this lesson is about the fact that most organisations do not have one.

The reasons are ordinary rather than negligent. A work order says a technician attended and closed it; the free-text note says "adjusted and tested"; nothing in the row distinguishes a bearing that was about to seize from a belt that was slightly loose. The failure that mattered was often fixed during a routine visit and recorded as routine. And the asset with the most interesting history is frequently the one with no history at all — because it is not on a maintenance schedule, which is why nobody has been looking at it.

That last case is testable, and it is the same anti-join Lesson 508 uses to find neglect, asked in a different direction. There it answered *which assets are we not maintaining*. Here it answers *which assets can we not learn anything about* — and on the data in this course, the answer is the one asset that is actually degrading.

The consequences are worth stating without softening. Without labels you cannot compute how often an indicator was right, you cannot compare two indicators, and you cannot support a claim about how much warning a scheme gives. What you *can* still do is considerable: detect deviation from an asset's own history (Lesson 564), rank assets by how far they have moved, and give a technician a better place to start than the schedule. That is a real product, and it is not prediction. **The honest position is to build the deviation product now and start capturing labels today**, because the labels needed to evaluate anything in two years are the ones written down this month.

Capturing them is cheap and almost never done: on the work order, one structured field for what was found and one for whether the asset had actually failed or was going to. Not free text. A closed list somebody can group by.

```quiz
- q: "What is a label, in the sense this lesson uses it?"
  anchor: "a record of what was actually found, against which asset, at a known time"
  options:
    - text: "The alert that was raised, with its indicator value"
      correct: false
      why: "That is the prediction. The label is what turned out to be true."
    - text: "A record of what was actually found, against a known asset at a known time"
      correct: true
      why: "Without it there is nothing to score a prediction against."
    - text: "The asset's condition score from the last inspection"
      correct: false
      why: "Closer, but a periodic judgement is not a record of a failure event (Lesson 507)."

- q: "Why does a complete work-order history often still fail as a label source?"
  anchor: "recorded as routine"
  options:
    - text: "Work orders are usually deleted after a year"
      correct: false
      why: "Retention is a separate problem; the issue is what the rows contain."
    - text: "The rows say someone attended and closed it, not what was found — and real failures are often fixed during routine visits and recorded as routine"
      correct: true
      why: "Free text like 'adjusted and tested' cannot be grouped or counted."
    - text: "The timestamps are unreliable"
      correct: false
      why: "Timing matters, but the missing content is the harder gap."

- q: "What can you honestly build without labels?"
  anchor: "That is a real product, and it is not prediction"
  options:
    - text: "Nothing useful — labels are a prerequisite for any monitoring"
      correct: false
      why: "Deviation detection needs no labels at all and is genuinely valuable."
    - text: "Deviation from each asset's own history, a ranking of how far each has moved, and a better starting point than the schedule"
      correct: true
      why: "It is a real product; what it is not is prediction, and the difference should be stated."
    - text: "A failure prediction with a wider confidence interval"
      correct: false
      why: "A wider interval on an unvalidated claim is still an unvalidated claim."
```

## Key Concepts
- **A label is what was actually found**, against a known asset, at a known time — not a visit and not a work order
- **Most maintenance histories are not label sources**: "attended and closed", free text, no structured finding
- **Real failures get fixed during routine visits** and recorded as routine
- **The most interesting asset often has no history**, because nothing put it on a schedule (Lesson 508's anti-join)
- **Without labels**: no accuracy, no comparison between indicators, no defensible warning-time claim
- **With no labels you can still detect deviation and rank assets** — a real product that is not prediction
- **Start capturing today**: one structured "what was found" field and one "had it failed" field, from a closed list

## Example Code
The anti-join, pointed at the question of what can be learned rather than what is neglected:

```sql run seed=condition_history
-- Which assets produce telemetry and have no maintenance record at all?
-- For those, no indicator can ever be scored, however good it looks.
SELECT t.asset_id,
       COUNT(*)                 AS readings,
       MIN(t.measured_at)::date AS first_reading,
       MAX(t.measured_at)::date AS last_reading
FROM asset_telemetry t
LEFT JOIN maintenance_event m ON m.asset_id = t.asset_id
WHERE m.asset_id IS NULL
GROUP BY t.asset_id
ORDER BY t.asset_id;
```

One asset comes back, and it is `AHU-02` — the one whose vibration has been climbing since day twenty-five in every query in this course. The asset with the clearest signal is the asset with nothing to check it against, and that is not a coincidence in this seed: it is the usual case. Nothing put it on a schedule, so nobody wrote anything down about it, so it also has no history to learn from.

Now look at what the recorded history does contain for everything else:

```sql run seed=condition_history
-- Every event we do have. Ask of each row: could this be used as a label --
-- did something fail, or was it about to?
SELECT asset_id, occurred_at::date AS occurred, kind
FROM maintenance_event
ORDER BY occurred_at;
```

Five rows across three assets. Two are planned services, which say nothing about condition. One is a sensor being re-seated — a data problem, not a machine problem, and a row that would poison a training set if it were treated as a failure. One is a bearing replacement, which is the closest thing here to a real label, and even it does not record whether the bearing had failed or was replaced on schedule. **The one genuinely informative row in the table is ambiguous**, and this is a small, tidy dataset written for a lesson.

## When to Use
- At the start of any predictive-maintenance conversation, where "what would the label be?" is the question that settles scope
- Before promising an accuracy figure, since accuracy is undefined without labels
- When designing a work-order form, where two extra structured fields decide whether anything can be learned in two years
- When choosing which assets to instrument, where an asset with maintenance history is worth more than one without
- When a vendor presents a validated model, where the useful question is which labels it was validated against

## Common Mistakes
- **Treating a work order as a failure record** — it records an attendance, not a finding
- **Mining free text for findings** — "adjusted and tested" is not a category and cannot be counted
- **Treating every event as a failure** — a sensor re-seat in the label set teaches the model to predict data problems
- **Assuming the labels will be there later** — they are only there if a field was added before the work happened
- **Selling deviation detection as prediction** — the first is real and useful; the second needs evidence nobody has
- **Instrumenting the asset with no history first** — it is the most interesting and the least evaluable

## Further Reading
- [Lesson 508](/courses/asset-management-systems/work-orders-and-maintenance-history) — the anti-join this lesson reuses, and what a work-order history is normally for
- [Lesson 511](/courses/asset-management-systems/handover-data) — where an asset's record begins, and what is missing from it on day one
- [Lesson 507](/courses/asset-management-systems/condition-and-criticality) — the periodic condition score, which is a judgement rather than a failure record
- [Lesson 570](/courses/condition-monitoring/remaining-useful-life) — what may and may not be claimed once the label problem is understood
- [Lesson 568](/courses/condition-monitoring/the-alert-you-can-defend) — the caught fraction in the cost arithmetic, which is the input labels would justify

```recall
- q: "What is a label and why is a work order usually not one?"
  must:
    - "a label is a record of what was actually found, against a known asset at a known time"
    - "a work order records that someone attended and closed it, often in free text"
    - "and real failures are frequently fixed during routine visits and recorded as routine"

- q: "Why is the asset with the clearest signal often the one with no labels?"
  must:
    - "it has no maintenance history because nothing put it on a schedule"
    - "so nobody has been looking at it or writing anything down"
    - "the anti-join that finds neglect also finds what cannot be learned from"

- q: "What can be built honestly without labels, and what cannot?"
  must:
    - "deviation from each asset's own history, and a ranking of how far each has moved -- a real product"
    - "not prediction: no accuracy figure, no comparison of indicators, no warning-time claim"
    - "and start capturing structured findings now, because evaluation in two years needs the rows written this month"
```
