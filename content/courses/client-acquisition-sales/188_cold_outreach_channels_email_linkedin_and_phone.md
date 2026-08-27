# 188. Cold Outreach Channels: Email, LinkedIn & Phone

## What It Is
Which channel opens a cold conversation depends on the prospect's tier and what contact routes actually exist for them — and once chosen, every touch across every channel draws from a single shared budget of three, total, combined. Switching channels does not reset the counter: three emails and then a call is four touches, and the call does not happen. The default sequence is email→email→email; phone can enter as touch two for an A-tier prospect in a jurisdiction where a published business line exists, and LinkedIn can open the sequence when the only real contact route is a profile. What is never allowed is opening on the phone, contacting the same person on two channels the same day, or hopping to a new channel specifically to buy extra touches beyond three. A contact route that is only a personal address or a personal mobile means the row is dropped entirely, on every channel — no route in, ever.

Each channel has its own mechanics layered on top of the shared structure from message anatomy. Email requires a real personal from-name and a monitored reply-to address — never a "no-reply" alias or a company-sounding team persona — plus a subject line under six words that describes the message honestly (no fake "Re:", no "Quick question", no manufactured urgency), a single link, no tracking pixels, and a footer carrying identification and a plain-language opt-out. LinkedIn treats the connection request itself as the entire ask: 200-280 characters, no pitch, no CTA, because a bare request with no note is just noise and a request with a pitch attached confirms it was a pretext. The first DM only comes after acceptance, with a mandatory 24-hour wait — an instant DM the moment someone accepts reveals that the "connection" was never the real goal. Phone is the most intrusive channel and carries the tightest gate: it is never touch one, never called to a personal mobile, and reserved for A-tier prospects with a published business line. The opener runs four beats in strict order — identify yourself, say where the number came from, state the specific reason, then ask permission to continue — and that fourth beat, the explicit offer of an exit, is not optional. One voicemail is allowed per prospect, ever, not per attempt.

Underneath all three channels sits one identity rule that decides whether any of this even works: the identity in the message has to match what the recipient finds within thirty seconds of checking. A cold message is an unverified claim from a stranger, and the first thing an interested recipient does is search the name. If the website, the LinkedIn profile, the email domain, and the stated role don't all agree, the message is discarded on the spot no matter how well it was written.

## Key Concepts
- **Shared touch budget across all channels**: three total, combined — switching channels never resets it, and there is no fourth touch on any channel in any combination.
- **Channel-by-tier decision table**: A-tier with both phone and email can open on email with phone as touch two; LinkedIn-only prospects open with a connection request; personal-only contact routes mean the row is dropped.
- **Allowed vs. banned sequences**: email→phone→email and LinkedIn-request→DM→stop are allowed; simultaneous multi-channel contact and phone-as-touch-one are banned outright.
- **Email mechanics**: real from-name and monitored reply-to (never no-reply or a team alias), a sub-six-word honest subject line, one link, no tracking, footer with identification and opt-out.
- **LinkedIn mechanics**: the connection note IS the ask (no pitch inside it); mandatory 24-hour wait before the first DM after acceptance; no automation tooling of any kind.
- **Phone mechanics**: never touch one, never a personal mobile, A-tier only; the four-beat opener (identify, source, reason, permission-to-continue) with an explicit, offered exit.
- **One voicemail per prospect, ever** — not one per call attempt, one for the entire relationship with that contact.
- **The 30-second identity check**: website, LinkedIn profile, email domain, and stated role must all agree, or an interested reply evaporates the moment it's checked.

## Example Code

**Channel and sequence picker:**

```text
Tier A + phone line + email, recipient in TR  -> Email (touch 1) -> Phone (touch 2) -> Email (touch 3)
Tier A/B + only a LinkedIn profile             -> LinkedIn request -> LinkedIn DM -> stop
Tier B + email and LinkedIn both available     -> Email -> Email -> Email
Any tier + only a personal address/mobile      -> Do not contact. Drop the row.
```

**Phone opener script skeleton:**

```text
1. Identify:    "Hi, this is <name>, an independent software engineer."
2. Source:      "I got your number from <specific published source>."
3. Reason:      "I emailed last week about <specific, dated trigger>."
4. Permission:  "Is now a bad time — should I try later, or not call again?"
```

## When to Use
- Once a prospect has passed all three outreach gates and it's time to decide which channel opens the conversation.
- Building or auditing a cold email or cold LinkedIn template before a campaign starts.
- Before any cold call, to confirm the prospect actually qualifies for phone contact at all.
- Reviewing whether a sender's public identity (site, profile, domain) would survive a prospect checking it.

## Common Mistakes
- Opening a cold sequence on the phone instead of a written first touch.
- Emailing and sending a LinkedIn request to the same person on the same day.
- Treating LinkedIn automation tools or browser extensions as a shortcut instead of a terms-of-service and account risk.
- Leaving a phone number in an email footer that nobody actually answers.
- Leaving a second voicemail for the same prospect, or calling twice in one day.

## Further Reading
- *Smart Calling* — Art Sobczak: opener discipline and permission-based framing for the phone channel specifically.
- *To Sell Is Human* — Daniel Pink: the psychology behind channel choice and timing in an unsolicited approach.
- *The Challenger Sale* — Matthew Dixon & Brent Adamson: a consultative posture that keeps a cold phone conversation from turning into a pitch dump.
