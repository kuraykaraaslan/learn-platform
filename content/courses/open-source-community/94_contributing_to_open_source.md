# 94. Contributing to Popular Open Source Projects

## What It Is
Contributing to open source means improving software whose source code is publicly available and governed by a community. A contribution is not only a code change — it includes bug reports, documentation improvements, test additions, reproducible examples, and triage work on the issue tracker. For a developer who uses Next.js, TypeScript, PostgreSQL, and Stripe in production, meaningful contribution opportunities exist at every level of skill and time investment.

The credibility that comes from merged contributions to well-known projects is categorically different from anything you can put on a portfolio page. When you have a merged PR in `vercel/next.js`, `prisma/prisma`, `typeorm/typeorm`, or any significant project in your stack, it tells the technical decision-maker reading your profile that you understand the internals well enough to improve them — which is a stronger signal than any number of client testimonials. For someone running a solo software company and bidding on technical work, this kind of visible evidence of expertise accelerates the sale.

The path from "I'd like to contribute" to "I have merged PRs" is more accessible than most developers believe. The majority of maintainers are stretched thin and genuinely want contributors. The most valuable contributions are often not feature additions — they are fixing a documentation gap that misled you, adding a test for a bug that bit you, or providing a clear reproduction case for an issue that others have struggled to diagnose. These contributions require understanding of the codebase, not deep familiarity with its full implementation.

```quiz
- q: "You need to fix a bug in a dependency you run in production. Fork it, or push upstream?"
  anchor: "push the fix upstream rather than forking; upstream merge means all your future upgrades include the fix"
  options:
    - text: "Fork — it ships today instead of waiting on a maintainer"
      correct: false
      why: "It ships today and then every future upgrade has to re-apply it. The fork is a cost you keep paying."
    - text: "Upstream — a merged fix arrives in every future upgrade"
      correct: true
      why: "That is the upstream-first principle: the fix stops being yours to carry."
    - text: "Both — fork now, push upstream when there is time"
      correct: false
      why: "\"When there is time\" is what leaves the permanent fork behind."

- q: "A 500-line feature and a 20-line fix with a test are both open. Which moves?"
  anchor: "a 20-line fix with a test is reviewed in days; a 500-line feature is reviewed in months (or never)"
  options:
    - text: "The feature — more value per unit of review effort"
      correct: false
      why: "Value per review is not what governs merge time. Size is."
    - text: "The 20-line fix — small, focused PRs get merged faster"
      correct: true
      why: "Days against months, or never."
    - text: "Whichever has been open longest"
      correct: false
      why: "Age does not move a large PR through review."

- q: "Someone files a bug you can reproduce but not fix. Is there a contribution to make?"
  anchor: "Reproducing issues reported by others, adding details, and labeling them correctly is valuable maintainer work"
  options:
    - text: "No — a contribution means a code change"
      correct: false
      why: "Contributions include bug reports, documentation, tests, reproducible examples and triage."
    - text: "Yes — reproducing, adding detail and labelling is maintainer work, and it builds familiarity before you write code"
      correct: true
      why: "Maintainers frequently close issues for lack of reproduction, which is why a minimal reproduction is often worth more than the fix."
    - text: "Only if you open a draft PR alongside it"
      correct: false
      why: "A draft PR is for a larger change you have already started. Triage stands on its own."
```

## Key Concepts
- **Good first issue label**: Most mature projects tag issues that are suitable for new contributors; this is your entry point — filter by `good first issue` or `help wanted` before reading any code
- **Reproduction before fix**: For bug reports and bug fixes, a minimal reproduction case (the smallest possible code that demonstrates the issue) is often more valuable than the fix itself — maintainers frequently close issues for lack of reproduction
- **Read CONTRIBUTING.md first**: Every project with a serious maintainer has a CONTRIBUTING.md; read it before opening any PR; it specifies the process, code style, test requirements, and communication norms
- **Small, focused PRs**: Maintainers merge small changes faster; a 20-line fix with a test is reviewed in days; a 500-line feature is reviewed in months (or never)
- **The "upstream first" principle**: If you are fixing a bug or adding a feature in a dependency you use, push the fix upstream rather than forking; upstream merge means all your future upgrades include the fix
- **Issue triage as contribution**: Reproducing issues reported by others, adding details, and labeling them correctly is valuable maintainer work that builds your familiarity with the codebase before you write code
- **Draft PRs for visibility**: If you start on a larger change, open a draft PR early to get feedback on the direction before investing significant time
- **Engaging with the community**: Asking a thoughtful question in the project's Discord/GitHub Discussions — with a full context description and what you have already tried — is itself a form of contribution

## Example Code or Template

````markdown
# OSS Contribution Checklist

## Finding the Right Project and Issue

- [ ] Choose a project you use in production (better: one where you have hit a real bug)
  Pick from your own dependency list — the ones you already debug are the ones
  where you can write a credible patch. For a typical Node/TypeScript web stack
  that means projects like:
  - `vercel/next.js` — the framework
  - `typeorm/typeorm` or `prisma/prisma` — the ORM
  - `panva/jose` — JWT handling
  - `resend/resend-node` — email SDK
  - `stripe/stripe-node` — payment SDK

- [ ] Filter issues by `good first issue` or `help wanted`
- [ ] Read the CONTRIBUTING.md and CODE_OF_CONDUCT.md
- [ ] Check if there is an existing PR for this issue (search PRs, not just issues)
- [ ] Comment on the issue to indicate you are working on it (prevents duplicate work)

---

## Preparing Your Environment

- [ ] Fork the repository to your GitHub account
- [ ] Clone your fork locally
- [ ] Run the existing test suite — verify everything passes before you change anything
  ```
  git clone https://github.com/YOUR_USERNAME/PROJECT.git
  cd PROJECT
  npm install (or pnpm/yarn — check package.json)
  npm test
  ```
- [ ] Create a branch from the default branch (not main of your fork)
  ```
  git checkout -b fix/describe-the-fix
  ```

---

## Making the Change

- [ ] Make the smallest possible change that addresses the issue
- [ ] Add or update tests — most maintainers require tests for bug fixes
- [ ] Run the full test suite again — all existing tests must still pass
- [ ] Lint and type-check: `npm run lint && npm run typecheck`
- [ ] Add a changeset if the project uses changesets (`npx changeset add`)

---

## Writing the PR Description

Use this structure:

```markdown
## Problem
[One paragraph explaining the bug or gap. Link to the issue.]

## Solution
[One paragraph explaining your approach and why you chose it over alternatives.]

## Testing
[Describe the test you added. Explain what it verifies.]

## Before / After (if applicable)
Before: [behavior or error message]
After: [corrected behavior]

Closes #[issue-number]
```

---

## After the PR is Open

- [ ] Respond to reviewer feedback within 48 hours
- [ ] Do not resolve reviewer comments yourself — let the reviewer resolve them after addressing
- [ ] If you disagree with feedback, explain your reasoning politely and specifically
- [ ] If the PR is stalled for > 2 weeks, post a polite "ping" comment asking for review
- [ ] If the issue was closed as "won't fix" after your PR, thank the maintainer and move on
      (it is not personal — project priorities shift)

---

## Tracking Your Contributions

Keep a running list:
| Date       | Project             | PR / Issue            | Status  | Notes                        |
|------------|---------------------|-----------------------|---------|------------------------------|
| 2025-06-01 | typeorm/typeorm     | PR #1234: fix null... | Merged  | First merged PR — celebrated |
| 2025-06-15 | vercel/next.js      | Issue #5678: repro    | Closed  | Bug confirmed, fix by team   |
````

## When to Use
- When you hit a bug in a library you use and diagnose the root cause — you are already 60% of the way to a contribution; the remaining 40% is writing the test and PR
- When a library's documentation misleads you — the next developer will have the same problem; a documentation PR takes 20 minutes and gets merged in days
- When you have learned something deeply (multi-tenant TypeORM patterns, Next.js App Router behavior) — look for questions on the project's GitHub Discussions that match what you know; answering them builds profile and often leads to maintainer recognition
- When a client project uses a library with a known issue that has no upstream fix — contributing the fix upstream protects you from re-applying the patch every time you upgrade
- When you want to transition from "builds SaaS products" to "known in the ecosystem" in your professional positioning

## Common Mistakes
- **Opening a large PR without prior discussion**: A 500-line feature PR with no prior issue discussion will almost always be rejected or ignored — maintainers do not accept large changes without architectural discussion first; open an issue proposing the change and wait for feedback before writing code
- **Skipping the existing test suite**: If your change breaks existing tests, your PR will not be merged; always run the full test suite before opening the PR, even if you are only changing documentation
- **Duplicating an existing open PR**: Before starting work, search both issues and PRs for your topic; opening a duplicate wastes your time and the maintainer's time; if a stale PR exists, offer to take it over
- **Taking negative feedback personally**: Maintainers sometimes decline contributions that represent real improvements due to constraints you cannot see (roadmap conflicts, pending rewrites, performance concerns); "we're not taking this direction right now" is not a judgment of your skill

## Further Reading
- **"How to Contribute to Open Source" — opensource.guide** — The authoritative guide maintained by GitHub; covers every aspect from finding a project to handling rejections
- **"How Open Source Maintainers Think" — Nadia Eghbal (Working in Public)** — Book-length treatment of the dynamics, incentives, and constraints of OSS maintenance; reading it makes you a better contributor because you understand what maintainers actually need
- [**"First Contributions"](https://github.com/firstcontributions/first-contributions)** — A live-practice repository specifically for making your first PR; use this to practice the mechanical workflow before doing it in a real project

```recall
- q: "Name the contributions that are not code."
  must:
    - "bug reports"
    - "documentation improvements"
    - "test additions"
    - "reproducible examples"
    - "triage work on the issue tracker"

- q: "What gets read, and what gets filtered, before any code?"
  must:
    - "read CONTRIBUTING.md first — it specifies the process, code style, test requirements and communication norms"
    - "filter issues by `good first issue` or `help wanted` before reading any code"

- q: "Why is a minimal reproduction often worth more than the fix?"
  must:
    - "it is the smallest possible code demonstrating the issue"
    - "maintainers frequently close issues for lack of reproduction"

- q: "When does a draft PR earn its place?"
  must:
    - "when you start on a larger change"
    - "opened early to get feedback on the direction"
    - "before investing significant time"
```
