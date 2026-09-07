# 565. Features Over Windows: What the Window Length Decides

## What It Is
A single reading is almost never the thing you want to watch. It carries the machine's state, the moment's load, the sensor's noise and whatever the transport did to it, all summed into one number. A **feature** separates them by aggregating over a window: a mean, a peak, a spread, a rate of change, a count of excursions. Which feature you compute matters. **How long the window is matters more, and it is the decision people skip.**

The window length sets what the feature can and cannot see, and the trade is strict. A short window follows the machine closely and inherits its noise, so it moves for reasons that have nothing to do with condition. A long window smooths the noise away and delays every real change by roughly half its length — a seven-day mean cannot tell you about something that started on Tuesday until Friday. There is no length that avoids both, and choosing one is choosing which error you would rather have.

Two window shapes exist and they answer different questions. A **tumbling** window partitions time into non-overlapping blocks — hourly means, daily peaks — which is what storage and reporting want, because each reading belongs to exactly one block. A **sliding** window recomputes at every reading over the last N, which is what monitoring wants, because it responds as soon as the data does. Systems usually need both, and using a tumbling window where a sliding one belongs is why some monitors only notice things on the hour.

There is a constraint from further up the pipeline that has to be respected here: **the feature can only be as good as what survived storage**. Lesson 488's downsampling and Lesson 481's edge aggregation both discard detail, and a peak-based feature computed on data that was averaged before it arrived is measuring the averaging, not the machine. If a feature needs peaks, the peaks have to survive the trip — which is a decision made at the device, months before anyone asks for the feature.

```quiz
- q: "What does a longer feature window buy, and what does it cost?"
  anchor: "delays every real change by roughly half its length"
  options:
    - text: "It buys accuracy and costs storage"
      correct: false
      why: "Storage is barely affected; the cost is in time."
    - text: "It smooths noise and delays every real change by about half the window"
      correct: true
      why: "A seven-day mean cannot report something that started on Tuesday until Friday."
    - text: "It buys sensitivity to short events"
      correct: false
      why: "That is what a short window buys, along with the noise that comes with it."

- q: "When is a sliding window the right shape rather than a tumbling one?"
  anchor: "which is what monitoring wants"
  options:
    - text: "When storing aggregates for reporting"
      correct: false
      why: "Reporting wants tumbling windows, where each reading belongs to exactly one block."
    - text: "When monitoring, because it recomputes at every reading and responds as soon as the data does"
      correct: true
      why: "Using a tumbling window here is why some monitors only notice things on the hour."
    - text: "When the data arrives irregularly"
      correct: false
      why: "Irregular arrival affects both shapes equally; the difference is response time."

- q: "A peak-based feature is computed on stored data and behaves oddly. What should you check first?"
  anchor: "the feature can only be as good as what survived storage"
  options:
    - text: "Whether the window is too long"
      correct: false
      why: "Worth checking, but it would smooth the peak rather than remove it."
    - text: "Whether the data was averaged or downsampled before storage, which destroys peaks"
      correct: true
      why: "Then the feature measures the averaging, not the machine (Lessons 488 and 481)."
    - text: "Whether the sensor is calibrated"
      correct: false
      why: "Calibration shifts values (Lesson 534); it does not remove peaks."
```

## Key Concepts
- **A feature aggregates a window** — mean, peak, spread, rate of change, excursion count
- **Window length is the decision that matters most** and is the one most often skipped
- **Short window**: follows the machine, inherits its noise, moves for non-condition reasons
- **Long window**: smooths noise, delays every real change by about half the window
- **Tumbling windows** partition time — for storage and reporting, each reading in exactly one block
- **Sliding windows** recompute per reading — for monitoring, responding as soon as the data does
- **A feature cannot recover what storage discarded** — peaks need peaks to have survived (Lessons 488, 481)

## Example Code
The same asset, the same forty-five days, three views: the raw reading, a 24-hour sliding mean, and a 7-day sliding mean.

```sql run seed=condition_history
-- One sample per week at midday, so the three columns can be read side by side.
WITH windowed AS (
  SELECT measured_at,
         vibration_mm_s AS raw,
         AVG(vibration_mm_s) OVER (ORDER BY measured_at
                                   ROWS BETWEEN 23 PRECEDING AND CURRENT ROW)  AS avg_24h,
         AVG(vibration_mm_s) OVER (ORDER BY measured_at
                                   ROWS BETWEEN 167 PRECEDING AND CURRENT ROW) AS avg_7d
  FROM asset_telemetry
  WHERE asset_id = 'AHU-02'
)
SELECT measured_at::date       AS day,
       ROUND(raw, 3)           AS raw,
       ROUND(avg_24h, 3)       AS avg_24h,
       ROUND(avg_7d, 3)        AS avg_7d
FROM windowed
WHERE EXTRACT(hour FROM measured_at) = 12
  AND EXTRACT(day FROM measured_at) % 7 = 1
ORDER BY day;
```

Read the three columns down. The raw midday value wanders by more than a tenth from week to week for reasons that are not condition — it is one sample, at one moment, on a machine with a daily cycle. The 24-hour mean is calmer and still moves with the cycle's weekly component. The 7-day mean is flat for the first month and then climbs steadily, and it is the only column in which the degradation is unambiguous.

That is the trade, stated in one table: the column that shows the trend most clearly is also the column that would have taken about three days to notice it. Neither is wrong. Which one belongs in the alert and which belongs on the chart is a decision about how long you are willing to wait, and it should be recorded as one.

## When to Use
- Whenever a raw reading is about to be compared with a threshold — the feature belongs in between
- When choosing what to alert on, where the window length is the response-time budget in disguise
- When a monitor is noisy, since a longer window is usually cheaper than a cleverer rule
- When a monitor is slow to notice real changes, where the window is usually the reason
- Before relying on peaks or transients, which requires checking what the storage path preserved (Lesson 488)

## Common Mistakes
- **Alerting on raw samples** — every transient becomes an event, which is Lesson 482's problem arriving early
- **Choosing a window by habit** — "hourly" is a storage convention, not a statement about the machine
- **Using one window for everything** — detection and reporting have different tolerances for delay
- **Computing peaks on averaged data** — the feature measures the averaging (Lessons 488, 481)
- **Tumbling where sliding belongs** — the monitor then reacts on block boundaries rather than on data
- **Not recording the window with the indicator** — a number whose window is unknown cannot be compared to last month's

## Further Reading
- [PostgreSQL documentation: window functions](https://www.postgresql.org/docs/current/tutorial-window.html) — the frame clause that defines a sliding window, and how `ROWS` differs from `RANGE`
- [Lesson 488](/courses/digital-twin-engineering/downsampling-without-lying) — what each downsampling method destroys, and therefore which features stay computable
- [Lesson 481](/courses/iot-telemetry-edge/edge-processing) — aggregation performed on the device, before the data has a chance to reach a window
- [Lesson 477](/courses/iot-telemetry-edge/time-series-schema) — retention and rollups: the storage decisions that decide which windows remain possible

```recall
- q: "What does the length of a feature window decide?"
  must:
    - "how much noise is smoothed away against how long a real change takes to appear"
    - "a long window delays a change by roughly half its length"
    - "there is no length that avoids both errors, so choosing one chooses which error you accept"

- q: "What is the difference between a tumbling and a sliding window?"
  must:
    - "tumbling partitions time into non-overlapping blocks -- each reading belongs to exactly one"
    - "sliding recomputes at every reading over the last N"
    - "storage and reporting want tumbling; monitoring wants sliding, or it only reacts on block boundaries"

- q: "Why can a feature be limited by decisions made months earlier?"
  must:
    - "downsampling and edge aggregation discard detail before storage"
    - "a peak-based feature computed on averaged data measures the averaging, not the machine"
    - "if a feature needs peaks, the peaks must survive the transport and storage path"
```
