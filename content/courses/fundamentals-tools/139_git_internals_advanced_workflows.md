# 139. Git Internals & Advanced Workflows — Bisect, Rebase Strategies, Monorepo Git

## What It Is
Underneath every Git command is a small, genuinely simple object model: a **blob** stores file contents, a **tree** stores a directory listing (names pointing at blobs or other trees), a **commit** points at one tree plus its parent commit(s), and a **ref** (a branch or tag) is just a named pointer to a commit. Once this clicks, commands that seemed like magic become mechanical: `git reset --hard` just moves a ref (and the working directory) to point at a different commit; `git rebase` builds new commits with the same content but different parents and reassigns the branch ref to the last new one — the "original" commits still exist as unreferenced objects for a while, which is exactly what the **reflog** exploits to recover from almost any mistake.

**Interactive rebase** (`git rebase -i`) turns commit history into something you can edit before sharing it: squashing a string of "wip" commits into one coherent commit, reordering commits, or splitting one commit into two. **`git bisect`** applies binary search to history itself — instead of manually reading dozens of diffs to find which commit introduced a regression, you mark one known-good and one known-bad commit and let Git pick the midpoint for you to test, repeatedly, until it isolates the exact commit.

In a monorepo, the same tools face scale problems: full history can be huge, and `git rebase`/`git log` across unrelated packages get noisy — sparse-checkout and path-scoped history commands (`git log -- packages/api`) are the practical mitigations, short of adopting a purpose-built monorepo tool (#108).

## Key Concepts
- **Object model**: blob (content) → tree (directory) → commit (tree + parents + metadata) → ref (named pointer to a commit)
- **Reflog**: a local, time-ordered log of everywhere `HEAD` has pointed — the safety net for "I think I lost work"
- **Interactive rebase**: squash, reorder, reword, or split commits before they're shared
- **`git bisect`**: binary search over commit history to isolate the exact commit that introduced a regression
- **Sparse checkout / path-scoped history**: mitigations for full-repo commands becoming slow or noisy in a large monorepo
- **Rebase vs merge in a monorepo**: rebasing across many unrelated package changes can be noisier than a clean merge — the fundamentals-level rule ("rebase local, merge shared," #120) still applies, just at higher stakes

## Example Code
```bash
# Recover "lost" commits after a bad reset — they're not actually gone yet
git reflog                       # shows every place HEAD has pointed, including the "lost" state
git reset --hard HEAD@{2}        # jump back to it directly

# Interactive rebase: squash the last 4 commits into one before opening a PR
git rebase -i HEAD~4
# In the editor: change `pick` to `squash` (or `s`) on the commits to fold into the one above them

# Bisect: find the exact commit that broke the build, across 200 commits
git bisect start
git bisect bad HEAD
git bisect good v2.3.0
# Git checks out a midpoint each time:
npm run build && git bisect good || git bisect bad
# ...repeats automatically until it reports the first bad commit...
git bisect reset

# Monorepo: scope history to one package instead of the whole repo's noise
git log --oneline -- packages/api
git sparse-checkout set packages/api packages/shared
```

The reflog recovery above, run for real: three commits, an accidental `reset --hard` that drops two of them, then the actual recovery. Predict what `cat file.txt` prints at each step before revealing the real output.

```proof sha=808e797f441230c8 at=2026-08-27 commit=eb4085c
$ bash run.sh
$ git log --oneline
92e1764 third commit — this is the work we're about to 'lose'
a467b92 second commit
45f95d3 first commit

$ git reset --hard HEAD~2   # oops — meant to undo 1 commit, undid 2
HEAD is now at 45f95d3 first commit

$ cat file.txt   # confirms the reset really happened — third commit's change is gone
one

$ git reflog   # HEAD@{0} is where we are now; HEAD@{1} is right before the reset
45f95d3 HEAD@{0}: reset: moving to HEAD~2
92e1764 HEAD@{1}: commit: third commit — this is the work we're about to 'lose'
a467b92 HEAD@{2}: commit: second commit
45f95d3 HEAD@{3}: commit (initial): first commit

$ git reset --hard HEAD@{1}   # jump back to right before the reset
HEAD is now at 92e1764 third commit — this is the work we're about to 'lose'

$ cat file.txt   # third commit's change is back
three
```

## When to Use
- Cleaning up a feature branch's commit history before opening a PR — squash noisy WIP commits into meaningful units
- Hunting a regression with no obvious cause across more than a handful of commits — `bisect` beats manual diff-reading past that point
- Recovering from any reset/rebase/checkout mistake — check `reflog` before assuming anything is actually lost
- Working day-to-day in a large monorepo where full-history commands have become slow or noisy

## Common Mistakes
- Rewriting (rebasing/force-pushing) history that other people have already pulled, without coordinating — their local history and the remote diverge permanently
- **A bad `reset` wipes out an afternoon's commits, and the response is redoing the work from scratch instead of checking `git reflog` first** — Panicking and re-doing work after a bad `reset`/`rebase` instead of checking `git reflog` first
- **`git bisect` runs against a flaky test, and it confidently reports the wrong commit as the culprit** — Using `git bisect` with a "good"/"bad" check that isn't actually deterministic (a flaky test), producing a wrong bisection result
- **A simple `git log` on one package takes ten seconds in the monorepo, because it's scanning the full history of every package by default** — In a monorepo, running full-history commands as the default instead of path-scoping them, making simple lookups slow enough that people stop using Git history as a debugging tool at all

## Further Reading
- "Pro Git" by Scott Chacon & Ben Straub — chapter 10 (Git Internals) is the object-model deep dive
- [git bisect](https://git-scm.com/docs/git-bisect) — and `git rebase --interactive`, the two commands worth learning properly
- Google's monorepo engineering blog posts (research.google/pubs, "Why Google Stores Billions of Lines of Code in a Single Repository") for the scale-specific tooling context
