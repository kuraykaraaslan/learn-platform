# 275. Technical Writing Style for Business Readers

## What It Is
Technical writing style, in the content-marketing sense, is not about dumbing anything down — it's about translating technical depth into something a non-technical buyer can follow without losing the substance that makes a technical reader trust you. The failure mode on one side is writing that removes all technical detail and becomes indistinguishable from generic marketing copy ("we build secure, scalable solutions"); the failure mode on the other side is writing that dumps unexplained implementation detail on a reader who has no way to evaluate whether it matters ("we use Redis for availability with TTL-backed keys"). Good technical style for a mixed audience does neither — it keeps the mechanism but explains why it matters in terms the reader's role actually cares about.

The starting move is to open with the problem, not the technology. "Redis is an in-memory data store that supports many data structures" tells a reader nothing about why they should keep reading. "Appointment systems fail when two users can reserve the same slot at the same time" gives them a reason to care before you ever mention the tool that solves it. From there, good technical writing shows judgment rather than fake certainty — instead of "always use microservices" or "PostgreSQL is always better," it explains the actual trade-off: "for most early MVPs, a modular monolith is easier to ship and maintain than microservices; microservices become useful when team size, scale, and deployment boundaries justify the operational cost." Absolutes read as inexperience to anyone who has actually shipped software; conditional, trade-off-aware statements read as seniority.

Depth should be calibrated to audience without pretending the audience doesn't exist: an SME owner needs business impact and a simple explanation; a founder needs the product trade-off plus the technical risk; an agency needs delivery-reliability language; a CTO or senior developer wants the actual pattern and constraint, not a metaphor standing in for it. The recommended shape for a piece that has to serve more than one of these at once is: state the problem, explain why it matters, name the common mistake, describe the better technical approach, name its trade-off, translate that into business/client impact, then close. Concrete scenarios do more work than abstract claims in every version of this — "in a ticketing system, the seat map affects pricing, inventory, reservation locks, refund logic, and admin reporting" teaches more in one sentence than a paragraph of general principles about "complexity."

## Key Concepts
- **Problem-first opening**: start with what goes wrong or what's at stake before introducing the technology that fixes it — technology-first openings lose the reader who doesn't already care.
- **Show the trade-off, not just the choice**: "I would not use X for every project" followed by when it makes sense and when it's overkill demonstrates judgment; a bare recommendation does not.
- **Concrete scenarios over abstract claims**: replace "this can get complex" with the actual list of things that get complex — inventory, pricing, refunds, reservation locks — because specificity is what reads as expertise.
- **No unsupported absolutes**: avoid "always," "never," and "X is always better"; conditional statements ("for most early MVPs...") read as senior judgment rather than dogma.
- **Depth-by-audience table**: SME owner → business impact + simple explanation; founder → product trade-off + technical risk; agency → delivery reliability + architecture confidence; CTO/developer → patterns, constraints, implementation detail.
- **Jargon is allowed if explained**: technical terms don't need to be avoided, but each one needs a sentence explaining why it matters, not just that it exists.
- **Code as illustration, not tutorial**: for social and mixed-audience content, a small snippet illustrating a point beats a large code block; full tutorials belong in dedicated technical documentation, not authority content.
- **The practitioner test**: before publishing, ask whether the content sounds like a practitioner with real judgment or a generic AI-written article that could have been produced by anyone with a search engine.

## Example Code
```md
## Technical Post Draft — Style Pass

**Weak (technology-first, no trade-off):**
"We use Next.js middleware and TypeORM for our multi-tenant architecture."

**Better (problem-first, trade-off shown, business impact stated):**
"Every multi-tenant app needs to stop one tenant from seeing another's
data. The obvious fix — add a WHERE tenant_id = ? clause to every query —
sounds simple but fails in practice: it depends on every developer
remembering the filter, and one missed clause exposes every tenant's data
at once. A more reliable approach enforces the tenant filter at the ORM
configuration layer, so queries without it simply don't run. The
trade-off is a small amount of setup complexity up front, in exchange for
removing an entire class of security bug that would otherwise depend on
human memory."

**Structure checklist applied:**
1. Problem: cross-tenant data leaks
2. Why it matters: one missed WHERE clause = full breach
3. Common mistake: relying on manual per-query filtering
4. Better approach: enforce isolation at the ORM/config layer
5. Trade-off: upfront setup cost vs. removing a human-memory dependency
6. Business impact: this is a security posture decision, not a style choice
```

## When to Use
- When writing any post, blog section, or case-study paragraph that needs to be credible to a technical reader and understandable to a non-technical one
- When a first draft reads as either too vague ("we build secure solutions") or too dense (unexplained acronyms and package lists) on re-read
- When translating a client project explanation or proposal section into public content
- When deciding how much code to include — the style rules double as a filter for when a snippet helps versus when it should be cut
- When technical peers are the only audience engaging with a post meant to reach buyers, which usually signals the depth calibration drifted toward "developer" and away from "founder/SME"

## Common Mistakes
- Opening with the technology or tool name instead of the problem it solves, losing non-technical readers in the first sentence
- Making unsupported absolute claims ("always," "never," "X is always better") that read as inexperience rather than authority
- Publishing large, unexplained code blocks in content meant for a mixed or non-technical audience
- Removing all technical substance in an attempt to be "accessible," producing content indistinguishable from generic marketing copy

## Further Reading
- *On Writing Well* — William Zinsser: the classic general reference for clear, jargon-aware nonfiction prose, directly applicable to technical writing for mixed audiences
- [Julia Evans' technical zines and blog](https://jvns.ca) — a widely cited example of explaining deep technical mechanisms in plain, concrete language without dumbing them down
- [Google's Technical Writing courses](https://developers.google.com/tech-writing) — a free, practical curriculum on writing for both technical and non-technical readers
