# 77. Technical Debt Prioritization — Risk × Cost Matrix

## What It Is
Technical debt is the accumulated cost of shortcuts, outdated dependencies, deferred refactors, and architectural compromises that slow down future work. Every non-trivial codebase has it. The question is never "do we have debt?" but "which debt is costing us the most and should be addressed before the others?"

The risk × cost matrix is one of the most practical frameworks for answering that question. You score each piece of debt on two axes: **probability and severity of the risk it creates** (what happens if you leave it untouched — security exposure, data loss, inability to ship a feature), and **cost to address it** (developer hours, migration complexity, blast radius). Debt that is high-risk and cheap to fix goes first. Debt that is low-risk and expensive to fix goes last or never. The matrix makes these tradeoffs visible and communicable — important when you need to explain to a client or future hire why you are spending a sprint on "invisible" work.

There are also two debt dimensions that the matrix does not capture on its own: **interest rate** (does this debt compound over time, making future work progressively slower?) and **leverage** (does paying this debt down unblock multiple other improvements?). These two modifiers can promote a moderate-scoring debt item to urgent. A poorly modeled database schema, for example, may score medium on the raw risk × cost matrix but carries a high interest rate because every new feature touches it — which makes it more urgent than a high-risk but isolated legacy endpoint that nobody calls anymore.

## Key Concepts
- **Risk score (1–5)**: Combines probability that the debt causes a real problem × severity if it does; a rarely-called insecure endpoint scores lower than a widely-used one
- **Cost score (1–5)**: Total developer cost to fix — time, testing, migration, coordination overhead
- **Priority score**: `(Risk × Cost_to_Ignore) / Cost_to_Fix` — high risk, low fix cost = highest priority
- **Interest rate**: Debt that compounds (slows down every new feature touching that module) outranks equal-scoring debt that is isolated
- **Leverage**: Paying down one debt item that unblocks two other improvements is worth more than the raw score suggests
- **Debt register**: A living document (or tagged Jira/Linear column) listing all known debt with scores, not just a mental list
- **Debt budget**: Dedicating a fixed percentage of sprint capacity to debt reduction (e.g., 20%) prevents total avoidance and total obsession
- **Categorizing by type**: Security debt, performance debt, maintainability debt, test debt, and documentation debt have different urgency profiles

## Example Code or Template

```typescript
// Technical Debt Register — scored with risk × cost matrix
// Keep this as a tracked JSON, CSV, or table in your project wiki

type DebtSeverity = 1 | 2 | 3 | 4 | 5;

interface DebtItem {
  id: string;
  title: string;
  location: string;            // File path or module name
  type: 'security' | 'performance' | 'maintainability' | 'test' | 'docs';
  riskProbability: DebtSeverity;   // 1 = unlikely, 5 = already causing issues
  riskSeverity: DebtSeverity;      // 1 = inconvenience, 5 = data loss / security breach
  fixCost: DebtSeverity;           // 1 = < 1 hour, 5 = > 2 weeks
  interestRate: DebtSeverity;      // 1 = isolated, 5 = touched by every new feature
  leverage: DebtSeverity;          // 1 = fixes only this, 5 = unblocks many other items
  addedDate: string;
  notes: string;
}

function priorityScore(item: DebtItem): number {
  const risk = item.riskProbability * item.riskSeverity; // max 25
  const adjustedCost = item.fixCost / (item.leverage * 0.5 + 0.5); // leverage reduces effective cost
  const urgencyMultiplier = item.interestRate / 3; // normalize to ~1
  return (risk * urgencyMultiplier) / adjustedCost;
}

// Example debt register
const debtRegister: DebtItem[] = [
  {
    id: 'TD-001',
    title: 'Raw SQL in tenant_session queries — no parameterization guard',
    location: 'modules/tenant_session/tenant_session.service.next.ts',
    type: 'security',
    riskProbability: 3,
    riskSeverity: 5,
    fixCost: 2,
    interestRate: 2,
    leverage: 1,
    addedDate: '2025-01-10',
    notes: 'Only one query affected, but severity is critical if exploited',
  },
  {
    id: 'TD-002',
    title: 'No index on tenant_member.userId + tenantId composite lookup',
    location: 'modules/tenant_member/entities/',
    type: 'performance',
    riskProbability: 4,
    riskSeverity: 3,
    fixCost: 1,
    interestRate: 4,
    leverage: 3,
    addedDate: '2025-02-15',
    notes: 'Every request does this lookup; will degrade linearly with member count',
  },
];

// Sort by priority score descending
const prioritized = [...debtRegister].sort(
  (a, b) => priorityScore(b) - priorityScore(a)
);

prioritized.forEach((item, i) => {
  console.log(`${i + 1}. [${item.id}] ${item.title} — score: ${priorityScore(item).toFixed(2)}`);
});
```

## When to Use
- At the start of each quarter, to decide which debt items get scheduled into the roadmap versus parked
- When a client asks why a sprint contains "no visible features" — the scored register is your justification
- Before hiring your first contractor — a scored debt register helps you assign cleanup tasks with clear priority rationale
- When a production incident occurs and post-mortem reveals a debt item that was known — score it immediately after the post-mortem while context is fresh
- When evaluating whether to rewrite a module versus incrementally improving it — compare the cumulative fix costs of all debt items in that module against an estimated rewrite cost

## Common Mistakes
- **Gut-feel prioritization without scoring**: "I feel like the auth module needs refactoring" is not comparable to "I feel like the billing module needs refactoring" — scores make tradeoffs explicit and auditable
- **Letting the register go stale**: A debt register that hasn't been updated in three months is worse than no register because it creates false confidence; review and re-score quarterly
- **Ignoring interest rate**: Isolated high-risk debt is less urgent than medium-risk debt that touches every feature — failing to account for interest rate leads to consistently wrong ordering
- **Treating all debt as bad**: Some debt is a deliberate, time-boxed tradeoff made to hit a deadline — mark these explicitly with a scheduled payback date, not as permanent items

## Further Reading
- **"Managing Technical Debt" by Philippe Kruchten, Robert Nord, and Ipek Ozkaya** — The most rigorous academic treatment of debt classification and scoring frameworks
- **"Technical Debt Quadrant" — Martin Fowler (martinfowler.com)** — Fowler's two-axis model (reckless/prudent × deliberate/inadvertent) is a useful pre-filter before scoring
- **"The Pragmatic Programmer" — Hunt & Thomas, Chapter on Broken Windows** — The psychological case for why unaddressed debt compounds socially, not just technically
