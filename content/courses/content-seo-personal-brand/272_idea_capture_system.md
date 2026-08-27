# 272. Idea Capture — Turning Daily Work Into a Content Backlog

## What It Is
The single biggest reason technical people stop publishing isn't lack of skill — it's staring at a blank page waiting for "an idea" to arrive. Idea capture solves this by treating idea generation as a separate, lightweight, ongoing habit that happens *during* work rather than a dedicated brainstorming session that happens *before* writing. The insight is that a working developer's day already contains a dozen pieces of raw content: a client question that revealed a misconception, a bug that took two hours to track down, an architecture trade-off you talked yourself into or out of, a code review comment you had to explain twice.

The system has two parts: a low-friction capture habit, and minimal structure applied at capture time so a raw idea doesn't get lost in an unsearchable pile of notes. The habit is simple — at the end of each work session or day, spend two minutes answering a handful of prompts ("What did I explain today? What did I fix? What did a client misunderstand? What trade-off did I make?") and write down anything that surfaces, even if it feels too small or too obvious to be a real post. The structure is equally light: each captured idea gets a source, a likely pillar, an audience, and a status (raw, approved, drafting, scheduled, published, archived) — enough metadata that six weeks later you can find "that thing about Redis overlap checks" without scrolling through months of notes.

The reason "too obvious to be a post" is a trap worth naming explicitly: something that took you two hours to figure out because you already know the domain will take someone else two hours too, and they will search for exactly the phrase you'd use to describe it. Familiarity is not the same as universality — the things that feel unremarkable to you because you do them daily are often the most valuable things you can write down, precisely because nobody who *doesn't* do them daily has bothered to explain them clearly.

Idea capture only works if it's genuinely lightweight. A complex tagging taxonomy or a heavyweight editorial system defeats the purpose for a solo operator — the entire point is to lower the cost of not losing a good idea to zero, not to create a second job managing an idea database.

## Key Concepts
- **Capture at the source, not from memory**: Ideas captured immediately after the triggering event (a bug, a client call, a decision) retain detail that gets lost within a day; waiting for "later" usually means never.
- **The daily capture prompts**: "What did I explain today? What did I fix? What did I decide? What did a client misunderstand? What trade-off did I make?" — a five-question ritual that takes under two minutes.
- **Minimum viable metadata**: raw idea, source, likely pillar, audience, format potential, proof/example available, status — enough to resurface an idea later without over-engineering the system.
- **Idea sources beyond "inspiration"**: client questions, proposal objections, discovery calls, bugs fixed, architecture trade-offs, code reviews, deployment issues, competitor observations, and repeated support questions.
- **The content seed formula**: "I noticed <problem/misconception>. The real issue is <insight>. A better way to think about it is <principle>. For example, <scenario>." — a fill-in-the-blank way to turn a raw observation into a postable shape.
- **Status lifecycle**: raw → approved → drafting → scheduled → published → repurposed → archived; simple states that prevent the backlog from becoming an undifferentiated dump.
- **The repetition signal**: if the same question comes up from multiple clients, calls, or Discord threads, that repetition is itself evidence the idea is worth prioritizing — it proves demand before you write a word.
- **Don't filter at capture time**: capture everything that surfaces, even ideas that feel too small; filtering and prioritization happen later, during angle selection, not during capture.

## Example Code
```md
## Content Idea

**Raw idea:** Client asked why I couldn't quote a price from a two-sentence
description of the project.

**Source:** client / proposal conversation
**Pillar:** Client Education
**Audience:** founder / SME owner
**Core insight:** Price depends on workflow clarity, not feature count.
**Example/proof:** The same "booking system" request can mean a five-field
form or a full slot-and-capacity engine — the words are identical, the
scope is not.
**Possible formats:** LinkedIn post, FAQ entry, discovery-page section
**CTA:** Send a short workflow description before asking for a price.
**Status:** raw

---

## Weekly Capture Log (end-of-day ritual, ~2 minutes)

| Day | What did I explain? | What did I fix? | What did I decide? | Client misunderstanding? | Trade-off made? |
|---|---|---|---|---|---|
| Mon |  |  |  |  |  |
| Tue |  |  |  |  |  |
| Wed |  |  |  |  |  |
| Thu |  |  |  |  |  |
| Fri |  |  |  |  |  |
```

## When to Use
- At the end of every work day or work session, as a standing two-minute ritual rather than an occasional brainstorm
- Immediately after any client call, code review, or bug fix where you had to explain something non-obvious
- When you notice yourself explaining the same thing for the second or third time to different people
- When the content calendar looks empty and the instinct is to "wait for inspiration" instead of mining the backlog you already have
- When onboarding a new client or starting a new project, since the first-contact questions reveal exactly what your audience doesn't yet understand

## Common Mistakes
- Waiting for a fully-formed, "blog-worthy" idea instead of capturing rough fragments and refining them later
- Storing ideas only in memory or scattered chat history instead of a searchable, structured backlog
- Discarding technical lessons because they feel too routine to be interesting to anyone else
- Publishing every raw capture unfiltered instead of using capture as a backlog that still gets curated before drafting

## Further Reading
- *Building a Second Brain* — Tiago Forte: the general framework for lightweight capture-and-resurface systems that idea capture borrows its logic from
- *Show Your Work* — Austin Kleon: a short, practical case for treating ordinary daily work as publishable material
- [Julian Shapiro's essay "How to Write Useful Blog Posts"](https://julian.com) — a working writer's account of mining real work for content ideas
