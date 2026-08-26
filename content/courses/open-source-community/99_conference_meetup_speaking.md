# 99. Conference / Meetup Speaking

## Coverage Level
**Not Covered** — Speaking at conferences and meetups is the highest-leverage form of developer visibility. One 30-minute talk at a relevant conference reaches a targeted audience of potential clients and collaborators more effectively than months of LinkedIn content.

## What It Is
Conference speaking is the practice of presenting a technical topic to an audience of developers at an organized event — a local meetup (10–100 people), a regional conference (100–500 people), or a major international conference (500–5,000+ people). The skill involves not just technical knowledge but the ability to structure that knowledge as a narrative, deliver it under time pressure to an unfamiliar audience, and handle questions in real time.

The entry point to conference speaking is almost universally the local meetup, not the major conference. Local JavaScript, TypeScript, or SaaS meetups — nearly every city with a tech scene has several — are actively looking for speakers. A 20-minute talk at a local meetup is where you calibrate your material, develop your delivery, and build the track record that conference program committees want to see. Submitting a CFP (Call for Proposals) to a major conference with zero speaking history is nearly always unsuccessful; submitting with three meetup talks and one recorded video on YouTube is competitive.

The strategic value of speaking is different from the value of writing. Writing reaches people who search for your topic; speaking reaches people who were not specifically looking for you but encounter you in a room they chose to be in. The in-person credibility transfer that happens in a conference talk — the audience sees your expertise demonstrated live, asks questions you answer confidently, and connects with you after the talk — is a qualitatively different signal than any written content. For a developer building a client practice, one talk at a relevant conference is routinely worth multiple client inquiries.

## Key Concepts
- **CFP (Call for Proposals / Call for Papers)**: The open invitation that conferences publish when they are accepting talk submissions; each CFP has a deadline, format requirements, and topic focus
- **Abstract vs. talk**: The CFP submission is a 150–300 word abstract that sells the talk to the program committee; the talk is what you actually deliver; write the abstract to optimize for acceptance, then build the talk to deliver on the abstract's promise
- **Talk formats**: Lightning talks (5 minutes, good for first-timers), standard talks (20–30 minutes), and longer sessions (45–60 minutes); start with lightning talks and standard talks before committing to longer formats
- **Program committee review criteria**: Relevance to the conference audience, specificity of the topic (not "everything about Next.js" but "one insight about multi-tenant routing in Next.js"), the speaker's apparent expertise, and originality
- **Slide design fundamentals**: One idea per slide; code slides use large font (minimum 24pt) and short snippets; avoid walls of text; use contrast for emphasis; dark backgrounds for code-heavy talks in large rooms
- **Talk rehearsal**: A talk you have not rehearsed out loud is a draft, not a talk; rehearse at full speed with slides at least three times before the first public delivery; time yourself every time
- **Conference CFP tracking**: papercall.io, Sessionize, and Lanyrd aggregate CFPs from hundreds of conferences; set up alerts for your technology tags
- **Recording and reuse**: Most talks can be given at multiple venues; one core talk can be adapted for three different conferences and five meetups; record every talk if the venue will not

## Example Code or Template

```markdown
# CFP Submission Template

## Talk Title
[Specific, outcome-focused — avoid "Introduction to X" or "Everything About Y"]
Good: "Row-Level Security in Next.js: Preventing Tenant Data Leaks at the Query Layer"
Good: "From Gut Feeling to Confidence Intervals: Estimating SaaS Projects Without Getting Burned"
Avoid: "Multi-Tenant SaaS with Next.js" (too broad)
Avoid: "How I Built My SaaS" (too vague)

---

## Abstract (150–300 words)
[First sentence: the problem the audience recognizes]
[Second sentence: why the standard approach is insufficient]
[One paragraph: what you will show and why it is different]
[Last sentence: what the audience will walk away able to do]

Example:
"Every multi-tenant SaaS app needs to prevent tenants from seeing each other's data.
The standard answer — 'add a WHERE tenant_id = ? clause everywhere' — sounds simple
but fails in practice: it requires every developer who writes a query to remember the
filter, and one forgotten clause exposes all your tenants' data.

In this talk, I'll show a different approach: enforcing tenant isolation at the ORM
configuration layer using TypeORM and Next.js middleware, so that queries without
the tenant filter simply do not run. We'll look at real code from a production
multi-tenant SaaS, cover the edge cases (admin endpoints, cross-tenant reporting,
background jobs), and discuss the performance tradeoffs of the approach.

You'll leave with a concrete pattern you can implement in a day, a set of tests
that verify the isolation is working, and a mental model for thinking about
security at the framework layer rather than the query layer."

---

## Talk Outline (for the program committee — 5–7 bullet points)
- Problem: why WHERE clause filtering fails at scale
- Pattern: tenant context propagation via Next.js middleware
- Code walkthrough: TypeORM data source scoping
- Edge cases: admin access, cross-tenant operations, background jobs
- Testing the isolation: what to verify and how
- Performance tradeoffs and when to use a different approach
- Q&A

---

## Speaker Bio (50–100 words)
[Write in third person; mention relevant experience without overselling]

"[Your name] is a full-stack developer and solo SaaS founder who builds and operates
multi-tenant SaaS products using Next.js, TypeScript, and PostgreSQL. They have been
building production SaaS applications as a freelancer for [N] years and maintain an
open-source boilerplate for multi-tenant Next.js applications used by [X] developers."

---

## Previous Speaking Experience
[List all previous talks, even informal ones. None is fine for meetup submissions.]
- [Date]: [Event name] — [Talk title] (lightning talk / standard talk)
- [Link to recording if available]

---

## Notes for the Program Committee (optional)
[Any context that helps them evaluate the talk: demo availability, unique angle,
why this topic is relevant now, why you are specifically qualified to give this talk]
```

```markdown
# Talk Preparation Timeline (for a 30-minute standard talk)

## T-6 weeks: Topic and abstract finalized
- [ ] CFP submitted
- [ ] Core insight stated in one sentence (the "so what" of the entire talk)

## T-4 weeks: Structure and outline
- [ ] Talk outline written (7–10 major points)
- [ ] Code examples drafted (these often take longer than the slides)
- [ ] Key demo identified and built

## T-2 weeks: Slides drafted
- [ ] First full slide draft complete
- [ ] First timed run-through: target 80% of time limit
- [ ] One person has given feedback on the draft

## T-1 week: Rehearsal
- [ ] Three full-speed rehearsals with slides, timed
- [ ] All code demos tested on a clean environment
- [ ] Q&A anticipated: write 5 questions you expect and draft answers

## T-1 day: Final check
- [ ] Slides accessible in at least two formats (local + cloud backup)
- [ ] Font sizes readable from 10 meters away
- [ ] Demo on a device you control, not relying on conference WiFi
```

## When to Use
- When you have a talk topic from your Stack Overflow answers, blog posts, or client work — the same material that makes a good post makes a good talk; repurpose content into multiple formats
- When you have a technical insight that has no good public treatment — conference talks about specific production experiences ("what I learned running a multi-tenant SaaS for 3 years") are more interesting to program committees than topic overviews
- When building a client pipeline in a specific vertical — speaking at industry conferences (not just developer conferences) reaches the buyer, not the developer; a talk at a SaaS founder conference is more client-generative than one at a JavaScript conference
- When you want to establish thought leadership in TypeScript/Next.js/multi-tenant SaaS — a recorded conference talk on YouTube is permanent, searchable, and compounds indefinitely
- When a past client testimonial or case study is compelling — with the client's permission, a "how we built X for client Y" talk is one of the most compelling formats for a technical audience that also makes purchase decisions

## Common Mistakes
- **Submitting to major conferences before speaking at meetups**: A JSConf CFP with no speaking history has a single-digit acceptance rate; a local TypeScript meetup CFP with no history has a > 50% acceptance rate; build the track record first
- **Making the abstract too broad**: "I'll talk about multi-tenant SaaS" is a topic, not a proposal; "I'll show how to enforce tenant isolation at the TypeORM data source layer with code examples" is a talk — specificity is what gets accepted
- **Not rehearsing out loud**: Reading slides silently is not rehearsal; you must rehearse speaking at full speed to discover which transitions are awkward, which code examples need simplification, and whether you are within the time limit
- **No clear takeaway**: A talk that ends with "and that's my experience building SaaS" gives the audience nothing to act on; define the one thing you want every attendee to do differently starting tomorrow and state it explicitly in the closing

## Further Reading
- **"Demystifying Public Speaking" — Lara Hogan (larahogan.me)** — The most practical guide to conference speaking specifically for developers; covers finding your topic, writing the abstract, handling nerves, and post-talk follow-up
- **"Speaking.io" — Zach Holman (speaking.io)** — A curated collection of advice from experienced conference speakers on every aspect of talk preparation and delivery; free to read online
- **Notist (noti.st) and Speakerdeck (speakerdeck.com)** — Platforms for hosting and sharing your slide decks; publishing your slides after a talk gives the audience a reference and increases the talk's findability online
