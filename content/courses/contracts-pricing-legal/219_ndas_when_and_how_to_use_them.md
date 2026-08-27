# 219. NDAs — When and How to Use Them

## What It Is
A Non-Disclosure Agreement is a narrower, more specific tool than people often assume. It doesn't govern the whole relationship — payment, deliverables, and IP live in the SOW and the main contract — it exists purely to protect information exchanged before, during, or after that relationship. Two situations call for a standalone NDA rather than folding confidentiality into the main agreement: early-stage conversations where no work agreement exists yet, and cases where a prospect or contractor will be exposed to genuinely sensitive material — a business plan, unreleased product details — before a scope is even finalized. A standalone NDA gets signed before that information is shared, not after.

Most ongoing engagements don't need a separate NDA; a confidentiality clause embedded in the contractor agreement or client SOW is enough, provided it actually names what's covered (client names, technical infrastructure, source code, pricing, methodologies) and states a duration that survives the end of the engagement — commonly a fixed number of years, not "forever" (a court is more likely to enforce a bounded, reasonable term). A recurring mistake is bundling a non-compete into an NDA on the assumption that it adds protection. In most jurisdictions non-competes are heavily restricted or outright unenforceable for freelance/contractor relationships, and an overly broad one can put the entire document's credibility at risk. A non-solicitation clause — no poaching of the other party's clients or staff — achieves almost the same practical protection and holds up far more reliably.

If an NDA is ever actually breached — a contractor leaks something, or worse — the response sequence matters more than the original document: document everything immediately, send a written demand to stop and delete, notify anyone whose personal data may have been exposed, and get a lawyer involved before escalating further, rather than jumping straight to informal threats. This lesson explains what an NDA is for and how to think about its scope — it is general education, not a legal opinion on whether any specific NDA you're given is enforceable. Have any NDA you're asked to sign, and any NDA you ask someone else to sign, reviewed by a lawyer before it matters.

## Key Concepts
- **NDA vs. embedded confidentiality clause**: a standalone NDA is for pre-agreement or high-sensitivity situations, signed before information is shared; an embedded clause inside the main contract is sufficient for most ongoing engagements.
- **What to name explicitly**: business information, technical infrastructure, source code, pricing/commercial terms, and methodologies — vague "confidential information" language is weaker than a named list.
- **Bounded duration**: a stated number of years surviving the end of the engagement, not an indefinite or "forever" obligation, which is both harder to enforce and harder to get a counterparty to sign.
- **Non-compete vs. non-solicitation**: non-competes are restricted or void in many jurisdictions and contexts for contractor relationships; a non-solicitation clause (no poaching clients or staff) is a more durable substitute.
- **Breach response sequence**: document immediately, send a written demand, notify affected parties if personal data was involved, and involve a lawyer before further escalation — never skip straight to informal threats.

## Example Code
```markdown
## Mutual Non-Disclosure Agreement (illustrative — not a ready-to-sign template)

1. **Confidential Information** includes: business plans, customer/client
   names, technical infrastructure and source code, pricing and commercial
   terms, and internal methodologies disclosed by either party.

2. **Obligation.** Each party will keep the other's Confidential
   Information confidential and use it only for the purpose of evaluating
   or performing the engagement.

3. **Duration.** This obligation survives for [3] years after the
   Confidential Information is disclosed, or after termination of any
   resulting engagement, whichever is later.

4. **Exclusions.** Information that is already public, already known to
   the receiving party, or independently developed is not covered.

5. **No non-compete.** This agreement does not restrict either party's
   right to work with other clients or contractors, except that neither
   party will solicit the other's clients or staff for [12] months.
```

## When to Use
- Before sharing a detailed project brief, business plan, or unreleased product information with a prospect or contractor who hasn't signed anything yet.
- When evaluating a contractor before committing to a full agreement.
- As a standard clause inside every contractor and client agreement, even when a standalone NDA isn't needed.

## Common Mistakes
- Sharing sensitive project details in a discovery call before any NDA or confidentiality clause is in place.
- Writing an indefinite confidentiality obligation instead of a bounded, more enforceable term.
- Adding a broad non-compete to an NDA and assuming it will hold up, when a non-solicitation clause would have been both sufficient and more durable.
- Responding to a suspected breach with an angry informal message instead of documenting first and involving a lawyer before escalating.

## Further Reading
- The Electronic Frontier Foundation's plain-language guides on NDAs for freelancers and small businesses.
- WIPO's overview of trade secret protection as background on what confidentiality law is actually trying to protect.
- Y Combinator's public startup library notes on when (and when not) to ask for an NDA in early conversations.
