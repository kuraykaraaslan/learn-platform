# 123. Debugging Fundamentals

## What It Is
Debugging is a loop, not a skill you either have or don't: reproduce the failure reliably, isolate the smallest case that still fails, form a specific hypothesis about the cause, test that hypothesis (not "poke around"), and only then fix it. Skipping straight to "fix" without reproducing first is how bugs get patched at the symptom and come back a week later somewhere else.

Reading a stack trace is a specific skill: the top frame is where the error was *thrown*, but the interesting frame is often several levels down, where the *wrong data* first entered the call chain. Read it looking for the first frame that's *your* code, not library internals — that's usually where the real hypothesis starts.

Breakpoints beat `console.log` for anything beyond a trivial check, because they let you inspect the entire call stack and live variable state at the exact moment of failure, not just the one value you thought to log in advance. `git bisect` extends the same "isolate the smallest failing case" idea to time — binary-searching through commit history to find exactly which commit introduced a regression.

## Key Concepts
- **Reproduce → isolate → hypothesize → test → fix**: the loop; each step earns the next
- **Stack trace anatomy**: top = where it was thrown; look downward for the first frame that's your own code
- **Breakpoints & conditional breakpoints**: pause execution and inspect full state, optionally only when a condition is true
- **`debugger;` statement**: a breakpoint you can commit temporarily, without touching devtools
- **Source maps**: let you debug readable TS/JSX instead of the compiled/minified output
- **`git bisect`**: binary search over commit history to isolate a regression
- **Rubber-duck debugging**: explaining the bug out loud (to anything) forces you to articulate assumptions you've been skipping

## Example Code
```jsonc
// .vscode/launch.json — attach the debugger to a running Node/Next.js process
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Next.js",
  "port": 9229,
  "restart": true,
  "skipFiles": ["<node_internals>/**"]
}
```

```bash
# Binary-search commit history for the commit that broke `npm test`
git bisect start
git bisect bad HEAD
git bisect good v1.4.0
# Git checks out a midpoint commit each time — run the check and report:
npm test && git bisect good || git bisect bad
# ...repeat until Git reports the exact first bad commit...
git bisect reset
```

That's the shape. Below is that exact loop run for real, against a real 5-commit history with one real bug — not a hand-typed transcript. Predict which commit `git bisect` will land on before revealing the actual output.

```proof sha=abc1cd52ea83b08a at=2026-08-27 commit=eb4085c
$ bash run.sh
status: waiting for both good and bad commits
status: waiting for good commit(s), bad commit known
Bisecting: 0 revisions left to test after this (roughly 1 step)
[2fb911a1aad6821de752d6241f319ea9876bcc78] feat: add input validation
running 'node' 'check.js'
FAIL: add(2,3) !== 5
Bisecting: 0 revisions left to test after this (roughly 0 steps)
[6abc1ce05061f02dd35149815527706225c5f141] refactor: add a comment (no behavior change)
running 'node' 'check.js'
PASS
2fb911a1aad6821de752d6241f319ea9876bcc78 is the first bad commit
commit 2fb911a1aad6821de752d6241f319ea9876bcc78
Author: CI <ci@example.com>
Date:   Thu Jan 1 00:00:04 2026 +0000

    feat: add input validation

 add.js | 2 +-
 1 file changed, 1 insertion(+), 1 deletion(-)
bisect found first bad commit
Previous HEAD position was 6abc1ce refactor: add a comment (no behavior change)
Switched to branch 'master'
```

## When to Use
- Any bug, but especially intermittent ones — resist the urge to guess-fix before you can reproduce it on demand
- A regression with no obvious cause — `git bisect` is faster than manually reading diffs once history is more than ~10 commits deep
- Anything happening deep in an async chain — breakpoints let you inspect the full stack; a scattered `console.log` often can't

## Common Mistakes
- Guessing at a fix instead of reproducing the failure first — "I think it's this" without confirming wastes more time than it saves
- Wrapping the failing code in `try/catch` to make the error go away instead of finding the root cause
- Reading only the top stack frame and missing where the bad data actually originated
- Debugging directly in production without a safe read-only path (see #111 for the production-specific version of this)

## Further Reading
- "Debugging" by David J. Agans — the general-purpose methodology, works outside software too
- [VS Code Debugging docs](https://code.visualstudio.com/docs/editor/debugging)
- [`git bisect` documentation](https://git-scm.com)
