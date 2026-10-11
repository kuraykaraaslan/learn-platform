# Judge 01 — Learner value

> Verbatim output of the `judge:learner-value` agent. It received all six audits and all 32 proposals,
> and scored every proposal it considered worth keeping under this lens alone.

## Judging lens

learner-value: does this move a reader from "read it" to "genuinely knows it"? I reward only two things — forced production (the learner commits to an output before being told) and feedback (they find out they were wrong in a way they can see). Everything else is scored by how directly it feeds those two. Volume, navigation, print, process and provenance score low no matter how well argued.

Three judgments shape the whole ranking:

(1) RETRIEVAL SCAFFOLDING INHERITS THE CORRECTNESS OF WHAT IT DRILLS. This is the single most important sequencing fact and most proposals gloss it. Making a reader *commit* to an answer and then confirming a wrong mitigation is worse than letting them skim it — a drilled error is a held belief. The timing-attack lesson's Common Mistakes bullet actively codifies a wrong fix ("include the length check inside the constant-time logic"), and that bullet is exactly the raw material Cold Open and Failure Drill would mine. So the ~20 harmful lessons (33, 34, 32, 07, 03, 41, 43, 410, 53, 230, 319, 216) must be corrected before, not after, any drill ships on them. Retrieval and correctness are not competing priorities; they are ordered ones.

(2) COMPLIANCE IS PART OF MECHANISM STRENGTH. Free recall beats multiple choice in the lab, but an optional textarea at the foot of a long page gets skipped and a forced choice at the top of the page does not. I scored formats by expected effect across real readers, not by peak effect on a compliant one. This is why Cold Open edges out Close the Tab despite the weaker format.

(3) PARSER TRAP, VERIFIED. Every proposal adding a section *above* `## What It Is` (Cold Open) is silently deleted, not mis-rendered — I simulated the parser and only `What It Is` survived. Sections added *after* an existing one degrade gracefully. Any new-section work must land the 3-file parser/type/UI change first, and Cold Open must land it before a single file is authored.

MERGES: 12+28 (same four-beat unit; 12 is the authoring pattern, 28 is the CI that stops it rotting). 3+10 (same telemetry content; 3 adds the commitment step and strictly dominates). 6+23 (same capstone; take 6's sealed-until-scored walkthrough and 23's rubric-from-Common-Mistakes, drop 23's certificate — a self-issued credential teaches nothing). 7+18 (same sort fix + prereq layer).

BELOW THE CUT BUT WORTH BUILDING LATER, not rejected: 17 Concept Spine (unplanned second encounters at zero authoring cost — but following a link is not retrieval), 15 Prove It (carries real new content in the gap between the shallow and strong answer; still read-only), 13 Decide (fixes "can't defend the choice"; read-only), 14 Field Notes (one real referent makes an abstraction durable; it is still a story you read), 20 Search (high-motivation retrieval *of the document*, not from memory), 26/29/30 (hygiene and sequencing that protect the above).

## Rankings (12)

| Score | Proposal |
|---:|---|
| 9 | Cold Open (#1) |
| 8.5 | Failure Drill (#21) |
| 8.5 | Close the Tab (#4) |
| 8.5 | Broken → Fixed → Proof + content/_verify (#12 + #28) — MERGED |
| 8 | Fill the Gap (#2) |
| 8 | When It Breaks (+ How It Breaks) (#3 + #10) — MERGED |
| 7.5 | Two Doors (#8) |
| 7.5 | The Return Queue (#5) |
| 7.5 | Capstone + Rubric (#6 Ship It + #23) — MERGED |
| 7 | Numbers That Matter (#11) |
| 6.5 | Authored Order + Prereq/Callback Graph (#7 + #18) — MERGED |
| 6.5 | Jurisdiction Notes (#16) |

### Reasoning, in ranked order

#### 9 — Cold Open (#1)

The strongest single intervention here because it is unavoidable: a forced choice sits at the top of every page, before the reader is allowed to read, so compliance approaches 100% where an end-of-page textarea gets skipped. Prediction error is the mechanism that makes the subsequent explanation land, and per-distractor feedback ('why the wrong one was tempting') is what separates this from a quiz. I verified the raw material is real — the idempotency lesson's four Common Mistakes bullets are specific, falsifiable failure modes, not filler, so 1,771 answer-key items convert into 1,771 questions at near-zero research cost. Two conditions: the parser/type/UI change MUST merge before any authoring (I simulated it — a `## Cold Open` above `## What It Is` is silently deleted, not mis-rendered, which is the worst possible failure), and it must not ship on the ~20 lessons whose Common Mistakes currently assert a wrong mitigation, because a drilled error is a held belief. Every distractor must be a position a competent engineer actually holds; 'it depends' options would make this filler overnight.

#### 8.5 — Failure Drill (#21)

The best value-per-unit-effort in the entire set of 32, and I verified the numbers: 609 of 1,771 bullets are already in `**lead** — body` shape (140 files fully structured), so a large fraction converts to predict-then-reveal with zero authoring. Hiding the body and asking 'what breaks?' turns the corpus's single largest asset from an answer key with no question into an act of production, on all 412 lessons, without writing a lesson. It scores below Cold Open only because click-to-reveal is covert retrieval — a reader can click without predicting, so the commitment is weaker than a recorded choice. Note the parse regex must handle `**Lead**: body` (colon) as well as em-dash; the newer cohort uses colons. Keep the 'Reveal all' escape hatch and persist the preference, or the drill becomes friction on a page someone was skimming, and lint any lead over ~8 words that gives its own answer away.

#### 8.5 — Close the Tab (#4)

Typed free recall against a `must[]` criterion checklist is the highest-fidelity retrieval format achievable without a human grader, and it is the only proposal that directly punctures the illusion of knowing — 'did I say the length still leaks?' is a yes/no a reader cannot fudge, whereas 'does my answer look like theirs?' always scores generously. The 15-character gate is the load-bearing detail: without it this is a reveal button, with it it is production. It ties with Failure Drill rather than beating it purely on compliance — an optional effortful textarea after Further Reading will be skipped by most readers, and a mechanism only counts when it fires. Also the cheapest authoring of the four content proposals (the `must` items are largely Key Concepts rewritten into produced form) and the natural item source for spacing, so freeze its schema first.

#### 8.5 — Broken → Fixed → Proof + content/_verify (#12 + #28) — MERGED

Merged because they are one idea at two layers: #12 is the four-beat authoring pattern (broken version with its symptom, the fix, an executable proof), #28 is the CI workspace that keeps it honest and injects real terminal output between machine-owned markers. Together they do two things nothing else does: they make the code *correct* (126 of 158 TS fences currently fail a standalone typecheck, and 46 import the first owner's private `@/libs/*`), and they give the reader something to run with a stated expected result — 0 of 412 files currently contain 'you should see'. I confirmed the highest-value half needs NO parser change: fence tracking is section-agnostic, so a six-line broken snippet plus its symptom can go into `## Common Mistakes` today. This is also the prerequisite that stops the drill proposals from teaching wrong code well. Scored just below the retrieval trio because a reader who does not paste the code gets a better-illustrated lesson rather than a production event.

#### 8 — Fill the Gap (#2)

Completion problems are the documented midpoint between a worked example and a blank page, and the corpus is stuck at one end: 338 of 412 files ship exactly one fully-solved fence, which builds recognition and not production. Blanking only the three load-bearing decisions is well-targeted difficulty — the reader retrieves the reasoning without retyping boilerplate, so the cognitive load lands on the part an interviewer would actually ask about. Typing `state.sagaId` and then reading why `job.id` fails is a memory of a decision you made; the equivalent bullet is a sentence you have seen. Two caveats keep it below the top group: it only applies to the ~175 lessons with real code (blanking a form field is not a completion problem, so leave the 230 business templates alone), and it is worthless until the code compiles — so it implicitly depends on the merged #12/#28 pass. Never render a red X; show the `why` for every blank so a rejected-but-reasonable answer still teaches.

#### 8 — When It Breaks (+ How It Breaks) (#3 + #10) — MERGED

Merged: identical telemetry content (symptom → probe → expected output → knob), but #3 wraps it in a commitment step — symptom shown first with the plausible-wrong instinct named, reader types their diagnosis before the row opens — so it strictly dominates #10 on this lens. It is the only proposal that teaches diagnosis rather than construction, which is what the reader will actually be doing under pressure, and having already held the wrong idea in a safe place means it arrives pre-labelled when it recurs. The `probe`/`expect` pair also smuggles in reality as the feedback source: running a query against your own database and finding a dead replication slot is a competence event fifty accurate paragraphs cannot produce. Held at 8.0 by cost and risk — this is the highest fabrication exposure in the set, since hallucinated `psql` output is indistinguishable from real `psql` output. Non-negotiable: every probe/expect executed by a human against a real instance, with the repro committed, and the section omitted rather than invented where no real probe exists.

#### 7.5 — Two Doors (#8)

Targets the sharpest gap in the audits — a reader who can define both options and defend neither. Discrimination between confusable mechanisms is not built by studying each thoroughly in its own block; it is built by interleaved forced choice where the separating cue becomes salient, which is exactly why the current blocked, one-encounter structure produces people who recognise four patterns and deploy none. The `confusable_with` field does the real work: naming why the wrong answer was attractive ('sequential versus concurrent', 'the write already committed') is what survives into a design review months later. Cheap for its yield — 30-40 units, not 412. Docked half a point for dependency and authoring risk: it needs the cross-lesson index to have anywhere to send people, and every scenario must have one defensible best answer with the runner-up named honestly, because a contestable answer key with no acknowledgement destroys credibility faster than anything else here. Cap at 6 scenarios; 20 turns a discrimination drill into a quiz.

#### 7.5 — The Return Queue (#5)

Spacing and interleaving are the two most robust findings in the retention literature and both currently sit at zero — every lesson is a terminal node with exactly one encounter, in a block, inside its own course. The second encounter three days later is where knowledge stops being a memory of having read something; the interleaved ordering builds the discrimination skill that blocked study actively suppresses. Zero content authoring, and the substrate is pre-approved (zustand + persist is already a dependency with no imports; ADR 0001 §3 explicitly reserved localStorage for this). Scored 7.5 rather than higher only because its standalone value is literally zero — it is a multiplier on whatever deck #1/#2/#4 produce, so it must not be built first. localStorage is one cleared-site-data away from nothing, so JSON export/import is mandatory, and the due count must stay a quiet number: streak pressure converts retrieval practice into card-clearing, which is re-reading with extra steps.

#### 7.5 — Capstone + Rubric (#6 Ship It + #23) — MERGED

Merged; take #6's sealed-until-you-self-score walkthrough and #23's rubric built from the course's own Common Mistakes, and drop #23's certificate — a self-issued unverifiable credential teaches nothing and cheapens what surrounds it. This is the only proposal producing transfer: applying knowledge in a novel context under constraints the lesson did not pre-solve, which is the ceiling the corpus currently cannot reach with 0 exercises in 412 lessons. The sealed walkthrough is a genuine calibration event — you commit to a self-assessment, then discover where an experienced engineer would have disagreed, and that delta is the densest feedback available without a human grader. It is also the only place the missing ambiguous-outcome case (the charge timed out but Stripe committed it) can be taught at all, because that case cannot be explained, only survived. Held at 7.5 by completion rate: enormous value for the few who finish, near zero for the rest. Ship five where the payoff is largest, not 23, and add a 'Level 1 in 30 minutes' version to raise the floor.

#### 7 — Numbers That Matter (#11)

The highest-value read-only section, because half of it is not read-only: the 'Measure yours' column is a production task whose feedback comes from reality rather than an answer key. A reader who runs EXPLAIN ANALYZE on their own database and comes back with a number nobody on their team has had a competence event, and that single experience does more for felt-and-actual knowledge than any amount of correct prose. It also repairs a specific defect with direct learner cost: you cannot defend a trade-off you cannot quantify, and the corpus currently teaches trade-offs entirely in adjectives ('significant cost', 'conflicts are rare'), so a reader leaves able to name the pattern and unable to argue for it in the room where it matters. The proposal's own discipline is what keeps it honest — prefer the measurement command over the stated value (commands do not go stale), stamp the version in the column header, and delete any row that has neither a source nor a command. Cap at ~6 rows or it becomes a config dump.

#### 6.5 — Authored Order + Prereq/Callback Graph (#7 + #18) — MERGED

Merged; both center on the same two-line sort fix plus a prerequisite layer. I verified the bug is real — `bracketRank(a.bracket) - bracketRank(b.bracket) || a.id - b.id` in the service and `BRACKET_ORDER.filter(...)` grouping in the overview — so 20 of 23 courses are currently taught in dependency-broken order, opening business-finance-solo-ops on 'Ethical Growth' instead of the cash-flow lesson everything downstream assumes. Teaching prerequisites backwards is a real comprehension cost at essentially zero fix cost, and it should ship on its own the same day as a bug, not bundled into a feature. The forward-callback half ('idempotency comes back in #7, #8, #14') is the genuinely pedagogical part — authored spaced re-encounter, turning terminal pages into a network. Scored 6.5 because sequencing is an enabler, not a mechanism: correct order makes reading comprehensible, it does not make it retrievable. Cap prereqs at 2, allow zero, require the `why` string, and never hard-lock — adults abandon gated content.

#### 6.5 — Jurisdiction Notes (#16)

Not a learning mechanism, and I would normally score reference content lower — but this is the only proposal that fixes content whose current learner value is *negative*. A Turkish reader following contracts-pricing-legal literally is taught IR35 when their exposure is SGK reclassification, and invoices with no e-Fatura; they finish the course confidently holding the wrong model, which is strictly worse than having read nothing. The swing from negative to positive is large, and the payoff is unusually actionable: learning that TTK 1530 already grants a 30-day term and TCMB-published statutory interest you have never invoiced is knowledge with immediate cash value, acquired by being handed the instrument rather than a summary of it. Two hard constraints — name the publisher and the month rather than the rate (that is what survives annual revision), and this is the one item on the list no AI pass may ship unreviewed: it needs a Turkish mali müşavir and a lawyer. Also forces the homepage contradiction ('interns and employees' vs 186 solo-operator lessons) into the open, which is overdue.

## Rejected (6)

- Depth Tiers (#9) — a word budget is not a mechanism; it grants permission to pad in a corpus whose disease is already confident undifferentiated prose, and none of the evidential sections it claims to unlock actually need it, since LessonSectionCard already returns null on empty html.

- Portable Progress (#19) — completion ticks and streaks count pages turned, which is exactly the metric that manufactures the illusion of knowing this project exists to destroy; keep only the next-lesson link (trivial, part of the sort fix) and let the Return Queue own the localStorage store.

- Course Pack / cheat sheet (#22) — printable re-reading; the one potentially valuable act, compressing 13 lessons into 3 pages, is performed by a script rather than by the learner, so it hands over a hierarchy instead of building one.

- Türkçe Katman (#24) — XL cost that doubles the maintenance surface and risks a stale Turkish page contradicting a corrected English one; it changes the language, not the modality, and the jurisdictional fix it is used to justify is far cheaper bought directly (#16).

- Provenance and the Human Gate (#31) — pure process weight with no learner-facing surface; the anti-slop effect it claims is delivered by the gold-standard rubric and lint, and a gate that costs more than the writing gets routed around.

- Freshness Contract (#32) — a maintenance calendar, not a learning intervention; its one genuine learner cost (five lessons ship a model id the API rejects, so the reader's first attempt to *use* the corpus fails) is a one-line fix inside content lint, not a program.
