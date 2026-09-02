# 375. MVP Scoping — Valuable, Usable, Testable, Deliverable

## What It Is
"MVP" has drifted so far from its original meaning that it's worth re-anchoring: an MVP is the smallest version of a product that is simultaneously valuable, usable, testable, and deliverable. Drop any one of the four and you get something else instead. Drop valuable and you have a demo — something to look at, not something that solves anyone's problem. Drop usable and you have a prototype — proof that something is technically possible, not proof that a real person can operate it unaided. Drop testable and you have an unclear bet — you shipped something, but nobody defined what "worked" would look like. Drop deliverable and you have an over-scoped plan that will blow through the timeline before anyone learns anything.

The practical tool for scoping an MVP is the must-have vs. nice-to-have split, applied ruthlessly against the single question "does removing this break the core job?" For an event ticketing MVP, event listing, ticket pricing, checkout, QR generation, and check-in validation are must-haves — remove any one and organizers can't actually run an event. A seat-map editor, a loyalty program, and AI recommendations are not must-haves, no matter how excited anyone is about them, because the core job (sell tickets, check people in) works fine without them. This is a harder discipline than it sounds, because every excluded feature has a plausible-sounding argument for inclusion; the filter has to stay mechanical (does the core job break without it) rather than emotional (would it be nice to have).

A frequently missed piece is the quality floor: an MVP is smaller, not careless. Even the leanest MVP needs authentication if it touches sensitive data, basic input validation, clear error states, a safe payment flow if payments exist, and some form of logging. Cutting these to "ship faster" isn't scoping — it's introducing a different kind of risk that will surface as a security incident or a support fire instead of a missed deadline. The manual backoffice pattern is the legitimate way to shrink scope without cutting the quality floor: explicitly deciding that refund requests, for instance, will be handled by a human clicking a button in an admin panel during MVP, with the automated refund engine deferred to V2. That's a real scope reduction that preserves the product's ability to actually operate.


```quiz
- q: "The client is enthusiastic about a feature and the team likes building it. It is not needed for the core job. Which bucket?"
  anchor: "a feature is must-have only if the core job breaks without it"
  options:
    - text: "Must-have \u2014 client enthusiasm is a real signal about adoption"
      correct: false
      why: "Enthusiasm is explicitly not the filter. The lesson says regardless of enthusiasm."
    - text: "Later phase \u2014 the core job does not break without it"
      correct: true
      why: "The test is structural: remove it and ask whether the core job still completes."
    - text: "Must-have if it is cheap to build"
      correct: false
      why: "Cost affects sequencing inside a phase, not whether something belongs in the MVP boundary."

- q: "You ship something valuable, usable and deliverable, but you cannot tell whether it worked. What do you have?"
  anchor: "valuable, usable, testable, deliverable"
  options:
    - text: "An MVP \u2014 three of four conditions is the practical bar"
      correct: false
      why: "Missing any one changes what you built. There is no three-of-four version."
    - text: "Not an MVP \u2014 without testability it is an unclear bet, not a minimum viable product"
      correct: true
      why: "The point of the M and V is learning something; a build you cannot evaluate has not produced that."
    - text: "A prototype, since prototypes are the untestable category"
      correct: false
      why: "A prototype is usually the one that is not deliverable. Untestable lands elsewhere."

- q: "You are cutting scope hard. Which of these can go?"
  anchor: "non-negotiable even at minimum scope"
  options:
    - text: "Input validation, since the pilot users are known and trusted"
      correct: false
      why: "The quality floor is non-negotiable at minimum scope, and validation is on it."
    - text: "Automating an admin workflow \u2014 route it through a human instead, and document the boundary"
      correct: true
      why: "That is the manual backoffice pattern: a deliberate, documented choice rather than a gap."
    - text: "Basic logging, since there is no on-call rotation yet"
      correct: false
      why: "Also on the quality floor. Without it the first pilot incident is unexplainable."
```

## Key Concepts
- **Four MVP conditions**: valuable, usable, testable, deliverable — missing any one changes what you've actually built (demo, prototype, unclear bet, or overrun)
- **Must-have vs. nice-to-have filter**: a feature is must-have only if the core job breaks without it; everything else is a later-phase candidate regardless of enthusiasm
- **Quality floor**: authentication where sensitive data exists, basic authorization, input validation, clear error states, safe payment flow, basic logging — non-negotiable even at minimum scope
- **Manual backoffice pattern**: deliberately routing a workflow through human/admin action instead of automating it, as long as the decision and its boundary are explicit and documented
- **MVP definition fields**: MVP goal, core user, core job, must-have features, explicit exclusions, manual operations allowed, quality floor, success metric, pilot context, post-MVP roadmap
- **Pilot context**: naming the specific, controlled setting the MVP will first run in (one region, one team, one customer) rather than "everyone, everywhere" from day one
- **Excitement is not a scoping criterion**: the mechanism for inclusion is "does the core job break without this," not "is this exciting to build or to demo"

## Example Code
```template
## MVP Definition — Crew Scheduler

**MVP goal:** Prove that a single shared schedule view eliminates double-booking incidents,
without yet solving route optimization or customer-facing communication.

**Primary user:** Dispatch coordinator

**Core job:** Assign a technician to a job and reassign without creating a conflict.

**Must-have features:**
- Job creation (customer, address, time window)
- Technician assignment with conflict detection
- Day/week calendar view
- Manual reassignment
- SMS notification to technician on assignment change

**Manual operations allowed:**
Route sequencing within a technician's day is decided manually by the coordinator in MVP;
an optimization engine is explicitly V2, not a must-have.

**Out of scope:**
- Route optimization
- Customer self-scheduling portal
- Payroll/timesheet integration
- Native mobile app (SMS is sufficient for MVP notification)

**Quality floor:**
- Coordinator login required (no anonymous access to the schedule)
- Server-side validation that a technician cannot be double-booked
- Audit log of every reassignment (who, when, from/to)
- Basic error states on job creation (missing address, invalid time window)

**Success metric:** Double-booking incidents per week drops from current baseline to zero
across a 2-week pilot.

**Pilot context:** One dispatch coordinator, one region, 8 technicians, 2-week window.

**Next phase candidates:** Multi-dispatcher support, route optimization, customer notifications.
```

## When to Use
- Any time "MVP" is being used as a synonym for "cheap version" rather than "smallest version that tests the core assumption" — re-anchor to the four conditions before scoping
- When a stakeholder pushes back that the MVP feels too small — check whether the pushback is about a genuine must-have being cut, or about a nice-to-have losing its slot
- Before quoting a timeline or price — the must-have list is what gets estimated, not the full wishlist
- When deciding whether a workflow needs automation now or can run manually for a phase — the manual backoffice pattern is the tool for that decision
- Before every pilot or first release — the pilot context field forces you to name who exactly the first real users are, rather than launching to an undefined "everyone"

## Common Mistakes
- **Input validation gets cut to hit the deadline, on the reasoning that it's an MVP so quality corners are fair game** — Confusing "minimum" with "minimum quality" and cutting authentication, validation, or error handling to hit a deadline instead of cutting scope
- **A stakeholder is excited about AI recommendations, and it makes the MVP list without anyone checking whether the core job breaks without it** — Including a feature because it's technically interesting or because a stakeholder is excited about it, without applying the "does the core job break without it" test
- **Handling refunds manually through an admin panel gets treated as an embarrassing shortcut instead of a deliberate, documented scope decision** — Treating manual operations as a shameful compromise instead of a legitimate, explicitly-scoped scope reduction that preserves learning without overbuilding
- **The MVP launches with no defined success metric, so nobody can say afterward whether the underlying assumption was actually validated** — Defining an MVP with no success metric, which makes it impossible to know afterward whether the assumption was validated or the team just shipped something

## Further Reading
- Eric Ries — "The Lean Startup" (the original MVP concept, before "smallest version" drifted into "cheapest version" in common usage)
- Henrik Kniberg — "Making Sense of MVP" (the widely-cited skateboard-not-a-car-wheel illustration of valuable-at-every-stage scoping)
- Melissa Perri — "Escaping the Build Trap" (on why shipping isn't the same as validating, which is the same distinction the quality-floor and success-metric fields protect)

```recall
- q: "Name the four MVP conditions and what a build becomes when one is missing."
  must:
    - "valuable, usable, testable, deliverable"
    - "missing one makes it a demo, a prototype, an unclear bet or an overrun"
    - "the four are a definition, not a checklist to score"

- q: "State the must-have filter, and what does not count as an argument."
  must:
    - "must-have only if the core job breaks without it"
    - "enthusiasm does not qualify a feature"
    - "cheapness does not qualify a feature either"

- q: "What sits on the quality floor even at minimum scope?"
  must:
    - "authentication where sensitive data exists"
    - "basic authorization and input validation"
    - "clear error states and a safe payment flow"
    - "basic logging"

- q: "What is the manual backoffice pattern, and what makes it legitimate rather than a gap?"
  must:
    - "deliberately routing a workflow through a human instead of automating"
    - "the decision and its boundary are explicit"
    - "both are written down rather than discovered later"
```
