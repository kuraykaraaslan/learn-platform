# 189. Follow-Up Cadence, Reply Handling & Campaign Discipline

## What It Is
Once a first touch goes out, everything that follows runs on one canonical shape: Day 0, Day 3-5, Day 10-14, then stop. Touch two has to carry something touch one didn't — a follow-up that just repeats the ask is a reminder that you want something, and a reminder is pressure. Touch three explicitly says it's the last message, and then it actually is. After three silent touches, the rule is a 90-day cooling-off period on every channel, and re-contact after that is only permitted with a genuinely new, fresh trigger — not a rerun of the old one dressed up differently. Two full silent sequences means the prospect is done permanently and goes on the suppression list. None of this is negotiable under pipeline pressure: a stop condition — any opt-out signal, a hostile reply, a hard bounce, or "not now" without a specific date — ends the sequence immediately, mid-cadence, no exceptions.

The moment any reply arrives, the cold-outreach ruleset's job narrows to exactly one thing: classify the reply and, if it's any form of no, suppress before doing anything else, including replying. A hard no, an opt-out, or a hostile reply gets suppressed immediately, before a response is even drafted — the statutory windows for honoring an opt-out (3 business days in Türkiye, 10 in the US) are ceilings, not targets to use up. A positive reply or a genuine information request gets answered the same business day, but the reply itself does exactly one thing: deliver what was promised, or ask the single question needed to move forward. The single most common way a cold conversation gets lost after a good reply is the pitch dump — leading with a full service list, a rate card, and a calendar link the instant someone shows a flicker of interest. Interest is not commitment, and a reply is the finish line of cold outreach, not the starting gun for an improvised sales process; qualifying, scoping, and pricing all belong downstream, not inside this reply.

Suppression itself is permanent and cross-channel by design: someone who says no to a cold email doesn't get a LinkedIn request next, and a refusal that speaks for the company — a gatekeeper's "we don't take vendor calls," a compliance reply — suppresses the whole domain, not just the one address. There is no re-add, ever, except the one exception that the person contacts you first, which reopens the conversation without lifting the outbound suppression entry. Volume discipline works the same way underneath all of this: ceilings scale by adding another mailbox, never by raising one mailbox's daily number, and a brand-new sending domain ramps up over roughly five weeks rather than starting at full volume. The numbers that actually matter — reply rate, not open rate, which isn't tracked here at all — decide whether a campaign continues, gets one variable changed, or dies outright: a reply rate under 2% after fifty sends, or a complaint rate above 0.3%, means the campaign stops that day, not "gets monitored." Scaling volume to fix a weak reply rate is the single most common way a legitimate cold motion turns into spam; the lever available is always relevance, never quantity.

```quiz
- q: "Three touches have gone out and the prospect has stayed silent throughout. What now?"
  anchor: "After three silent touches, the rule is a 90-day cooling-off period on every channel"
  options:
    - text: "Try a different channel — the sequence only ran on email"
      correct: false
      why: "The cooling-off applies on every channel, not per channel."
    - text: "A 90-day cooling-off on every channel, and re-contact only with a genuinely new trigger"
      correct: true
      why: "Not a rerun of the old trigger dressed up differently — and two full silent sequences means the suppression list, permanently."
    - text: "Move them to a nurture list and keep sending something monthly"
      correct: false
      why: "That is a fourth touch under another name, and touch three already said it was the last."

- q: "A hostile reply arrives. What happens first?"
  anchor: "gets suppressed immediately, before a response is even drafted"
  options:
    - text: "Draft a brief, gracious apology, then suppress"
      correct: false
      why: "Suppression comes before anything else, including replying."
    - text: "Suppress immediately, before a response is even drafted"
      correct: true
      why: "The statutory windows for honouring an opt-out — 3 business days in Türkiye, 10 in the US — are ceilings, not targets to use up."
    - text: "Wait out the statutory window so the record shows a considered response"
      correct: false
      why: "Those windows are ceilings, not targets."

- q: "Someone replies with genuine interest. What is the most common way the conversation is lost from there?"
  anchor: "the pitch dump — leading with a full service list, a rate card, and a calendar link the instant someone shows a flicker of interest"
  options:
    - text: "Replying too slowly and losing the moment"
      correct: false
      why: "A positive reply or genuine information request is answered the same business day — but speed is not where this goes wrong."
    - text: "The pitch dump — a full service list, a rate card and a calendar link on the first flicker of interest"
      correct: true
      why: "Interest is not commitment. A reply is the finish line of cold outreach, not the starting gun for an improvised sales process."
    - text: "Failing to qualify the lead before answering at all"
      correct: false
      why: "Qualifying, scoping and pricing all belong downstream, not inside this reply."
```

## Key Concepts
- **Canonical 3-touch cadence**: Day 0 / Day 3-5 (adds new content, never "just following up") / Day 10-14 (explicitly the last message), then a 90-day cooling-off before any recontact.
- **Immediate, non-negotiable stop conditions**: any opt-out, hostile reply, hard bounce, or an undated "not now" ends the sequence on the spot, mid-cadence.
- **Reply taxonomy with a required SLA**: positive/information-request replies get a same-day answer; opt-out/hard-no/hostile replies get suppressed immediately, before any reply is sent.
- **A reply is the finish line, not the start**: this process owns suppression on a reply and nothing else — qualifying, scoping, and pricing move to the next stage.
- **No pitch dump on a positive reply**: answer with exactly what was promised, plus at most one clarifying question — a full service catalogue in the first reply loses more conversations than the cold message ever did.
- **Suppression is permanent and cross-channel**: one no closes every channel forever, with re-contact possible only if the person reaches out first.
- **Volume scales by adding mailboxes, not by raising one mailbox's ceiling**, and a new domain ramps gradually rather than starting at full send volume.
- **Reply rate, not open rate, is the primary metric**: a campaign below its kill threshold stops that day; strong metrics are a reason to narrow the segment further, never to raise the volume cap.

## Example Code

**Reply classification and action:**

```text
Reply type                     | Action                              | SLA
--------------------------------|--------------------------------------|---------
Positive / info request         | Answer directly, one clarifying Q   | Same day
Not now, WITH a date            | Log date, stop sequence, one recontact | Same day
Not now, NO date                | Treat as no, suppress               | Immediate
Hard no / opt-out / hostile     | Suppress FIRST, reply after if at all | Immediate
Wrong person, referred onward   | Thank them; referred person is new  | Same day
Auto-reply / out of office      | Not a touch; resume after return date | —
Hard bounce                     | Suppress the address permanently    | Immediate
```

**Weekly campaign review scorecard:**

```markdown
Campaign ID:            
Sends this week:        
Reply rate:              (kill if <2% after 50 sends)
Positive reply rate:     (kill if <1% after 50 sends)
Opt-out rate:            (kill if >10%)
Complaint rate:          (auto-stop if >=0.3%)
Decision: Continue / Iterate one variable / Kill
Ethics re-check passed:  Y/N
```

## When to Use
- Immediately after sending any first touch, to schedule the exact next two dates.
- On every reply, regardless of channel, before drafting any response.
- Every week, reviewing a live campaign's numbers against the kill/iterate/scale thresholds.
- When a campaign is performing well and there's a temptation to push volume higher.

## Common Mistakes
- **A prospect hasn't replied after three touches on email, so you try them on LinkedIn** — Sending a fourth touch on any channel, or resetting the touch counter by switching channels.
- **A reply comes in hostile, and you want to respond and de-escalate right away** — Replying to a hostile or negative message before suppression has actually been applied.
- **A prospect replies "maybe later," no date attached** — Treating a polite "maybe later" with no date as a warm lead instead of a no.
- **A prospect replies showing mild interest, so you send your full rate card and a calendar link** — Pitch-dumping a full rate card and calendar link the moment a prospect replies with mild interest.
- **A campaign is working, so you raise that mailbox's daily send limit to scale it faster** — Scaling a working campaign by raising one mailbox's daily send limit instead of adding another mailbox.

## Further Reading
- *Cracking the Sales Management Code* — Jason Jordan & Michelle Vazzana: distinguishing metrics that actually predict outcomes from ones that just feel busy.
- *Measure What Matters* — John Doerr: setting a small number of metrics with real kill/continue consequences, applied here to a solo campaign.
- *The Ultimate Sales Machine* — Chet Holmes: systemizing follow-up discipline so it survives busy weeks instead of quietly lapsing.

```recall
- q: "Give the canonical cadence, and what each touch has to carry."
  must:
    - "Day 0, Day 3-5, Day 10-14, then stop"
    - "touch two has to carry something touch one didn't — a repeated ask is a reminder, and a reminder is pressure"
    - "touch three explicitly says it is the last message, and then it actually is"

- q: "Name the stop conditions that end a sequence immediately, mid-cadence."
  must:
    - "any opt-out signal"
    - "a hostile reply"
    - "a hard bounce"
    - "\"not now\" without a specific date"
    - "none of it is negotiable under pipeline pressure"

- q: "What happens after three silent touches, and after two silent sequences?"
  must:
    - "a 90-day cooling-off period on every channel"
    - "re-contact only with a genuinely new, fresh trigger — not a rerun of the old one"
    - "two full silent sequences means done permanently, onto the suppression list"

- q: "A reply arrives. What is the ruleset's job, and what does the reply itself do?"
  must:
    - "classify the reply, and if it is any form of no, suppress before doing anything else including replying"
    - "a positive reply or genuine information request is answered the same business day"
    - "the reply does exactly one thing: deliver what was promised, or ask the single question needed to move forward"
```
