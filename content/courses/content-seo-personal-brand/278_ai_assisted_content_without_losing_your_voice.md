# 278. AI-Assisted Content Without Losing Your Voice

## What It Is
AI can genuinely accelerate content production — brainstorming twenty angles on a topic, turning rough notes into an outline, rewriting a paragraph for clarity, adapting a blog into a carousel structure — but it consistently fails at the one thing that makes content valuable in the first place: sounding like a specific person with real, situated experience. Left unedited, AI-generated content converges on the same generic phrasing regardless of who prompted it — "in today's fast-paced digital world," "unlock the power of," "seamless and robust" — because it's trained to produce the statistically average version of confident-sounding business writing, which is exactly the opposite of what makes a specific voice memorable.

The fix isn't avoiding AI, it's treating AI output as a first draft that always requires a human injection before publishing: at least one project scenario, technical trade-off, personal opinion, client question pattern, or specific mistake observed that could only have come from someone who actually does the work. Without that injection, the content is technically correct and completely forgettable. The quality of what AI produces is also a direct function of what it's given — a prompt like "write a LinkedIn post about software development" will produce filler no matter how good the model is, while a prompt that specifies the audience, the core idea, a concrete example, the platform, the tone, and what claims are off-limits will produce something worth editing rather than rewriting from scratch.

There's a firm line between acceptable and risky AI use here. Brainstorming angles, restructuring notes, shortening a draft, adapting one format to another, and generating headline variations are all safe uses that save real time. Inventing case studies, fabricating metrics, manufacturing testimonials, or making legal, medical, or financial claims without review are not — and the risk isn't hypothetical, since fabricated proof discovered later does far more damage to credibility than a slower content pace ever would. The output should always be run through an editing checklist before publishing: does this sound like a real practitioner, is there a concrete example, is any claim too broad, does the language sound too polished or too generic, does it match your actual positioning, and is the CTA natural rather than inserted.

## Key Concepts
- **AI as accelerant, not author**: AI should speed up drafting, restructuring, and rewriting — it should never be the source of the actual opinion, example, or experience that makes the content credible.
- **Required input for a usable prompt**: audience, content goal, pillar, core idea, a real example or personal experience, tone, platform, CTA, length, and any forbidden claims — a prompt missing these produces generic filler regardless of model quality.
- **The human injection rule**: every AI-assisted draft needs at least one element that could only come from a real practitioner — a project scenario, a trade-off, an opinion, a client question pattern, or a mistake actually observed.
- **AI phrase detection**: watch for and remove telltale generic phrasing — "in today's fast-paced world," "unlock the power of," "game-changer," "leverage cutting-edge solutions," "seamless and robust" — these are reliable tells of unedited AI output.
- **Safe use cases**: brainstorming angles, turning notes into an outline, rewriting for clarity, shortening content, adapting one format to another, creating headline variations, translating while preserving tone.
- **Forbidden use cases**: fabricating case studies, inventing metrics or testimonials, making unreviewed legal/medical/financial claims, generating spam outreach at scale, or copying competitor content structure verbatim.
- **The AI editing checklist**: does this sound like a real practitioner, is there a concrete example, is any claim too broad, is the language too polished or generic, does it match positioning, is there an unsupported promise, is the CTA natural.
- **Never publish raw output**: every AI-generated draft requires a human review pass for specificity, voice, accuracy, and honesty before it goes anywhere public — no exceptions for time pressure.

## Example Code
```md
## AI Content Brief (fill in before prompting)

**Audience:** SME owners considering internal software
**Goal:** Education — reframe "we just need a dashboard" as a workflow problem
**Pillar:** Business Automation
**Core idea:** Admin panels fail when treated as UI screens instead of
workflow systems
**Real example:** A recent request for "a dashboard" turned out to need
approval states, role-based visibility, and exportable reports once the
actual process was mapped
**Tone:** Practical, direct, no buzzwords
**Platform:** LinkedIn
**CTA:** Map your approval workflow before requesting a quote
**Avoid:** Any claim implying guaranteed cost savings or time savings percentages

---

**Bad prompt:**
"Write a LinkedIn post about software development."

**Good prompt (built from the brief above):**
"Write a LinkedIn post for SME owners explaining why admin panels should
start from workflow mapping, not UI screens. Use a practical, no-buzzword
tone. Include the example of a 'dashboard' request that actually needed
approval states and role-based visibility. End with a soft CTA about
workflow audits. Do not imply guaranteed savings."

---

## Post-Generation Editing Pass
- [ ] Real practitioner voice, not generic AI phrasing
- [ ] Concrete example present and specific
- [ ] No unsupported claims or invented statistics
- [ ] Matches known positioning and pillar
- [ ] CTA reads as natural, not inserted
```

## When to Use
- When brainstorming a large batch of angles or headline variations quickly before selecting the strongest one
- When turning rough capture notes into a structured outline before writing the actual draft
- When adapting an existing piece into a different format (blog into carousel, post into newsletter section)
- When time pressure tempts publishing an AI draft unedited — this is precisely when the review checklist matters most
- When translating content while trying to preserve tone and voice across languages or platforms

## Common Mistakes
- Publishing AI output with no edit pass, resulting in generic, forgettable content that damages rather than builds authority
- Prompting with vague, underspecified requests and blaming the model for generic results instead of providing the required inputs
- Using AI to fabricate case studies, metrics, or testimonials to make content sound more impressive than the real situation
- Letting AI-typical phrases ("unlock the power of," "game-changer") slip into published content unnoticed because the edit pass was skipped

## Further Reading
- [Anthropic's guide to prompting Claude](https://docs.claude.com) — practical, current guidance on providing the context a model needs to produce specific rather than generic output
- Nicolas Cole and Dickie Bush's writing on "AI-assisted vs. AI-generated" content (via Ship 30 for 30 / Category Pirates) — a widely referenced practitioner take on where the human-injection line belongs
- Wharton's "Practical AI for Business" course materials or similar university-issued guidance on responsible AI use in marketing content, useful as a sanity check against overclaiming
