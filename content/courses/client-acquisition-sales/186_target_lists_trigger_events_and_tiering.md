# 186. Target Lists, Trigger Events & Tiering

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Client_Acquisition/Cold_Search/Sales_and_Discovery/Brand_Positioning material to build out the Client Acquisition & Sales course; no existing coverage data for your own practice.

## What It Is
A cold outreach list is not "a list of emails" — it is one segment plus one trigger plus one offer, and changing any of the three makes it a different campaign with its own list. The build order matters and runs in exactly one direction: fix the segment first, fix the trigger type second, find organizations that match both, find the specific role that owns the problem at each one, and only then record the contact detail with its provenance. Starting from "I found a list of emails" and working backward inverts this order and produces exactly what it sounds like: generic messages to people who happen to be on a spreadsheet.

The trigger is the reason the message is about the recipient rather than about you, and it does two jobs at once. It supplies the first sentence of the message, and it supplies the legal justification — a real, dated, quotable trigger is what makes "necessary" and "reasonable expectation" answerable in a legitimate-interest analysis, and what makes a subject "related to their line of business" under a B2B exemption. A trigger has a freshness window: hiring signals stay usable for 45 days, a funding announcement for 60, a public post in someone's own words for only 21. Past that window, the trigger is not a trigger anymore, and referencing a stale one is worse than referencing none — it signals the list was built once and has been running on autopilot ever since. Existing on the internet, being in the right industry, being in the same city, or "the pipeline is thin this quarter" are never triggers, no matter how much pressure is behind the last one.

Each row on the list gets tiered by ICP fit crossed with trigger strength — A, B, or C — and the tier decides how much research time it earns and which channel opens the conversation. A-tier gets 15-20 minutes and the best available channel, including a phone call where a published business line exists. C-tier gets five minutes and email only, or it gets dropped. Below C — partial fit with no real trigger — a row is deleted, not parked in case things improve later. The weekly list size is sized backward from actual research capacity, never forward from ambition: capacity divided by per-prospect time is the list size, and a list bigger than that is simply wrong, regardless of how good the closer feels that week.

## Key Concepts
- **One campaign, one segment, one trigger, one offer**: mixing any of the three inside a single list produces a message generic enough to fit anyone, which means it fits no one.
- **Build order**: segment → trigger → organization → recipient role → contact detail — never starting from an existing list of contact details.
- **A/B/C tiering**: ICP fit × trigger strength decides research time budget (15-20 / 8-10 / 5 minutes) and the opening channel; below C, the row is deleted outright.
- **Trigger catalog with freshness windows**: hiring signals (45 days), funding/growth news (60 days), visible technical symptoms (30 days), a public post in their own words (21 days), tenders (per the notice deadline).
- **The freshness rule**: a trigger past its window is not a trigger — it's evidence the list is stale, which is worse than having no reason to write at all.
- **Non-triggers**: having a website, being in the right city or industry, a tool flagging "good fit," and pipeline pressure are never legitimate reasons to contact someone.
- **List size is backward-derived**: weekly research capacity ÷ per-prospect research time = list size, not the other way around.
- **Required row schema**: company, country, entity type, recipient role, contact, contact type, source_url, captured_at, trigger, tier, channel, status, next_action_date — a row missing country, source, or trigger is not contactable.

## Example Code

**List row schema** (one row per prospect):

```text
company | country | entity_type | recipient_role | recipient_name |
contact | contact_type | source_url | captured_at | trigger (with date) |
tier (A/B/C) | channel | status | next_action_date
```

**Trigger quick-reference:**

```markdown
| Trigger                          | Freshness window | Best channel     |
|-----------------------------------|-------------------|-------------------|
| Hiring for roles implying the gap | 45 days            | Email              |
| Funding / growth announcement     | 60 days            | Email              |
| Public launch or new service line | 60 days            | Email or LinkedIn |
| Visible technical symptom         | 30 days            | Email              |
| Public post in their own words    | 21 days            | LinkedIn           |
| Tender / procurement notice       | Per notice deadline| Route named in it |
```

**Tiering decision:**

```text
ICP fit: strong / partial / weak
Trigger: fresh+specific / weak-or-older / none

Strong + fresh   -> Tier A -> 15-20 min research -> best channel available
Strong + weak    -> Tier B -> 8-10 min research  -> email or LinkedIn
Partial + any    -> Tier C -> 5 min research      -> email only, or drop
Weak + none      -> Delete the row, do not contact
```

## When to Use
- At the start of a cold outreach campaign, and once a week when refreshing the list.
- When deciding whether "just a few more" prospects can be added mid-campaign (they can't — that's next week's list).
- When a campaign's reply rate is weak and the question is whether the segment, the trigger, or the volume is wrong.
- When pipeline feels thin and there's a temptation to relax the trigger bar to fill the list.

## Common Mistakes
- Building the list from a data export or enrichment tool first, then trying to justify it with a trigger afterward.
- Treating "they have a website" or "they're in the right industry" as a trigger.
- Keeping C-tier or below-C rows around in case the fit improves later instead of deleting them.
- Lowering the trigger bar because the pipeline looks thin that quarter — a reason to spend more time researching, never a reason to contact people without cause.
- Sizing the list to ambition instead of to actual weekly research capacity, producing a list that can never be researched or answered properly.

## Further Reading
- *Predictable Revenue* — Aaron Ross & Marylou Tyler: the segment-and-trigger discipline behind building a scalable, non-random outbound list.
- *Combo Prospecting* — Tony J. Hughes: trigger-event-based outbound treated as a repeatable system rather than a volume game.
- *Agile Selling* — Jill Konrath: adapting a targeting approach quickly based on what the tiering data actually shows.
