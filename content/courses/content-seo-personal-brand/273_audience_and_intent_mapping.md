# 273. Audience & Intent Mapping Before You Write

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Content_Engine_Rules material (audience-and-intent-mapping.md) to build out the Content, SEO & Personal Brand course; no existing coverage data for your own practice.

## What It Is
The same underlying idea needs to be written completely differently depending on who's reading it, and skipping this step is the single fastest way to produce generic content. "Role-based access matters" means something different to an SME owner (fewer mistakes, clearer accountability) than to a CTO (API guards, database relations, auditability, test coverage). Audience mapping is the discipline of deciding, before a single sentence gets drafted, exactly who this piece is for, what they already believe, and what you want them to believe after reading it.

A useful audience map for a technical solo business usually covers five recurring reader types: SME owners and operations leads (who care about time savings, cost control, and business outcomes, not technical detail); founders and product owners (who care about MVP scope, launch speed, and technical partner reliability); agency or consultant partners (who care about delivery reliability and protecting their own client relationships); technical buyers like CTOs or senior developers (who care about architecture, trade-offs, and integration risk); and developer peers (valuable for reputation and referrals, but a trap if they dominate content meant to attract paying clients).

Audience alone isn't enough — intent matters just as much. The same SME owner might be "unaware" that their problem is software-shaped at all (they just know approvals are chaotic), "problem-aware" (they know the pain but not the fix), "solution-aware" (they're evaluating custom software), "provider-aware" (comparing developers), or simply "ready" for a next step. A diagnosis post works for someone unaware of their own problem; a case-study or trust post works for someone already comparing providers. Using the wrong content type for the reader's actual awareness level either wastes the post on people not ready to act, or scares off someone who isn't ready for a hard pitch yet.

The forcing function that makes this concrete is writing a single sentence before drafting: "After reading this, [audience] should believe that [belief]." If you can't fill that sentence in specifically — not "should believe I'm smart," but "should believe that MVP scope must be reduced before pricing" — the piece isn't ready to write yet, no matter how good the topic sounds.

## Key Concepts
- **Five default audiences**: SME owners, founders/product owners, agency/consultant partners, technical buyers (CTOs/senior devs), and developer peers — each with a different vocabulary and different stakes.
- **Awareness levels**: unaware → problem-aware → solution-aware → provider-aware → ready; content type should match where the reader actually sits, not where you wish they sat.
- **The desired-belief sentence**: "After reading this, [audience] should believe that [belief]" — a one-line test that forces clarity before drafting begins.
- **Intent types**: awareness, education, trust, proof, conversion, nurture, and partnership — a piece can touch several, but should have exactly one primary intent.
- **CTA-by-audience mapping**: an SME gets invited to a workflow audit, a founder to an MVP scope review, an agency to a delivery partnership conversation, a developer to a comment or technical discussion — matching the ask to what that audience is actually positioned to do next.
- **The "speaks to everyone" trap**: a post that tries to address founders, SMEs, agencies, developers, and students in one breath weakens its message for all of them; specificity beats broad appeal for content meant to convert.
- **Depth calibration by audience**: SMEs need business impact translated in plain language; technical buyers need the actual trade-off and mechanism, not a simplified metaphor that insults their expertise.
- **Peer content isn't wasted, but it isn't the goal**: developer-peer content builds reputation and referrals, but shouldn't dominate a calendar whose real objective is client acquisition.

## Example Code
```md
## Audience Map

**Idea:** Why role-based access is more than a UI dropdown

**Audience:** Technical buyer / CTO
**Awareness level:** Solution-aware (already knows they need a fix, not
sure the current approach is enough)
**Intent:** Trust / proof
**Pain:** Uncertainty about whether the current auth model will hold up
under audit or scale
**Desired belief:** "After reading this, CTOs should believe that
role-based access implemented only in the UI is not real authorization,
and that this developer thinks about auth at the API/data layer."
**Tone:** Direct, technically specific, no hand-holding
**CTA:** Review architecture / request a technical audit

---

**Same idea, different audience:**

**Audience:** SME owner
**Awareness level:** Problem-aware (knows approvals are messy, doesn't
know the fix is "permissions")
**Intent:** Education
**Desired belief:** "After reading this, SME owners should believe that
who-can-approve-what is a business risk, not a technical detail to leave
until later."
**Tone:** Plain language, business-outcome framed, no jargon
**CTA:** Map your approval workflow before requesting a quote
```

## When to Use
- Before drafting any content piece — as a mandatory five-minute step, not an optional one
- When a post gets broad engagement but no meaningful replies or leads, which usually signals it was written for "everyone" rather than a specific reader
- When repurposing one idea across LinkedIn, a blog, and a newsletter — each version needs its own audience/intent pass, not a copy-paste
- When deciding between a soft CTA and a direct CTA — the right choice depends entirely on the reader's awareness level
- When content keeps attracting the wrong audience (e.g., mostly other developers) despite a goal of client acquisition

## Common Mistakes
- Writing one version of an idea and assuming it works for every reader type without adjusting tone, depth, or CTA
- Skipping the desired-belief sentence and starting from "what do I want to say" instead of "what do I want them to believe"
- Using a hard CTA on unaware or problem-aware readers who haven't been given enough context to act yet
- Letting developer-peer engagement (likes, technical debates) substitute for actually reaching the buyer audience the content was meant to attract

## Further Reading
- *Breakthrough Advertising* — Eugene Schwartz: the original, deeply detailed treatment of matching message to a reader's stage of awareness (dense but foundational)
- *Obviously Awesome* — April Dunford: positioning framework that sharpens how to think about who a message is actually for
- Amy Hoy's "Sales Safari" methodology (blog posts under stackingthebricks.com) — a practical method for learning exactly how a target audience talks about their own problems before writing to them
