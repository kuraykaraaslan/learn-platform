# 379. User Stories and Acceptance Criteria

## What It Is
A PRD's functional requirements (lesson 378) describe what the system must do at the feature level. User stories and acceptance criteria break that down one more level, into units small enough to plan, build, and test independently. The story format — "As a `<user role>`, I want to `<action/capability>`, so that `<benefit/outcome>`" — exists to keep every piece of work anchored to a user and a reason, instead of drifting into a developer's internal task list. "Refactor the ticket service" is a task. "As an event organizer, I want to define ticket types with price and capacity, so that I can sell different categories of tickets for the same event" is a story, because it names who benefits and why, and it can be demoed to a real person.

Acceptance criteria answer the question a story alone can't: how do we know it's done correctly? The Given/When/Then structure forces that answer into a testable shape — "Given I am an authenticated admin, when I create a ticket type with name, price, currency, and capacity, then the ticket type should be saved and appear under the selected event." For any story that matters, criteria should cover more than the happy path: validation rules, permission behavior, empty states, error states, and edge cases. A story that only specifies the happy path is a story that will pass review and then surprise everyone in QA, because "what happens when the field is blank" was never actually decided — it was left for whoever wrote the code that day to guess.

Sizing is the discipline that keeps stories usable for planning. "As an admin, I want to manage the entire event system" is not a story, it's a project description wearing story syntax — it can't be estimated, demoed, or tested as one unit because it bundles unrelated workflows. The fix is mechanical: split by distinct user action, not by screen or by data model. "Create an event draft," "publish an event," "create ticket types for an event," and "export attendees" are each independently buildable and independently demoable, even though a UI mockup might show them on the same screen.

## Key Concepts
- **Story format**: As a `<role>`, I want to `<action>`, so that `<benefit>` — every story names a user and a reason, never just a task
- **Given/When/Then acceptance criteria**: the testable behavior contract for a story, not a paraphrase of the story itself
- **Required criteria types**: happy path, validation rules, permission behavior, empty state, error state, edge case, success state — skipping any of these leaves a real behavior undefined
- **Story sizing rule**: a story is too large if it bundles unrelated workflows; split by distinct user action, not by screen or database table
- **Priority tag on stories**: P0/P1/P2, inherited from feature prioritization (lesson 376), not re-litigated per story
- **Stories describe user-visible behavior**: "As an admin, I want to see a validation error when the price field is left blank" is a story; "refactor the validation layer" is not
- **Out-of-scope belongs on the story too**: a story can name what it explicitly does not cover, preventing scope from silently expanding during implementation

## Example Code
```template
## User Story: Create Ticket Type

**Role:** Event organizer (admin)
**Story:** As an event organizer, I want to define ticket types with price and capacity,
so that I can sell different categories of tickets for the same event.
**Priority:** P0

**Acceptance criteria:**
- Given I am an authenticated admin on an event I own, when I create a ticket type with
  name, price, currency, and capacity, then it is saved and appears under that event.
- Given I leave the price field blank, when I attempt to save, then the system shows a
  validation error and does not create the ticket type.
- Given I am not the owner of the event, when I attempt to create a ticket type on it,
  then the system rejects the action with a permission error.
- Given an event has zero ticket types, when I view its ticket type list, then I see an
  empty state prompting me to create the first one.
- Given the capacity is set below the number of tickets already sold, when I attempt to
  save, then the system rejects the change and states the conflict.

**Edge cases:** Currency change after tickets have already been sold in the original currency.
**Out of scope:** Bulk ticket type import; multi-currency pricing for the same ticket type.
```

## When to Use
- When breaking PRD functional requirements into backlog items for sprint planning
- When QA needs a testable contract to derive test cases from, not just a feature description
- Whenever a story reads like a task ("refactor," "optimize," "clean up") instead of a user-visible capability
- When a story feels too big to demo in one sitting — that's the signal to split it by user action

## Common Mistakes
- Writing stories from the developer's perspective ("As a developer, I want to cache the query") instead of the user's
- Sizing a story so large it spans multiple unrelated workflows, making it impossible to estimate or demo as one unit
- Writing acceptance criteria that cover only the happy path, leaving validation, permission, and empty/error states undefined until QA finds them
- Writing subjective acceptance criteria ("the form works well") instead of a testable Given/When/Then statement

## Further Reading
- Mike Cohn — "User Stories Applied" (the foundational text on story format and sizing)
- [Dan North — "Introducing BDD"](https://dannorth.net) — the original source of the Given/When/Then structure
- Bill Wake's INVEST mnemonic (Independent, Negotiable, Valuable, Estimable, Small, Testable) for judging whether a story is actually ready to build
