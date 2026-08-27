#!/bin/bash
# Real find | xargs grep | sort against a scratch tree, not a hand-typed
# transcript. -mtime -1 always matches these files (created moments before
# the command runs), and every path in the output is relative to the scratch
# dir — nothing timestamp- or environment-specific, so this is byte-
# identical on every run without needing pinned dates.
set -e
WORK=$(mktemp -d)
cd "$WORK"

mkdir -p src node_modules/some-dep
echo "export function add(a: number, b: number) { return a + b; }" > src/math.ts
echo "// TODO: validate inputs before shipping
export function divide(a: number, b: number) { return a / b; }" > src/divide.ts
echo "export const ok = true;" > src/clean.ts
# A file inside node_modules with a TODO — must be excluded by -not -path.
echo "// TODO: this should never show up in the results" > node_modules/some-dep/index.ts

echo '$ find . -name "*.ts" -mtime -1 -not -path "*/node_modules/*" | xargs grep -l "TODO" | sort'
find . -name "*.ts" -mtime -1 -not -path "*/node_modules/*" | xargs grep -l "TODO" | sort

rm -rf "$WORK"
