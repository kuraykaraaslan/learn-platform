# 118. Building in Public — Social Proof Without a Portfolio

## Coverage Level
**Not Covered** — You have LinkedIn_Authority_Rules but "building in public" as a compounding growth mechanism is a different discipline than LinkedIn content strategy.

## What It Is
Building in public means sharing your work process — decisions, tradeoffs, mistakes, and learnings — as you build, not after you've succeeded. It's the opposite of the polished case study: instead of "here's what I built and how great it is," it's "here's what I'm building, here's the hard decision I'm facing today, and here's what I got wrong last week."

This works because authenticity compounds in ways that polish doesn't. A case study proves you succeeded once. A build-in-public record proves you're consistently working, thinking, and improving. It also creates an audience before you need one — people follow the journey, and when you launch or pitch, they're already invested.

For a solo developer with a multi-tenant SaaS boilerplate, the content already exists. Every architectural decision, every tradeoff, every time you hit a wall and figured it out — those are posts. The question is whether you're extracting them or letting them disappear.

## Key Concepts
- **Process > outcome**: Share the decisions and reasoning, not just the results. "I chose PostgreSQL row-level security over separate schemas because..." is more valuable than "we launched."
- **Consistency > virality**: One post that reaches 10,000 people once is less valuable than 50 posts that each reach 500 people who are exactly your target client. Consistency builds trust; virality builds vanity metrics.
- **"Show your work"**: Austin Kleon's principle — document what you're learning and making as you go, not retrospectively.
- **Specificity beats generality**: "I added WebAuthn passkey support to a Next.js app in 3 hours using @simplewebauthn" gets more engagement than "I shipped a security feature today."
- **Failure posts outperform success posts**: Sharing what went wrong and what you learned generates more trust and engagement than showing wins.
- **Content inventory**: Your existing work is already content. The boilerplate, the ruleset system, each architectural decision — these are posts waiting to be written.
- **Compounding**: Content published 6 months ago still generates leads. Unlike client work, content doesn't stop working when the project ends.
- **Platform choice**: Twitter/X for reach and developer audience. LinkedIn for client audience (founders, CTOs, product managers). Pick one primary, repurpose to the other.

## Example / Template

**30-Day Build-in-Public Starter Calendar**
(Based on your existing projects — no new work required)

```markdown
## Week 1 — Architecture Posts (from next-boilerplate)
Day 1: "Why I use two PostgreSQL databases in my SaaS boilerplate (system + tenant)"
        → Explain the isolation model, when it matters
Day 3: "The multi-tenant auth flow: how a single login works across 50 tenants"  
        → JWT payload, tenant session, RBAC — one diagram + code snippet
Day 5: "Passkeys in Next.js: what @simplewebauthn actually does under the hood"
        → 5 things I learned adding WebAuthn to a production app

## Week 2 — Decision Posts (from ruleset system)
Day 8: "Why I formalized 74,000 lines of rules for my solo software company"
        → What's in it, how I use it with AI, what problem it solves
Day 10: "The 5 contract clauses every freelance developer should understand"
         → From your legal rules, made accessible
Day 12: "How I price fixed-scope SaaS projects (and why I stopped billing hourly)"
         → From your Finance_and_Operations_Rules

## Week 3 — Technical Deep Dives
Day 15: "Building an impersonation system: how Stripe and Intercom do it, how I did it"
         → Your ImpersonationService — a genuinely rare feature
Day 17: "3 months building a multi-tenant boilerplate: what I'd do differently"
         → Honest retrospective post — high engagement
Day 19: "My full TypeScript multi-tenant SaaS stack in 2026 (and why each piece)"
         → Stack overview with reasoning — good for SEO

## Week 4 — Engagement & Opinion Posts  
Day 22: "The N+1 query problem in Prisma: how to spot it before it hits production"
         → Technical education post targeting other Next.js developers
Day 24: "Why I have 0 tests in my production SaaS boilerplate (and what I'm doing about it)"
         → Honest, controversial, generates discussion
Day 26: "Rate your own SaaS boilerplate: the 20-point checklist I wish I had"
         → Interactive/checklist format, shareable
Day 29: "Month 1 building in public: what I shared, what got traction, what didn't"
         → Meta-post — builds authenticity, closes the loop
```

**Post structure for technical posts:**
```
Hook (first line — must work without clicking):
  "I added passkey support to a Next.js app. Here's what surprised me:"

Context (2-3 sentences):
  What the problem was, why it mattered

The insight (the core of the post):
  The specific thing they won't get from a tutorial

Code/diagram (if applicable):
  One concrete example — not a tutorial, an illustration

Takeaway:
  The one thing to remember
  
Optional CTA:
  "If you're building multi-tenant SaaS, I wrote about the full architecture here: [link]"
```

## When to Use / Apply
- You have a decision to make — write the options and tradeoffs before deciding, post it
- You shipped something non-trivial — document what was hard about it before you forget
- You found a bug or made a mistake — write the post-mortem version
- You're between projects — review your commit history from the last month for content

## Common Mistakes
- Waiting until you've "succeeded enough" to start — the journey is the content, not the destination
- Generic posts ("excited to share my new project!") — specificity always outperforms
- Disappearing for weeks then posting in bursts — consistency matters more than volume
- Sharing code dumps without explaining decisions — code is the example, thinking is the content

## Further Reading
- *Show Your Work* — Austin Kleon: the original short book on building in public (not technical, but directly applicable)
- *The 1,000 True Fans* — Kevin Kelly (essay): why a small, specific audience beats a large generic one
- Pieter Levels (@levelsio) on Twitter — the canonical example of building in public for solo developers; study his post format and frequency
