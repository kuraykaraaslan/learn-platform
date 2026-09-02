# 142. Capacity Planning & Back-of-Envelope Estimation

## What It Is
Back-of-envelope estimation is quick, explicit arithmetic from a small number of stated assumptions to a rough but directionally correct answer — "roughly how many requests per second," "roughly how much storage will this grow by in a year" — done *before* writing code or provisioning infrastructure, not as a substitute for measuring the real thing once it exists. The value isn't precision; it's catching an order-of-magnitude mistake (assuming 10K users when the actual number is 10M) while it's still a five-minute conversation instead of a production incident.

The standard shape is: start from a known or estimated business number (daily active users, orders per day), multiply by an assumed action rate to get a baseline load, then apply a peak multiplier (traffic isn't uniform across the day — a 3-5x peak-to-average ratio is a common starting assumption, refined with real data once available), and separately estimate storage growth as rows-per-day × average-row-size × retention period. The discipline that makes this useful — as opposed to a comforting but meaningless number — is writing the assumptions down explicitly, so anyone reviewing it can point at exactly which assumption they disagree with, rather than the estimate being unreviewable.

## Key Concepts
- **QPS estimation**: (daily active users) × (actions per user per day) ÷ 86,400 seconds ≈ average QPS
- **Peak vs average**: real traffic isn't uniform — apply a peak multiplier (commonly 3-5x as a starting assumption) to size for the worst realistic moment, not the average
- **Storage growth**: rows/day × average row size × retention period — the input to deciding when partitioning (#45) or archival actually becomes necessary
- **Read:write ratio**: drives whether caching (#20) or read replicas (#11) are worth the complexity — a 100:1 read-heavy system and a 1:1 system need very different architectures
- **Stated assumptions over false precision**: round numbers, and write down every assumption — an estimate nobody can review or challenge isn't useful

## Example Code
```typescript run
// Not "real" code — this is the actual deliverable: an explicit, reviewable calculation
// with every assumption stated, so a reviewer can challenge any single line.

const assumptions = {
  dailyActiveUsers: 500_000,
  actionsPerUserPerDay: 10,
  peakMultiplier: 5,          // stated assumption: peak is ~5x average, refine with real data later
  avgRowSizeBytes: 500,
  retentionDays: 365,
};

const totalActionsPerDay = assumptions.dailyActiveUsers * assumptions.actionsPerUserPerDay;
const avgQps = totalActionsPerDay / 86_400;
const peakQps = avgQps * assumptions.peakMultiplier;

const storageGrowthBytesPerYear =
  totalActionsPerDay * assumptions.avgRowSizeBytes * assumptions.retentionDays;

console.log({
  avgQps: avgQps.toFixed(1),                 // ~58 QPS average
  peakQps: peakQps.toFixed(1),                // ~290 QPS peak — this is the number to provision for
  storageGrowthGbPerYear: (storageGrowthBytesPerYear / 1e9).toFixed(1), // ~913 GB/year
});
```

The standard shape from What It Is, made arithmetic: a business number, an
action rate, a peak multiplier, and storage as rows × row size × retention.
The point is not the output — it is that every assumption is a field someone
reviewing this can disagree with by name.

```calc
inputs:
  - { id: dau, label: "Daily active users", type: number, default: 10000, min: 0, step: 1000 }
  - { id: actions, label: "Actions per user per day", type: number, default: 20, min: 0 }
  - { id: peak, label: "Peak-to-average multiplier", type: number, default: 4, min: 1 }
  - { id: row_bytes, label: "Average row size (bytes)", type: number, default: 500, min: 0, step: 50 }
  - { id: retention, label: "Retention (days)", type: number, default: 365, min: 0 }
outputs:
  - { label: "Average requests per second", expr: "dau * actions / 86400", format: number }
  - { label: "Peak requests per second", expr: "dau * actions * peak / 86400", format: number }
  - { label: "Rows retained", expr: "dau * actions * retention", format: number }
  - { label: "Storage at retention (GB)", expr: "dau * actions * retention * row_bytes / 1000000000", format: number }
```

Note how little the average RPS moves the design and how much the peak does —
that gap is the reason the multiplier is written down as its own assumption
rather than folded into the action rate. A 3-5x peak-to-average ratio is a
starting assumption, not a measurement; replace it with real data as soon as
there is any.

## When to Use
- System design discussions — ground the conversation in numbers before debating architecture
- Deciding whether a specific piece of complexity (sharding #12, a read replica #11, a cache #20) is justified yet, or premature for the actual scale
- Provisioning ahead of a known event (a launch, a marketing campaign) — size for the estimated peak, not the current average

## Common Mistakes
- Skipping the stated assumptions and presenting only a final number — makes the estimate impossible for anyone else to sanity-check or disagree with productively
- Confusing average and peak load, provisioning for the former and getting paged during the latter
- Estimating to false precision (three significant figures) on numbers that are fundamentally rough guesses — round numbers signal the right level of confidence
- Skipping this step entirely and reaching for the most complex architecture "to be safe," paying its operational cost long before the scale that justifies it arrives

## Further Reading
- "System Design Interview" by Alex Xu — the estimation sections, even though the interview framing is optional context
- "Designing Data-Intensive Applications" by Martin Kleppmann — the numbers-first mindset runs throughout
- Jeff Dean's "Numbers Everyone Should Know" (latency/throughput reference numbers, widely reproduced)
