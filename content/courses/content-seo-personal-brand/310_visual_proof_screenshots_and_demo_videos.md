# 310. Visual Proof, Screenshots & Demo Videos

## What It Is
Visual proof makes work real, but a visual only earns its place if it proves something specific — workflow existence, UI quality, before-after improvement, complexity handled, admin control, or responsiveness. A screenshot dropped in just to fill space proves nothing and actually weakens a case study by making the reader wonder why it's there. Every screenshot needs a caption, context, sanitized data, a consistent resolution, and a clean crop — "Admin request table with status filtering, role-based actions, and export-ready operational data" tells the reader exactly what they're looking at and why it matters, while an unexplained screenshot forces them to guess. Different visual types serve different jobs: a hero screenshot shows final product quality, a workflow sequence shows how users move through the system, a before-after image shows transformation directly, an architecture diagram shows technical thinking — and a diagram with no accompanying explanation is decoration, not proof, exactly the same failure mode as an unexplained screenshot. The recommended visual ordering inside a case study follows the same logic as the written narrative: hero result screenshot, then before/problem visual, then core workflow screenshots, then technical diagram, then result/proof visual, then CTA — visuals should reinforce the story arc, not scatter randomly through the page.

Demos extend the same proof logic into motion, and the standard is a defined purpose, a realistic scenario, safe data, one core workflow, and a caption or script — never a feature-by-feature tour clicking randomly through every screen. A useful demo scenario reads like an actual user story: a customer books an appointment, an admin approves a request, a manager filters and exports reports. The demo script template makes this concrete — state the role and the business problem, show the key decision or feature, walk through the steps, end with the result, and name the capability the demo just demonstrated. Length should match where the demo lives: 30–60 seconds for a social media teaser, 2–4 minutes for a portfolio demo, 5–8 minutes for a technical walkthrough aimed at a developer reviewer — using a technical-walkthrough length for a social teaser loses the audience before the point lands.

The non-negotiable layer underneath both screenshots and demos is safety: use demo data only, remove real names, remove real emails and phone numbers, hide credentials and environment variables, disable destructive actions or reset demo data after recording, and never expose admin-only production routes or internal URLs. A demo that's technically impressive but exposes a real client's production data or a live admin panel isn't proof of competence — it's evidence of carelessness, and it undermines exactly the trust the demo was supposed to build. Both screenshots and demos should end the same way a written case study does: with a soft CTA connecting the specific capability just shown to the reader's own likely situation, rather than ending abruptly once the workflow finishes.

## Key Concepts
- **Every visual proves one specific thing**: workflow existence, UI quality, before-after improvement, complexity handled, or admin control — never included "just to fill space."
- **Screenshot completeness**: caption + context + what-it-proves + sanitized data + clean crop, every time, with no exceptions for "obviously self-explanatory" images.
- **Diagrams need explanatory text**: an architecture diagram with no accompanying explanation is decoration, not proof — cut it or explain it.
- **Recommended visual ordering**: hero result → before/problem visual → core workflow screenshots → technical diagram → result/proof visual → CTA.
- **Demo-scenario rule**: script a realistic user journey (customer books, admin approves) rather than clicking randomly through the product.
- **Demo script template**: role → business problem → key decision/feature → steps → result → capability demonstrated.
- **Length matched to placement**: 30–60 sec social teaser, 2–4 min portfolio demo, 5–8 min technical walkthrough.
- **Demo safety checklist as a pre-publish gate**: demo data only, no real names/emails/phones, hidden credentials, disabled destructive actions, no exposed admin-only production routes.

## Example Code
```md
## Demo Script Template

In this demo, I will show how <user role> completes <core workflow>.
The business problem was <pain>.
The key part of the solution is <decision/feature>.
First, the user <step 1>.
Then, the system <step 2>.
Finally, the admin/user can <result>.
This demonstrates <capability>.

## Screenshot Caption Examples

Good:  "Admin dashboard showing appointment slot filters and booking status
        table."
Weak:  "screenshot1" / "image" / "project photo"

## Demo Safety Checklist (before publishing)

[ ] Demo data only, no real customer records
[ ] Real names, emails, and phone numbers removed
[ ] Credentials and environment variables hidden
[ ] Destructive actions disabled or demo data reset after recording
[ ] No admin-only production routes exposed
[ ] No internal URLs or client secrets visible

## Visual Ordering in a Case Study

1. Hero result screenshot
2. Before/current-problem visual (if available)
3. Core workflow screenshots
4. Technical diagram (with explanation)
5. Result/proof visual
6. CTA
```

## When to Use
- Selecting which screenshots or recordings to include in a new case study
- Recording any demo video, live or asynchronous, before it's published anywhere
- Auditing an existing case study where visuals feel random or go unexplained
- Before publishing any screen recording that touches a real or client-adjacent environment
- When an architecture diagram exists but has no explanatory text around it

## Common Mistakes
- **A screenshot is dropped into a case study with no caption explaining what it proves** — Dropping in screenshots with no caption, context, or explanation of what they prove
- **A demo video walks through every feature at equal length** — Demoing every feature equally instead of the one workflow that actually proves the point
- **A screen recording runs against a real environment with live delete buttons still active** — Recording a walkthrough against a real environment without disabling destructive actions first
- **A portfolio demo for a business buyer runs as long as an internal technical walkthrough** — Making a portfolio demo as long as a technical walkthrough, losing a business-buyer audience before the point lands
- **An architecture diagram sits in a case study with no surrounding text** — Including an architecture diagram with no accompanying text, leaving it as pure decoration

## Further Reading
- *Show Your Work* — Austin Kleon: a useful mindset shift for treating process visibility itself as proof worth sharing, relevant to both screenshots and demos
- [Wistia's guide to product demo videos](https://wistia.com) — current, practical detail on structuring and pacing a demo for different audiences and lengths
- [OWASP's guidance on sanitizing screenshots and redacting sensitive data](https://owasp.org) — a technical baseline for what genuinely needs to be hidden before a screen recording or screenshot goes public
