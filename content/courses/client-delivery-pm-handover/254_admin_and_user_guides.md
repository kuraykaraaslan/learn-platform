# 254. Admin and User Guides

## What It Is
"It's self-explanatory" and "the client can figure it out" are the two phrases that most reliably generate a flood of avoidable support questions after launch. A client's team depending on delivered software should not need to message the developer to learn how to perform a task that was already built and demonstrated. Admin and user guides exist to close that gap — written in plain, role-based, workflow-based language, aimed at the person who will actually use the system day to day, not at a developer reading the code.

The structure that makes a guide usable follows how someone actually approaches unfamiliar software: how to get in (access), what each role can and can't do (roles and permissions), how to accomplish specific tasks (common workflows, step by step), what the data actually means and what shouldn't be touched (data rules), how to get information out (reports and exports), when the system talks back (notifications), what error messages mean, and where to go when something isn't covered (support). Each workflow entry works best as a specific, numbered sequence — "log in, go to Events, click Create Event, fill required fields" — rather than a paragraph describing the feature in the abstract.

Safe-usage warnings deserve their own explicit attention, separate from the happy-path instructions: deleting a product may remove it from public listing, changing a user's role to admin grants full access, editing payment status manually can create an accounting mismatch. These aren't hypothetical edge cases — they're exactly the actions a well-meaning but untrained staff member is most likely to take without realizing the consequence, and naming them plainly before they happen is far cheaper than explaining the damage afterward.

## Key Concepts
- **Role-based, workflow-based, plain language**: write for the person doing the task, not for a developer — a client-facing guide describing internal API calls has failed its purpose
- **Fixed structure**: access, roles and permissions, common workflows, data rules, reports/exports, notifications, common errors, FAQ, and support contact — in that order, so a reader can navigate predictably
- **Workflow entries are numbered steps with a "who" and a "notes" section**: "Who can do this: Admin" followed by numbered steps and a short list of things to watch out for is more usable than prose
- **Role definitions state both permission and restriction**: "Admin users can manage products, orders, and users; standard staff can view orders but cannot change payment status or delete users" — both halves matter
- **Safe-usage warnings for dangerous actions are explicit, not implied**: deleting, role changes, and manual status overrides each get a plain warning about their real consequence
- **Screenshots support text, they don't replace it**: a screenshot without accompanying step-by-step text breaks the moment the UI changes and helps nobody using a screen reader
- **Kept separate from technical secrets**: a user guide never contains credentials, API keys, or deployment detail — that content belongs in developer-facing documentation instead

## Example Code
```md
# Admin/User Guide — Order Management Admin Panel

## Access
Log in at https://orders.meridianretail.example/login with your work email.
Admin accounts are created by Tomas Reyes; staff accounts are created by an
existing Admin from the Users page.

## Roles and Permissions
**Admin** can manage products, orders, users, and export data.
**Staff** can view and update order status but cannot change payment status,
delete users, or access the Users page.

## Common Workflows

### Workflow: Update an Order's Status
**Who can do this:** Admin, Staff

1. Go to Orders.
2. Find the order (use search or filter by status).
3. Click the order to open its detail view.
4. Select the new status from the dropdown.
5. Click Save.

**Notes:**
- Cancelled orders cannot be reopened — this is intentional.
- Status changes are logged with your name and timestamp automatically.

### Workflow: Export Orders to CSV
**Who can do this:** Admin

1. Go to Orders.
2. Apply any filters you want reflected in the export (date range, status).
3. Click Export CSV.
4. File downloads with columns: date, customer, amount, status.

**Common mistakes:**
- Forgetting to apply a date filter before exporting all-time data
- Very large exports (>5,000 rows) take about 8 seconds — this is expected

## Data Rules
Order status transitions follow a fixed sequence: Received → Packed →
Shipped → Delivered. Cancelled is a permanent end state.

## Common Errors
**"You do not have permission to view this page"** — you're logged in as
Staff and tried to access an Admin-only page. Ask an Admin for the task.

## Support
Email support@meridianretail-dev.example for anything not covered here.
```

## When to Use
- For any delivered admin panel, dashboard, content system, or internal tool that a client team will operate without the developer present
- Before the training/demo session, so the guide can be handed out and referenced live rather than written up afterward from memory
- Whenever a workflow changes after a feedback round or change request, to keep the guide from silently going stale
- Any time a support request repeats a question that a guide could answer — that's the signal to add or clarify a workflow entry, not just answer the ticket

## Common Mistakes
- Writing "it's self-explanatory" instead of documenting the actual steps, on the assumption the interface speaks for itself
- Writing the guide in developer language, describing implementation details instead of the task from the user's point of view
- Omitting safe-usage warnings for genuinely dangerous actions, so a well-meaning staff member causes damage without knowing the risk
- Letting the guide fall out of sync after a UI or workflow change, so it actively misleads instead of helping

## Further Reading
- Nielsen Norman Group, "How to write a user manual" — foundational usability guidance on task-based technical writing: https://www.nngroup.com/articles/user-manual/
- GitLab Handbook, "Documentation style guide" — a widely referenced real-world example of role-based, plain-language internal and external documentation: https://about.gitlab.com/handbook/style-guide/
- Krug, Steve. *Don't Make Me Think* — on writing and designing for how people actually read instructions, not how writers wish they would
