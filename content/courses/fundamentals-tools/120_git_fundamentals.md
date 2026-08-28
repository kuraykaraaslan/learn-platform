# 120. Git Fundamentals — Branching, Merge vs Rebase, Resolving Conflicts

## What It Is
Git tracks snapshots, not diffs — every commit is a full snapshot of the tree, and Git is efficient about storing that because unchanged files are just pointers to the same blob. Once that clicks, branches stop being mysterious: a branch is just a movable pointer to a commit, and "checking out" a branch moves `HEAD` to point at it.

The concept most people use daily without understanding is the difference between merge and rebase. `git merge` creates a new commit that ties two histories together — nothing is rewritten, but you get a non-linear graph. `git rebase` replays your commits one by one onto a new base — the result looks like you branched off *now* instead of when you actually did, at the cost of rewriting commit hashes. Neither is "correct"; they're different tradeoffs between honest history and readable history, and the one hard rule is: never rebase a branch someone else has already pulled from.

Conflicts aren't Git failing — they're Git correctly refusing to guess when two changes touch the same lines. The markers (`<<<<<<<`, `=======`, `>>>>>>>`) are just showing you both versions so you can decide.

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
