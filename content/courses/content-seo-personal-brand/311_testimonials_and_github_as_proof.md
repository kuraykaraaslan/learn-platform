# 311. Testimonials & GitHub as Proof

## What It Is
Testimonials and GitHub repositories are two different third-party-credibility channels, and both fail for the same underlying reason when handled lazily: a testimonial with no specifics reads as filler, and a repository with no context reads as an unexplained code dump. A strong testimonial mentions at least two of problem, process, communication, technical competence, reliability, result, business impact, or handover/support — generic praise like "great to work with!" transfers almost no trust because it could describe literally anyone. Getting a specific testimonial usually requires guided questions rather than an open-ended ask: what problem were you trying to solve before the project, why did you choose to work with me, what part of the process was most useful, what changed after delivery, would you recommend working with me to similar companies. A request template that offers to draft a short version for the client's approval — based on the actual project — often produces a better, more specific testimonial than asking someone to write one from scratch, since most clients are busy and will otherwise send back one generic sentence.

Placement discipline matters as much as content: testimonials belong distributed near relevant proof — the case study result section, the specific service landing page, a proposal document, the LinkedIn featured section — rather than dumped onto one isolated "testimonials" page nobody visits deliberately. Editing is allowed but bounded: fixing typos, shortening repetitive phrases, and removing private details is safe; adding claims the client didn't make, inventing metrics, or changing the sentiment is not, and any significant edit should get the client's explicit approval before publishing. When a client can't be named, an anonymous format — "Founder, B2B operations company," "Product manager, event platform" — preserves most of the credibility while respecting the confidentiality constraint.

GitHub repositories work the same way for technical reviewers that testimonials work for business buyers, but only when the README does the explaining a real technical reader actually needs: project purpose, the problem solved, features, an architecture overview, the tech stack, setup instructions, testing notes, screenshots or a demo, known limitations, and future improvements. The stack-explanation rule carries over directly from case study writing — "Next.js, Prisma, PostgreSQL, Redis" as a bare list proves nothing, while "Next.js handles the app shell and routing, Prisma manages typed database access, PostgreSQL stores durable application data, and Redis supports fast transient state" proves the same stack was chosen with actual reasoning behind it. Technical proof signals a reviewer actually looks for include a clear folder structure, typed interfaces, a described service layer, test commands, and deployment notes — the things that separate "I can write code" from "I can build something someone else could maintain." The overexposure risk here is specific to code rather than to prose: client repositories, .env files, database dumps, private API credentials, and proprietary business logic should never be published under a personal portfolio without explicit clearance, regardless of how instructive the code would be to show.

## Key Concepts
- **Strong testimonial criteria**: mentions at least two of problem, process, communication, competence, reliability, result, impact, or support — generic praise alone is weak proof.
- **Guided testimonial questions**: asking specific questions (what problem, why you, what changed, would they recommend) produces a usable testimonial far more often than an open-ended request.
- **Distributed placement**: testimonials belong near the relevant case study, service page, and proposal — not isolated on a single, rarely-visited page.
- **Bounded editing rule**: fix typos and trim repetition freely; never add claims or change meaning without the client's explicit approval.
- **Anonymous testimonial format**: "Founder, B2B operations company" preserves most of the credibility when a client can't be named.
- **Portfolio-ready README checklist**: purpose, problem, architecture, stack-with-reasoning, setup, screenshots/demo, limitations, and future improvements.
- **Stack-explanation rule for code, same as prose**: name each technology's actual purpose in the system — a bare list proves nothing about judgment.
- **Code-specific overexposure risk**: client repos, .env files, database dumps, and proprietary logic must never be published without explicit clearance, regardless of instructional value.

## Example Code
```md
## Testimonial Request Template

Hi <Name>, I'm updating my portfolio and would really appreciate a short
testimonial about our work together.

It doesn't need to be long — one or two sentences are enough. It would be
especially helpful if you could mention:
- what problem we worked on
- what changed after the project
- what it was like working with me

If easier, I can draft a short version for your review based on the
project, and you can edit or approve it.

## Portfolio README Skeleton

# Project Name

## Summary
What this project does and why it exists.

## Problem
What business/technical problem it demonstrates.

## Architecture
High-level explanation, optionally with a diagram.

## Tech Stack
Only relevant technologies, each with a stated purpose.

## Getting Started
Install, env, run, test.

## Demo
Screenshots, video, or public URL.

## Limitations
What is intentionally not included.
```

## When to Use
- Right after completing a project, while the outcome is fresh, before requesting a testimonial
- Preparing any public or open-source repository as portfolio proof
- Auditing existing testimonials for genericness and replacing the weakest ones
- Before pushing any client-adjacent code publicly, to check for overexposure risk
- Deciding where a testimonial should live — which case study, service page, or proposal it belongs near

## Common Mistakes
- Asking for "a testimonial" with no guiding questions and receiving one generic, unusable line back
- Inventing or heavily rewriting a testimonial's substance instead of getting explicit client approval for edits
- Publishing a GitHub repository with no README context beyond a raw file listing
- Listing a tech stack with no explanation of why each piece was actually chosen for the project
- Accidentally publishing client-owned code, credentials, or business logic under a personal portfolio repository

## Further Reading
- *Influence* — Robert Cialdini: the social-proof mechanics that explain precisely why a specific testimonial transfers trust and a generic one doesn't
- [GitHub's official guide to writing a great README](https://docs.github.com) — first-party, current guidance on the structure technical reviewers expect
- [Choose a License's plain-language overview of open-source licensing](https://choosealicense.com) — relevant for freelancers safely repurposing client-adjacent code under a personal license
