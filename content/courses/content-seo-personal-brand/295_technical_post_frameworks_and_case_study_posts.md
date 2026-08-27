# 295. Technical Post Frameworks and Case Study Posts

## What It Is
Technical posts on LinkedIn have a specific job: prove expertise without becoming unreadable, by translating engineering complexity into business-relevant judgment. Every technical post needs a specific problem, an engineering trade-off, a recommended approach, a business/project impact, and a clear takeaway — a raw code dump with no context isn't a technical post, it's a snippet with no argument attached. Five recurring frameworks cover most of what's worth writing: **Problem → Pattern → Payoff** ("If your admin panel has permissions only in the UI, you do not have authorization. You have decoration."); **Mistake → Consequence → Better Rule**, which names a common implementation error, what breaks later, and the principle that prevents it; the **Architecture Decision Record post** (Context, Decision, Alternatives, Why this choice, Trade-off), which mirrors how real engineering teams document decisions; the **Hidden Complexity post** ("People think ticketing is just 'buy a ticket.' Actually, it includes event timing, venue sections, seat locks, payment state, QR validation, refunds, capacity, and fraud prevention"), which is one of the highest-performing formats because it rewards the reader with genuine insight into what they didn't know to ask; and the **Checklist post**, a numbered list of what to clarify before building a given kind of system. Depth should generally stay at Level 1 (business-friendly explanation) plus Level 2 (architecture/pattern explanation) for most posts, with Level 3 (code or schema detail) used occasionally as proof rather than as the default format.

Case study posts are the highest-value proof format available and deserve their own discipline: a complete one needs context, problem, constraint, solution, the technical/process decision actually made, a result or expected value, a takeaway, and a CTA — screenshots alone, with no explanation, are not a case study post. Because one real project usually contains too much for a single post, breaking it into a series (business problem → scope/MVP decisions → data model challenge → UI/admin workflow → deployment/handover → lessons learned) produces several weeks of high-quality content from one piece of real work instead of exhausting it in a single post. For confidential work, a sanitized template works well: describe the client generically ("a B2B operations team"), name the deceptively-simple-sounding request ("we need a dashboard"), then reveal the real scope hidden underneath it (role-based access, approval states, searchable records, exportable reports, audit-friendly actions) — the lesson usually isn't about the technology at all, it's that "the value is not the table, the value is operational clarity."

## Key Concepts
- **Every technical post needs five elements**: specific problem, engineering trade-off, recommended approach, business/project impact, and a takeaway or CTA.
- **Problem → Pattern → Payoff**: name what goes wrong, how to structure or solve it, and why it matters to product/client/maintainability.
- **Mistake → Consequence → Better Rule**: a common implementation error, what breaks later, and the practical principle that prevents it.
- **Architecture Decision Record post**: Context, Decision, Alternatives, Why this choice, Trade-off — borrowed directly from real engineering documentation practice.
- **Hidden Complexity post**: "People think X is simple. Actually it includes..." — one of the strongest formats because it delivers genuine, specific insight.
- **Three depth levels**: business-friendly (Level 1), architecture/pattern (Level 2), code/schema detail (Level 3) — default to Level 1+2, use Level 3 occasionally as proof.
- **Complete case-study post anatomy**: context, problem, constraint, solution, technical/process decision, result, takeaway, CTA — never screenshots alone.
- **Case study series over single mega-post**: break one real project into 5-6 posts (business problem, scope decisions, data model, UI/workflow, deployment/handover, lessons) rather than exhausting it in one.

## Example Code
```md
## Hidden Complexity Post Template

People think <feature> is simple.
Actually, it includes:
- item
- item
- item
The safe way to scope it is...

## Case Study Series Breakdown (one project → six posts)

Post 1: business problem
Post 2: scope/MVP decisions
Post 3: data model challenge
Post 4: UI/admin workflow
Post 5: deployment/handover
Post 6: lessons learned

## Sanitized Case Study Post

A B2B operations team had a familiar problem:
Their workflow lived across spreadsheets, WhatsApp messages, and manual
status updates.

The software request sounded simple: "We need a dashboard."

But the real scope was:
- role-based access
- approval states
- searchable records
- exportable reports
- audit-friendly actions

This is why I do not treat admin panels as "just CRUD."
The value is not the table. The value is operational clarity.
```

## When to Use
- When writing a technical post and needing a structural framework instead of starting from a blank page
- When a completed project has more depth than fits in one post, and needs to become a series instead
- When a raw code snippet feels tempting to post but has no business-relevant argument attached yet
- When deciding how much technical depth to include for a mixed LinkedIn audience of buyers and peers
- When turning confidential client work into proof content that needs sanitizing first

## Common Mistakes
- Posting code with no context about why the decision mattered
- Publishing a case study post that's just a screenshot with a caption and no problem/solution narrative
- Cramming an entire project's worth of technical detail into a single overwhelming post instead of a series
- Defaulting to Level 3 (code/schema) depth on every post instead of reserving it as occasional proof
- Making a client look incompetent or exposing confidential details while telling a case study story

## Further Reading
- Julia Evans' technical zines and blog (jvns.ca) — a widely cited example of explaining deep technical mechanisms in plain, concrete language
- Michael Nygard's "Documenting Architecture Decisions" (the original ADR format article) — the direct source for the Architecture Decision Record framework
- Justin Welsh's and Wes Kao's writing on technical/expertise-based LinkedIn content — current, practitioner-level examples of the hidden-complexity and mistake-consequence formats in practice
