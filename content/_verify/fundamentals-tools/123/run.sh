#!/bin/bash
# Real `git bisect run`, not a transcript — this sets up a scratch repo with
# a pinned-date, 5-commit history where one commit introduces a real bug,
# then lets git actually bisect it. Author/committer dates are pinned so the
# resulting commit hashes (and therefore this script's entire stdout) are
# byte-identical on every run — required for stamp-verify.ts --check to
# regenerate and compare against the committed proof block.
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

cat > check.js <<'EOF'
const add = require('./add.js');
if (add(2, 3) !== 5) { console.error('FAIL: add(2,3) !== 5'); process.exit(1); }
console.log('PASS');
EOF
git add -A && commit 1 "add check.js"

echo "module.exports = function add(a, b) { return a + b; };" > add.js
git add -A && commit 2 "v1.4.0: add() implemented correctly"
git tag v1.4.0

echo "// clarify intent
module.exports = function add(a, b) { return a + b; };" > add.js
git add -A && commit 3 "refactor: add a comment (no behavior change)"

echo "// clarify intent
module.exports = function add(a, b) { return a + b + 1; }; // BUG: off-by-one introduced here" > add.js
git add -A && commit 4 "feat: add input validation"

echo "// clarify intent, updated
module.exports = function add(a, b) { return a + b + 1; };" > add.js
git add -A && commit 5 "docs: update comments"

git bisect start
git bisect bad HEAD
git bisect good v1.4.0
git bisect run node check.js
git bisect reset

rm -rf "$WORK"
