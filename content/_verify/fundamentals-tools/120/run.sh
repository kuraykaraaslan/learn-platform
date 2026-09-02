#!/bin/bash
# A real merge and a real rebase of the same history, not a hand-typed
# transcript. Author AND committer dates are pinned on every commit, so the
# resulting commit hashes — the whole point of this block — are byte-identical
# on every run and on every machine. `git log --format` is used instead of
# --graph because the graph-drawing characters have shifted between git
# versions; the parent list makes the same point without that risk.
#
# The rebase uses --committer-date-is-author-date deliberately: a plain
# `git rebase` stamps the replayed commit with the *current* time as its
# committer date, which would make its hash — the one thing this block is
# demonstrating — different on every run. Pinning it to the (already pinned)
# author date makes the hash stable while changing nothing about the point:
# the commit still gets a new hash, because its parent changed.
set -e
WORK=$(mktemp -d)
cd "$WORK"
git init -q -b main
git config user.email "ci@example.com"
git config user.name "CI"

commit() {
  GIT_AUTHOR_DATE="2026-01-01T00:00:0${1}+00:00" GIT_COMMITTER_DATE="2026-01-01T00:00:0${1}+00:00" \
    git commit -q -m "$2"
}

echo "base" > base.txt
git add -A && commit 1 "base commit"

git checkout -q -b feature
echo "feature work" > feature.txt
git add -A && commit 2 "feature: add feature.txt"

git checkout -q main
echo "main work" > main.txt
git add -A && commit 3 "main: add main.txt"

FEATURE_BEFORE=$(git rev-parse --short feature)
echo '$ git log --format="%h %s" feature -1   # the feature commit, before anything'
git log --format="%h %s" feature -1

echo ''
echo '--- merge: nothing is rewritten ---'
git checkout -q -b merge-demo main
GIT_AUTHOR_DATE="2026-01-01T00:00:04+00:00" GIT_COMMITTER_DATE="2026-01-01T00:00:04+00:00" \
  git merge -q --no-ff feature -m "merge feature into main" 2>&1
echo '$ git log --format="%h %p %s" -1   # the merge commit and its two parents'
git log --format="%h %p %s" -1
echo "feature commit is still $FEATURE_BEFORE: $(git cat-file -t $FEATURE_BEFORE)"

echo ''
echo '--- rebase: the same change gets a new hash ---'
git checkout -q feature
git rebase -q --committer-date-is-author-date main 2>&1
FEATURE_AFTER=$(git rev-parse --short feature)
echo '$ git log --format="%h %s" -2   # linear now, and the hash changed'
git log --format="%h %s" -2
echo "before rebase: $FEATURE_BEFORE"
echo "after rebase:  $FEATURE_AFTER"
echo "same tree, same message, different commit — this is why you never rebase what others pulled"

rm -rf "$WORK"
