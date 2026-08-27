#!/bin/bash
# Real recovery, not a transcript: makes 3 pinned-date commits, "accidentally"
# git reset --hard's 2 of them away, then recovers via reflog. Pinned dates
# keep the resulting hashes (and this script's entire stdout) byte-identical
# on every run, required for stamp-verify.ts --check.
set -e
WORK=$(mktemp -d)
cd "$WORK"
git init -q
git config user.email "ci@example.com"
git config user.name "CI"

commit() {
  GIT_AUTHOR_DATE="2026-01-01T00:00:0${1}+00:00" GIT_COMMITTER_DATE="2026-01-01T00:00:0${1}+00:00" \
    git commit -q -m "$2"
}

echo "one" > file.txt
git add -A && commit 1 "first commit"
echo "two" > file.txt
git add -A && commit 2 "second commit"
echo "three" > file.txt
git add -A && commit 3 "third commit — this is the work we're about to 'lose'"

echo '$ git log --oneline'
git log --oneline
echo
echo '$ git reset --hard HEAD~2   # oops — meant to undo 1 commit, undid 2'
git reset --hard HEAD~2
echo
echo '$ cat file.txt   # confirms the reset really happened — third commit'"'"'s change is gone'
cat file.txt
echo
echo '$ git reflog   # HEAD@{0} is where we are now; HEAD@{1} is right before the reset'
git reflog
echo
echo '$ git reset --hard HEAD@{1}   # jump back to right before the reset'
git reset --hard HEAD@{1}
echo
echo '$ cat file.txt   # third commit'"'"'s change is back'
cat file.txt

rm -rf "$WORK"
