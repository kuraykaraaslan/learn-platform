# 185. Cold Outreach Ethics & the Three Gates

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Client_Acquisition/Cold_Search/Sales_and_Discovery/Brand_Positioning material to build out the Client Acquisition & Sales course; no existing coverage data for your own practice.

## What It Is
Cold outreach is the highest-risk acquisition channel because it interrupts someone who never asked to hear from you, on a channel they did not opt into. The discipline that makes it permissible rather than spam is a sequence of three gates, and all three have to pass **before a single word of the message is drafted** — not before sending. A draft that already exists is a draft that eventually gets sent; the gate has to sit upstream of the writing, not downstream of it.

Gate one is provenance: where did this contact detail come from, and can you name the exact URL you opened to find it? Contact information published by a company for external contact — a "contact us" page, a team page, a public tender notice, a business card exchanged at an event — is fair game. Scraped data, purchased or "shared" lists, leaked databases, LinkedIn exports, and guessed email addresses (`firstname.lastname@domain`, tested by which ones bounce) are not, regardless of how easy they are to obtain. A contact whose origin cannot be stated in one sentence with a real URL is not a contact; it is dropped, not parked for later.

Gate two is legal basis, and which rule applies depends entirely on where the recipient is. A recipient in Türkiye falls under ETK 6563 and the İYS refusal registry, which allow B2B commercial messages to merchants and tradespeople without prior consent — but still require identification, an honored opt-out, and a documented reason the recipient qualifies for that exemption. A recipient in the EEA, UK, or US shifts to a different regime entirely: GDPR legitimate interest with a written assessment and Art. 14 notice, or CAN-SPAM's opt-out model with a mandatory physical postal address. Anywhere else — Canada included, because of CASL's strict consent regime — is out of scope until it is specifically researched. An unknown location is treated as "do not send," never as a default to whichever rule is most convenient.

Gate three is suppression: has this person, or anyone at their company domain, already said stop — on any channel, in any wording, ever? A refusal does not need the word "unsubscribe" to count, and once it lands, the person is off every channel permanently, not just the one where they said no. The three gates together are what make automation and scale defensible: a system that checks all three before a message can be queued is not a mail-merge with manners, it is a person writing to one other person who happens to use software to remember the rules.

## Key Concepts
- **Gate 1 — Provenance**: a documented `source_url` and `captured_at` date for every contact; no real URL means the contact is dropped, not parked.
- **Allowed vs. prohibited sources**: company-published contact routes, team pages, tender notices, and event exchanges are allowed; scraping, purchased lists, leaked data, and guessed emails are prohibited outright.
- **Role accounts preferred**: `info@`, `sales@`-style addresses are lower-risk and easier to justify than a named personal inbox; personal mobiles and personal email addresses are never contactable without the person handing them over directly.
- **Gate 2 — Jurisdiction decides the rule**: Türkiye (ETK 6563 / İYS), EEA/UK (GDPR legitimate interest + Art. 14 notice), US (CAN-SPAM + physical address), everywhere else (stop and research first).
- **Gate 3 — Suppression is cross-channel and permanent**: an opt-out on one channel closes every channel, with the single exception that the person contacting you first reopens the conversation.
- **The screenshot test**: if you would not be comfortable with this exact message and its source list being made public, it does not send.
- **One real person, one real name**: no aliases, no invented team personas, no "no-reply" address — a no-reply address cannot carry a working opt-out, which makes it non-compliant everywhere these gates apply.

## Example Code

**Provenance record** (required before a contact is contactable):

```markdown
## Contact: <Name / Role Inbox>

source_url:      <exact page you opened>
captured_at:     <date you read it>
basis:           <which allowed-source category applies>
role_relevance:  <why this person/inbox is the right recipient>
trigger_ref:     <the dated trigger justifying contact now>
```

**Pre-draft gate checklist** (all boxes before writing one word):

```text
[ ] Gate 1 — source_url and captured_at exist and are real
[ ] Gate 1 — this is a role account or company-published address, not personal
[ ] Gate 2 — recipient's country is known
[ ] Gate 2 — the matching legal-basis rule for that country has been checked
[ ] Gate 3 — person checked against the suppression list
[ ] Gate 3 — company domain checked against the suppression list
[ ] I would be comfortable if this message and its source were made public
```

## When to Use
- Before adding any prospect to a cold outreach list, spreadsheet, or CRM stage.
- Before drafting the first word of any first-touch message, on any channel.
- When evaluating whether a data enrichment vendor or list broker is usable at all.
- When deciding whether a "found" contact detail is actually contactable, or just technically visible.

## Common Mistakes
- Treating a published address as consent to use it for anything, rather than as one specific permitted route.
- Re-finding a dropped prospect through a different channel to get around a failed provenance check.
- Assuming "it's B2B" is a blanket exemption from every jurisdiction's rules — GDPR in particular has no B2B carve-out.
- Forgetting that suppression is cross-channel: someone who declined by email still gets a LinkedIn request from the same list.
- Backfilling a provenance record after the fact to make an already-collected contact look compliant.

## Further Reading
- *Permission Marketing* — Seth Godin: the foundational argument for why unsolicited contact has to earn its way rather than assume the right to interrupt.
- *Fanatical Prospecting* — Jeb Blount: outbound discipline and the psychology of a cold first touch, independent of the legal specifics.
- *New Sales. Simplified.* — Mike Weinberg: a plain, no-nonsense outbound framework compatible with a gate-based approach to who gets contacted at all.
