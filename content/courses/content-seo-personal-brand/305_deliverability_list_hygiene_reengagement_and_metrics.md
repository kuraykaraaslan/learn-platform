# 305. Deliverability, List Hygiene, Re-engagement & Metrics

## What It Is
Even a well-written email fails if it never reaches the inbox, which is why domain reputation has to be treated as a protected business asset rather than a one-time setup checkbox. The technical baseline — SPF, DKIM, DMARC, a custom sending domain, a consistent sender identity, and a visible unsubscribe link — needs to be configured and verified before scaling send volume, not discovered as the explanation after deliverability quietly degrades. List hygiene runs on two clocks: monthly (remove hard bounces, suppress unsubscribes, review inactive subscribers, merge duplicates, check source quality) and quarterly (run a re-engagement campaign, suppress long-term inactive contacts, review the opt-in forms themselves, check for deliverability warnings). Sending cadence discipline matters just as much as the technical setup — disappearing for six months and then sending an aggressive campaign reads as spam to both recipients and inbox providers, while a predictable monthly-minimum cadence protects the sender's reputation over time.

Re-engagement exists for the specific, common case where contacts stop opening, old leads go quiet, or a proposal didn't close but might become relevant later — and the right tone is contextual, brief, useful, and explicitly respectful of silence, never guilt-driven or urgency-faked. An old lead gets a "should I close the loop on this?" message referencing the specific previous conversation; a past client gets a check-in about how the delivered system is working now; an inactive subscriber gets asked whether a different topic focus would be more useful, with an explicit reminder that unsubscribing is fine. The frequency rule caps how far this goes: one useful check-in, one final close-the-loop message, then suppress or reduce frequency — repeatedly chasing someone who has already gone quiet reads as exactly the kind of desperation the entire trust-building system was built to avoid.

Metrics close the loop on all of it, and the discipline that matters most is resisting vanity numbers. The priority order runs qualified replies, project inquiries, discovery calls, referrals, and case study clicks well above lead magnet conversions and list growth — with open rate explicitly useful but never the primary business metric, because a list can grow every month while the actual business outcomes it's supposed to produce quietly stall. A simple interpretation table turns raw numbers into action: high opens with low replies signals a CTA or relevance problem to fix; high unsubscribes signals a promise mismatch or a frequency that's too aggressive for what was set up front; low replies with high clicks signals a CTA that needs to ask for less friction; slow list growth signals the opt-in placement or lead magnet needs improvement, not that the newsletter itself is failing. The optimization cadence mirrors the hygiene cadence — monthly reviews of metrics, the best-performing topic, and one small sequence improvement; quarterly reviews of positioning, lead quality, and whether the lead magnet and welcome sequence still reflect where the business actually is now.

```quiz
- q: "Opens are high, replies are near zero. What does the interpretation table point at?"
  anchor: "high opens with low replies signals a CTA or relevance problem to fix"
  options:
    - text: "The subject lines — they are clearly the weak point"
      correct: false
      why: "High opens mean the subject lines are already working. The problem is everything after the open."
    - text: "The CTA, or the relevance of the content itself"
      correct: true
      why: "Those are the two things a reader who opened and then did nothing was failed by."
    - text: "Sending frequency — cut it until replies recover"
      correct: false
      why: "Frequency is the answer to high unsubscribes, which signal a promise mismatch or a cadence more aggressive than what was set up front."

- q: "A contact has stayed silent through a check-in and a close-the-loop message. What now?"
  anchor: "one useful check-in, one final close-the-loop message, then suppress or reduce frequency"
  options:
    - text: "A third message with a deadline, to create some urgency"
      correct: false
      why: "Faked urgency is named as the wrong tone, and repeated chasing reads as exactly the desperation the whole trust-building system exists to avoid."
    - text: "Suppress or reduce frequency — the cap has been reached"
      correct: true
      why: "The frequency rule caps re-engagement at two messages precisely so silence stays respected."
    - text: "Move them into a different sequence and start the count over"
      correct: false
      why: "Same chase, different label. The cap is on contacting someone who has already gone quiet, not on any one sequence."

- q: "Which ordering of metrics matches this lesson?"
  anchor: "qualified replies, project inquiries, discovery calls, referrals, and case study clicks well above lead magnet conversions and list growth"
  options:
    - text: "List growth first, then open rate, then replies"
      correct: false
      why: "That inverts it. A list can grow every month while the business outcomes it exists to produce quietly stall."
    - text: "Qualified replies and project inquiries first; list growth and open rate as supporting signals"
      correct: true
      why: "Open rate stays explicitly useful, but never as the primary business metric."
    - text: "Open rate first — nothing else can happen until the mail is opened"
      correct: false
      why: "It is a precondition, not a goal, and the lesson demotes it deliberately for that reason."
```

## Key Concepts
- **Technical deliverability baseline**: SPF, DKIM, DMARC, a custom sending domain, and a consistent sender identity should be configured and verified before scaling send volume.
- **Monthly vs. quarterly hygiene cadence**: bounces, unsubscribes, and duplicates get cleaned monthly; re-engagement campaigns and opt-in form review happen quarterly.
- **Predictable cadence protects reputation**: disappearing for months and then sending an aggressive campaign damages deliverability more than a modest but consistent schedule.
- **Re-engagement tone**: contextual, brief, useful, and explicitly respectful of silence — never guilt, fake urgency, or repeated chasing.
- **The re-engagement frequency cap**: one useful check-in, one final close-the-loop message, then suppress or reduce frequency for good.
- **Metrics priority order**: qualified replies and project inquiries outrank discovery calls, which outrank list growth and open rate — the last two are supporting signals, not the goal.
- **Interpretation-first metric reviews**: a metric only matters once it's paired with an action — high unsubscribes means check the promise or frequency; low growth means fix the opt-in, not the newsletter content.
- **Matching optimization and hygiene cadence**: monthly for tactical review (best topic, small fixes), quarterly for strategic review (positioning, lead quality, lead magnet freshness).

## Example Code
```md
## Deliverability Setup Checklist

[ ] SPF configured and verified
[ ] DKIM configured and verified
[ ] DMARC policy set
[ ] Custom sending domain in use
[ ] Reply-to address monitored
[ ] Sender name consistent across all sends
[ ] Unsubscribe link present on every send

## Re-engagement Template (Old Lead)

Subject: Should I close the loop on this?

Hi <Name>,

We previously discussed <topic/problem>. I know timing changes, so I wanted
to check whether this is still relevant or if I should close the loop for
now.

If the project is still on your side, the useful next step would be
clarifying <scope/timeline/decision item>.

No problem either way.

## Monthly Metrics Dashboard

| Metric                  | This month | Last month | Notes |
|--------------------------|-----------:|-----------:|-------|
| New subscribers          |            |            |       |
| Qualified replies        |            |            |       |
| Calls booked             |            |            |       |
| Lead magnet downloads    |            |            |       |
| Unsubscribes             |            |            |       |
| Best topic               |            |            |       |
| Inactive contacts        |            |            |       |

## Interpretation Rules

High opens, low replies    → improve CTA and relevance, sharpen reply prompt
High unsubscribes          → check promise mismatch, reduce frequency
Low replies, high clicks   → lower-friction CTA, add project review invite
Slow list growth           → fix opt-in placement, sharpen the lead magnet
```

## When to Use
- Before scaling send volume on a new or recently migrated sending domain
- During the monthly or quarterly list and metrics review
- When contacts have gone quiet for an extended period and a decision is needed: re-engage or suppress
- When open rates look healthy but replies, calls, and referrals aren't moving
- When list growth looks strong but qualified conversations aren't increasing to match it

## Common Mistakes
- **Open rate keeps climbing, so the newsletter is called a success** — Optimizing only for open rate while replies, calls, and referrals quietly stagnate
- **Send volume gets scaled up before SPF/DKIM/DMARC have actually been verified** — Scaling send volume before SPF/DKIM/DMARC are actually verified
- **A contact went quiet, so a follow-up goes out implying they're missing something urgent** — Repeatedly chasing a silent contact with guilt or manufactured urgency instead of one check-in and a close-the-loop
- **An old, unmaintained list gets a full send with no hygiene pass first** — Blasting an old, unmaintained list without a hygiene pass first, damaging deliverability for the whole domain
- **Subscriber count is rising month over month, so the newsletter is called a success** — Treating rising subscriber count as success while reply quality and business outcomes decline

## Further Reading
- [Google's sender guidelines for bulk email](https://support.google.com/mail) — first-party detail on the authentication and reputation thresholds that affect inbox placement
- [Litmus's guide to email deliverability](https://litmus.com) — a current, practitioner-level reference connecting technical setup to actual inbox outcomes
- A practical guide to RFM (recency, frequency, monetary) segmentation — useful for deciding which inactive contacts are worth one more re-engagement attempt versus suppression

```recall
- q: "State the technical deliverability baseline that must exist before send volume scales."
  must:
    - "SPF, DKIM and DMARC"
    - "a custom sending domain"
    - "a consistent sender identity"
    - "a visible unsubscribe link"
    - "configured and verified before scaling, not discovered afterwards as the explanation"

- q: "Split list hygiene into its monthly and its quarterly work."
  must:
    - "monthly: remove hard bounces, suppress unsubscribes, review inactive subscribers"
    - "monthly: merge duplicates, check source quality"
    - "quarterly: run a re-engagement campaign, suppress long-term inactive contacts"
    - "quarterly: review the opt-in forms, check for deliverability warnings"

- q: "Why is a modest predictable cadence safer than six quiet months followed by a big campaign?"
  must:
    - "the gap-then-blast pattern reads as spam to recipients and to inbox providers"
    - "a predictable monthly-minimum cadence protects sender reputation over time"

- q: "Give the right re-engagement message for an old lead, a past client, and an inactive subscriber."
  must:
    - "old lead — \"should I close the loop on this?\", referencing the specific previous conversation"
    - "past client — a check-in on how the delivered system is working now"
    - "inactive subscriber — ask whether a different topic focus would help, and say plainly that unsubscribing is fine"
    - "tone throughout: contextual, brief, useful, explicitly respectful of silence"
```
