# 365. Children's Data Compliance — Age Verification & Parental Consent

## What It Is
Children's data compliance is triggered by a single scoping question that most projects never explicitly ask: will users under 18 be able to access this service, and if so, what personal data does it collect from them? Getting this wrong is not a hypothetical risk — the UK's ICO fined TikTok £12.7M and the FTC fined YouTube $170M specifically over children's-data violations, and in both cases the platforms were not "for children" in the marketing sense, they were simply *accessible* to children without meaningfully different handling. That distinction — "likely to be accessed by children" versus "marketed at children" — is what the UK's Age Appropriate Design Code (Children's Code) actually tests, and it means a general-audience app with no age gate has to assume children can reach it rather than assuming they can't.

Each jurisdiction sets a different bar. The UK's Children's Code applies to any online service likely to be accessed by under-18s and imposes fifteen standards — privacy-by-default, a data protection impact assessment before launch, plain-language transparency, geolocation and profiling off by default, no nudge techniques (a bigger "Accept" button than "Decline"), and parental controls where the service is child-directed. The US's COPPA is narrower in scope (services directed at or with actual knowledge of under-13 users) but stricter in mechanism: verifiable parental consent is required *before* any personal data is collected, a neutral, non-cartoon age screen is used instead of a friendly one, and an under-13 user is routed to a parental-consent flow rather than simply blocked. The EU's GDPR Article 8 sets a "digital consent age" that varies by member state — 16 in Germany and the Netherlands, 15 in France, Italy, and Spain, 16 as the GDPR default elsewhere — below which a parent or guardian must authorize processing. Turkey's KVKK treats anyone under 18 as unable to give their own consent, requiring guardian consent regardless of the specific age tiers used elsewhere, and layers on BTK's separate child-protection filtering requirements for internet services.

The practical shape of compliance is the same regardless of jurisdiction, even though the exact age thresholds differ: age has to be established at signup (a neutral age screen, not a checkbox styled to be skipped), the flow has to route an under-age user to a real parental-consent mechanism rather than a soft block, tracking and profiling default to off for anyone who declares as under-age, and the privacy notice needs a plain-language version a child or parent can actually read. The one thing every jurisdiction agrees on is that age verification itself must be proportionate — collecting a scanned ID or a full birthdate just to confirm someone is over 13 collects far more data than the service needed in the first place, which is the same data-minimization principle from lesson #358 applied specifically to the age check.

## Key Concepts
- **Scoping trigger**: "will users under 18 access this service, and does it collect personal data from them?" — asked at discovery, not discovered after launch
- **"Likely to be accessed by" vs. "directed at"**: UK Children's Code applies based on accessibility, not marketing intent — a general-audience app with no age gate is in scope by default
- **UK Children's Code — 15 standards**: privacy by default, DPIA before launch, transparency, data minimization, geolocation/profiling off by default, no nudge techniques, parental controls where relevant
- **US COPPA — verifiable parental consent before collection**: applies to under-13 users; requires a neutral (non-child-appealing) age screen and a real parental-consent flow, not a simple block
- **EU GDPR Article 8 — variable digital consent age**: 15–16 depending on member state; under that age, a parent/guardian must authorize processing
- **TR KVKK — under-18 cannot self-consent**: guardian consent required regardless of the finer age tiers other jurisdictions use; BTK adds separate child-protection filtering obligations
- **Proportionate age verification**: don't collect more to verify age (ID scans, full birthdate) than the service would collect to operate — a neutral self-declared age screen is usually enough
- **Defaults for declared minors**: analytics, profiling, geolocation, and behavioral advertising off by default; "Reject" as prominent as "Accept" in any consent UI they see

## Example Code
```markdown
# Discovery Checklist — Children's Data Scoping

## Trigger Question (ask on every project)
"Will users under 18 be able to access this service? If yes, what is the
minimum age, and does the service collect any personal data from them?"

## Jurisdiction Routing
| Signal | Applies | Key obligation |
|---|---|---|
| Service accessible to UK users, no strict adult-only gate | UK Children's Code | 15 standards; DPIA before launch |
| Service directed at or knowingly used by US under-13s | COPPA | Verifiable parental consent before data collection |
| EU users, no age gate | GDPR Art. 8 | Digital consent age per member state (15–16) |
| TR users under 18 | KVKK + BTK | Guardian consent; content filtering obligations |

## Signup Flow — Age-Gated Path
1. Neutral age screen (date of birth entry, no cartoon/child-styled UI)
2. If age >= jurisdiction threshold → normal signup flow
3. If age < threshold:
   - US (<13): route to verifiable parental consent flow; do not collect
     personal data until consent is confirmed
   - EU (<15-16 by state): route to guardian authorization flow
   - TR (<18): route to guardian consent flow
   - UK: apply Children's Code defaults regardless of exact age (see below)
4. Record consent/authorization decision with timestamp and method

## Defaults Applied When User Is (or May Be) a Minor
- [ ] Analytics and profiling: OFF by default
- [ ] Geolocation: OFF by default, no continuous tracking
- [ ] Behavioral/retargeting advertising: disabled entirely
- [ ] Session replay: excluded for this user segment
- [ ] "Reject"/"Decline" options: same visual prominence as "Accept"
- [ ] Data retention: shortest period that serves the stated purpose

## Forbidden
- Nudge techniques (bigger "Accept" button, pre-ticked opt-ins) shown to declared minors
- Sharing a minor's data with third-party advertisers
- Collecting more identity data to "verify" age than the service needs to operate
```

## When to Use
- At discovery/scoping for any consumer-facing product without a strict, enforced adult-only gate — assume children can reach it unless proven otherwise
- When designing the signup or onboarding flow — the age screen and consent routing need to exist before the database schema for user profiles is finalized
- When a marketing or growth team proposes analytics, retargeting, or profiling features — check whether the under-age user segment needs to be excluded by default
- When a client says "we're not a kids' app, this doesn't apply" — apply the "likely to be accessed by" test rather than accepting the marketing framing at face value
- Before a UK launch specifically — the Children's Code's DPIA-before-launch requirement means this has to be resolved pre-launch, not patched in afterward

## Common Mistakes
- Assuming "we don't market to children" satisfies the UK Children's Code, which tests accessibility, not marketing intent
- Using a friendly, game-like age-verification screen for a COPPA-scoped service, when a neutral screen is specifically required
- Treating an under-13 (or under-16, depending on jurisdiction) user as simply blocked, instead of routed to a real, working parental-consent mechanism
- Collecting a full ID scan or exact birthdate to verify age when a simple, proportionate self-declared age check would have sufficed — over-collecting to solve a minimization problem
- Applying a single global age threshold (e.g., always 13) across all users instead of routing by the visitor's jurisdiction, which produces under-compliance in the EU/UK and over-collection in the US

## Further Reading
- [ICO — Age Appropriate Design Code (Children's Code)](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/) — the full 15-standard framework and applicability test
- [FTC — Children's Online Privacy Protection Act (COPPA) Rule](https://www.ftc.gov/business-guidance/privacy-security/childrens-privacy) — verifiable parental consent mechanisms and enforcement examples
- [GDPR Article 8 — Conditions Applicable to Child's Consent](https://gdpr-info.eu/art-8-gdpr/) — the member-state digital consent age variation
