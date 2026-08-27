# 61. Alerting Design — Avoiding Alert Fatigue

## What It Is
Alerting design is the discipline of deciding what should wake someone up at 2 AM versus what should appear on a dashboard to be reviewed in the morning. Getting this wrong in either direction is expensive: too few alerts means outages go unnoticed; too many means every alert gets ignored, including the critical ones.

The core problem is that most people start with threshold-based alerts — "alert if error rate > 1%" — and end up with dozens of firing alerts that are technically correct but not actionable. A spike to 2% errors for 30 seconds during a deploy is noise. A sustained 1.5% error rate for 10 minutes during normal traffic is a real problem. The difference is context: duration, trend, and whether someone can actually do something about it right now.

The modern approach is to alert on **symptoms**, not causes, and to base those symptoms on your SLIs (item 55). If your SLI is "99.5% of requests succeed in < 2 seconds," then your alert is "we are burning our error budget at a rate that will exhaust it in less than 6 hours." That alert is actionable regardless of the root cause — you page someone, they investigate, they find the cause. Contrast this with "CPU > 80%" — that fires constantly, correlates poorly with user impact, and trains your team to ignore it.

For a solo developer, alerting design is about ruthless minimalism: pick three to five metrics that directly represent user experience, set burn-rate-based thresholds, and route everything else to a Slack channel for passive review. Never page yourself for something you cannot act on immediately.

## Key Concepts
- **Symptom-based alerting** — alert on user-visible impact (high error rate, slow responses), not internal causes (high CPU, disk I/O)
- **Cause-based alerting** — alerts on infrastructure metrics (CPU, memory, disk); useful in dashboards, rarely worth a page
- **Alert fatigue** — when so many alerts fire that on-call engineers start ignoring all of them, including critical ones
- **Actionability** — a good alert has a clear runbook: "this fires → check X → do Y"; if you cannot write that, the alert should not page
- **Burn rate alert** — fires when error budget is being consumed faster than sustainable; directly tied to SLO (see item 55)
- **Multi-window alert** — fast window (e.g., 1 hour) catches sudden spikes; slow window (e.g., 6 hours) catches slow-burning issues; both must fire together to reduce false positives
- **Runbook** — a document linked from the alert that explains what it means, how to triage, and how to resolve it
- **Routing** — critical alerts → PagerDuty/phone; warning alerts → Slack channel; info → dashboard only

## Example Code
```typescript
// libs/alert-manager.ts — a minimal alerting abstraction
// In production, use Grafana Alertmanager or PagerDuty; this shows the concepts

interface Alert {
  name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  labels: Record<string, string>;
  runbookUrl?: string;
}

type AlertChannel = (alert: Alert) => Promise<void>;

// Route alerts to different channels by severity
const channels: Record<Alert['severity'], AlertChannel[]> = {
  critical: [sendToPagerDuty, sendToSlack],  // wakes you up
  warning:  [sendToSlack],                    // Slack only, no page
  info:     [writeToLog],                     // dashboards only
};

async function fireAlert(alert: Alert): Promise<void> {
  const targets = channels[alert.severity] ?? [writeToLog];
  await Promise.allSettled(targets.map((fn) => fn(alert)));
}

// ── Concrete alert definitions ───────────────────────────────────────────────

// GOOD: symptom-based, tied to SLI, actionable
// This fires when you are burning error budget at 14× sustainable rate
// (meaning you will exhaust the monthly budget in ~2 hours)
const HIGH_ERROR_BUDGET_BURN: Omit<Alert, 'message'> = {
  name: 'HighErrorBudgetBurn',
  severity: 'critical',
  labels: { team: 'backend', component: 'api' },
  runbookUrl: 'https://wiki.internal/runbooks/high-error-rate',
};

// BAD: cause-based, almost never actionable as a page
// const HIGH_CPU: Alert = { name: 'HighCPU', severity: 'critical', ... }
// → move this to 'warning' and route to Slack only

// ── BullMQ queue depth alert — actionable, with clear threshold ──────────────
import redis from '@/lib/redis';
import Logger from '@/lib/logger';

const QUEUE_DEPTH_THRESHOLD = 500;  // tune this based on your worker throughput

export async function checkQueueHealth(): Promise<void> {
  // This runs as a BullMQ cron job every minute
  const waiting = await redis.llen('bull:email-queue:wait');

  if (waiting > QUEUE_DEPTH_THRESHOLD * 2) {
    await fireAlert({
      ...HIGH_ERROR_BUDGET_BURN,
      name: 'QueueBacklogCritical',
      severity: 'critical',
      message: `Email queue has ${waiting} waiting jobs — workers may be down`,
    });
  } else if (waiting > QUEUE_DEPTH_THRESHOLD) {
    await fireAlert({
      name: 'QueueBacklogWarning',
      severity: 'warning',
      labels: { queue: 'email' },
      message: `Email queue backlog growing: ${waiting} jobs waiting`,
    });
  }
}

// ── Alert deduplication — do not page for the same condition every minute ───
const firedAlerts = new Map<string, number>();  // alertName → last fired timestamp

export async function deduplicatedAlert(alert: Alert, cooldownMs = 15 * 60 * 1000): Promise<void> {
  const lastFired = firedAlerts.get(alert.name) ?? 0;
  if (Date.now() - lastFired < cooldownMs) return;  // still in cooldown window

  firedAlerts.set(alert.name, Date.now());
  await fireAlert(alert);
}
```

## When to Use
1. **API error rate suddenly spikes** — critical alert, pages immediately; something broke in the last deploy.
2. **Queue backlog grows beyond normal capacity** — warning alert to Slack; workers may be slow or down, but not urgent enough to wake someone at 3 AM unless the backlog doubles.
3. **Payment webhook processing fails 3× in a row** — critical alert; lost payments are business-critical.
4. **Database connection pool exhaustion** — critical alert; the app will start returning 500s immediately after.
5. **SSL certificate expiring in < 14 days** — warning alert scheduled daily; not urgent, but needs attention within a week.

## Common Mistakes
- **Alerting on every possible metric** — start with three alerts: high error rate, high latency, and service-down. Add more only when you have been burned by not having them.
- **Alerts without runbooks** — if the on-call person (you) wakes up at 3 AM and the alert says "high CPU," what do you do? Every alert must have a linked runbook with triage steps.
- **Not silencing alerts during planned maintenance** — maintenance windows should suppress alerts temporarily; otherwise you desensitize yourself to real alerts.
- **Ignoring alert flapping** — an alert that fires and resolves every 5 minutes is noise. Add a `for: 5m` duration requirement so the alert only fires if the condition persists.

## Further Reading
- Google SRE Book — Chapter 6 (Monitoring Distributed Systems): https://sre.google/sre-book/monitoring-distributed-systems/
- Alerting on SLOs (burn rate model): https://sre.google/workbook/alerting-on-slos/
- PagerDuty — The On-Call Engineer's Handbook: https://www.pagerduty.com/resources/learn/on-call-management/
