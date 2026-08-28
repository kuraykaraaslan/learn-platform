# 274. Content Angles & Storytelling Frameworks

## What It Is
An idea is a subject; an angle is an argument. "MVP scoping" is a topic anyone could write about forever without saying anything memorable. "Most founders think MVP scope is a feature list, but the real issue is choosing the first workflow that proves value" is an angle — it takes a position, and a reader either agrees, disagrees, or feels caught. Angle selection is the step between "I have something to say about X" and actually writing, where you pick which shape the argument takes: a mistake being corrected, a myth being debunked, a checklist being handed over, a before/after transformation, a trade-off being weighed, or an opinion being defended.

Once an angle is chosen, a storytelling framework gives it a shape a reader can follow without effort. The workhorse framework for technical content is Problem → Insight → Example → Takeaway: name the pain, state the non-obvious realization, ground it in one concrete scenario, and land on the one thing to remember. For proof-heavy content, Before → After → Bridge works better: describe the painful old state, the improved new state, and the specific mechanism that connects them. For opinion and authority content, Myth → Reality → Better Rule lets you challenge an oversimplified belief and replace it with something more precise. And for authentic, lower-effort posts, the Field Note framework — "Today I noticed X. It reminded me that Y. In software projects, this matters because Z." — turns a passing observation into something structured enough to publish.

The through-line across every angle and framework is specificity. A generic angle ("software is important for business") reads as filler no matter how well-formatted it is; a specific one ("if your business process still needs three people to update one spreadsheet, software can remove operational friction") reads as expertise even in a single sentence. The test for whether an angle is strong enough to write is whether it fits this sentence: "Most [audience] think [wrong belief], but the real issue is [better belief]." If that sentence can't be filled in with something true and non-obvious, the angle needs more thought before it becomes a draft.

## Key Concepts
- **Angle vs. topic**: a topic is a subject area; an angle is the specific claim or shape the content takes on that subject — mistake, myth, checklist, framework, before-after, trade-off, lesson learned, warning, or opinion.
- **The angle-quality sentence**: "Most [audience] think [wrong belief], but the real issue is [better belief]" — a fast test for whether an angle has enough tension to be worth writing.
- **Problem → Insight → Example → Takeaway**: the default framework for educational and technical posts; states the pain, the non-obvious realization, a concrete scenario, and the one thing to remember.
- **Before → After → Bridge**: the default framework for automation and case-study content; shows the painful old state, the improved state, and the specific mechanism that connects them.
- **Myth → Reality → Better Rule**: the framework for opinion and authority content; challenges an oversimplified belief and replaces it with a sharper one.
- **Field Note framework**: "Today I noticed X. It reminded me that Y. This matters because Z." — a low-effort, authentic structure for smaller observational posts that still need a shape.
- **Angle-to-goal matrix**: mistake/myth/warning/opinion angles attract attention; framework/behind-the-scenes/case-breakdown angles build trust; checklist/how-to/trade-off angles educate buyers; before-after/lesson-learned angles show proof.
- **Story detail without exposure**: use specific but safe scenario details ("a project with three user roles," "a legacy spreadsheet process") rather than confidential client specifics — specificity doesn't require identifiability.

## Example Code
```template
## Angle + Framework Brief

**Raw idea:** Clients keep asking for a price before the workflow is defined.

**Angle:** Mistake
**Angle-quality sentence:** "Most founders think a software estimate can
come from a one-sentence idea, but the real issue is that price depends
entirely on workflow clarity, not word count."

**Framework:** Problem → Insight → Example → Takeaway

**Draft skeleton:**
Problem: Clients ask for a fixed price from a two-sentence project description.
Insight: The words "booking system" can describe a five-field form or a
full slot-and-capacity engine — the price gap between them is 10x.
Example: A recent request for "an appointment system" turned out to need
overlap checks, cancellation windows, and admin overrides once we mapped
the actual workflow.
Takeaway: Before asking for a price, write down who does what, in what
order, and what happens when something goes wrong.

**CTA:** Send the workflow, not just the idea, before requesting a quote.
```

## When to Use
- Immediately after pulling a raw idea from the capture backlog, before any drafting begins
- When a topic feels "too broad to write" — choosing a specific angle almost always narrows it into something writable
- When repurposing the same underlying idea for multiple platforms — each version can use a different angle or framework so it doesn't feel copy-pasted
- When a draft feels flat or generic on re-read — the fix is usually a sharper angle, not better sentences
- When building a content calendar and needing variety — rotating angle types (mistake one week, checklist the next, opinion after that) prevents every post from feeling the same

## Common Mistakes
- **The post covers "MVP scoping" broadly, informative but not actually arguing anything a reader could agree or disagree with** — Writing about a topic without ever committing to a specific angle, producing a post that informs without arguing anything
- **"You won't believe what happened when this client asked for a dashboard" opens the post, with no real insight anywhere underneath the hook** — Choosing purely motivational or clickbait angles with no real insight behind them, which erodes credibility over time
- **Every single post this month opens with "Most people think X, but the real issue is Y," whether or not the idea actually fits that shape** — Reusing the same angle and framework every single time, making the content feel formulaic even when the substance changes
- **The before/after numbers in the case study post got rounded up "to make the story land better"** — Inventing dramatic story details or fake specificity to make a Before/After post sound more impressive than the real situation

## Further Reading
- *Made to Stick* — Chip and Dan Heath: the clearest general treatment of why specific, concrete, unexpected ideas are remembered and generic ones aren't
- *Everybody Writes* — Ann Handley: practical, non-academic guidance on shaping ideas into content people actually want to read
- Nicolas Cole's writing on "The Content Matrix" (via Category Pirates / Digital Press) — a working framework for angle selection aimed specifically at building written authority
