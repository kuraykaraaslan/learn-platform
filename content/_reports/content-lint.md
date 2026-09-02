# Content lint report

`npx tsx scripts/content-lint` — generated file, do not edit by hand.

412 lessons · 2 findings · 5 waived

| Rule | Findings | Severity | What it means |
|---|---:|---|---|
| `drill/widget-on-unverified-lesson` | 2 | warn | A `quiz` or `recall` fence on a lesson that is not `verified`. QuizCard and RecallCard both return null in that case — the stopping rule working — so the fence renders nothing at all and the effort is invisible to every reader. The neighbouring `drill/unverified-lesson` rule does not catch this: it checks a manifest `interactive` field that no lesson in the corpus actually sets, so nothing was watching the fences themselves. Born `warn` per the repo rule, because the corpus is not clean of it: 114 is on stamp-verified.ts's T1.7 harm denylist and can only be cleared by the expert pass that list is waiting for, so its drills stay written-but-dark until then. Promote to `error` once that is resolved. |

## Findings by rule

### `drill/widget-on-unverified-lesson` — 2

- career-entrepreneurship/114_niche_positioning.md:11 — `quiz` fence on an unverified lesson — it renders nothing
- career-entrepreneurship/114_niche_positioning.md:100 — `recall` fence on an unverified lesson — it renders nothing
