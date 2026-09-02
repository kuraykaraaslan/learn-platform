# 217. IP Assignment and Source Code Ownership

## What It Is
In essentially every legal system, the person who writes code owns it by default the moment it's created — including you, when a client pays you to build their product. Payment alone does not transfer ownership anywhere. Only a written, signed clause does that. Without one, a client who has paid in full technically doesn't own the deliverable outright, and a contractor you've hired could, in theory, reuse the same code for a competitor or resist final delivery. This is the single highest-stakes clause in any software contract, and it's also one of the easiest to get right, because the fix is just explicit language, agreed in advance.

The mechanism for transferring ownership differs by jurisdiction even though the underlying problem is universal. Some legal systems use outright "assignment" language that transfers ownership cleanly. Others — Germany and France are commonly cited examples — restrict full copyright assignment for an individual creator and instead rely on an exclusive, irrevocable, perpetual license that achieves the same practical result without claiming to transfer authorship itself. Common-law systems built on a "work made for hire" doctrine can make the hiring party the legal author from the moment of creation, provided both sides signed a written agreement saying so before the work began. None of this is a reason to panic — it's a reason to know which mechanism applies to your situation and to word the clause accordingly, with a lawyer's input if the engagement is large enough to matter.

The clause that actually protects a freelancer commercially is payment-contingent assignment: ownership transfers only upon receipt of full payment, not upon delivery. Framed well — "once it's paid, it's 100% yours, that's the deal" — this is standard, expected language that clients rarely push back on, and it gives the freelancer real leverage if a client tries to withhold final payment after receiving the work. Two categories deserve their own carve-outs in the same clause: pre-existing tools, generic components, and reusable know-how that the freelancer retains regardless of the engagement, and third-party open-source libraries, which remain governed by their own licenses no matter what the main assignment clause says. This lesson explains how IP assignment works conceptually — it is not a substitute for having your specific IP clause, and the governing law it relies on, reviewed by a lawyer qualified in your jurisdiction and your client's.

```quiz
- q: "A client has paid in full and taken delivery, and no IP clause was signed. Who owns the code?"
  anchor: "Payment alone does not transfer ownership anywhere. Only a written, signed clause does that."
  options:
    - text: "The client — they commissioned it and paid for it"
      correct: false
      why: "In essentially every legal system the person who wrote the code owns it by default from the moment it was created."
    - text: "The developer, unless a written signed clause transferred it"
      correct: true
      why: "Which is why this is the highest-stakes clause in a software contract, and also one of the easiest to get right."
    - text: "Nobody, until delivery is formally accepted"
      correct: false
      why: "Ownership exists from the moment of creation. Acceptance is a separate question entirely."

- q: "Why does the lesson recommend payment-contingent assignment?"
  anchor: "ownership transfers only upon receipt of full payment, not upon delivery"
  options:
    - text: "It postpones the paperwork until the money has arrived"
      correct: false
      why: "The clause is signed up front. What is contingent is the transfer, not the agreement."
    - text: "It gives real leverage if a client withholds final payment after receiving the work"
      correct: true
      why: "And framed as \"once it's paid, it's 100% yours, that's the deal\", it is standard language clients rarely push back on."
    - text: "It removes the need for an assignment clause in jurisdictions that restrict assignment"
      correct: false
      why: "Those jurisdictions use an exclusive, irrevocable, perpetual licence instead — a different mechanism, not the absence of one."

- q: "Which two categories need their own carve-outs inside the assignment clause?"
  anchor: "pre-existing tools, generic components, and reusable know-how that the freelancer retains regardless of the engagement, and third-party open-source libraries"
  options:
    - text: "The client's brand assets and their existing database"
      correct: false
      why: "Those were never the freelancer's to assign, so they are not what a carve-out is for."
    - text: "The freelancer's pre-existing tools and reusable know-how, and third-party open-source libraries"
      correct: true
      why: "The first is retained regardless of the engagement; the second stays governed by its own licences whatever the main clause says."
    - text: "Test code and documentation, which are excluded by default anyway"
      correct: false
      why: "Nothing is excluded by default — writing the clause explicitly is the entire mechanism."
```

## Key Concepts
- **Default ownership rule**: the creator owns the work by default in virtually every jurisdiction; payment alone transfers nothing without a written assignment clause.
- **Jurisdiction-dependent mechanism**: assignment (outright transfer), exclusive irrevocable license (used where full assignment to an individual is restricted), or work-made-for-hire (common-law doctrine making the hiring party the legal author from creation) — the right mechanism depends on governing law, not personal preference.
- **Payment-contingent assignment**: ownership transfers upon receipt of final payment, not upon delivery — this is the freelancer's primary source of leverage and is standard, expected practice.
- **Reusable component carve-out**: the freelancer retains ownership of pre-existing tools, generic patterns, and non-client-specific utilities, provided they contain no client-confidential information.
- **Third-party license pass-through**: open-source and third-party components remain governed by their own licenses regardless of what the main IP clause says between freelancer and client.
- **Governing law as a negotiation lever**: for cross-border engagements, which country's law governs the contract materially changes how IP assignment actually works — this is worth deciding deliberately, not accepting by default.

## Example Code
```markdown
## Intellectual Property (illustrative — have local counsel confirm wording)

Upon receipt of full and final payment, Contractor assigns to Client all
right, title, and interest in the deliverables created under this
agreement, including source code, documentation, and design files,
for the agreed business use.

Contractor retains ownership of pre-existing tools, generic code patterns,
reusable components, templates, and non-client-specific utilities used in
delivering the work, provided they contain no Client confidential
information.

Open-source and third-party components remain subject to their own
licenses. Client is responsible for compliance with third-party service
terms for accounts it owns.

[Where full assignment to an individual creator is not permitted under the
governing law, replace the above with:]
Contractor grants Client an exclusive, irrevocable, worldwide, royalty-free
license to use, reproduce, modify, and commercialize the deliverables and
derivative works, in perpetuity, for any purpose, effective upon receipt
of final payment.
```

## When to Use
- In every client contract, without exception — this clause should never be left implicit "because it's obvious."
- Whenever a project spans more than one country, so governing law and the correct transfer mechanism can be chosen deliberately.
- When hiring a subcontractor whose work you'll pass on to a client — the same chain needs to hold subcontractor → you → client, with no gap.

## Common Mistakes
- **The final invoice is paid in full, and everyone assumes that alone made the client the legal owner of the code** — Assuming payment automatically transfers ownership without any written clause saying so.
- **The contract grants a "license" to use the deliverable, when what the client actually thought they were buying was outright ownership** — Using the word "license" when "assignment" (or the jurisdiction-appropriate equivalent) was actually intended, leaving the client with less than they think they bought.
- **"You'll own full rights to everything I write" gets promised, including the reusable utility library used across every other client project** — Promising a client "full ownership of everything I ever write," which would improperly include the freelancer's own pre-existing tools and unrelated work.
- Accepting a subcontractor's refusal to sign an IP assignment or exclusive license clause and proceeding anyway — a break anywhere in the chain means the freelancer cannot guarantee clean IP to their own client.

## Further Reading
- WIPO's introductory guides on copyright and software as a starting orientation to how authorship and assignment work internationally.
- U.S. Copyright Office Circular 9 on "work made for hire" for a detailed look at one major jurisdiction's approach.
- Orrick's or similar law firms' public client alerts on cross-border IP assignment in outsourced software development, as a starting point before engaging your own lawyer.

```recall
- q: "State the default ownership position and what actually changes it."
  must:
    - "the person who writes the code owns it by default from the moment it is created"
    - "payment alone does not transfer ownership anywhere"
    - "only a written, signed clause does"

- q: "Name the three transfer mechanisms and when each applies."
  must:
    - "outright assignment language, which transfers ownership cleanly"
    - "an exclusive, irrevocable, perpetual licence where full assignment by an individual creator is restricted — Germany and France are the cited examples"
    - "work made for hire, making the hiring party the legal author from creation"
    - "provided both sides signed a written agreement before the work began"

- q: "What does payment-contingent assignment do, and how is it framed to a client?"
  must:
    - "ownership transfers only on receipt of full payment, not on delivery"
    - "\"once it's paid, it's 100% yours, that's the deal\""
    - "standard, expected language that clients rarely push back on"
    - "it gives leverage if a client withholds final payment after receiving the work"

- q: "What does this lesson explicitly not replace?"
  must:
    - "having your specific IP clause, and the governing law it relies on, reviewed by a lawyer"
    - "one qualified in your jurisdiction and your client's"
```
