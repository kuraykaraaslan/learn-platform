# 306. Case Study Structure, Narrative Arc & Operating System

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Case_Study_and_Portfolio_Rules material (case-study-and-portfolio-master.md, case-study-structure.md, before-after-storytelling.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
A portfolio is not a gallery — it's a trust system, and every case study inside it needs to answer seven specific questions: who had the problem, why did it matter, what was difficult, what was built, how were decisions made, what changed, and why should a future client trust the freelancer more after reading this. That last question is the one screenshots and technology logos can never answer on their own. Evidence beats claims as the operating principle throughout: "I build scalable and secure applications" proves nothing, while "I separated Redis slot management from Prisma appointment persistence, added overlap checks, and documented the handover flow to reduce double-booking risk" proves that a real decision was made under a real constraint. Business context has to come before technology in the reading order — problem, then workflow pain, then solution, then technical decisions, then result, then proof, then CTA — because a reader who doesn't yet understand why the project mattered has no reason to care how it was built.

Underneath that ordering sits a three-layer structure that lets one case study serve very different readers without rewriting it twice: a business layer (what problem mattered), a product layer (what workflow or user outcome was designed), and a technical layer (how it was built responsibly). A non-technical buyer can stop reading after the business and product layers and still understand the value; a technical reviewer can keep reading into the technical layer and find something credible there too. The recommended eleven-section skeleton — title, executive summary, context, problem, constraints, solution, key workflows, technical approach, result, what this demonstrates, and CTA — gives that three-layer structure a concrete shape, and an outcome-oriented title ("Turning a Manual Appointment Workflow into a Redis-backed Booking System") does more work than a generic one ("React Admin Panel Project") before the reader has read a single sentence of body copy.

Before-after storytelling is the specific narrative technique that makes the transformation legible rather than just implied. Every case study should define a before-state (manual, unclear, slow, risky, or missing), an after-state (structured, automated, visible, faster, or safer), and the bridge — what was actually built to create the change. The story arc that makes this land is consistent: the client had a painful workflow, that pain created real business cost or risk, the project focused on the highest-value workflow first rather than trying to solve everything at once, the solution turned that workflow into something usable, and the result reduced uncertainty. A before-after table often makes the transformation concrete faster than prose can. The one discipline that has to hold regardless of format: if the exact metric isn't known, say what the system was designed to do rather than inventing a number — "reduced manual work by 80%" without measurement is a claim that can be challenged later, while "designed to reduce manual confirmation work by automating availability checks" is honest and still persuasive.

Format length should match placement rather than being fixed everywhere: a 150–250 word short card for a portfolio grid, 700–1,200 words for a standard website case study page, 1,500–3,000 words for a deep technical case study aimed at technical buyers or proposals, and 150–400 words for a social mini-case. Using one length everywhere either bores a skimming visitor or under-serves a technical reviewer who needed the deeper version.

## Key Concepts
- **The seven questions every case study must answer**: who had the problem, why it mattered, what was difficult, what was built, how decisions were made, what changed, and why the reader should trust more afterward.
- **Evidence beats claims**: specific technical-decision language proves capability; generic adjectives ("scalable," "modern," "secure") prove nothing on their own.
- **Business context before technology**: the reading order is problem → workflow pain → solution → technical decisions → result → proof → CTA, never stack-first.
- **Three-layer structure**: business layer, product layer, technical layer — lets one case study serve non-technical and technical readers without being rewritten twice.
- **Outcome-oriented titles**: "Turning a Manual Appointment Workflow into a Redis-backed Booking System" beats "React Admin Panel Project" before a single sentence of body copy is read.
- **Before / Bridge / After framing**: define the painful before-state, the built bridge, and the improved after-state explicitly, then connect them with a consistent story arc.
- **Never invent a metric**: if the number isn't measured, describe what the system was designed to achieve instead of fabricating a percentage.
- **Length matched to placement**: 150–250 words (grid card), 700–1,200 (standard page), 1,500–3,000 (deep technical), 150–400 (social mini-case).

## Example Code
```md
## Master Case Study Skeleton

# <Project / Case Study Title — outcome-oriented>

## Short Summary
<One paragraph: who it was for, what problem existed, what was delivered.>

## Context
<Business/client/project situation, only what's needed.>

## The Problem
<Concrete pain: manual work, lost visibility, slow approvals, fragile system.>

## Constraints
<Time, budget, legacy system, data, stakeholder, integration limits.>

## Solution
<What was built and why these choices matched the problem.>

## Key Workflows
- <Workflow 1>
- <Workflow 2>
- <Workflow 3>

## Technical Approach
<Architecture, data model, API, security, deployment, trade-offs.>

## Result
<Metric if measured; otherwise verified/observed/intended outcome language.>

## What This Demonstrates
<Why this project should increase a future client's trust.>

## CTA
<Relevant next action.>

## Before/After Transformation Table

| Before                          | After                                  |
|----------------------------------|------------------------------------------|
| Manual slot checking              | Redis-backed availability validation     |
| No clear booking state             | Structured appointment lifecycle         |
| Admin confirms manually             | Automated confirmation flow              |
```

## When to Use
- Writing a new case study from a just-completed project
- Deciding case study length for a specific placement — portfolio grid vs. proposal attachment vs. LinkedIn article
- When a draft reads like a generic project description with no clear before-state or stakes
- When a technical and non-technical reader both need to get value from the same page
- Reviewing an existing case study that opens with the tech stack instead of the business problem

## Common Mistakes
- Opening with technology names instead of the business problem the project actually solved
- Making claims ("scalable and secure") with no specific decision or trade-off backing them up
- Skipping the before-state entirely, leaving the after-state with nothing to contrast against
- Inventing a precise metric ("reduced work by 80%") when the real number was never measured
- Using the same case study length and depth regardless of where it will actually be placed

## Further Reading
- *Made to Stick* — Chip Heath & Dan Heath: the underlying research on why concrete, story-shaped explanations outperform abstract claims
- Nielsen Norman Group's guidance on writing effective case studies (nngroup.com) — evidence-based structure advice that applies directly to portfolio writing
- Harvard Business Review's "How to Write a Case Study" guidance (hbr.org) — a classic reference for structuring a business narrative around a real decision under constraint
