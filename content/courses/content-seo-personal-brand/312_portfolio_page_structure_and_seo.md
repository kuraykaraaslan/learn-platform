# 312. Portfolio Page Structure & SEO

## What It Is
A portfolio page should behave like a guided path to proof, not an unstructured gallery, and the required elements reflect that: a positioning headline, a short proof statement, featured case studies shown first, category filters, consistent project cards, a trust strip, and a CTA. The featured-first rule matters more than it sounds — the two or three strongest case studies belong above everything else, because a visitor who never scrolls past the first section should still walk away understanding the strongest available proof. Filters should mirror how a buyer would describe their own need rather than internal project names — "SaaS MVP," "Admin Panel," "Dashboard," "Automation," "Ticketing/Booking" — so a visitor can self-select into the category most relevant to them instead of scanning everything. Every project card follows the same discipline the case studies themselves follow: lead with a one-line outcome, then the project type, then stack tags, then a proof badge and link — never a card that lists only technologies with no stated outcome, which is exactly the "modern, scalable app" failure mode showing up at the card level instead of the case-study level.

Search and answer-engine treatment for portfolio and case-study pages specifically needs its own formulas, distinct from generic page SEO, because a case study is trying to signal something a normal page isn't: "this is evidence." The title formula — `<Project Outcome> | <Project Type> Case Study` — names both the result and the genre in one string, which is why "Custom Appointment Booking System | SaaS Workflow Case Study" outperforms a plain project name for both search relevance and click quality. The meta description formula follows the same logic in sentence form: "Case study showing how \<problem/context\> was solved with \<solution\>, including \<technical/business proof\>" — naming the problem and the proof type up front, not just the topic. A clean, case-study-specific heading structure (H1 as the outcome title, then Summary, Context, Problem, Solution, Technical Approach, Result, Proof, Related Services) gives both a skimming human and a crawler the same predictable shape to parse.

Internal linking closes the loop between the case study and the commercial page it's actually supposed to support — every case study should link to the related service page, a relevant technical blog post, the portfolio category page, and the contact or project-review page, while the service page links back to its supporting case studies. A case study with no link to the service it demonstrates is commercially orphaned even if it's technically reachable and well-written — nobody who reads it and gets convinced has an obvious next click toward the thing they'd actually pay for. Image alt text follows the same descriptive discipline as everywhere else in the portfolio: "Admin dashboard showing appointment slot filters and booking status table" instead of "screenshot1" or "image." None of this — titles, descriptions, headings, links, alt text — should come at the expense of the trust the page is trying to build; SEO here supports the case study's real job of converting a qualified visitor, it doesn't compete with it.

## Key Concepts
- **Portfolio page must-haves**: positioning headline, proof statement, featured case studies (strongest 2–3 first), filters, consistent project cards, trust strip, CTA.
- **Featured-first ordering**: the strongest case studies go above everything else, so even a visitor who doesn't scroll sees the best available proof.
- **Buyer-language filters**: category filters should mirror how a prospect describes their own need ("SaaS MVP," "Admin Panel") rather than internal project naming.
- **Outcome-first project cards**: lead with a one-line outcome before stack tags — a card listing only technologies proves nothing, the same failure as a stack-first case study.
- **Case-study title formula**: `<Project Outcome> | <Project Type> Case Study` — signals both the result and the genre in one string.
- **Meta description formula**: "Case study showing how \<problem/context\> was solved with \<solution\>, including \<technical/business proof\>" — written for click quality, not click volume.
- **Bidirectional internal linking**: every case study links to its supporting service page, and the service page links back — a case study with no link to a service is commercially orphaned.
- **Descriptive alt text as default**: alt text should describe what's actually shown and why it matters, never a generic placeholder.

## Example Code
```template
## Portfolio Page Skeleton

Hero: Selected software projects, MVPs, dashboards, and technical systems
      built to solve real business workflow problems.
Subheadline: Each case study explains the business problem, product scope,
             technical approach, and proof behind the delivery.

Featured Case Studies (2-3 strongest, shown first)
Filters: SaaS MVP | Admin Panel | Dashboard | Automation | Ticketing/Booking
Project Cards (consistent structure, see below)
Proof Strip: project count, industries served, testimonials, GitHub links
CTA: "Have a similar workflow or MVP idea? Start with a project review."

## Project Card Template

## <Project Title>
**Type:** SaaS MVP / Dashboard / Integration / UI System
**Problem:** <one sentence>
**Solution:** <one sentence>
**Proof:** Demo / Screenshot / Case Study / GitHub / Testimonial
**Stack:** <only relevant technologies>
**CTA:** View case study

## Case Study SEO Formulas

Title: Custom Appointment Booking System | SaaS Workflow Case Study
Meta:  Case study showing how a manual appointment workflow was redesigned
       into a Redis-backed booking system with structured slot management,
       appointment persistence, and admin control.

Heading structure:
H1: Project outcome title
H2: Summary / Context / Problem / Solution / Technical Approach / Result /
    Proof / Related Services
```

## When to Use
- Designing or rebuilding the portfolio/work page from scratch
- Publishing a new case study and deciding its title, meta description, and internal links
- Auditing why portfolio visitors bounce without reaching a single case study
- When case studies aren't showing up in search for relevant, specific queries
- Reviewing project cards that read as a technology list with no stated outcome

## Common Mistakes
- **The main portfolio page lists a dozen small projects instead of the strongest 2-3** — Putting every small project on the main portfolio page instead of featuring the strongest 2–3
- **A project card lists "React, Node.js, PostgreSQL" and nothing about the outcome** — Writing project cards that list only technologies with no outcome statement
- **A case study's page title reads like any other blog post** — Giving a case study a generic page title indistinguishable from a blog post
- **A case study exists with no link to the service page it's meant to support** — Publishing a case study with no link to the service page it's supposed to support, leaving it commercially orphaned
- **A proof screenshot's alt text just says "image" or "screenshot1"** — Using placeholder alt text ("image," "screenshot1") on proof screenshots that actually need to describe real content

## Further Reading
- [Baymard Institute's research on portfolio and work-page UX patterns](https://baymard.com) — evidence-based guidance on how visitors actually scan project listings
- [Google Search Central's guidance on titles and structured page content](https://developers.google.com/search) — first-party detail on how case-study-style titles get parsed and displayed
- A well-regarded developer-portfolio teardown or gallery roundup (e.g., from a respected design/dev publication) — useful as a model reference for featured-first, outcome-led portfolio structure
