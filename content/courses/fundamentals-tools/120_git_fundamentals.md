# 120. Git Fundamentals — Branching, Merge vs Rebase, Resolving Conflicts

## What It Is
Git tracks snapshots, not diffs — every commit is a full snapshot of the tree, and Git is efficient about storing that because unchanged files are just pointers to the same blob. Once that clicks, branches stop being mysterious: a branch is just a movable pointer to a commit, and "checking out" a branch moves `HEAD` to point at it.

The concept most people use daily without understanding is the difference between merge and rebase. `git merge` creates a new commit that ties two histories together — nothing is rewritten, but you get a non-linear graph. `git rebase` replays your commits one by one onto a new base — the result looks like you branched off *now* instead of when you actually did, at the cost of rewriting commit hashes. Neither is "correct"; they're different tradeoffs between honest history and readable history, and the one hard rule is: never rebase a branch someone else has already pulled from.

Conflicts aren't Git failing — they're Git correctly refusing to guess when two changes touch the same lines. The markers (`<<<<<<<`, `=======`, `>>>>>>>`) are just showing you both versions so you can decide.

```quiz
- q: "You rebased a branch you had already pushed and shared. What did that do to collaborators?"
  anchor: "replays commits onto a new base, rewrites hashes, produces linear history"
  options:
    - text: "Nothing — a rebase only reorders commits locally"
      correct: false
      why: "It rewrites hashes, so the commits they already have no longer exist under those ids."
    - text: "Their history now diverges — the replayed commits carry new hashes"
      correct: true
      why: "A merge would have preserved both histories exactly as they happened. A rebase produces new commits."
    - text: "It fast-forwarded their branch automatically on the next fetch"
      correct: false
      why: "A fast-forward needs the target to be a direct ancestor, and a rewritten history is not."

- q: "What is a Git branch?"
  anchor: "a movable pointer to a commit — cheap to create, that's the whole point"
  options:
    - text: "A copy of the working directory at a point in time"
      correct: false
      why: "Nothing is copied, which is exactly why creating one costs almost nothing."
    - text: "A movable pointer to a commit"
      correct: true
      why: "Cheap to create, and that is the whole point of the design."
    - text: "A named sequence of commits, stored separately from main's"
      correct: false
      why: "Commits live in one shared object store. The branch only names where its tip currently is."

- q: "You merge `feature` into `main` and no merge commit appears. Why not?"
  anchor: "when merging requires no new commit because the target is a direct ancestor"
  options:
    - text: "Git squashed the commits automatically"
      correct: false
      why: "Squashing is a separate and explicit operation."
    - text: "It was a fast-forward — `main` was a direct ancestor, so the pointer simply moved"
      correct: true
      why: "No new commit is needed when there is nothing to reconcile."
    - text: "The merge failed silently and nothing was applied"
      correct: false
      why: "The commits are there. Only the merge commit is absent, and deliberately so."
```

## Key Concepts
- **Commit** = a snapshot + parent pointer(s) + metadata, identified by a SHA-1/SHA-256 hash
- **Branch** = a movable pointer to a commit — cheap to create, that's the whole point
- **Merge** = new commit with two parents, preserves both histories exactly as they happened
- **Rebase** = replays commits onto a new base, rewrites hashes, produces linear history
- **Fast-forward** = when merging requires no new commit because the target is a direct ancestor
- **Staging area (index)** = the "about to commit" set, separate from working directory and last commit
- **Conflict markers** = Git showing you both divergent versions; resolving means picking/combining and removing the markers

## Example Code
```bash
# Branch, commit, and rebase onto updated main
git checkout -b feature/rate-limit
# ... make commits ...
git fetch origin
git rebase origin/main          # replay feature commits on top of latest main

# If a conflict appears mid-rebase:
#   1. open the file, resolve markers
git add path/to/file.ts
git rebase --continue

# Merge instead, when the branch is shared/public:
git checkout main
git merge --no-ff feature/rate-limit   # explicit merge commit, preserves branch history

# Recover from a rebase/reset gone wrong — reflog remembers even "lost" commits
git reflog
git reset --hard HEAD@{3}
```

Merge and rebase applied to the same two-branch history, run for real with pinned commit dates so the hashes below are the actual ones git produced. Predict what happens to the feature commit's hash in each case before revealing it.

```proof sha=8e683f19cfad0ad0 at=2026-09-02 commit=9614387
$ bash run.sh
$ git log --format="%h %s" feature -1   # the feature commit, before anything
cb7b115 feature: add feature.txt

--- merge: nothing is rewritten ---
$ git log --format="%h %p %s" -1   # the merge commit and its two parents
e833489 ee3b722 cb7b115 merge feature into main
feature commit is still cb7b115: commit

--- rebase: the same change gets a new hash ---
$ git log --format="%h %s" -2   # linear now, and the hash changed
607cc5e feature: add feature.txt
ee3b722 main: add main.txt
before rebase: cb7b115
after rebase:  607cc5e
same tree, same message, different commit — this is why you never rebase what others pulled
```

## When to Use
- **Rebase** your own local, unpushed (or not-yet-pulled-by-others) feature branch to keep history linear before opening a PR
- **Merge** when the branch is shared, or when you want an honest record of when work actually diverged
- Resolve conflicts by understanding *both* sides' intent, not by mechanically picking one and deleting the other
- Use `git reflog` any time you think you've lost work — it almost always hasn't actually been deleted

## Common Mistakes
- Rebasing a branch other people have already pulled — their history and yours diverge permanently, causing a mess on next pull
- **`git push --force` runs on a shared branch, silently overwriting a teammate's commit that landed five minutes earlier** — Force-pushing with plain `--force` instead of `--force-with-lease` (which fails safely if someone else pushed in the meantime)
- **`node_modules` shows up in the first commit, because `.gitignore` didn't exist yet when `git add .` ran** — Committing generated files (`node_modules`, build output) because `.gitignore` wasn't set up first
- **A bad merge triggers a panic-deleted branch, before anyone thought to check `git reflog` for a way back** — Panic-deleting a branch after a bad merge instead of checking `git reflog` first

## Further Reading
- "Pro Git" by Scott Chacon & Ben Straub — free online, chapters 2–3 cover this completely
- Atlassian Git Tutorials — merge vs rebase comparison
- `git help everyday` — the built-in "everyday git" workflow guide
- [Pro Git](https://git-scm.com/book/en/v2) — free and complete; chapters 2, 3 and 7 cover everything above properly

```recall
- q: "What is a commit, physically?"
  must:
    - "a snapshot, plus parent pointer or pointers, plus metadata"
    - "identified by a SHA-1 or SHA-256 hash"

- q: "Contrast merge and rebase."
  must:
    - "merge creates a new commit with two parents and preserves both histories exactly as they happened"
    - "rebase replays commits onto a new base, rewrites hashes, and produces linear history"

- q: "What is the staging area, and what are conflict markers?"
  must:
    - "the index is the \"about to commit\" set, separate from the working directory and from the last commit"
    - "conflict markers are Git showing you both divergent versions"
    - "resolving means picking or combining, and removing the markers"
```
