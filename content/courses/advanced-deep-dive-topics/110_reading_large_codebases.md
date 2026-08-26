# 110. Reading Large Codebases Fast

## Coverage Level
**Not Covered** — You build greenfield projects but have no documented methodology for entering and navigating unfamiliar large repos.

## What It Is
Reading a large codebase fast is a learnable skill, not a talent. Most developers waste their first hours in an unfamiliar repo by starting at the README, then wandering through folders aimlessly. Professionals start from behavior — find where the HTTP request lands and trace execution forward. The README explains intent; running code explains reality.

The goal of the first session in a new codebase is not to understand everything. It is to build a sparse but accurate mental map: where are the entry points, what are the load-bearing modules, what is the data flow, and what can break if you touch the wrong thing. Everything else is detail you fill in on demand.

This matters for solo consultants especially. You will eventually take on legacy work, audit a client's existing system, or inherit a codebase during an acquisition. The developer who can be productive in an unfamiliar repo within a day charges more and delivers faster than the one who needs two weeks to "get oriented."

## Key Concepts
- **Entry point tracing** — Start from the HTTP handler or CLI entrypoint, not the folder structure. Behavior is the truth.
- **Load-bearing code instinct** — Identify the code paths that, if broken, take down the system (auth middleware, database connections, billing webhooks). These you read before you touch anything.
- **Grep-driven exploration** — Use `git log --oneline`, `git blame`, and symbol search to understand who changed what and why, not just what the code says now.
- **Mental map before mutation** — Draw (even on paper) the request-response flow and the main data entities before writing a single line.
- **The "what changed recently?" question** — `git log --since="30 days ago"` tells you where the active churn is; churn = where bugs live.
- **Dependency graph reading** — `package.json` / `go.mod` / `requirements.txt` tells you what the team trusted. Unusual deps are always worth investigating.
- **Test suite as documentation** — Tests describe intended behavior. Read the test file for a module before reading the module itself.
- **Breadth before depth** — Spend the first hour mapping the whole system at 10,000ft before diving into any single file.

## Example / Template

### First 4 Hours in an Unfamiliar Repo — Workflow Checklist

```
PHASE 1 — Orient (0–30 min)
─────────────────────────────────────────────────────────────
[ ] Read package.json / go.mod / pom.xml — what frameworks/libs?
[ ] Run `git log --oneline -50` — what has changed recently?
[ ] Run `git log --since="90 days ago" --stat` — which files are hotspots?
[ ] Run `find . -name "*.env*" -o -name "docker-compose*"` — how does it run?
[ ] Identify: is this a monolith, monorepo, microservices?
[ ] Identify: where do HTTP requests enter? (server.ts, app.ts, main.go, index.js)

PHASE 2 — Trace One Request End-to-End (30–90 min)
─────────────────────────────────────────────────────────────
[ ] Pick the most important user action (login, checkout, submit form)
[ ] Find the route/handler for that action
[ ] Trace: route → middleware → controller → service → repository → DB
[ ] Note every external call (3rd party APIs, queues, caches)
[ ] Sketch the flow on paper or in a scratch file — don't skip this

PHASE 3 — Map the Load-Bearing Code (90–150 min)
─────────────────────────────────────────────────────────────
[ ] Auth middleware — how is identity established? JWT? Session? API key?
[ ] Database connection — is there a connection pool? ORM? Raw queries?
[ ] Error handling — is there a global error handler? What does unhandled look like?
[ ] Background jobs — cron? queue? what happens if they fail silently?
[ ] External service calls — are they wrapped in retries? timeouts?
[ ] Run `grep -rn "TODO\|FIXME\|HACK\|XXX" --include="*.ts"` — read every one

PHASE 4 — Build Your Map (150–240 min)
─────────────────────────────────────────────────────────────
[ ] Write a 1-page system summary (entities, flows, external deps)
[ ] List the 5 files you must not touch without full understanding
[ ] List the 3 things most likely to break under load or edge cases
[ ] Identify gaps: what is NOT tested? what has no logging?
[ ] Ask: where would a bug hide in this system? (stale cache? race condition?)
[ ] Only now: look at the issue tracker / ticket you were assigned

TOOLS
─────────────────────────────────────────────────────────────
git log --oneline -50
git log --since="30 days ago" --stat | sort -rn | head -20
git blame <file>                      # who wrote this and when
grep -rn "symbolName" --include="*.ts"
grep -rn "TODO\|FIXME" --include="*.ts"
find . -name "*.test.ts" | head -20   # find the test suite
```

## When to Use / Apply
- Onboarding to a client's existing codebase before starting a consulting engagement
- Auditing a startup's codebase for a technical due diligence review
- Taking over maintenance of a legacy Next.js app after the original developer left
- Open-source contribution — understanding a large OSS project before submitting a PR
- Evaluating whether to fork vs build from scratch for a client requirement

## Common Mistakes
- **Starting with the README** — READMEs describe what someone intended, not what the code actually does. They go stale immediately.
- **Diving deep too early** — Spending 2 hours on one utility function when you haven't mapped the top-level architecture yet is a trap that costs days.
- **Not reading `git blame`** — Code without history is a puzzle. `git blame` tells you the context of every line: was it a hotfix at 2am? A refactor? A hack that was "temporary"?
- **Skipping the tests** — Developers who don't read tests first spend hours reverse-engineering behavior that was already documented in assertions.

## Further Reading
- *Working Effectively with Legacy Code* — Michael Feathers (the canonical reference on navigating unfamiliar code)
- *The Art of Reading Code* — Dustin Boswell & Trevor Foucher (practical grep/trace techniques)
- GitHub: `git log` documentation — `git help log` (master the `--stat`, `--follow`, `--pickaxe-all` flags)
