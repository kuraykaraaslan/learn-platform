# 390. Technology Selection and New-Technology Governance

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Technical_Architecture_Rules material (specifically `technology-selection.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
Technology selection at the architecture level is a different decision from vendor evaluation — evaluating a specific external vendor on price, contract terms, and support SLAs is a commercial skill covered elsewhere in this curriculum's process material. This lesson is about the stack-level decision: which framework, database, hosting model, and supporting tools a project is built on, which is the choice the team building *and maintaining* the system for years actually has to live with. Every technology choice must be justified against project requirements, team capability, ecosystem maturity, deployment model, security needs, maintenance cost, client ownership, and migration path — never against personal preference, trend, or what's interesting to learn on someone else's budget.

The technology decision matrix makes this concrete: fit (does it solve the actual project need), familiarity (can the team deliver confidently with it), stability (is it mature enough for paid client work), ecosystem (are libraries, documentation, and community support strong), deployment (can it be hosted and operated without heroics), cost (are runtime and provider costs acceptable), hiring (can another developer maintain it later without the original author), and risk (what happens if it breaks or the project behind it is abandoned). Underneath the matrix sits a simple habit: for most web platforms, a boring-good default — a typed frontend framework, a relational database, managed hosting — is the right starting point precisely because it's replaceable and hireable-for later. Deviating from that default needs a stated reason; it should never be the default itself.

The new-technology governance gate is what keeps novelty from creeping into paid, production work under the banner of "we should modernize." A new technology should not enter a client project unless at least one of these is true: it clearly reduces project risk, it's required by the client's existing environment, it solves a problem the current stack genuinely cannot solve well, there's enough time to validate it properly, or there's a real fallback plan if it doesn't work out. And whenever a stack is recommended, the required sequence is fixed: state the requirements first, recommend the stack second, explain why it fits, name at least one trade-off, and say explicitly what would change the recommendation — never present a preference as if it were the only reasonable option.

## Key Concepts
- **Technology decision matrix**: fit, familiarity, stability, ecosystem, deployment, cost, hiring, risk — eight criteria, applied to every non-trivial stack choice
- **Boring-good default habit**: a mature, typed, well-hosted default stack is the right starting assumption for paid/production work; deviation requires a stated reason, not the reverse
- **New-technology introduction gate (five conditions, at least one required)**: clearly reduces project risk, required by client environment, solves what the current stack can't, enough time to validate, or a real fallback plan exists
- **Provider selection criteria**: pricing, API quality, documentation, rate limits, webhook reliability, data residency, support, export/migration ability, vendor lock-in — the narrower version of the same decision applied to a single external service
- **Required recommendation sequence**: requirements stated first → stack recommended second → fit explained → trade-off named → what-would-change-this stated explicitly
- **Explicit boundary**: this is stack/tool selection at the architecture level; evaluating a specific vendor's commercial terms, pricing, and contract is a separate skill (covered under Process & Soft Skills' build-vs-buy/vendor evaluation)
- **Learning cost is not free**: adopting a new tool the team hasn't used before is a cost the project bears, not a benefit the client is assumed to want

## Example Code
```markdown
## Technology Decision — Crew Scheduler

**Requirements first:**
- Small crew SaaS, SMS-first notification, modest traffic (dozens of jobs/day
  per pilot region), single developer maintaining post-launch, client has no
  existing infrastructure preference.

**Recommended stack:**
- Next.js (frontend + API routes) — single deployable unit, matches modular
  monolith decision from lesson 389
- PostgreSQL — relational integrity needed for conflict-detection transactions
  and future reporting
- Managed hosting (Vercel/Render-equivalent) — no dedicated ops budget
- No Redis, no queue system yet — current volume doesn't justify the
  operational cost

**Why it fits:**
Matches team familiarity, has strong ecosystem/hiring support, deployment is
low-effort for a solo-maintained pilot, and cost scales with usage rather than
requiring upfront infrastructure spend.

**Trade-offs:**
Next.js API routes are less suited to long-running background jobs than a
dedicated backend — acceptable now because SMS sending is fire-and-forget,
revisit if async job volume grows (Stage 2 of the scaling path, lesson 389).

**What would change this recommendation:**
- Multi-region expansion needing background workers → introduce a queue
  (Stage 2/3 of the scaling path)
- Client mandates a specific cloud provider or on-prem hosting → hosting
  layer changes, database/framework choice likely unaffected

**New-technology gate check:** No new/unproven technology introduced — every
component is a mature, boring-good default matched to stated requirements.
```

## When to Use
- At the start of any project, before committing to a framework, database, or hosting model — state requirements before naming a stack
- Whenever a new tool or library is proposed mid-project — run it through the five-condition governance gate before adopting it
- When a client or stakeholder requests a specific trendy technology — use the decision matrix to evaluate fit honestly rather than accepting or rejecting on reputation alone
- When selecting a third-party provider (payment, SMS, storage) — apply the provider selection criteria as the narrower version of the same discipline

## Common Mistakes
- Choosing a technology because it's currently popular or personally interesting rather than because it fits the stated requirements
- Adding Redis, a message queue, or a new database "because it might be needed later" without a current requirement driving it — this is exactly the overbuilding the architecture principles (lesson 387) warn against
- Recommending a stack without stating requirements first, so the recommendation can't actually be evaluated against anything
- Introducing an unfamiliar technology into paid client work without disclosing the associated learning cost and risk
- Treating technology selection and vendor evaluation as the same decision — a stack choice and a specific vendor's contract terms are different questions with different owners

## Further Reading
- Dan McKinley — "Choose Boring Technology" (mckinley.works — the essay-length version of the boring-good-default principle)
- ThoughtWorks Technology Radar (thoughtworks.com/radar — a structured, ongoing example of the fit/maturity/ecosystem evaluation habit)
- David Thomas & Andrew Hunt — "The Pragmatic Programmer" (on evaluating tools by fit for the problem rather than novelty)
