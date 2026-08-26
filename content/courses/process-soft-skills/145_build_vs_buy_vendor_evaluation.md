# 145. Build vs Buy / Vendor Evaluation Decisions

## Coverage Level
**Not assessed** — added during the roadmap gap review. Writing ADRs (#75) and the RFC Process (#76) cover *how* to document and socialize a decision; this covers a specific, recurring decision those processes are often used for — and it was never framed as its own topic.

## What It Is
"Should we build this ourselves or pay for it" is a recurring decision that deserves a repeatable framework instead of being re-litigated from scratch (or decided by whoever's most excited to build something) every time it comes up. The first, most useful filter is **core vs. context**: is this capability part of what actually differentiates your product to customers (core — usually worth building and owning), or is it necessary but generic infrastructure every company like yours also needs (context — usually worth buying, because a vendor specializing in exactly that problem will out-invest what you could justify building)? Payment processing, email deliverability (#88), and authentication are classic context — critical, but not what customers are paying you for.

The comparison itself needs **total cost of ownership**, not just sticker price: building costs the initial engineering time *plus* every hour spent maintaining, patching, and extending it forever after — a cost that's easy to underestimate because it's diffuse and doesn't show up as a single line item the way a vendor's monthly invoice does. Buying costs the subscription *plus* integration effort *plus* the ongoing risk of **vendor lock-in** — which is why evaluating a vendor should always include their data portability story (can you actually get your data out, in a usable format, if you leave) alongside the more obvious criteria like SLA and pricing-at-scale.

**Reversibility** is the other axis worth naming explicitly: a decision that's cheap to undo (a low-commitment vendor trial) deserves far less analysis than one that's expensive to reverse (a deeply-integrated platform choice, or a from-scratch build that other systems come to depend on) — matching the depth of the evaluation to how hard the decision would be to walk back.

## Key Concepts
- **Core vs context**: build what differentiates you; buy the generic infrastructure everyone in your category also needs
- **Total cost of ownership**: build = engineering time now + maintenance forever; buy = subscription + integration + lock-in risk
- **Data portability**: can you actually export your data in a usable format if you leave — the vendor-evaluation criterion people skip until it's too late
- **Reversibility**: match the depth of the evaluation to how expensive the decision would be to undo later
- **Vendor evaluation criteria**: SLA terms, pricing model at your projected scale (not just today's), support responsiveness, and portability — evaluated together, not SLA/price alone

## Example Code
```typescript
// Not code — the deliverable is a short, explicit comparison, the same way an ADR (#75) is.
// Making the reasoning reviewable is the actual point, not the specific numbers.

interface BuildVsBuyAnalysis {
  capability: string;
  isCoreDifferentiator: boolean;
  buildEstimate: { engineeringWeeksUpfront: number; estimatedMaintenanceHoursPerMonth: number };
  buyEstimate: { monthlyCost: number; integrationWeeks: number; dataPortabilityConfirmed: boolean };
  reversibilityIfWrong: "cheap" | "expensive";
  recommendation: string;
}

const emailInfraDecision: BuildVsBuyAnalysis = {
  capability: "transactional email sending + deliverability",
  isCoreDifferentiator: false, // context, not core — customers pay us for the product, not for SMTP plumbing
  buildEstimate: { engineeringWeeksUpfront: 6, estimatedMaintenanceHoursPerMonth: 15 }, // SPF/DKIM/DMARC upkeep, see #88
  buyEstimate: { monthlyCost: 400, integrationWeeks: 1, dataPortabilityConfirmed: true },
  reversibilityIfWrong: "cheap", // switching providers later is a config change, not a rewrite
  recommendation: "Buy — not a differentiator, vendor specializes in exactly this problem, low switching cost later.",
};
```

## When to Use
- Any recurring "should we build this in-house" debate — apply the same framework instead of re-arguing it from intuition each time
- Evaluating a new SaaS dependency before integrating it — check data portability and pricing-at-scale, not just today's quoted price
- A capability that's starting to look core (heavily customized, deeply differentiating) after being bought as context — worth revisiting the decision, not locking it in permanently

## Common Mistakes
- Comparing only the vendor's subscription price against zero, ignoring the real ongoing engineering cost of the "free" build option
- Building something technically interesting because it's fun, rather than because it's actually a competitive differentiator
- Signing with a vendor with no clear data-export path, discovering the lock-in only when trying to leave
- Treating every build-vs-buy decision with the same depth of analysis regardless of how reversible it actually is

## Further Reading
- Gergely Orosz — "The Software Engineer's Guidebook," build vs buy chapter
- Joel Spolsky — "In Defense of Not-Invented-Here Syndrome" (the case for building core capabilities, as a useful counterweight)
- Martin Fowler — "Core vs Context" framing draws on Geoffrey Moore's "Dealing with Darwin"
