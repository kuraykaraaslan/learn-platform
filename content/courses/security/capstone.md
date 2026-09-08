# Capstone — Review This Pull Request

## Brief
A colleague has opened a pull request adding a document search endpoint to a
multi-tenant application. It is small, it works, the tests pass, and it is
ready to merge. You are the reviewer.

The PR touches five things:

1. **A route** — `GET /documents?q=...&sort=...`, accepting a free-text query
   and a sort field, both taken straight from the query string. The route
   validates the request body against a schema.
2. **A service method** — `searchDocuments(input)`, which the route calls with
   the parsed input, and which is also called from a background job that does
   not go through the route.
3. **A query** — the sort field is concatenated into the SQL, with a comment
   saying it is safe because the value is passed as a parameter. The `WHERE`
   clause filters by the search text and by nothing else.
4. **A `.env` file**, added in this PR, containing the connection string for
   the search database and an API key for the document indexer.
5. **A CI step** — `npm install && npm test`, added to the workflow that runs
   on every pull request.

The UI hides the endpoint behind a "Search" menu item that only renders for
users with the `analyst` role. The author has noted this in the PR
description as the access control.

## Deliverable
A review. Not a list of adjectives — a set of findings, each one written so
the author can act on it without asking you a follow-up question. Each finding
needs three things:

1. **What is wrong**, stated as the behaviour rather than the smell. "This is
   insecure" is not a finding; "any authenticated user can call this endpoint
   directly" is.
2. **What it lets someone do**, concretely, in this application. If you cannot
   say what an attacker or a mistake would achieve, you do not yet have a
   finding — you have a preference.
3. **The change you want**, specific enough to be implemented and reviewed.

Then one paragraph the review usually skips: **what you did not check, and
why**. A review that implies completeness it does not have is worse than one
that states its own edges.

## Rubric
Score yourself honestly against each row. Every one is a mistake this course
already documents, quoted from the lesson beside it — and every one of those
lessons is verified, so the rubric measures only what the corpus stands behind.

```rubric
rows:
  - lead: "Dynamic ORDER BY without an allowlist"
    lesson: 30
    looks_like: "You noticed that the sort field reaches the SQL text, and that the author's \"it is a parameter\" defence does not hold — a placeholder cannot occupy an ORDER BY position. The proof below shows what actually happens when you try."
  - lead: "Validating at the route layer but not the service layer"
    lesson: 31
    looks_like: "The route validates and the service trusts. You spotted the second caller — the background job — which reaches the same method without passing through the schema at all."
  - lead: "Checking roles in the UI only"
    lesson: 39
    looks_like: "You did not accept the menu item as access control. The endpoint is reachable by anyone who can construct the request, and the PR description mistakes a rendering condition for an authorisation check."
  - lead: "System admin can access all tenant data without tenant role"
    lesson: 39
    looks_like: "The WHERE clause filters by the search text and not by tenant. You asked what stops one tenant's search from returning another tenant's documents, and the answer in this PR is nothing."
  - lead: "Committing `.env` to version control"
    lesson: 37
    looks_like: "You raised the added .env file as a finding in its own right, and your suggested change includes rotating both values — because a secret that reached a branch is disclosed whether or not the branch is merged."
  - lead: "Using `npm install` in CI"
    lesson: 40
    looks_like: "You noticed the CI line, which nobody reviewing a feature PR expects to be a finding: `npm install` may resolve to versions the lockfile does not name, so CI stops testing what production will run."
```

## Reference Walkthrough
This is one competent review, not the only one. Read it after scoring
yourself.

**The sort field.** The author's comment is the most interesting thing in the
PR, because it is a reasonable belief that is wrong in a specific way: a
placeholder in `ORDER BY` position is not a column reference. PostgreSQL
accepts the query and sorts by a constant, which is to say it does not sort at
all — so the feature is both unsafe and silently broken, and the second half is
what lets it pass review on a page where the rows already looked plausible.

Before opening the run below, predict what `ORDER BY $1` returns when the
parameter is the string `title`:

```proof sha=322b5b50cd5a93bd at=2026-09-08 commit=56afec5
$ node order_by.js
rows are inserted Zulu, Mike, Alpha — so a working sort by title is visible:

  no ORDER BY at all                           Zulu, Mike, Alpha
  ORDER BY $1, parameter is "title"            Zulu, Mike, Alpha
  ORDER BY $1, parameter is "id DESC"          Zulu, Mike, Alpha
  ORDER BY title from an allowlist             Alpha, Mike, Zulu

The two parameterised rows are byte-identical to the unsorted one. PostgreSQL
accepted the query, raised nothing, and sorted by a constant — which is not a
sort. The reviewer's finding is therefore not "this is injectable" alone; it
is that the only way to make ORDER BY work is to put the column name into the
SQL text, and the only safe way to do that is to choose it from a fixed list.

allowlist in this run: title -> title, newest -> id DESC
Anything not in it is rejected before a query is built, which is the whole
mechanism — no escaping, no sanitising, no cleverness.
```

The change to ask for is an allowlist: a fixed map from the values the API
accepts to the SQL fragments they mean, and a rejection for anything else,
applied before a query is built. Not escaping, not sanitising.

**The two entry points.** The route validates; the service trusts the route.
That is fine exactly until a second caller exists, and this PR adds one — a
background job that calls `searchDocuments` directly. Validation that lives in
the route is a property of *that path*, not of the method. The change to ask
for is that the service validates its own input, and the route keeps its own
validation for the error messages it can give a user that the service cannot.

**The role check.** A menu item that renders for `analyst` is a statement about
what a user is offered, not about what they can reach. The endpoint answers
anyone who can form the request. The change to ask for is an authorisation
check in the service, next to the validation, for the same reason.

**The tenant.** This is the finding that costs the most if it ships. The
`WHERE` clause filters by search text; nothing scopes the query to the caller's
tenant. Every tenant's documents are in one table, and a search for a common
word returns them all. Ask for the tenant predicate, and ask where else in this
codebase the same omission is possible — one missing filter is a bug, and a
pattern of relying on callers to remember it is a design.

**The secrets.** The `.env` is a finding even though removing it is a one-line
change, because deleting a file does not un-disclose what was in it. Both
values need rotating, and the review should say so rather than leaving the
author to conclude it.

**The CI line.** It is the one nobody looks for in a feature PR. `npm install`
is free to resolve versions the lockfile does not name, so from this merge on,
CI is testing a dependency tree that production may not have. Ask for `npm ci`.

**And what this review did not check.** It read a diff. It did not run the
endpoint, did not look at what the background job passes, did not check whether
the search index itself enforces tenancy, and formed no opinion about the
schema the route validates against. A review that does not say this implies it
looked everywhere, and the next reviewer trusts that implication.
