# 78. Code Review Culture — Critique Code, Not People

## Coverage Level
**Not Covered** — You are a solo freelancer today, but when you bring on contractors, review client teams' code, or grow into a small team, the quality of your code review culture will directly determine the quality of code you receive.

## What It Is
Code review is the process of a developer other than the author reading, understanding, and commenting on a proposed code change before it is merged. The mechanics are simple — open a pull request, leave comments, approve or request changes. The culture around it is not. Code review culture is the set of unwritten (and written) norms that determine whether reviews are genuinely useful, whether they feel safe to participate in, and whether they improve the codebase over time.

"Critique code, not people" is the foundational principle of healthy code review culture. It means that every comment is anchored to the code, not the person who wrote it. "This function has a side effect that could cause X under race condition Y" is a code critique. "You always forget about race conditions" is a personal critique. The distinction sounds obvious when stated this way, but under time pressure or repeated frustration, the line blurs — and once a team stops feeling safe posting drafts, asking questions in PRs, or pushing back on review comments, the review process degrades into a rubber stamp or an adversarial audit.

For a solo developer in a client-facing role, code review culture matters in two directions: you may review client team code (as a consultant or auditor), and you may eventually receive reviews from contractors or collaborators. In both directions, setting norms explicitly — what a good review comment looks like, what the SLA for reviewing is, what "approved" means — is more valuable than leaving it to intuition. One page of code review guidelines, shared with any collaborator before they open their first PR, prevents months of friction.

## Key Concepts
- **Conventional comment prefixes**: Label the intent of each comment — `nit:`, `suggestion:`, `blocker:`, `question:`, `praise:` — so the author knows which comments must be addressed before merge
- **Author responsibilities**: Small, focused PRs (< 400 lines of change ideally); PR description that explains the *why*; self-review before requesting others
- **Reviewer responsibilities**: Read the PR description before the diff; understand the goal before evaluating the approach; time-box the review to < 1 hour per session
- **The "two-hat" model**: Separate the first pass (understanding intent) from the second pass (finding problems); mixing them slows reviews and increases missed issues
- **Blocking vs. non-blocking comments**: Make explicit which comments must be resolved before merge; unclear blockers create endless back-and-forth
- **Praise and acknowledgment**: Calling out good code is not flattery — it reinforces the practices you want to see repeated
- **Review debt**: PRs open for > 48 hours without a review are a productivity tax on the author; define a response SLA
- **The "author gets final say on style" rule**: Reviewers can note style preferences, but unless they conflict with a documented standard, the author's choice should be respected

## Example Code or Template

```markdown
# Code Review Guidelines — [Project Name]

## For Authors

### Before Opening a PR
- [ ] PR is focused on one logical change (not "various fixes")
- [ ] PR description explains WHY the change was made, not just what changed
- [ ] Self-reviewed the diff — no debug logs, no commented-out code, no TODO left unaddressed
- [ ] Tests added or updated for the changed behavior
- [ ] PR title follows the format: `type(scope): short description`
      (types: feat, fix, refactor, chore, docs, test)

### PR Size Guidelines
- **Ideal**: < 300 lines changed
- **Acceptable**: 300–600 lines changed, with a detailed description
- **Split required**: > 600 lines — break into a stack of PRs

---

## For Reviewers

### Comment Conventions
Use prefixes to signal intent. Only `blocker:` comments must be resolved before merge.

| Prefix       | Meaning                                              | Blocks merge? |
|--------------|------------------------------------------------------|---------------|
| `blocker:`   | This must change — correctness, security, or policy  | Yes           |
| `suggestion:` | I'd do it differently, but your approach works      | No            |
| `question:`  | I don't understand this — help me learn              | No (but answer) |
| `nit:`       | Minor style or naming preference                     | No            |
| `praise:`    | This is a good approach — noting it for visibility   | No            |

### Review SLA
- Initial review response within **48 hours** of the review request
- Second-round review (after author addresses comments) within **24 hours**

### What to Check (in order)
1. **Correctness**: Does it do what the PR description says?
2. **Edge cases and error paths**: What happens when the input is unexpected?
3. **Security**: Are inputs validated? Are secrets handled correctly?
4. **Performance**: Any N+1 queries, unbounded loops, or missing indexes?
5. **Readability**: Would a new contributor understand this in six months?
6. **Tests**: Do they test behavior, not just coverage?

### What NOT to Do
- Do not rewrite the entire implementation in a comment (write a suggestion or offer to pair)
- Do not comment on style that is not covered by the project linter
- Do not approve a PR you did not actually read
- Do not leave a review without an explicit approval or change-request decision
```

## When to Use
- When onboarding a first contractor or collaborator — share the guidelines on day one, before the first PR
- When reviewing a client team's codebase as a consultant — adapt the "For Reviewers" section to match their stack
- When a PR review turns tense or personal — reference the guidelines as a shared norm rather than a personal correction
- When conducting your own code review as a solo developer (yes, reviewing your own draft PRs before merging to main is a real practice and catches real bugs)
- When building a team culture document for a client who is scaling their engineering function

## Common Mistakes
- **No explicit blocker vs. suggestion distinction**: Authors waste time addressing nit comments they thought were required, or ignore blocker comments they thought were optional
- **Reviewing the implementation, not the intent**: Jumping straight to "I would have done this differently" without first confirming you understood what the PR is trying to accomplish leads to irrelevant feedback
- **Approving to avoid conflict**: "Looks good to me" on a PR you did not read is worse than not reviewing — it signals that the review process has no real function
- **Making the review about the reviewer**: "I never write it this way" is not a valid review comment unless "this way" is demonstrably incorrect or violates a documented standard

## Further Reading
- **"How to Do Code Reviews Like a Human" — Michael Lynch (mtlynch.io)** — The most practical guide to writing actionable, non-adversarial review comments; referenced by engineering teams at Google and Stripe
- **"Google's Code Review Developer Guide" (google.github.io/eng-practices)** — Google's public engineering practices documentation; the reviewer and author guides are both worth reading in full
- **"Conventional Comments" (conventionalcomments.org)** — The prefix convention used in the template above; one-page reference that can be linked in your guidelines document
