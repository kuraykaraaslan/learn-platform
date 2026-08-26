# 141. Cloud Architecture & Well-Architected Patterns — Multi-Region, FinOps

## Coverage Level
**Not assessed** — added during the roadmap gap review. Kubernetes Fundamentals (#59) and Dockerfile Best Practices (#58) cover a single deployment; this covers the architectural decisions above that layer — topology, cost — which were never addressed directly.

## What It Is
Cloud architecture decisions live above any individual service, and the most consequential one is deployment topology: **single-region** (simple, but the whole region going down means you're down), **active-passive** (a warm or cold standby region that takes over on failover, trading cost for recovery time — directly parameterized by the RTO/RPO targets from #49), or **active-active** (multiple regions serving live traffic simultaneously, which buys the best availability but forces genuinely hard data-consistency questions, right back to #1 CAP Theorem, now across regions instead of across nodes). None of these is unconditionally "better" — the right one is whichever matches what an actual outage would cost the business against what the topology costs to run and operate correctly.

**FinOps** treats cloud spend as a discipline with the same rigor as reliability, running an inform → optimize → operate loop: first make cost visible and attributable (tagging resources by team/feature so a bill is actually explainable), then optimize (rightsizing instances, reserved/savings-plan commitments for predictable baseline load, spot instances for interruptible batch work), then operationalize it as an ongoing practice rather than a one-time cost-cutting sprint. The **AWS Well-Architected Framework** (and its equivalents from other providers) formalizes this kind of thinking into a recurring review across several pillars — reliability, cost, security, performance, operational excellence — meant to be revisited periodically, not filled out once and filed away.

## Key Concepts
- **Single-region vs active-passive vs active-active**: increasing availability, increasing cost and operational complexity, increasing consistency challenges
- **Blast radius containment**: designing so one component's failure can't cascade into an unrelated one — the architectural version of the Bulkhead pattern (#4)
- **FinOps loop**: inform (visibility/tagging) → optimize (rightsizing, commitments) → operate (ongoing practice)
- **Reserved/savings plans vs on-demand vs spot**: committing to predictable baseline load for a discount, paying full price for unpredictable load, using spot for interruptible/batch work at the steepest discount
- **Well-architected review**: a recurring, multi-pillar practice (reliability, cost, security, performance, operations) — not a one-time checklist

## Example Code
```typescript
// A decision table isn't code, but it's the actual deliverable of this kind of analysis —
// making the tradeoff explicit instead of an implicit, undocumented default.

type Topology = "single-region" | "active-passive" | "active-active";

interface TopologyProfile {
  rtoMinutes: number;      // recovery time objective this topology can realistically hit
  monthlyCostMultiplier: number; // relative to single-region baseline
  operationalComplexity: "low" | "medium" | "high";
}

const topologyProfiles: Record<Topology, TopologyProfile> = {
  "single-region":   { rtoMinutes: 240, monthlyCostMultiplier: 1.0, operationalComplexity: "low" },
  "active-passive":  { rtoMinutes: 15,  monthlyCostMultiplier: 1.6, operationalComplexity: "medium" },
  "active-active":   { rtoMinutes: 0,   monthlyCostMultiplier: 2.4, operationalComplexity: "high" },
};

// Pick the cheapest topology that still meets a required RTO — an explicit, reviewable decision
function chooseTopology(requiredRtoMinutes: number): Topology {
  const candidates = (Object.entries(topologyProfiles) as [Topology, TopologyProfile][])
    .filter(([, p]) => p.rtoMinutes <= requiredRtoMinutes)
    .sort((a, b) => a[1].monthlyCostMultiplier - b[1].monthlyCostMultiplier);
  return candidates[0][0];
}
```

## When to Use
- Choosing a deployment topology — tie it explicitly to a business-stated RTO/RPO, not to what "sounds robust"
- Justifying infrastructure spend to non-engineering stakeholders — FinOps tagging turns "the cloud bill is high" into "feature X costs $Y/month, here's why"
- Preparing for a compliance audit or enterprise sales cycle where a well-architected-style review is expected evidence

## Common Mistakes
- Going multi-region "because it sounds robust" without a tested failover — an untested DR plan is not a DR plan
- No cost visibility until the monthly bill arrives, instead of tagging resources for attribution from day one
- Treating a well-architected review as a one-time checklist exercise instead of a recurring practice that catches drift
- Over-committing to reserved capacity for load that turns out to be far less predictable than assumed, or under-committing and paying full on-demand price for genuinely steady baseline load

## Further Reading
- AWS Well-Architected Framework (the pillars generalize even outside AWS specifically)
- "Cloud FinOps" by J.R. Storment & Mike Fuller
- Google Cloud Architecture Framework (a useful second reference point, differs in emphasis from AWS's)
