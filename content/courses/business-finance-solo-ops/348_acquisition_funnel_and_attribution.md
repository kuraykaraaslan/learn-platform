# 348. Diagnosing Your Acquisition Funnel

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Business_Growth/Sales_Growth/Finance_and_Operations/Analytics_and_Growth_Experiments/Business_Continuity/Offer_Library material to build out the Business Growth & Finance course; no existing coverage data for your own practice.

## What It Is
An acquisition funnel is a simple way to see where attention becomes revenue, and where the process is actually breaking. The standard stages run: reach → visit/profile view → lead → qualified lead → discovery call → proposal → closed deal, and each stage should have a conversion rate to the next one wherever data exists. The minimum metrics worth tracking are new leads, qualified leads, discovery calls booked, proposals sent, deals won, proposal value, and revenue won; everything else — impressions, website sessions, form completion rate — is optional detail that only matters once the core numbers raise a question. The funnel's real value isn't the dashboard, it's the diagnosis: a funnel review is only complete once you can name the single biggest bottleneck and one concrete action to fix it.

The diagnostic logic follows the funnel shape directly. If reach is low, the fix is more content, outbound, referrals, SEO, or community activity — not a better landing page. If visits are high but leads are low, the problem is the call-to-action, offer clarity, or the proof on the page, not the traffic source. If leads are high but qualified leads are low, positioning, ICP targeting, or pricing signals need tightening. If qualified leads are high but proposals are low, the discovery process itself — urgency, clarity of next steps — needs work. And if proposals are high but closes are low, the issue is almost always pricing, scope, trust proof, or how thoroughly objections were handled during the sales conversation — not the funnel's top.

None of this diagnosis is possible without attribution discipline: every lead needs a first source, a last source, a source detail (which specific post, page, or asset), and a referrer if applicable, drawn from a controlled taxonomy (linkedin_content, website_seo, referral, partner, past_client, and so on) rather than free-form guessing. Self-reported attribution — simply asking "how did you hear about me?" on the intake form — closes most of the gap cheaply. Attribution confidence should be tracked explicitly as known, partial, self-reported, or unknown, with the explicit goal of shrinking the unknown bucket over time, and a channel should ultimately be judged by qualified leads, proposal value, and closed revenue it produces — never by raw lead count alone, since a channel that produces high volume and zero qualified leads is not actually working.

## Key Concepts
- **Funnel stages**: reach → visit/profile view → lead → qualified lead → discovery call → proposal → closed deal, each with a conversion rate to the next stage.
- **Minimum metrics**: new leads, qualified leads, discovery calls booked, proposals sent, deals won, proposal value, revenue won.
- **Diagnostic rules by bottleneck**: low reach → more content/outbound/SEO/referrals; high visits, low leads → fix CTA/offer clarity/proof; high leads, low qualified → tighten ICP and positioning; high qualified, low proposals → improve discovery process; high proposals, low closes → review pricing, scope, and trust proof.
- **Attribution fields**: first source, last source, source detail/asset, campaign, and referrer — recorded from a controlled taxonomy, not free text.
- **Attribution confidence levels**: known (source and asset both clear), partial (channel known, asset unknown), self-reported (prospect stated it), unknown — with a standing goal to shrink the unknown bucket.
- **Channel judgment rule**: evaluate a channel by qualified leads, proposal value, and closed revenue it produces, plus strategic and relationship value — never by lead count alone.

## Example Code
A funnel table with attribution notes, used to diagnose the actual bottleneck for a given month:

```
FUNNEL — August 2026

Stage                Count   Conv. to Next   Notes
Reach (impressions)   8,400        -          LinkedIn + SEO combined
Visits                  210       2.5%        Landing page + profile
Leads                    24       11.4%       Intake form + DMs
Qualified leads            9      37.5%       Budget+timeline+fit met
Discovery calls             7      77.8%
Proposals                   5      71.4%
Closed deals                 1      20.0%

DIAGNOSIS
Reach -> Visits conversion (2.5%) is roughly on par with prior
  months -> not the bottleneck.
Visits -> Leads conversion (11.4%) is strong -> landing page and
  CTA are working.
Leads -> Qualified (37.5%) is below the 50%+ seen in prior months
  -> ICP targeting or intake form filtering may have loosened.
Proposals -> Closed (20%) is the single biggest bottleneck this
  month -> five proposals sent, only one won.

ATTRIBUTION BREAKDOWN (of the 9 qualified leads)
Known: 5 (linkedin_content: 3, referral: 2)
Partial: 2 (website_seo, asset unknown)
Self-reported: 2 ("Google" and "a colleague mentioned you")
Unknown: 0

ACTION: The proposal-to-close bottleneck is the priority. Reviewing
  the four lost proposals shows three cited "went with a cheaper
  option" -> next action is to add a clearer differentiation section
  to the proposal template, not to generate more leads.
```
The funnel numbers pointed to a specific, actionable bottleneck — more top-of-funnel activity would not have fixed a close-rate problem.

## When to Use
- Monthly, as a standing review to identify the single biggest conversion bottleneck rather than reacting to whichever number looks worst that week.
- Before increasing spend or effort on any channel, to confirm it is producing qualified leads and revenue, not just raw traffic or impressions.
- Whenever a new intake form or landing page ships, to add or confirm the self-reported attribution question is still present.
- When comparing two channels for future investment, to compare them on qualified leads and closed revenue rather than on lead count.

## Common Mistakes
- Evaluating a channel purely by traffic or impressions, missing that it produces zero qualified leads.
- Reacting to a weak top-of-funnel number by producing more content, when the actual bottleneck is further down the funnel (e.g., proposal-to-close).
- Leaving attribution source blank or defaulting everything to "website" when the real source was a LinkedIn post or a referral.
- Comparing channels on lead count alone without adjusting for the very different lead quality each channel tends to produce.

## Further Reading
- *Hacking Growth* — Sean Ellis and Morgan Brown: a systematic approach to funnel diagnosis and growth experimentation used widely in early-stage teams, scalable down to a solo operation.
- *Web Analytics 2.0* — Avinash Kaushik: on building attribution and funnel measurement that actually drives decisions instead of vanity reporting.
- This lesson is general education, not financial or tax advice. Attribution percentages and conversion benchmarks vary widely by niche and price point — use your own trailing data as the real baseline.
