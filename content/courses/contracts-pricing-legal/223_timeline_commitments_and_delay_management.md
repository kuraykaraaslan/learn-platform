# 223. Timeline Commitments and Delay Management

## What It Is
A timeline written as an unconditional promise is a timeline that will eventually be broken by something outside the freelancer's control — a client feedback delay, a payment processor's approval process, a slow response on brand assets — and then blamed on the freelancer anyway, because the document never said otherwise. A realistic timeline is conditional by construction: it names a start condition, states what it depends on, and says plainly what happens to the schedule when a dependency slips.

The start condition is worth stating explicitly rather than assuming: the clock starts after deposit payment, written SOW approval, and receipt of the access or content needed for the first phase — not from the date the proposal was signed. From there, a simple table (phase, estimated duration, start condition, client dependency, output) does more to manage expectations than paragraphs of caveats, because it makes the conditional nature of each phase visible rather than buried in fine print. The delay clause underneath the table says the same thing in words: client delays in providing content, access, feedback, or payment may shift the timeline, and so may third-party provider delays entirely outside the freelancer's control.

Rush requests deserve their own explicit rule rather than a default of quietly working nights and weekends unpaid. Accelerating a timeline usually requires one of a small number of real trade-offs — reduced scope, fewer review cycles, separate rush pricing, or deferring non-critical features — and naming those trade-offs turns "can you just go faster?" into a structured conversation instead of an unstated expectation that erodes both margin and goodwill. None of the language here is a guarantee that a court would treat a missed date as excused; how enforceable a conditional timeline clause actually is depends on your contract as a whole and your jurisdiction, so treat this as the operational habit and have the actual wording checked by a lawyer if a specific deadline carries real financial stakes for either side.

## Key Concepts
- **Conditional timeline structure**: estimated duration, start condition, client dependency, feedback window, and delay consequence — stated together, not as separate afterthoughts.
- **Timeline start rule**: the schedule begins after deposit, written SOW approval, and initial access/content are received — not from the proposal date.
- **Delay clause**: client delays (content, access, feedback, approvals, payment) and third-party delays (provider approvals, outages, API limitations) both explicitly shift the timeline.
- **No unconditional launch date**: a target launch date is stated as conditional on approvals, payment status, and the absence of unapproved scope changes, rather than guaranteed regardless of circumstances.
- **Rush work trade-offs**: acceleration requires scope reduction, fewer review cycles, separate rush pricing, or deferred features — not unpaid compression of the freelancer's own time.

## Example Code
```template
## Timeline

The project timeline begins after deposit payment, written SOW approval,
and receipt of required initial access/content.

| Phase | Est. Duration | Start Condition | Client Dependency | Output |
|---|---:|---|---|---|
| Kickoff & setup | 2–3 days | Deposit + SOW approved | Access/content list | Repo/board setup |
| Design | 1 week | Requirements confirmed | Feedback within 3 days | Approved screens |
| Core development | 2–4 weeks | Design approved | API/payment access | Working staging build |
| Testing & launch | 1 week | Final feedback received | DNS/provider approvals | Production release |

**Delay clause:** Client delays in providing content, access, feedback,
approvals, or payment may shift this timeline. Third-party provider
delays, outages, or API limitations may also affect delivery dates.

**Target launch date** is conditional on client approvals, payment status,
production access readiness, and the absence of unapproved scope changes.

**Rush requests:** Acceleration may require scope reduction, fewer review
cycles, rush pricing, or deferral of non-critical features — to be agreed
explicitly, not absorbed silently.
```

## When to Use
- Whenever a timeline, launch date, or delivery estimate is communicated to a client, in a proposal or a SOW.
- When a client asks to move a deadline earlier without changing scope.
- Any time a delay has already happened and needs to be attributed correctly between client-side and freelancer-side causes.

## Common Mistakes
- **"Launch is October 1st" gets said as a guarantee, with no mention of what it actually depends on** — Presenting an estimate as a guaranteed date regardless of client responsiveness or third-party approval timelines.
- **The client's content arrived ten days late, and the launch date somehow stayed exactly where it was** — Absorbing a client-caused delay into the existing deadline instead of visibly shifting the schedule.
- **"Can you just go faster?" gets answered with a few unpaid late nights instead of a scope or price conversation** — Accepting a rush request by quietly working unpaid overtime instead of naming the real trade-offs available.
- **The client's mental clock started the day the proposal was signed, three weeks before the deposit or SOW were ever finalized** — Leaving out the start condition, so the client's mental clock starts on the proposal date rather than the actual kickoff.

## Further Reading
- Tom DeMarco, *Waltzing with Bears: Managing Risk on Software Projects* — on the relationship between schedule commitments and unmanaged risk.
- Steve McConnell, *Software Estimation: Demystifying the Black Art* — on why single-point deadline estimates routinely fail without stated conditions.
- The Standish Group's CHAOS Report series on the historical relationship between fixed deadlines and project outcomes.
