# 226. Detecting and Responding to Scope Creep

## What It Is
Scope creep almost never announces itself as a demand. It arrives dressed as friendliness: "can we also add," "just one small thing," "while you're in there," "it should be simple," "we forgot to mention." None of these phrases are dishonest — most clients genuinely believe the request is minor — but the freelancer's job is to notice that friendly framing and unscoped work are two completely different questions, and to answer the second one deliberately instead of being talked past it by the first.

The detection habit is a short internal checklist run against every new request: was this listed in the SOW, was this workflow part of the acceptance criteria, does it require new UI, API, database, integration, testing, or deployment work, does it change something already approved, and is this actually a bug against agreed behavior or just a new expectation nobody stated before. Any "yes" beyond simple clarification means the request isn't a quick favor — it needs to be classified out loud, not absorbed silently.

The response itself doesn't need to be adversarial to be firm. "This is a reasonable addition, but it wasn't part of the approved scope — I can prepare a change request with the cost and timeline impact, or we can move it to the next phase" costs nothing in tone and protects everything in substance. The replacement option — swapping this new item for something of similar effort already in scope — turns a scope conversation into a prioritization conversation, which is far easier for a client to engage with than a flat "no." What should never happen, regardless of how small the request sounds, is a reflexive "sure, no problem" that skips classification entirely — that's not generosity, it's the mechanism by which a fixed-price project quietly becomes an unpaid, unbounded one.

```quiz
- q: "\"Just one small thing while you're in there — it should be simple.\" What is the job in that moment?"
  anchor: "friendly framing and unscoped work are two completely different questions"
  options:
    - text: "Judge the size honestly — if it really is small, absorb it"
      correct: false
      why: "Size is not the question being answered. Classification comes first, and the request may still be granted afterwards."
    - text: "Notice that the friendly framing and the unscoped work are separate questions, and answer the second one deliberately"
      correct: true
      why: "Most clients genuinely believe the request is minor — the framing is not dishonest, it is just not what is being decided."
    - text: "Push back on the framing — naming it early stops it repeating"
      correct: false
      why: "The lesson says plainly that none of these phrases are dishonest, and that the response does not need to be adversarial to be firm."

- q: "Which response does the lesson say should never happen, however small the request sounds?"
  anchor: "a reflexive \"sure, no problem\" that skips classification entirely"
  options:
    - text: "\"That wasn't in the approved scope — here is a change request with the cost and timeline impact\""
      correct: false
      why: "That is the recommended response. It costs nothing in tone and protects everything in substance."
    - text: "A reflexive \"sure, no problem\" that skips classification entirely"
      correct: true
      why: "Not generosity — the mechanism by which a fixed-price project quietly becomes an unpaid, unbounded one."
    - text: "\"We could swap this for something of similar effort already in scope\""
      correct: false
      why: "That is the replacement option, which turns a scope conversation into a prioritization one."

- q: "What does offering the replacement option actually change?"
  anchor: "turns a scope conversation into a prioritization conversation, which is far easier for a client to engage with"
  options:
    - text: "It gets the work done without a change request, saving the admin"
      correct: false
      why: "It is a swap of similar effort, offered after the request was classified — not a way around classifying it."
    - text: "It converts a scope conversation into a prioritization one, which a client engages with far more easily than a flat no"
      correct: true
      why: "A trade is a question the client can actually answer."
    - text: "It moves the decision onto the client so the freelancer is not blamed later"
      correct: false
      why: "The point is not where blame lands; it is that the conversation becomes one the client can participate in."
```

## Key Concepts
- **Classification categories**: in-scope bug, included revision, clarification, out-of-scope new feature, out-of-scope rework, third-party/provider issue, or a support/maintenance request — every new message gets sorted into one of these before a reply is sent.
- **Friendly-language signals**: "just one small thing," "while you're at it," "it should be simple," "we forgot to mention," "can it also support..." — softness of phrasing has no bearing on whether the request is actually in scope.
- **Detection questions**: was this in the SOW, was it in the acceptance criteria, does it need new UI/API/DB/integration/testing/deployment work, does it change approved work, is it a bug or a new expectation.
- **Response ladder**: in-scope (handle immediately), reasonable-but-out-of-scope (change request / replace / defer), and not-recommended (name the complexity or timeline cost and suggest phase two).
- **Never-silent rule**: no request beyond genuine in-scope clarification gets a reflexive "sure, no problem" — it gets classified out loud first, every time, regardless of how small it sounds.

## Example Code
```template
## Scope-Creep Response Templates

**In-scope:**
"This fits the agreed scope and acceptance criteria, so I'll handle it
within the current milestone."

**Out-of-scope but reasonable:**
"This is a reasonable addition, but it wasn't part of the approved scope.
I can prepare a change request with the cost/timeline impact, or we can
move it to the next phase — happy to do either."

**Replace instead of add:**
"If you'd like to keep the budget where it is, we could replace [scoped
item] with this instead. Otherwise it's a paid change request."

**Not recommended:**
"I wouldn't recommend adding this to the current phase — it increases
complexity and could delay the core launch. It would be safer to capture
it as a phase-two item."
```

## When to Use
- Every time a client request arrives during a call, in chat, in feedback, or during a bug report review.
- When a "small" request keeps recurring in slightly different forms across a project.
- Any time you notice yourself about to say "sure, no problem" before actually checking the SOW.

## Common Mistakes
- **"Just one small thing while you're in there" gets treated as genuinely small because of how it's phrased, not what it actually involves** — Accepting friendly framing at face value instead of running the detection checklist regardless of tone.
- **"Sure, no problem" goes out to avoid an awkward moment, and the scope conversation gets attempted three weeks later instead** — Saying yes quickly to avoid an awkward moment, then trying to claw back scope or price later once the pattern repeats.
- **Classifying a request as out-of-scope feels like starting a fight, so it just doesn't get said out loud** — Treating classification as confrontational rather than as a standard, expected part of professional delivery.
- **"We can decide later" becomes the answer to a scope question, leaving price and timeline hanging along with it** — Letting "we can decide later" become the default answer, which leaves scope, price, and timeline all unresolved simultaneously.

## Further Reading
- Tom DeMarco and Timothy Lister, *Peopleware* — on managing incremental requirement drift without derailing delivery.
- The PMBOK Guide's treatment of scope validation and control as a formal analog to this freelance-scale practice.
- Blair Enns, *Pricing Creativity* — on treating every unscoped request as a pricing decision rather than a favor.

```recall
- q: "Give the phrases scope creep usually arrives in, and why they are not dishonest."
  must:
    - "\"can we also add\", \"just one small thing\", \"while you're in there\""
    - "\"it should be simple\", \"we forgot to mention\""
    - "most clients genuinely believe the request is minor"

- q: "Run the detection checklist from memory."
  must:
    - "was this listed in the SOW"
    - "was this workflow part of the acceptance criteria"
    - "does it require new UI, API, database, integration, testing or deployment work"
    - "does it change something already approved"
    - "is it a bug against agreed behaviour, or a new expectation nobody stated"
    - "any yes beyond simple clarification means it gets classified out loud"

- q: "Give the firm-but-not-adversarial response, and the alternative it can offer."
  must:
    - "\"a reasonable addition, but it wasn't part of the approved scope\""
    - "a change request with the cost and timeline impact, or move it to the next phase"
    - "or the replacement option — swap it for something of similar effort already in scope"

- q: "What is a reflexive \"sure, no problem\" actually doing?"
  must:
    - "skipping classification entirely"
    - "it is not generosity"
    - "it is the mechanism by which a fixed-price project quietly becomes an unpaid, unbounded one"
```
