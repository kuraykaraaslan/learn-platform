# 116. Legal Literacy for Software Contracts

## What It Is
Software developers sign contracts that transfer significant rights and create significant liabilities, often without understanding what they've agreed to. You don't need a law degree. You need to understand the 5–6 clauses that actually matter in a software development contract and know what position to negotiate from.

The fundamental asymmetry: clients (especially larger ones) have legal teams who draft contracts that favor the client. As a solo developer, you either sign unfavorable terms because you don't understand them, or you spend money on a lawyer for every contract. The middle path is knowing enough to identify the dangerous clauses and negotiate them yourself.

This is especially important for international contracts (Turkish developer, EU or US client), where jurisdiction and governing law become significant.

## Key Concepts
- **IP assignment vs license**: Assignment transfers ownership permanently. A license lets the client use the code but you retain ownership. Most clients demand assignment; most contracts grant it implicitly on payment.
- **Work-for-hire doctrine**: In some jurisdictions (notably US), work created by an independent contractor is owned by the contractor unless explicitly assigned. Get the assignment in writing.
- **Liability cap**: Limits your financial exposure if something goes wrong. Standard position: cap at the total contract value. Without a cap, a client could theoretically sue for consequential damages (lost revenue, etc.).
- **Indemnification**: One party agrees to defend and compensate the other against third-party claims. Watch for clauses that make you indemnify the client for IP infringement claims — you need to warrant that your code doesn't infringe third-party IP.
- **Termination for convenience**: Client can end the contract at any time with X days notice. You must be paid for work completed. Essential: define what "work completed" means.
- **Confidentiality scope**: NDA should cover client's business information, not restrict you from using general skills and knowledge you develop on the project.
- **Governing law and jurisdiction**: Which country's law applies and where disputes are resolved. For Turkish developers with EU/US clients, this matters for enforcement.
- **Warranty period**: How long after delivery are you responsible for defects? 30–90 days is standard. Unlimited warranty is unacceptable.

## Example / Template

**Clause-by-clause breakdown for a standard software contract:**

```markdown
## Key Contract Clauses — Review Checklist

### 1. Intellectual Property
☐ Code ownership transfers on FULL payment (not partial)
☐ You retain ownership of pre-existing IP (your boilerplate, libraries)
☐ Pre-existing IP is licensed to client (not assigned) for use in the project
☐ No clause claiming ownership of skills or knowledge you develop

### 2. Liability
☐ Your liability is capped at [total contract value]
☐ Neither party liable for indirect/consequential damages
☐ Carve-outs: only direct damages for your errors

### 3. Indemnification  
☐ You indemnify client only for YOUR IP infringement (not for client's use)
☐ Client indemnifies you for claims arising from client-provided content/data
☐ No broad indemnification for "any claim related to the software"

### 4. Termination
☐ Either party can terminate with 14–30 days written notice
☐ Client pays for all work completed through termination date
☐ "Work completed" is defined (e.g., approved milestones or % of phase)
☐ No refund for completed milestones on termination-for-convenience

### 5. Confidentiality
☐ Covers client's business information and data
☐ Does NOT restrict your use of general technical knowledge
☐ Excludes information already public or independently developed by you
☐ Term: 2–3 years (not indefinite)

### 6. Warranties
☐ You warrant code will work as documented for [30–90] days post-delivery
☐ No warranty that code will be error-free or meet requirements you didn't define
☐ No warranty for third-party services (AWS, Stripe, etc.)

### 7. Governing Law (international contracts)
☐ Preferred: your jurisdiction (Turkey) or neutral (England and Wales)
☐ Dispute resolution: ICC arbitration preferred over local courts for international
☐ Language of contract: English (with Turkish translation if required)
```

**Red flags — walk away or get a lawyer:**
- Unlimited liability clause
- Ownership of "all work product" including pre-existing code
- Client can demand code ownership before final payment
- Perpetual, worldwide NDA restricting your technical knowledge
- Automatic IP assignment without payment condition

## When to Use / Apply
- Before signing any contract over €2,000
- When a client sends their standard contract (it will favor them)
- When working with a new client type (enterprise vs startup — different risk profiles)
- When adding a sub-contractor — you need your own subcontractor agreement

## Common Mistakes
- Signing without reading because "it's standard" — no contract is standard in your favor unless you wrote it
- Granting IP rights before receiving payment — you lose leverage immediately
- No written contract for "small" projects — verbal agreements are unenforceable in most jurisdictions
- Accepting unlimited liability — one catastrophic client claim could exceed your total annual revenue

## Further Reading
- *The Freelance Contract* — Andy Clarke: practical guide to software development contracts written for practitioners
- TULIP (Turkish IP law) and KVKK — understand your obligations under Turkish law when processing client data
- *Getting to Yes* — Fisher & Ury: negotiation principles for contract discussions
