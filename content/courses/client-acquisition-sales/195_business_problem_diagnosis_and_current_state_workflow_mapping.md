# 195. Business Problem Diagnosis & Current-State Workflow Mapping

## What It Is
Clients describe what they want in the language of features — an admin dashboard, an app, a booking system — because that's the vocabulary they have, not because the feature is actually what matters. Diagnosis is the discipline of translating every requested feature back through a fixed chain: feature request → workflow problem → business cost → desired outcome. "Admin dashboard" becomes "managers can't track orders without asking staff," which becomes "delays, manual reporting, poor visibility," which becomes "real-time operational status and faster decisions." Skipping this chain and jumping straight to building the requested feature routinely produces a technically correct deliverable that doesn't fix anything, because the feature was never the actual point. A small set of categories — revenue, operational, visibility, customer experience, compliance/risk, cost, strategic — gives the diagnosis a place to land, and asking for rough value even when exact numbers aren't available ("how many hours a week," "how many requests are affected") keeps the diagnosis grounded in something measurable rather than a vague sense that the project "would help."

The sharpest version of this discipline is separating symptoms from root causes, because clients reliably describe the symptom with total confidence and never see the cause underneath it: "our website is old" is usually a symptom of weak conversion or no clear offer, not a design problem; "we need an app" is usually a request for mobile access to one specific workflow, not a mandate to build a native app; "we need a dashboard" is usually a symptom of managers lacking operational visibility, which a much smaller build than "a dashboard" might solve. Diagnosis ends with an outcome statement in a fixed shape — "the project should help \<user/company\> move from \<current painful state\> to \<desired improved state\> by enabling \<core workflow\>" — which is deliberately not a feature list. If that sentence can't be written yet, diagnosis isn't finished, no matter how many features have already been discussed.

Once the problem is named, current-state workflow mapping does the parallel job of exposing how the work actually happens today, because a better system can't be designed against a workflow nobody has actually walked through. The sequence is trigger → actor → action → data → decision → output → exception, and it only works when the client is asked to walk through the process step by step rather than summarize it — "it's simple" from a client describing a multi-role approval chain is a signal to slow down, not a green light to move on. Manual-process signals — spreadsheet dependencies, WhatsApp or email approvals, duplicate data entry, no status visibility, lost requests — are each, on their own, a candidate business case for the software being discussed. Every workflow map has to explicitly cover exceptions, not just the happy path: what happens if a request is rejected, if required data is missing, if two people edit the same record, if an approver is out. Skipping exceptions during discovery doesn't make them go away; it just means they surface for the first time during delivery, as scope the client assumed was already included.

## Key Concepts
- **The diagnosis chain**: feature request → workflow problem → business cost → desired outcome — never accept the feature name as the actual requirement.
- **Problem-type categories**: revenue, operational, visibility, customer experience, compliance/risk, cost, strategic — used to classify what's really being solved.
- **Value clarification without forcing precision**: ask for hours, volumes, or affected counts; accept ranges when exact numbers aren't known rather than skipping the question.
- **Symptoms vs. root causes**: "the website is old," "we need an app," "we need a dashboard" are symptom statements — the diagnosis job is finding what's underneath each one.
- **The outcome statement format**: "help \<user/company\> move from \<current state\> to \<desired state\> by enabling \<core workflow\>" — a required, non-optional close to diagnosis.
- **Workflow mapping sequence**: trigger → actor → action → data → decision → output → exception, walked step by step, never summarized.
- **Manual-process signals**: spreadsheets, WhatsApp/email approvals, duplicate entry, lost requests, unclear ownership — each one is a candidate business case on its own.
- **Exceptions are core scope, not later detail**: rejection paths, missing data, concurrent edits, and absent approvers must be mapped now, not discovered during delivery.

## Example Code

**Feature-to-outcome diagnosis chain:**

```text
Feature requested:     <what the client asked for>
Workflow problem:      <what actually breaks without it>
Business cost:         <time, money, visibility, risk>
Desired outcome:       <what should be true after delivery>

Outcome statement:
"The project should help <user/company> move from <current painful state>
to <desired improved state> by enabling <core workflow/outcome>."
```

**Workflow mapping template:**

```text
Workflow name:
Purpose:
Trigger:
Actors:
Steps:      1. 2. 3. ...
Inputs:
Outputs:
Rules:
Exceptions: (rejection / missing data / concurrent edit / absent approver)
Pain points:
Improvement opportunities:
```

## When to Use
- The moment a prospect describes their need as a feature or a named product ("we need an app like X") instead of a problem.
- Whenever an existing manual process, spreadsheet, or legacy system is part of what the project is meant to replace.
- Before any scope or estimate is discussed — a feature list is not a substitute for a diagnosed problem.
- When a call feels productive but nobody could yet write the one-sentence outcome statement.

## Common Mistakes
- Accepting "we need a website" or a named feature as a complete requirement without asking what it's actually for.
- Designing screens or discussing technology before the current workflow has been walked through step by step.
- Treating "it's simple" from the client as accurate instead of a sign to ask for the step-by-step version.
- Letting exceptions (rejections, errors, concurrent edits) stay undiscussed until they appear mid-delivery as unplanned scope.
- Confusing feature quantity with project value — a long feature list is not the same thing as a diagnosed business problem.

## Further Reading
- *The Mom Test* — Rob Fitzpatrick: asking questions that expose the real problem instead of validating whatever solution the client already has in mind.
- *Mastering the Complex Sale* — Jeff Thull: diagnostic-first selling that resists the pull toward proposing a solution before the problem is actually understood.
- *The Goal* — Eliyahu M. Goldratt: root-cause and bottleneck thinking, the same discipline behind separating a workflow's real constraint from its visible symptoms.
