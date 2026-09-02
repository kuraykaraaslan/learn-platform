# 308. Case Study Metrics, Outcomes & Evidence Levels

## What It Is
A case study becomes significantly stronger when it shows outcomes, but the discipline that makes this safe is refusing to invent or exaggerate a single number — the strongest *truthful* outcome available always beats an impressive but fabricated one, because an invented metric is a liability the moment anyone asks how it was measured. The outcome taxonomy gives four places to look for something real even when there's no single flashy number: business metrics (conversion rate, users served, manual hours reduced, orders processed), operational metrics (approval time reduced, self-service reporting, fewer status-check messages), technical metrics (page speed improvement, error rate reduction, deployment reliability), and delivery outcomes (launched MVP, completed handover, replaced a legacy workflow). Most projects have at least one category with something genuinely worth stating, even when the client never shared exact business numbers.

The four-level evidence system is what keeps outcome language honest without making an unmeasured project sound weak. Level 1, measured, supports direct language: "reduced X by Y%." Level 2, client-confirmed, supports attributed language: "the client reported..." Level 3, observable, supports descriptive language: "the system now enables..." Level 4, intended, supports design-language: "designed to reduce..." Each level has its own matching verb tense and confidence, and the discipline is picking the level that actually matches the evidence rather than borrowing a higher level's confident phrasing for a lower level's actual proof. A result stated as "designed to reduce manual confirmation work" (Level 4, honest) protects credibility in a way that "reduced manual work by 80%" (implied Level 1, unsupported) does not — the honestly-qualified claim can't be challenged, while the confident-sounding invented one eventually will be.

Getting to a real Level 1 or Level 2 outcome usually requires directly asking the client rather than guessing: what changed after launch, how many users use the system now, which manual steps were removed, did the system save time or reduce errors, are there any before-after numbers safe to mention, and can the outcome be described qualitatively if exact numbers are private. The result-statement formula turns whatever comes back into a consistent sentence: "The project helped \<user/company\> move from \<before state\> to \<after state\>, resulting in \<measured/verified outcome\>" — which works whether the outcome slot holds a hard percentage or an honestly-qualified Level 3 observation. What never belongs in any tier is unearned superlative language — "10x better," "massively improved," "saved thousands" — used without evidence to support it; the entire point of the evidence-level system is that confidence in the writing should track confidence in what was actually verified.

```quiz
- q: "The client shared no numbers, but you know the system replaced a manual confirmation step. Which claim is safe to publish?"
  anchor: "the honestly-qualified claim can't be challenged, while the confident-sounding invented one eventually will be"
  options:
    - text: "\"Reduced manual work by 80%\" — a concrete number reads as credible"
      correct: false
      why: "That is an implied Level 1 claim with no measurement behind it — a liability the moment anyone asks how it was measured."
    - text: "\"Designed to reduce manual confirmation work\" — Level 4 language matching Level 4 evidence"
      correct: true
      why: "Honest and unchallengeable, which is the entire point of picking the level that matches the proof you actually have."
    - text: "\"The client reported a large improvement\" — attributed, so the risk sits with them"
      correct: false
      why: "Level 2 language requires the client to have actually confirmed something. Attributing a statement nobody made is the same invention with someone else's name on it."

- q: "On a call the client said approvals feel much faster now, but gave no figures. Which evidence level is that?"
  anchor: "Level 2, client-confirmed, supports attributed language"
  options:
    - text: "Level 1, measured — a statement from the client counts as measurement"
      correct: false
      why: "Level 1 needs a number that was actually measured, which is what licenses \"reduced X by Y%\"."
    - text: "Level 2, client-confirmed — which licenses \"the client reported...\""
      correct: true
      why: "The client confirmed it without measuring it, and the attributed phrasing says exactly that."
    - text: "Level 3, observable — nothing was measured, so it is only an observation"
      correct: false
      why: "Level 3 is what the system can be seen to enable without the client saying anything. Here they did say it, which is the stronger level."

- q: "A project has no headline business number at all. What does the outcome taxonomy tell you to do?"
  anchor: "Most projects have at least one category with something genuinely worth stating"
  options:
    - text: "Skip outcomes and describe what was built"
      correct: false
      why: "There are four categories to look in — business, operational, technical and delivery — before concluding there is nothing to state."
    - text: "Look in the operational, technical and delivery categories too"
      correct: true
      why: "Approval time reduced, error rate down, a launched MVP or a completed handover are all real outcomes with no business figure in sight."
    - text: "Estimate a plausible business number and label it as an estimate"
      correct: false
      why: "The discipline is refusing to invent a single number. A labelled estimate is still a number nobody measured."
```

## Key Concepts
- **Four outcome categories**: business, operational, technical, and delivery metrics — most projects have something real in at least one category even without a flashy headline number.
- **Four evidence levels with matching language**: Level 1 Measured ("reduced X by Y%"), Level 2 Client-confirmed ("the client reported..."), Level 3 Observable ("the system now enables..."), Level 4 Intended ("designed to reduce...").
- **Confidence should track evidence, not ambition**: never borrow a higher evidence level's confident phrasing for a lower level's actual proof.
- **Never invent a number**: an honestly-qualified Level 3 or 4 claim protects credibility better than a confident but unverifiable Level 1-sounding one.
- **Result-statement formula**: "The project helped \<user/company\> move from \<before state\> to \<after state\>, resulting in \<measured/verified outcome\>."
- **Direct metric-collection questions**: ask the client what changed, how many users, which steps were removed, and whether qualitative language is acceptable if exact numbers are private.
- **Forbidden unearned superlatives**: "10x better," "massively improved," "saved thousands" — usable only when actual evidence supports the specific claim.

## Example Code
```md
## Metric Collection Script (ask the client directly)

What changed after launch?
How many users use the system?
Which manual steps were removed?
Did the system save time or reduce errors?
Do you have any before-after numbers we can safely mention?
Can I describe the outcome qualitatively if exact numbers are private?

## Evidence-Level Labeling (internal working notes)

Level 1 (Measured):        "Reduced manual confirmation time by 40%."
Level 2 (Client-confirmed): "The client reported fewer double-bookings
                             since launch."
Level 3 (Observable):       "The system now enables self-service booking
                             without admin intervention."
Level 4 (Intended):         "Designed to reduce manual confirmation work by
                             automating availability checks."

## Result Statement Formula

The project helped <user/company> move from <before state> to
<after state>, resulting in <measured/verified outcome>.

Example:
"The project helped the team move from manual slot confirmation to a
structured booking flow, resulting in a clearer appointment lifecycle and
reduced risk of overlapping bookings."
```

## When to Use
- Writing the "Result" section of any case study, before defaulting to vague language
- When a client can't or won't share exact numbers but the project clearly delivered value
- Reviewing a draft case study for claims that sound more confident than the actual evidence supports
- Deciding how to phrase an outcome honestly before publishing, especially under time pressure
- Preparing to ask a client for a testimonial, so the right outcome questions get asked at the same time

## Common Mistakes
- **A case study feels incomplete without a specific percentage, so one gets written in** — Inventing a specific percentage because the case study "needs a number" to feel complete
- **An intended-but-unmeasured result is written in the same confident language as a number you actually measured** — Writing Level 4 (intended) results in Level 1 (measured) language, implying more certainty than exists
- **A project had no clean business metric, so the case study skips a results section entirely** — Only ever looking for business metrics and missing legitimate operational or technical wins that are just as credible
- **A client is asked for "a testimonial," open-ended, nothing more specific** — Asking for a testimonial without asking the specific outcome questions that would make it concrete
- **A case study claims the result was "massively improved" or "10x better"** — Using superlative language ("massively improved," "10x better") with no evidence behind the specific claim

## Further Reading
- *How to Measure Anything* — Douglas Hubbard: a rigorous, practical approach to quantifying outcomes honestly even under real uncertainty
- [The FTC's endorsement and testimonial guidelines](https://ftc.gov) — a first-party baseline for truth-in-advertising that applies directly to published outcome and testimonial claims
- A practical primer on distinguishing correlation from attributed impact in product/analytics contexts — useful for calibrating Level 2 vs. Level 3 claims honestly

```recall
- q: "Name the four evidence levels and the language each licenses."
  must:
    - "Level 1 Measured — \"reduced X by Y%\""
    - "Level 2 Client-confirmed — \"the client reported...\""
    - "Level 3 Observable — \"the system now enables...\""
    - "Level 4 Intended — \"designed to reduce...\""
    - "each has its own matching verb tense and confidence"

- q: "Name the four outcome categories with an example of each."
  must:
    - "business — conversion rate, users served, manual hours reduced, orders processed"
    - "operational — approval time reduced, self-service reporting, fewer status-check messages"
    - "technical — page speed improvement, error rate reduction, deployment reliability"
    - "delivery — launched MVP, completed handover, replaced a legacy workflow"

- q: "Give the result-statement formula and say why it survives a weak outcome."
  must:
    - "The project helped <user/company> move from <before state> to <after state>, resulting in <measured/verified outcome>"
    - "the outcome slot takes a hard percentage or an honestly-qualified Level 3 observation equally well"

- q: "What never belongs at any evidence tier, and what is the underlying rule?"
  must:
    - "unearned superlatives — \"10x better\", \"massively improved\", \"saved thousands\""
    - "used without evidence to support them"
    - "confidence in the writing should track confidence in what was actually verified"
```
