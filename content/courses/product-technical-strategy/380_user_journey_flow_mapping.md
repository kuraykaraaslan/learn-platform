# 380. User Journey and Flow Mapping

## Coverage Level
**Not assessed** — this concept was added from internal-ai-rules' Product_Strategy_Rules material (specifically `user-journey-and-flows.md`) to build out the Product & Technical Strategy course; no existing coverage data for your own practice.

## What It Is
A page list is not a user flow. "Home, login, dashboard, settings" tells you nothing about what actually happens between those screens — where a decision gets made, where data gets entered, where something can fail. A user flow forces the sequence into the open: entry point → action → decision → data entry → confirmation → result → follow-up state. Walking through that sequence for even a simple feature routinely surfaces a screen, a permission check, or an error state that nobody had thought to mention, because it only becomes visible once you trace someone actually trying to accomplish something, not once you list the pages a designer might draw.

Different actors need different flows, and treating "the user flow" as singular hides work. A ticketing platform has a public flow (browsing an unpublished vs. published event), an authenticated customer flow (purchase), an admin flow (event setup), a payment/checkout flow, an approval flow if refunds require sign-off, a notification flow, and — the one teams forget most often — an error recovery and manual-intervention flow, for when the payment fails, the QR code won't scan, or a customer needs a human to fix something the system can't. Each flow deserves its own trace, because "how does this fail and get recovered" is a different question from "how does this succeed."

Flows aren't complete until they're accountable for screen state, not just screen sequence. For each step, the state machine to check is: what fields exist, what actions are available, what gets validated, and what does the screen look like loading, empty, in error, and on success — plus which permission restricts the step. Skipping this is why "add a feature" estimates routinely balloon once implementation starts: the happy-path screen was scoped, but the empty state, the validation message, and the permission-denied screen were not, and now they have to be designed and built as unplanned work in the middle of a sprint.

## Key Concepts
- **Flow structure**: entry point → action → decision → data entry → confirmation → result → follow-up state
- **Flow types to document separately**: public, authenticated, admin, operator, payment/checkout, approval, notification, error recovery, support/manual intervention
- **Screen-state checklist per step**: fields, actions, validation, loading state, empty state, error state, success state, permission restrictions
- **Flows reveal missing work before design does**: a traced flow surfaces missing screens, permission gaps, and edge cases that a page list hides
- **Error recovery flows are first-class, not an afterthought**: "what happens when this fails" deserves its own trace, not a footnote on the happy path
- **Admin visibility as part of the customer flow**: a customer-facing flow usually implies a corresponding admin-side visibility step (e.g., "admin sees order in dashboard") that's easy to omit
- **Flows precede design and API work**: routing, component planning, and backend endpoint design should follow from a traced flow, not precede it

## Example Code
```markdown
## User Flow: Ticket Purchase

**User role:** Customer (unauthenticated at entry)
**Goal:** Buy a ticket to a published event
**Entry point:** Public event detail page

**Steps:**
1. User opens event detail page.
2. User selects ticket type and quantity.
3. System validates capacity (decision point: sold out → show waitlist state).
4. User enters attendee/contact details.
5. User proceeds to payment.
6. Payment succeeds (decision point: payment fails → error recovery flow).
7. System creates order and issues ticket.
8. User receives confirmation and QR ticket by email.
9. Admin sees the order in the dashboard order list.

**Decision points:** capacity check, payment success/failure.
**Required screens:** event detail, ticket selector, attendee form, payment, confirmation.
**Required system states:** sold-out empty state, payment-error state, order-success state.
**Edge cases:** payment succeeds but email delivery fails; user abandons cart mid-payment.
**Success condition:** user holds a valid, scannable ticket; admin can see the order.
```

## When to Use
- Before UI design, routing, or component planning begins
- Before backend API or endpoint design — a traced flow reveals which endpoints and states actually need to exist
- Whenever the only artifact so far is a page list ("home, login, dashboard") instead of a traced sequence
- When estimating a feature — screen-state completeness (empty/error/loading) is where estimates usually go wrong
- When a support ticket reveals a flow nobody had traced (e.g., "what happens when a technician's phone has no signal")

## Common Mistakes
- Moving to UI design with only a list of pages instead of a traced flow with decision points and states
- Tracing only the happy path and treating error recovery as something to figure out during implementation
- Forgetting the admin-side visibility step that corresponds to a customer-facing action
- Omitting permission restrictions from the flow, so authorization gets bolted on after screens are already built

## Further Reading
- Jesse James Garrett — "The Elements of User Experience" (the structural layers a flow sits inside)
- Alan Cooper, Robert Reimann, David Cronin — "About Face: The Essentials of Interaction Design" (on screen-state completeness)
- Nielsen Norman Group — articles on user flow diagrams and task analysis (nngroup.com)
