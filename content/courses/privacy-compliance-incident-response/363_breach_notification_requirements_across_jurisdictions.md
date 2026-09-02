# 363. Breach Notification Requirements Across Jurisdictions

## What It Is
Once an incident response process (lesson #362) confirms personal data may have been involved, a separate clock starts — and it's a legal clock with a specific deadline, a specific regulator, and specific content requirements, all of which vary by jurisdiction in ways that are easy to get wrong by assuming "GDPR's 72 hours" is universal. Under GDPR, a personal data breach must be reported to the competent national data protection authority within 72 hours of the organization becoming aware of it — not 72 hours from when the breach happened, from when it's *discovered*, which is why detection speed (covered in the incident response and audit-logging lessons) directly determines how much of that window is left to actually investigate and report. KVKK in Turkey mirrors this timeline almost exactly: notification to the KVKK Kurumu within 72 hours of discovery. UK GDPR keeps the same 72-hour window but routes the notification to a different regulator entirely — the ICO, not an EU national DPA and not the KVKK Kurumu — a distinction that matters because post-Brexit UK deadlines and EU deadlines run on separate legal tracks even when the number of hours happens to match.

HIPAA in the US runs on a longer and structurally different timeline: a covered entity must notify affected individuals within 60 days of discovering a breach of unsecured Protected Health Information, and a business associate (which is what a software vendor touching PHI legally becomes) must notify the covered entity "without unreasonable delay," which in practice means fast enough that the covered entity can still meet its own 60-day clock — the 60 days is not a vendor's personal deadline, it's the outer bound the whole chain has to fit inside. NHS-adjacent UK health data adds a second, parallel reporting path on top of the standard 72-hour ICO notification: serious incidents also go through the NHS Data Security and Protection Toolkit's own incident-reporting mechanism, and severe cases additionally reach NHS England directly. US state consumer-privacy laws (CCPA/CPRA and similar) generally require notification "without unreasonable delay," a vaguer standard than GDPR's fixed number, but several states layer their own breach-notification statutes on top with their own specific deadlines — so a US incident potentially triggers state breach-notification law, not just the sector-specific federal rule.

The practical discipline this creates is a jurisdiction-routing decision that has to happen fast, immediately after the incident response process confirms personal data is involved: which regulator, which deadline, and which notification content is required, and whether more than one jurisdiction's clock is running simultaneously because the affected users span multiple countries. None of this replaces legal counsel — the final determination of whether a breach is notifiable, and the actual notification content and delivery, should go through legal/privacy counsel — but engineering's job is to have already produced, from the incident response process, the specific facts (what data, how many records, what timeframe, what containment has occurred) that counsel needs to make that call inside a 72-hour or 60-day window instead of starting the investigation from zero.


```quiz
- q: "A breach occurred on 1 March and you discovered it on 20 March. When does the GDPR clock start?"
  anchor: "72 hours of the organization becoming aware of it"
  options:
    - text: "1 March \u2014 the deadline runs from the breach itself"
      correct: false
      why: "If it ran from the event, every slow detection would be an automatic breach of the deadline. It runs from awareness."
    - text: "20 March \u2014 the 72 hours run from becoming aware"
      correct: true
      why: "Which is why detection speed decides how much of the window is left to investigate rather than just to report."
    - text: "Whenever the investigation confirms the scope of the data involved"
      correct: false
      why: "Waiting for a complete picture is the common mistake \u2014 the clock does not pause for the investigation."

- q: "You already report to an EU national DPA. A UK customer is affected too. What does that change?"
  anchor: "routes the notification to a different regulator entirely"
  options:
    - text: "Nothing \u2014 UK GDPR keeps the same 72 hours, so the same filing covers it"
      correct: false
      why: "The hours matching is a coincidence of drafting; the filing goes to a different regulator on a separate legal track."
    - text: "A separate notification to the ICO, on its own track, even though the window matches"
      correct: true
      why: "Post-Brexit the UK and EU deadlines run independently \u2014 the same number of hours does not make it the same obligation."
    - text: "Only if UK residents outnumber EU residents in the affected set"
      correct: false
      why: "There is no such threshold. The obligation follows the jurisdiction, not the headcount split."
```

## Key Concepts
- **GDPR / KVKK — 72 hours from discovery**: notification to the national DPA / KVKK Kurumu within 72 hours of *becoming aware*, not from when the breach actually occurred
- **UK GDPR — 72 hours to the ICO**: same window as GDPR but a distinct regulator and legal instrument — EU notification does not substitute for a UK one
- **HIPAA — 60 days, chain-of-notice**: covered entities notify affected individuals within 60 days; business associates (most software vendors) must notify the covered entity "without unreasonable delay" so the 60-day chain still closes on time
- **NHS dual-reporting path**: UK health incidents require both the standard 72-hour ICO notification and a separate NHS DSPT incident report, with severe cases also reaching NHS England
- **US state patchwork**: CCPA/CPRA-style laws use a vaguer "without unreasonable delay" standard, but individual states may layer their own specific breach-notification statutes on top
- **"Discovery" starts the clock, not the incident itself**: detection speed directly consumes the notification window — a slow-to-detect breach leaves less time to investigate and report
- **Multi-jurisdiction incidents**: an incident affecting users across countries can trigger multiple regulators' clocks simultaneously, each with its own deadline and content requirements
- **Engineering's deliverable to legal**: the specific facts (data types, record count, timeframe, containment status) produced by the incident response process — not the notification decision itself, which belongs to legal/privacy counsel

## Example Code
```typescript
// A jurisdiction-routing helper: NOT a legal determination, but a fast way to
// surface the right regulator/deadline/obligation to legal counsel the moment
// an incident is confirmed to involve personal data. Feed it what the incident
// response process (#362) already produced.

type Jurisdiction = "EU" | "UK" | "TR" | "US_HIPAA" | "US_STATE";

interface BreachNotificationRule {
  jurisdiction: Jurisdiction;
  regulator: string;
  deadline: string;
  clockStartsAt: "discovery" | "incident_occurrence";
  additionalReportingPath?: string;
}

const NOTIFICATION_RULES: Record<Jurisdiction, BreachNotificationRule> = {
  EU: {
    jurisdiction: "EU",
    regulator: "National Data Protection Authority (e.g. CNIL, BfDI)",
    deadline: "72 hours",
    clockStartsAt: "discovery",
  },
  UK: {
    jurisdiction: "UK",
    regulator: "ICO",
    deadline: "72 hours",
    clockStartsAt: "discovery",
    additionalReportingPath: "NHS DSPT + NHS England if NHS-adjacent health data",
  },
  TR: {
    jurisdiction: "TR",
    regulator: "KVKK Kurumu",
    deadline: "72 hours",
    clockStartsAt: "discovery",
  },
  US_HIPAA: {
    jurisdiction: "US_HIPAA",
    regulator: "HHS Office for Civil Rights (via the covered entity)",
    deadline: "60 days to affected individuals (business associate notifies covered entity without unreasonable delay)",
    clockStartsAt: "discovery",
  },
  US_STATE: {
    jurisdiction: "US_STATE",
    regulator: "State Attorney General (varies)",
    deadline: "'Without unreasonable delay' — check the specific state statute",
    clockStartsAt: "discovery",
  },
};

function routeIncident(affectedJurisdictions: Jurisdiction[]): BreachNotificationRule[] {
  // An incident touching users in multiple regions runs multiple clocks
  // in parallel — surface all of them, do not pick just one.
  return affectedJurisdictions.map((j) => NOTIFICATION_RULES[j]);
}

// Usage the moment personal-data involvement is confirmed:
const applicable = routeIncident(["EU", "US_HIPAA"]);
// → hand `applicable` straight to legal/privacy counsel alongside the
//   incident report produced by the response process (#362).
```

## When to Use
- The moment the incident response process (#362) confirms that personal data may have been involved — this determination should happen in parallel with containment, not after
- When users affected by an incident span more than one jurisdiction — confirm every applicable regulator and deadline, not just the most familiar one
- When onboarding a health-data client or feature — confirm in advance which breach-notification path applies (HIPAA, NHS DSPT, KVKK health-specific rules) before an incident, not during one
- When a business-associate or processor relationship exists — confirm your own notification-to-the-controller deadline is fast enough for their downstream deadline to still be achievable
- When drafting the incident communication plan — the legally required deadline should shape the internal escalation timeline, not be discovered only once legal gets involved

## Common Mistakes
- **The EU notification goes out within 72 hours, and nobody realizes the UK arm of the same incident needed its own separate ICO notification** — Assuming "72 hours" is a single universal number and not realizing UK GDPR, EU GDPR, and KVKK route to three different regulators even though the deadline number matches
- **The 72-hour clock gets counted from when the breach actually happened three weeks ago, not from when it was discovered yesterday** — Starting the notification clock from when the breach occurred instead of from when it was *discovered*, misjudging how much time remains
- **HIPAA's 60 days feels like plenty of time, so the business associate takes two weeks just deciding how to word the notice to the covered entity** — Treating HIPAA's 60-day window as generous and therefore low-urgency, missing that a business associate's own notification to the covered entity must happen fast enough for the covered entity's 60-day clock to still close on time
- **Legal counsel starts researching which regulators apply from a standing start, hours into an incident that's already burning through its notification window** — Waiting for legal counsel to determine jurisdiction and deadlines from scratch during the incident instead of having the facts and a jurisdiction map ready to hand over immediately

## Further Reading
- [GDPR Article 33 — Notification of a Personal Data Breach to the Supervisory Authority](https://gdpr-info.eu/art-33-gdpr/)
- [ICO — Personal Data Breaches Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/personal-data-breaches/)
- [HHS — Breach Notification Rule (HIPAA)](https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html)

```recall
- q: "When does the 72-hour clock start, and why does that detail matter?"
  must:
    - "from becoming aware, not from when the breach happened"
    - "slow detection eats the window you needed for investigating"
    - "the clock does not pause while you establish scope"

- q: "Name three regimes and where each notification goes."
  must:
    - "GDPR \u2014 the competent national data protection authority"
    - "UK GDPR \u2014 the ICO, on a separate post-Brexit track"
    - "KVKK \u2014 the KVKK Kurumu in Turkey, same 72-hour shape"

- q: "Why is 'GDPR's 72 hours is universal' a dangerous assumption?"
  must:
    - "the deadline, the regulator and the required content all vary"
    - "matching hour counts do not mean one filing satisfies both"
    - "a missed regulator is a separate violation, not a formality"
```
