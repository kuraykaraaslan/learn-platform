# 100. Creating a Reference Resource — Course, Guide, or Tool in Your Domain

## What It Is
A reference resource is a comprehensive, structured piece of content or tooling that becomes the go-to resource for a specific audience solving a specific class of problem. Examples: a course that teaches full-stack SaaS architecture; a guide that is the definitive reference for multi-tenant Next.js; a CLI tool that scaffolds new projects following a specific pattern; an open-source boilerplate with documentation comprehensive enough to teach while enabling. What distinguishes a reference resource from a blog post or a talk is that it is designed to be returned to repeatedly, not consumed once.

The leverage of a reference resource is unlike any other form of content. A blog post reaches people once. A course, guide, or tool becomes the resource that people search for when they are ready to build what you build. The developer looking to start a multi-tenant SaaS in 2027 will find your resource the same way a developer in 2025 would — the relevance does not expire as quickly as news or opinion content. When that developer needs help, they know exactly where to go. When that developer becomes a buyer, they already trust you.

Most developers who could write a reference resource believe they have nothing to write, because the raw material does not look like content while it is still work: a boilerplate refined across four client projects, the checklist you follow before every deploy, the architecture decisions you can now defend without thinking. The audit worth running is mechanical — list the artifacts you already maintain (templates, scaffolds, internal rules, runbooks, decision records), then ask which of them a stranger would pay to skip building. That intersection, not a blank page, is where a reference resource starts. The real question is rarely whether you have the content; it is which format to extract it into first, and how to build an audience for it before or alongside building it.

## Key Concepts
- **Audience specificity**: The more specific the audience ("solo full-stack developers building their first SaaS on Next.js"), the more resonant the resource — broad resources compete with everything; specific resources own a niche
- **Format-audience fit**: Courses suit learners who want step-by-step guidance; guides suit practitioners who want reference material they can consult; tools suit developers who want to skip setup and start building; choose based on what your audience actually buys
- **The "build in public" strategy**: Documenting your creation process on LinkedIn, Twitter/X, or a blog while building the resource creates an audience before the resource is complete; it also generates feedback that improves the resource before release
- **Pre-selling**: Offering the resource for purchase before it is complete (with a clear delivery timeline) validates demand before you invest the full creation time; if nobody buys a pre-sale, the market signal is valuable
- **Minimum viable resource**: A 1-hour focused course or a 20-page guide that is complete and excellent beats a 40-hour course that is never finished; ship an MVP, get feedback, expand based on demand
- **Content-to-tool pipeline**: Internal rules and conventions are content; extracting them as a CLI tool, a linter config, or a scaffolding generator is the same knowledge in a form a developer can use before they have read anything
- **Evergreen vs. time-sensitive**: Resources about architecture patterns and business principles age slowly; resources about specific library APIs age quickly; weight your resource toward the former
- **Platform choices**: Gumroad and Lemon Squeezy for digital products; Maven and Podia for courses; GitHub for tools; your own domain for guides that serve as SEO content

## Example Code or Template

```markdown
# Reference Resource Planning Template

## 1. Audience Definition (be specific)
Primary audience: [describe them in one sentence, including their current situation
and what they are trying to achieve]

Example: "Solo developers who have 1–3 years of full-stack experience and are
building their first multi-tenant SaaS product on Next.js, trying to avoid the
architectural mistakes that turn into 6-month refactors."

## 2. The Problem You Are Solving
What does your audience currently do when they need this knowledge?
- [ ] Search Stack Overflow with inconsistent results
- [ ] Read 40 different blog posts that contradict each other
- [ ] Watch a tutorial that covers the basics but not the hard parts
- [ ] Ask in Discord and get three different answers
- [ ] Just guess and pay the refactoring tax later

Your resource replaces all of the above with one authoritative, complete source.

## 3. Resource Format Selection

| Format      | Best for                        | Creation time | Revenue model       |
|-------------|---------------------------------|---------------|---------------------|
| Written guide| Reference, SEO, long-form      | 2–4 weeks     | Free (lead gen), Paid PDF |
| Course      | Step-by-step skill development  | 4–12 weeks    | One-time or subscription |
| CLI tool    | Workflow automation              | 1–3 weeks     | Free (OSS), Paid pro tier |
| Boilerplate | Project scaffolding             | Ongoing       | Free + paid support |
| Newsletter  | Ongoing relationship             | Ongoing       | Sponsorships, affiliate |

Worked example — a developer with a production boilerplate and a set of
internal architecture rules has three plausible extractions:
1. A paid guide: "The Solo SaaS Developer's Architecture Handbook"
2. An open boilerplate + paid course: "Build Multi-Tenant SaaS with Next.js"
3. A CLI tool that scaffolds a configured multi-tenant project from those rules

## 4. Content Outline (table of contents first)
[Write the full table of contents before writing any content.
This is your commitment to the reader about what they will get.
Share the outline publicly to get feedback before writing.]

## 5. Minimum Viable Version
What is the 20% of content that delivers 80% of the value?
This is your first release.

After release: add more sections based on what readers ask for most.

## 6. Build-in-Public Plan
Before launch:
- [ ] Week 1: Announce the resource and the problem it solves (LinkedIn + Twitter/X)
- [ ] Week 2-N: Share one insight from the resource per week ("here's one thing from
      the guide I'm working on: [specific tip]")
- [ ] Two weeks before launch: Share the table of contents and ask for feedback
- [ ] One week before launch: Pre-sale announcement with early-bird pricing

After launch:
- [ ] Share a "behind the scenes" post about building it
- [ ] Share testimonials or reader results as they come in
- [ ] Post excerpts and expand them into full posts/talks

## 7. Revenue Model
[ ] Free (goal: audience building, inbound client leads)
[ ] One-time purchase: $29–$149 for a guide, $99–$499 for a course
[ ] Subscription: access to ongoing updates
[ ] Free base + paid premium tier (freemium OSS model)
[ ] Free content + paid consulting (resource as top of funnel)

Recommended starting point for your situation:
→ Free open-source boilerplate (visibility) +
  Paid guide/course (revenue) +
  Monthly retainer clients sourced from both (primary revenue)
```

---

```markdown
# Extraction Worksheet — Worked Example

Filled in for a developer whose assets are a production multi-tenant
boilerplate and a documented set of internal architecture rules. Replace
the assets with your own and the three options fall out the same way:

## Option A: "The Multi-Tenant Next.js Handbook"
**Format**: Comprehensive written guide (PDF + web)
**Audience**: Developers starting a B2B SaaS on Next.js
**Unique edge**: the problems were solved in production first and formalized
  into written rules second — the combination is what a reader cannot get from
  documentation alone
**Estimated creation time**: 3–4 weeks (much of the content is already written)
**Monetization**: $49–$99 one-time; or free web version with paid PDF

## Option B: "Build and Launch a Multi-Tenant SaaS" Course
**Format**: Video course (12–20 hours) with code repository
**Audience**: Same as above but prefers watching to reading
**Your unique edge**: You can show the full boilerplate being built from scratch,
  explaining every decision as you make it
**Estimated creation time**: 8–12 weeks
**Monetization**: $149–$299 one-time on Gumroad or your own site

## Option C: `create-saas` CLI Tool
**Format**: npm package that scaffolds a new project from your boilerplate
**Audience**: Developers who want a running Next.js multi-tenant SaaS in minutes
**Your unique edge**: Your boilerplate is already production-ready — the CLI
  is just a distribution layer
**Estimated creation time**: 1–2 weeks
**Monetization**: Free (OSS) — feeds clients into your consulting practice
```

## When to Use
- When you find yourself explaining the same architectural pattern for the third time to a client or Discord member — that explanation is the first chapter of your guide; capture it
- When your boilerplate is stable and well-documented — this is the right time to build a "create-saas" CLI tool or a course; an unstable foundation makes course creation twice as hard
- When you want to reduce client dependency for income — a resource that sells while you sleep is the first step from "trading time for money" to "compounding intellectual property"
- When you want to attract a specific client profile without outbound sales — a reference resource that your ideal client uses before they know they need you is the most efficient inbound channel
- When you have delivered the same type of project three or more times — you have enough pattern recognition to teach it; the question is only which format to use

## Common Mistakes
- **Waiting to know everything before starting**: The best time to write a guide or build a course is when you are one year ahead of your audience — close enough to remember the struggles, far enough to know the solutions; waiting until you are ten years ahead means you have forgotten what was hard
- **Making it too broad**: A course titled "Full-Stack SaaS Development" competes with everything from Udemy to bootcamps; a course titled "Multi-Tenant SaaS with Next.js, TypeORM, and Stripe" is the only course with that specific coverage — specificity wins
- **Building in private until it is perfect**: A resource built entirely in private with no feedback has a high probability of being wrong about what the audience needs; build in public, share outlines and excerpts, and let audience feedback guide the final 30% of the resource
- **Pricing out of fear**: Developers consistently under-price their knowledge resources; a $29 guide requires 10× more buyers than a $299 guide for the same revenue; pricing at what a single hour of your consulting time costs is a reasonable floor for a comprehensive resource

## Further Reading
- **"Productize Yourself" — Paul Jarvis (pjrvs.com/productize)** — The foundational essay on turning individual expertise into scalable digital products; directly applicable to converting your rulesets into a resource
- **"The Knowledge Commerce Blueprint" — Podia blog** — Practical guide to choosing formats, pricing, and platforms for digital knowledge products; includes data on conversion rates across formats
- **"Show Your Work!" — Austin Kleon** — Short, motivating treatment of why sharing your process while building a resource creates an audience that your competitors who build in private never develop; essential reading before you start any build-in-public effort
