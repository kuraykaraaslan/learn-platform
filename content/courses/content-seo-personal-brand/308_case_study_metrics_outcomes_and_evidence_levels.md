# 308. Case Study Metrics, Outcomes & Evidence Levels

## What It Is
A case study becomes significantly stronger when it shows outcomes, but the discipline that makes this safe is refusing to invent or exaggerate a single number — the strongest *truthful* outcome available always beats an impressive but fabricated one, because an invented metric is a liability the moment anyone asks how it was measured. The outcome taxonomy gives four places to look for something real even when there's no single flashy number: business metrics (conversion rate, users served, manual hours reduced, orders processed), operational metrics (approval time reduced, self-service reporting, fewer status-check messages), technical metrics (page speed improvement, error rate reduction, deployment reliability), and delivery outcomes (launched MVP, completed handover, replaced a legacy workflow). Most projects have at least one category with something genuinely worth stating, even when the client never shared exact business numbers.

The four-level evidence system is what keeps outcome language honest without making an unmeasured project sound weak. Level 1, measured, supports direct language: "reduced X by Y%." Level 2, client-confirmed, supports attributed language: "the client reported..." Level 3, observable, supports descriptive language: "the system now enables..." Level 4, intended, supports design-language: "designed to reduce..." Each level has its own matching verb tense and confidence, and the discipline is picking the level that actually matches the evidence rather than borrowing a higher level's confident phrasing for a lower level's actual proof. A result stated as "designed to reduce manual confirmation work" (Level 4, honest) protects credibility in a way that "reduced manual work by 80%" (implied Level 1, unsupported) does not — the honestly-qualified claim can't be challenged, while the confident-sounding invented one eventually will be.

Getting to a real Level 1 or Level 2 outcome usually requires directly asking the client rather than guessing: what changed after launch, how many users use the system now, which manual steps were removed, did the system save time or reduce errors, are there any before-after numbers safe to mention, and can the outcome be described qualitatively if exact numbers are private. The result-statement formula turns whatever comes back into a consistent sentence: "The project helped \<user/company\> move from \<before state\> to \<after state\>, resulting in \<measured/verified outcome\>" — which works whether the outcome slot holds a hard percentage or an honestly-qualified Level 3 observation. What never belongs in any tier is unearned superlative language — "10x better," "massively improved," "saved thousands" — used without evidence to support it; the entire point of the evidence-level system is that confidence in the writing should track confidence in what was actually verified.

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
- Inventing a specific percentage because the case study "needs a number" to feel complete
- Writing Level 4 (intended) results in Level 1 (measured) language, implying more certainty than exists
- Only ever looking for business metrics and missing legitimate operational or technical wins that are just as credible
- Asking for a testimonial without asking the specific outcome questions that would make it concrete
- Using superlative language ("massively improved," "10x better") with no evidence behind the specific claim

## Further Reading
- *How to Measure Anything* — Douglas Hubbard: a rigorous, practical approach to quantifying outcomes honestly even under real uncertainty
- The FTC's endorsement and testimonial guidelines (ftc.gov) — a first-party baseline for truth-in-advertising that applies directly to published outcome and testimonial claims
- A practical primer on distinguishing correlation from attributed impact in product/analytics contexts — useful for calibrating Level 2 vs. Level 3 claims honestly
