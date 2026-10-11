# Proposals 01 — Learning science

> Verbatim output of the `ideate:learning-science` agent. It received all six audit reports as input.

## Lens

learning-science. My starting position is the pedagogy grader's measurement, which I verified by reading: 0 of 412 lessons ask the reader to produce anything. The corpus is 425k words delivered in the single modality — re-reading — that maximises the gap between felt fluency and actual retention. That is precisely the failure mode of the owner's goal: "kendini cidden bilgi sahibi hissetsin" is not a content-volume problem, it is a *feedback* problem. A reader feels knowledgeable when they have committed to an answer, been wrong in a way they can see, and corrected it. Nothing in this repo currently lets them be wrong.

So I ignored "add more prose" entirely. Every proposal below is a **generation event plus a correction event**, in that order, and none requires a backend: the reader commits (click, type, self-explain), then authored feedback arrives, then the commitment is stored in localStorage so a *second* encounter can be scheduled. The three mechanisms I lean on hardest: (1) **prediction before reveal** — a wrong prediction is what makes the subsequent explanation stick, and this corpus has 1,771 Common Mistakes bullets already sitting in answer-key form that are perfect distractors; (2) **completion problems / faded worked examples** — 338 lessons ship exactly one fully-solved fence, which produces recognition and not production, and fading is a cheap edit to code that already exists; (3) **spaced interleaved retrieval** — "retry" recurs in 35 lessons, "idempoten" in 27, and none of that natural recurrence is exploited, so every lesson is a terminal node with exactly one encounter.

Two structural facts constrain everything. First, the pedagogical ceiling is enforced in code: `LessonSections` is a fixed 6-key record, `HEADING_RULES` maps only 6 prefixes, and an unrecognised `##` is *silently swallowed into the previous card* — so any new section is a mandatory 3-file change that must land BEFORE authoring, or 412 files render wrong. Second, `zustand` + `persist` is already a dependency and docs/adr/0001 §3 explicitly reserved localStorage for progress, so the scheduling substrate is pre-approved and needs no new architecture.

Ordering: proposals 1-4 are per-lesson generation events that ship independently; 5 is worthless until 1 or 4 exists (it reuses their items as its deck); 6-8 are the transfer layer where "I can defend this in a review" gets built. If only one ships, ship #1 — cheapest per lesson, reuses text that already exists, and it changes the reader's posture from consuming to committing on line one of every lesson.

## Proposals (8)

### 01.1 Cold Open · effort L

**Every lesson opens with a forced prediction about real code, with per-distractor feedback mined from that lesson's own Common Mistakes bullets — you commit before you are allowed to read.**

**What changes**

CONTENT: a new `## Cold Open` section inserted between the `# N. Title` line and `## What It Is` in all 412 files, containing 1-3 sentences of setup plus one ```predict fence (YAML). PARSER: add `{ prefix: 'Cold Open', field: 'coldOpen' }` to HEADING_RULES in course_content.parser.ts, and add a widget-extraction step inside `flush()` that pulls fences whose info string is a known widget lang out of the buffer BEFORE `markdownToHtml`, yaml-parses them and zod-validates them into a new `LessonWidgets` slot on the parse result. TYPES: `coldOpen` key on `LessonSections`; new `PredictBlock` type in course_content.types.ts. UI: LessonPage.tsx renders `<PredictCard>` (new `modules/course_content/ui/interactive/PredictCard.tsx`, 'use client') as the FIRST card, above What It Is; options render as buttons, and only after a click does it reveal that option's feedback plus a 'show the lesson' control. STATE: choice written to `learn:v1:predictions` via a new `modules/progress/progress.store.ts` (zustand + persist). DEPS: add `yaml` (build-time only — parsing happens in the server component, the YAML never reaches the client). CI: extend the existing vitest setup with a content test asserting every lesson has exactly one Cold Open with >=3 options and exactly one `correct: true`. MANIFEST: unchanged.

**Example snippet**

````
For content/courses/database-caching-performance/16_n_plus_1_query_problem.md — inserted directly after the `# 16. N+1 Query Problem` line, before `## What It Is`. Distractors a and d are lifted in substance from this lesson's OWN first Common Mistakes bullet, which currently sits at the bottom of the page as an unearned answer.

    ## Cold Open
    A support ticket says the team page takes 4 seconds for one customer and 200ms for everyone
    else. This is the handler. Commit to a number before you scroll.

    ```predict
    question: "Run against a tenant with 50 members. How many statements reach PostgreSQL?"
    code: |
      const members = await db.tenantMember.findMany({ where: { tenantId } });
      const result = await Promise.all(
        members.map((m) => db.user.findUnique({ where: { id: m.userId } }))
      );
    options:
      - id: a
        label: "1 — Promise.all sends them as a single batch"
        feedback: |
          No. `Promise.all` schedules concurrency in JavaScript; it has no idea a database
          exists. Fifty `findUnique` calls are fifty `SELECT ... WHERE id = $1` statements.
          They just leave at the same time.
      - id: b
        label: "2 — Prisma auto-batches relation loads"
        feedback: |
          True for `include`, which Prisma resolves with one extra `WHERE id IN (...)`.
          Not true here: you never asked for a relation. You wrote fifty independent finds,
          so Prisma has nothing to batch.
      - id: c
        label: "51 — one for the list, one per member"
        correct: true
        feedback: |
          Right. And notice why this survives code review: the awaits are parallel, so it
          *reads* as optimized. Parallel N is still N.
      - id: d
        label: "51, but Promise.all makes it fast enough not to matter"
        feedback: |
          Half right, and this is the expensive half. Fifty simultaneous round trips also
          demand fifty connections from a pool sized 10 (#19), so the extra 49 queue behind
          the first 10. Under load this endpoint gets *slower* than the sequential version.
    ```
````

**Why it makes them feel knowledgeable**

A prediction that turns out wrong creates a specific, felt gap — and the explanation that lands in that gap is retained far better than the same sentence read cold. This is the mechanism behind pretesting and error-based learning: reading 'don't fix N+1 with Promise.all' generates no prediction error and no correction, while clicking option (d) and being told the pool math does. It also converts the corpus's largest untapped asset — 1,771 expert-identified failure patterns currently written as their own answer key — into 1,771 questions at close to zero research cost. And it changes the reader's posture on every page from consumption to commitment, which is the difference between finishing 412 lessons feeling informed and finishing them able to produce.

**Risk**

The 412 authored predictions are the whole cost; the component is a day. The real risk is generic distractors ('all of the above', 'it depends'), which read as AI filler instantly — the authoring rule must be that every distractor is a position a competent engineer actually holds, and the correct answer's feedback must explain why the wrong ones are tempting, not just restate the right one. Secondary: the parser change must merge before any content authoring, or `## Cold Open` is silently DROPPED entirely (no preceding section means `currentField` is null and the buffer is discarded) — worse than mis-rendered. Answer keys are visible in page source; irrelevant here since there are no grades, but say so before anyone builds anti-cheat.

### 01.2 Fill the Gap · effort L

**The solved code example is followed by the same code with 3 load-bearing decisions blanked out, checked client-side against accepted answers with an explanation of what breaks if you get it wrong.**

**What changes**

CONTENT: a new `## Fill the Gap` section immediately after `## Example Code`, in the ~175 lessons with real code (skip the 230 whose 'Example Code' is a markdown template — those get proposal 6's filled-instance treatment instead). Body is one ```gap fence: `language`, `code` with `▢1`-style markers, and a `blanks` list of `{id, accept[], why}`. PARSER: `{ prefix: 'Fill the Gap', field: 'fillTheGap' }` in HEADING_RULES; reuses the same widget-extraction step as proposal 1. TYPES: `fillTheGap` key; `GapBlock` type. UI: new `modules/course_content/ui/interactive/GapCard.tsx` ('use client') renders the code with inline `<input>` elements at each marker, monospace, sized to the longest accepted answer; a Check button normalizes whitespace/quotes and compares against `accept[]`, then reveals `why` for every blank regardless of correctness. A 'reveal' control unlocks after 60s. STATE: per-blank first-attempt correctness to `learn:v1:gaps` for the review queue. CI: a vitest content test asserting each `▢n` marker has a matching blank entry, and that `accept[0]` substituted back into `code` passes a per-language smoke check (tsc --noEmit for typescript, javac for java).

**Example snippet**

````
For content/courses/distributed-systems-api-design/03_saga_pattern.md. The blanks are exactly the three decisions the current lesson gets WRONG in its own Example Code — the missing idempotency key, the bare `catch` that conflates failure with timeout, and the compensation routing — so authoring this section forces the code defect to be repaired.

    ## Fill the Gap
    Here is the CHARGE_CARD case from above with three decisions removed. Each one is a place
    where a real saga has lost real money. Fill them in, then check.

    ```gap
    language: typescript
    code: |
      case 'CHARGE_CARD': {
        try {
          const charge = await chargeCard(state.input.paymentMethodId, state.input.planId, {
            idempotencyKey: ▢1,
          });
          await sagaQueue.add('saga', { ...state, chargeId: charge.id, step: 'ALLOCATE_SEATS' });
        } catch (err) {
          if (▢2) {
            // the charge may have committed at Stripe even though we saw an error
            await sagaQueue.add('saga', { ...state, step: 'VERIFY_CHARGE' });
            break;
          }
          await sagaQueue.add('saga', { ...state, step: ▢3 });
        }
        break;
      }
    blanks:
      - id: 1
        accept: ["state.sagaId", "`${state.sagaId}:charge`", "state.sagaId + ':charge'"]
        why: |
          The key has to be stable across retries of the SAME saga and distinct across sagas.
          `job.id` is the tempting wrong answer: BullMQ mints a new one on every re-add, so the
          key changes on exactly the retry it was supposed to protect. That is Common Mistakes
          bullet 2 of this lesson, as a bug instead of a warning.
      - id: 2
        accept: ["isTimeout(err)", "err.code === 'ETIMEDOUT'", "err instanceof TimeoutError"]
        why: |
          A bare `catch` collapses two different worlds: 'Stripe declined' and 'Stripe probably
          charged them but the socket died'. Treating the second as the first deletes the tenant
          and keeps the customer's money, with no refund and no record. This is the 3am saga
          incident, and it is the one case the pattern exists to handle.
      - id: 3
        accept: ["'COMPENSATE_TENANT'"]
        why: |
          There is nothing to refund — the only committed step is CREATE_TENANT. Routing to
          COMPENSATE_CHARGE here calls `refundCharge(undefined!)`, which throws INSIDE a
          compensation step, which BullMQ retries, forever, on a saga that can never finish.
    ```
````

**Why it makes them feel knowledgeable**

A completion problem is the documented midpoint between a worked example and an unsupported problem: the solved version transfers the schema, the faded version forces retrieval of the part that carries the reasoning, and the reader gets productive struggle without the overload of a blank page. Critically the difficulty is targeted — the reader does not retype boilerplate, they supply only the three decisions an interviewer would ask about. Typing `state.sagaId` into a box and then reading why `job.id` fails is qualitatively different from reading a bullet that says steps must be idempotent: one is a memory of a decision you made, the other is a sentence you have seen.

**Risk**

Authoring is expensive and must come after the code is actually correct — blanking a line in code that doesn't compile ships the defect with extra ceremony, so this proposal implicitly forces the tsc/javac verification pass over ~175 examples (a feature, but budget it). Free-text checking will reject legitimate variants; mitigate with generous `accept[]` arrays, whitespace/quote normalization, and a reveal escape hatch, and never render a red X — render the `why` for every blank so a rejected-but-reasonable answer still teaches. Do not attempt this on the 230 template-only 'Example Code' sections; blanking a form field is not a completion problem.

### 01.3 When It Breaks · effort XL

**A symptom-first diagnosis section: here is the log line, the metric, the SQLSTATE — name the cause before you open the row, then get the exact probe command and the output you should see.**

**What changes**

CONTENT: a new `## When It Breaks` section after `## Common Mistakes` in the ~250 technical lessons, holding one ```symptoms fence with 2-3 entries of `{symptom, guess, cause, probe, expect, fix}`. PARSER: `{ prefix: 'When It Breaks', field: 'whenItBreaks' }`; same widget extraction as proposal 1. UI: new `modules/course_content/ui/interactive/SymptomCard.tsx` ('use client') renders each entry as a collapsed row showing ONLY `symptom` plus a 'plausible-but-wrong first instinct' pill (`guess`) and a text box for the reader's own diagnosis; expanding reveals cause → probe (with a copy button) → expect → fix, one beat at a time. STATE: `learn:v1:symptoms` records which rows were opened and whether the reader self-marked their diagnosis correct. CI: a content test requiring every entry to have a non-empty `probe` and `expect` — the rule that stops this degrading into more prose.

**Example snippet**

````
For content/courses/database-advanced/41_postgresql_mvcc_vacuum_bloat_isolation.md. Note what this section forces into the corpus: `xmin` horizon, `pg_replication_slots`, `idle in transaction`, SQLSTATE 40001 — currently 0 hits across all 412 files, and the actual reason autovacuum tuning fails in production.

    ## When It Breaks
    Two incidents. Read the symptom, write down your diagnosis, then open the row.

    ```symptoms
    - symptom: |
        `n_dead_tup` on `tenant_events` has climbed past 4M over three days. `last_autovacuum`
        updates every few minutes, so autovacuum is definitely running. The table file on disk
        keeps growing. Sequential scans that took 300ms now take 9s.
      guess: "Autovacuum is too slow — drop autovacuum_vacuum_scale_factor to 0.01 and move on"
      cause: |
        Autovacuum is running and finding nothing it is ALLOWED to remove. A dead tuple can only
        be reclaimed once no snapshot can still see it, so the oldest running transaction in the
        whole cluster pins every dead tuple newer than itself. One forgotten transaction freezes
        the entire table. Scale factors are irrelevant while the xmin horizon is held.
      probe: |
        SELECT pid, state, now() - xact_start AS age, left(query, 60)
        FROM pg_stat_activity
        WHERE backend_xid IS NOT NULL OR backend_xmin IS NOT NULL
        ORDER BY xact_start;

        SELECT slot_name, active, xmin FROM pg_replication_slots;
        SELECT gid, prepared FROM pg_prepared_xacts;
      expect: |
        Usually one row with `state = 'idle in transaction'` and an age in hours — an ORM
        connection that opened a transaction and then awaited an HTTP call. If pg_stat_activity
        is clean, check the other two: an inactive replication slot from a decommissioned
        replica holds the horizon just as effectively and is invisible in every dashboard.
      fix: |
        `ALTER ROLE app SET idle_in_transaction_session_timeout = '30s';` and drop dead slots.
        n_dead_tup falls on the next autovacuum pass, usually within minutes.

    - symptom: |
        After moving the seat-limit check to REPEATABLE READ, the endpoint 500s under concurrent
        signups with `ERROR: could not serialize access due to concurrent update` (SQLSTATE 40001).
      guess: "Add a pessimistic lock so the second transaction waits instead of failing"
      cause: |
        It already waited — and then it failed. Under REPEATABLE READ a blocked writer that is
        released by a COMMIT it could not see does not silently proceed; PostgreSQL aborts it.
        The lock is not the missing piece: 40001 is not an error, it is the protocol telling you
        to retry the whole transaction from the top.
      probe: |
        SELECT xact_commit, xact_rollback FROM pg_stat_database WHERE datname = current_database();
        -- sample twice under load and diff; watch rollbacks climb relative to commits
      expect: |
        A rollback rate that tracks concurrency. Below roughly 1% of transactions, retry and stop
        worrying. Above it the contention is real and the fix is data layout, not isolation level.
      fix: |
        Wrap the transaction in a bounded retry (3 attempts, full-jitter backoff) that catches
        ONLY 40001 and 40P01 and re-runs the whole closure — re-reading inside the same aborted
        transaction returns the same stale snapshot and fails identically.
    ```
````

**Why it makes them feel knowledgeable**

This is the only proposal that teaches diagnosis rather than construction, and diagnosis is what the reader will actually be doing at 3am. Presenting the symptom first, with the plausible-wrong instinct named explicitly, is misconception inoculation: the reader has already HAD the wrong idea in a safe place, so when it recurs under pressure it arrives pre-labelled. The `probe` + `expect` pair is the corpus's missing feedback loop — 0 of 412 files contain 'you should see' or 'how to verify', so nothing a reader does can currently confirm they understood. And it smuggles in the quantitative layer: '1% rollback rate' is defensible in a design review, 'significant performance cost' is not.

**Risk**

Highest authoring cost and the highest correctness stakes in this set — a wrong probe or a fabricated expected output is worse than an absent section, and this corpus already has a track record of confidently-wrong mitigations inside Common Mistakes. Every probe/expect pair must be executed by a human against a real instance before merge; treat AI drafts as hypotheses, not content. Scope discipline: 2-3 entries max, only failures that actually happen — a section of exotic trivia is worse than nothing. Skip entirely for any lesson where the author cannot produce a real probe.

### 01.4 Close the Tab · effort M

**Five typed free-recall questions at the end of each lesson, self-graded against an authored 'you should have mentioned' checklist rather than a model paragraph.**

**What changes**

CONTENT: a new `## Close the Tab` section as the final section of all 412 lessons (after Further Reading), one ```recall fence with 3-5 entries of `{q, must[], note?}`. PARSER: `{ prefix: 'Close the Tab', field: 'closeTheTab' }`; same extraction. UI: new `modules/course_content/ui/interactive/RecallCard.tsx` ('use client') shows one question at a time with a textarea; Reveal stays disabled until the textarea has >=15 characters (the forcing function — a blank box teaches nothing); on reveal it shows `must[]` as tickable criteria and asks for a self-score of Got it / Partial / Missed. Scores land in `learn:v1:recall`. LessonPage.tsx renders it last; CourseOverviewPage.tsx shows a per-lesson dot (untested / partial / solid) beside each item. TYPES: `closeTheTab` key, `RecallBlock` type. This is also the item source for proposal 5's deck, so freeze this schema first.

**Example snippet**

````
For content/courses/security/34_timing_attack_constant_time_comparison.md. Q1 deliberately targets what this lesson currently gets WRONG — its own Common Mistakes bullet tells the reader to fold the length check into the constant-time logic, and the shown `crypto.timingSafeEqual(bufA, bufA)` does not hide length at all — so authoring the checklist repairs the lesson.

    ## Close the Tab
    Answer each one in your own words, out loud or in the box, without scrolling up. Then grade
    yourself against the checklist — you are looking for the ideas, not the wording.

    ```recall
    - q: |
        You hold a 20-byte stored token and a 64-byte candidate from the request.
        What does `crypto.timingSafeEqual` do, and what should you actually do?
      must:
        - "It throws a TypeError — it requires equal byte lengths, it does not return false"
        - "Comparing bufA against itself does NOT hide the length: a 20-byte compare is
           measurably faster than a 64-byte one, so the length still leaks"
        - "The real fix is to HMAC both values to a fixed 32 bytes and compare THOSE"
      note: |
        If you answered 'do the length check first and return false', you gave the answer this
        lesson itself used to give. It is wrong for the reason in bullet two, and it is the most
        commonly repeated wrong answer on this topic.
    - q: "Why is bcrypt.compare not on the list of comparisons to fix?"
      must:
        - "The work factor dominates — ~200ms at cost 12 versus nanoseconds of byte comparison"
        - "The timing signal is buried under noise orders of magnitude larger than itself"
    - q: |
        Name two comparisons in a normal SaaS that genuinely need constant time, and one that
        looks like it does and does not. Say why for the third.
      must:
        - "Needs it: webhook signature (HMAC digest) verification"
        - "Needs it: CSRF token, cookie value against header value"
        - "Does not: a SHA-256 hash you just computed compared against a DB row — the compare
           happens inside an I/O-bound query, and the attacker cannot steer the hash without
           breaking pre-image resistance"
    - q: |
        The attacker is remote, over HTTPS, across the public internet. Estimate what they need
        to exploit a 200-nanosecond difference, then decide: P1 or P3?
      must:
        - "Thousands to millions of samples to average out jitter that is 4-6 orders of magnitude
           larger than the signal"
        - "Realistically needs network proximity or a co-tenant position"
        - "P3 for a hashed-token compare; P1 for webhook signature verification, where the
           attacker controls the payload and can sample offline at will"
    ```
````

**Why it makes them feel knowledgeable**

Free recall with a criterion checklist is the highest-yield retrieval format available without a grader, and it is strictly better than multiple choice here: typing an answer requires generation, while recognising one only requires familiarity — which is exactly the illusion this corpus currently manufactures. The `must[]` list rather than a model paragraph is what makes self-grading honest: 'did I say the length still leaks?' is a yes/no a reader cannot fudge, whereas 'does my answer look like theirs?' always scores generously. The 15-character gate matters more than it looks — it is the difference between retrieval practice and a reveal button. And the resulting per-lesson dot on the course page is the product's first honest signal of what the reader knows versus what they have read.

**Risk**

Self-grading inflation is real and only partly fixable — the checklist format plus a deliberately harsh 'Partial means you missed one item' instruction gets most of the way. Authoring is the cheapest of the four content proposals (the `must` items are largely Key Concepts rewritten into produced form) but 412 x 4 items still needs human review for factual correctness, and questions aimed at a lesson's existing errors will surface those errors — plan for it. A 7th section after Further Reading extends page length; mitigate by rendering it as a visually distinct full-width band rather than a 7th identical card.

### 01.5 The Return Queue · effort M

**A /review page that resurfaces items you got wrong — interleaved across courses, spaced by a Leitner schedule in localStorage — so no lesson stays a one-encounter terminal node.**

**What changes**

BUILD: `scripts/build-review-deck.ts` walks all 412 files at build time and compiles every `predict`, `gap` and `recall` item into `content/.generated/review-deck.json` (id, courseSlug, lessonSlug, lessonTitle, kind, payload, plus `tags` from a small keyword map — retry, idempotency, locking, caching, pricing, scope). SERVICE: `CourseContentService.getReviewDeck()` reads it; imported statically so it ships in the client bundle for the review route (~200KB gzipped at 3 items/lesson; chunk per course and lazy-load if that grows). STATE: `modules/progress/progress.store.ts` gains a Leitner scheduler — boxes at 1/3/7/21/60 days, a miss resets to box 0, a hit promotes — keyed `learn:v1:schedule`, entirely client-side. ROUTES: new `app/(frontend)/review/page.tsx` ('use client') serving a daily session of up to 10 due cards, deliberately shuffled ACROSS courses, plus a due-count badge in the app header and a 'seen again in' footer line per lesson. UI: reuses PredictCard/GapCard/RecallCard in compact mode. Zero content authoring — this is pure build work on top of 1/2/4.

**Example snippet**

```
A generated deck entry and the scheduling rule that acts on it. This card originates in content/courses/security/34_timing_attack_constant_time_comparison.md and will be shown interleaved with cards from distributed-systems-api-design and database-advanced — never in a security-only block, because blocked practice by topic is what produces the fluency illusion.

    // content/.generated/review-deck.json (excerpt, emitted by scripts/build-review-deck.ts)
    {
      "id": "security/34#recall.0",
      "courseSlug": "security",
      "lessonSlug": "timing-attack-constant-time-comparison",
      "lessonTitle": "Timing Attack — Constant-Time String Comparison",
      "kind": "recall",
      "tags": ["hmac", "comparison", "webhooks"],
      "payload": {
        "q": "20-byte stored token, 64-byte candidate. What does crypto.timingSafeEqual do?",
        "must": [
          "Throws a TypeError — requires equal byte lengths",
          "Comparing bufA to itself does not hide length; length still leaks",
          "Real fix: HMAC both sides to a fixed 32 bytes, compare those"
        ]
      }
    }

    // modules/progress/progress.store.ts
    const BOX_DAYS = [1, 3, 7, 21, 60];

    grade(cardId: string, result: 'got' | 'partial' | 'missed') {
      const prev = get().cards[cardId] ?? { box: 0, seen: 0 };
      const box =
        result === 'got'       ? Math.min(prev.box + 1, BOX_DAYS.length - 1)
        : result === 'partial' ? prev.box
        : 0;                                  // a miss always returns to box 0
      set({ cards: { ...get().cards, [cardId]: {
        box, seen: prev.seen + 1,
        due: Date.now() + BOX_DAYS[box] * 864e5,
      }}});
    }

    // The interleaving rule that makes the session work: never two cards from the same
    // course back to back while any other course still has a due card.
    function orderSession(due: Card[]): Card[] {
      const byCourse = groupBy(due, (c) => c.courseSlug);
      const out: Card[] = [];
      while (Object.values(byCourse).some((q) => q.length)) {
        for (const q of Object.values(byCourse)) if (q.length) out.push(q.shift()!);
      }
      return out;
    }

And the trailer rendered at the foot of the saga lesson, computed from the tag map rather than authored by hand:

    Idempotency comes back in: Idempotency Key Pattern (#7), Webhook Security & Retry (#8),
    Outbox Pattern (#14). You will see this saga's charge step again in 3 days.
```

**Why it makes them feel knowledgeable**

Spacing and interleaving are the two most robust findings in the retention literature and both are currently at zero: every lesson is read once, in a block, inside its own course. The second encounter three days later is where knowledge stops being a memory of reading and becomes something the reader can produce on demand — and the interleaved ordering builds the discrimination skill (is this an idempotency problem or a locking problem?) that blocked study actively suppresses. There is also a motivational effect that matters for a paid product: a due count and a visible box distribution are evidence of accumulation, which is the concrete form of 'I genuinely know this', as opposed to a progress bar that only counts pages turned.

**Risk**

Worthless before proposals 1 or 4 exist — it has no deck of its own. localStorage is per-browser and silently lost on clear/incognito, so the store must survive an empty read and the UI must never imply the streak is durable; add JSON export/import so a motivated learner can carry their schedule (and a mentor can see it). Watch bundle size if all three item kinds ship. Do not gamify beyond the due count — streak pressure converts retrieval practice into card-clearing.

### 01.6 Ship It · effort L

**One capstone per course: a realistic multi-lesson deliverable with a three-level self-scoring rubric, a reference walkthrough that unlocks only after you score yourself, and an exportable markdown review packet.**

**What changes**

CONTENT: 23 new files at `content/capstones/<course-slug>.md` with their own shape — `## The Brief` / `## Constraints` / `## What to Hand In` / `## Rubric` (a ```rubric fence: criteria x three levels, each level a falsifiable description) / `## Reference Walkthrough` (how an experienced engineer would have approached it, including the two or three judgment calls with no single right answer). MANIFEST: `CourseManifestSchema` in course_content.manifest.ts gains optional `capstone: { file, title, lessonIds: number[] }`, zod-validated. SERVICE: `getCapstone(courseSlug)`. ROUTES: `app/courses/[courseSlug]/capstone/page.tsx`; a prominent card at the top of CourseOverviewPage.tsx; a line at the foot of each participating lesson ('this feeds capstone step 3'). UI: new `modules/course_content/ui/interactive/RubricCard.tsx` ('use client') — the Reference Walkthrough renders but is visually sealed until every rubric row has a self-score, then unseals with a diff-style 'you scored yourself 2 here, read this'; plus an Export button producing a markdown file (self-scores, notes, timestamps) via a Blob download for a mentor or manager to review. STATE: `learn:v1:capstone:<slug>`.

**Example snippet**

````
content/capstones/distributed-systems-api-design.md — spanning lessons 3 (saga), 4 (circuit breaker/retry), 7 (idempotency), 8 (webhooks), 14 (outbox), which are five unconnected pages today.

    # Capstone — Onboarding That Survives a Stripe Timeout

    ## The Brief
    You have a four-step tenant onboarding: create tenant → charge card → allocate seats →
    send welcome email. Build it so every one of these produces a correct end state, and so
    you can say which one you are in from a log line alone:

      1. The charge is declined.
      2. The charge request times out, and Stripe committed it anyway.
      3. The worker is SIGKILLed between charging and recording the charge id.
      4. Seat allocation fails, the refund is issued, and the refund call times out too.
      5. Stripe delivers the same `charge.succeeded` webhook four times over ten minutes.

    ## What to Hand In
    - The orchestrator, running, against Stripe test mode.
    - A script that forces each of the five scenarios. Scenario 3 must be a real `kill -9`.
    - The log output of all five runs, with the saga id greppable through every line.
    - Five sentences: for each scenario, the end state and the evidence you would show finance.

    ## Rubric
    ```rubric
    - criterion: "Ambiguous charge outcome (scenario 2)"
      levels:
        - level: 1
          text: "A bare catch. Tenant deleted, customer charged, no refund. This is the default
                 outcome and it is why the capstone exists."
        - level: 2
          text: "Timeout is distinguished from decline and the saga stops in a NEEDS_REVIEW state
                 with the payment intent id recorded. A human resolves it."
        - level: 3
          text: "A VERIFY_CHARGE step re-queries Stripe by idempotency key and resumes or
                 compensates automatically. Verification is itself retried with backoff and gives
                 up into NEEDS_REVIEW after a bounded number of attempts."
    - criterion: "Compensation failure (scenario 4)"
      levels:
        - level: 1
          text: "refundCharge throws, BullMQ retries it, the customer is refunded twice."
        - level: 2
          text: "The refund carries an idempotency key, so retries are safe."
        - level: 3
          text: "Refund is idempotent AND the saga classifies its steps compensatable / pivot /
                 retriable, so it knows which failures may be retried forever and which must
                 stop and page a human."
    - criterion: "Evidence"
      levels:
        - level: 1
          text: "console.log without the saga id — you cannot reconstruct a single run."
        - level: 2
          text: "Every line carries sagaId and step; one grep reconstructs a run."
        - level: 3
          text: "A one-command query answers 'what is the system doing right now for tenant X',
                 which is the sentence the lesson opened with."
    ```
````

**Why it makes them feel knowledgeable**

Transfer requires applying knowledge in a novel context under constraints the lesson did not pre-solve, and nothing in the current 412 lessons asks for that even once — so the ceiling is recognition. A capstone is also the only place the corpus's most-missing content (the ambiguous-outcome case) can be taught at all, because that case cannot be explained, only survived. The sealed-until-scored walkthrough is what makes it a feedback loop rather than an assignment: the reader commits to a self-assessment first, then discovers where an experienced engineer would have disagreed, and the delta between those two is the most information-dense moment available without a human grader. And the exported packet is the artifact — what an intern actually shows a manager is 'I built the thing that survives a Stripe timeout', not 'I completed 18 lessons'.

**Risk**

Only 23 units, but each is genuine work — a bad capstone (vague brief, rubric levels that are adjectives) is transparently filler and damages the product more than having none. Rubric levels must be falsifiable behaviours, never quality words. Completion rate will be low compared to reading, which is fine and should not be treated as a funnel problem; a 'Level 1 in 30 minutes' reduced version per capstone raises the floor. The business courses need a different deliverable shape — a filled-in artifact (a real quoted proposal for a described client, with the numbers reconciling) rather than running code.

### 01.7 Prereq and Callback Graph · effort M

**Make the corpus's ~127 dead '#NN' references real links, add authored prerequisites and forward callbacks to the manifest, and fix the bracket-before-id sort that shreds the teaching order in 20 of 23 courses.**

**What changes**

MANIFEST: `ManifestItemSchema` in course_content.manifest.ts gains `order?: number` (authored sequence, defaults to id), `prerequisites?: Array<{course, id, why}>`, `callbacks?: Array<{course, id, note}>`. SERVICE: build a global `id -> {courseSlug, lessonSlug, title}` index once in course_content.service.ts; fix `getSidebarNavGroups` to sort by `order` and NOT bracket-first; same fix in CourseOverviewPage.tsx (keep the bracket badge, drop the bracket grouping — or keep grouping but preserve authored order within it). MARKDOWN: a small remark plugin in course_content.markdown.ts rewriting `(#16)`, `see #18` and `Lesson 41` in prose into real links via that index — this alone repairs the 14 explicit cross-course refs and ~113 bare ones, with zero content edits. UI: LessonPage.tsx gains a slim 'Before this' strip above the title (prerequisites plus a one-line reason) and a 'This comes back in' strip at the foot, both linking out. STATE: an unread prerequisite shows a soft nudge, never a lock. CI: a vitest test failing the build on any `#NN` that resolves to nothing, which also catches future authoring drift.

**Example snippet**

```
Two changes, both to material that already exists. First, content/courses/fundamentals-tools/121_sql_fundamentals.md line 4 currently reads:

    Everything from N+1 Query Problem (#16) to PostgreSQL MVCC (#41) assumes fluency with plain SQL

...where #16 lives in database-caching-performance and #41 in database-advanced, so a 0-1 bracket reader has literally no route to either — there is no search anywhere in app/ or modules/. After the remark plugin both render as links to /courses/database-caching-performance/n-plus-1-query-problem and /courses/database-advanced/postgresql-mvcc-vacuum-bloat-isolation, with no content edit at all.

Second, in content/courses/distributed-systems-api-design/manifest.json:

    {
      "id": 3,
      "order": 3,
      "file": "03_saga_pattern.md",
      "title": "Saga Pattern (Orchestration vs Choreography)",
      "bracket": "3-7",
      "category": "Distributed Systems & API Design",
      "prerequisites": [
        { "course": "distributed-systems-api-design", "id": 131,
          "why": "A saga is a queue topology before it is a pattern — pub/sub vs point-to-point first." },
        { "course": "distributed-systems-api-design", "id": 7,
          "why": "Every saga step must be idempotent. This lesson assumes you can already build that." }
      ],
      "callbacks": [
        { "course": "distributed-systems-api-design", "id": 14,
          "note": "The outbox is how the saga's state transition and its message become one atomic write." },
        { "course": "database-advanced", "id": 42,
          "note": "Seat allocation is where the saga meets optimistic locking — same failure, different layer." }
      ]
    }

Note the prerequisite pointing FORWARD to id 7, which the current bracket-then-id sort renders four positions later in the sidebar. Adding `order` is what lets the manifest say 'read 7 before 3' — today the UI actively prevents that from being expressible.
```

**Why it makes them feel knowledgeable**

Two mechanisms. Prior-knowledge activation: naming what a lesson assumes, with a one-line reason and a working link, is the difference between a reader who bounces off the saga lesson and one who arrives with the right schema loaded — and the current UI is worse than neutral, since bracket-first sorting opens business-finance-solo-ops on lesson 352 instead of the cash-flow lesson every later lesson depends on. Second, distributed re-encounter for free: 'idempotency comes back in #7, #8, #14' turns a terminal page into a node in a network, and meeting a concept again in three different problem contexts is what builds the transferable version rather than the memorised one. The felt effect is coherence — the reader stops experiencing 412 disconnected pages and starts experiencing a field with a shape, which is much of what 'genuinely knowledgeable' means.

**Risk**

The sort fix is a visible behaviour change on every course page and needs an explicit decision from the owner about whether brackets stay a grouping or become a badge only — do not ship it silently. Authoring prerequisites for 412 lessons is judgement work that resists automation (an LLM will happily invent plausible-but-wrong dependencies); cap at 2 prerequisites, allow zero, and require the `why` string so an empty relationship cannot be padded in. The `#NN` rewriter must not touch text inside code fences — reuse the parser's existing fence tracking. Never hard-lock a lesson behind an unread prerequisite; adults abandon gated content.

### 01.8 Two Doors · effort M

**Cross-lesson discrimination drills: six scenarios, pick which of three or four closely-related mechanisms applies, and the feedback names the single cue that distinguishes them.**

**What changes**

CONTENT: ~30-40 new files at `content/drills/<drill-slug>.md`, each keyed to 2-4 lesson ids across one or more courses, containing a ```drill fence: `lessons` and `scenarios[]` of `{text, answer, confusable_with, why}`. This is a NEW content type rather than a lesson section, so it needs its own small loader — `modules/course_content/course_content.drills.ts` (fs read + zod, mirroring course_content.manifest.ts) — and no parser changes. ROUTES: `app/(frontend)/drills/[drillSlug]/page.tsx` plus an index at `/drills`; a link block at the foot of each participating lesson ('Drill: at-least-once delivery — 4 lessons, 6 scenarios, ~5 min'). UI: new `modules/course_content/ui/interactive/DrillRunner.tsx` ('use client') — one scenario at a time, forced choice, immediate feedback, and a closing summary that reports WHICH confusion the reader has ('you picked distributed lock for two duplicate-delivery scenarios — the cue you are missing is whether the duplicate is concurrent or sequential') with a link to the specific lesson. STATE: `learn:v1:drills`; misses feed proposal 5's deck.

**Example snippet**

````
content/drills/at-least-once-delivery.md — drawing on distributed-systems-api-design lessons 04, 06, 07 and 14, which are four separate pages today with no relationship expressed anywhere in the repo.

    # Drill — Which Mechanism? (at-least-once delivery)

    ```drill
    lessons:
      - { course: distributed-systems-api-design, id: 4,  label: "Retry / circuit breaker" }
      - { course: distributed-systems-api-design, id: 6,  label: "Distributed lock" }
      - { course: distributed-systems-api-design, id: 7,  label: "Idempotency key" }
      - { course: distributed-systems-api-design, id: 14, label: "Outbox" }
    scenarios:
      - text: |
          Stripe delivers the same `charge.succeeded` webhook four times over ten minutes
          because your first 200 was slow enough to trip their timeout.
        answer: 7
        confusable_with: 6
        why: |
          Sequential duplicates of a completed operation. A lock would only make the later
          deliveries WAIT and then run anyway — it serializes, it does not deduplicate. The
          cue: you are being asked to recognise work already done, not to prevent two workers
          doing it at once.
      - text: |
          Two app instances both fire the nightly invoice run at 03:00 because both cron
          containers survived the deploy.
        answer: 6
        confusable_with: 7
        why: |
          Concurrent, and there is no shared key to deduplicate on — both runs are legitimately
          'the 03:00 run'. You need mutual exclusion. An idempotency key works IF you derive one
          from the date, which is the honest second-best answer and worth noticing.
      - text: |
          You COMMIT the order row, then the `orderPlaced` publish throws. The order exists and
          nothing downstream ever hears about it.
        answer: 14
        confusable_with: 4
        why: |
          Retry cannot help: the process that would retry may be gone, and the failure is the
          gap between two systems, not a flaky call. The cue is that the write already committed
          — the message has to be inside the same transaction as the row.
      - text: |
          A downstream pricing API starts returning 503 for 40% of calls and your p99 goes from
          200ms to 30s because every request is waiting on three retries.
        answer: 4
        confusable_with: 14
        why: |
          Retry is the cause here, not the cure. The cue is a live dependency degrading, so the
          mechanism you need is the one that stops calling: a breaker, plus a bounded retry with
          jitter rather than an unbounded one.
    ```
````

**Why it makes them feel knowledgeable**

This targets the tech-depth verdict's sharpest complaint directly — that a reader finishes unable to defend one choice over another with anything but an aesthetic argument. Discrimination between confusable concepts is not built by studying each thoroughly in its own block; it is built by interleaved forced-choice practice where the separating cue becomes salient, which is exactly why blocked study produces people who recognise all four patterns and can deploy none. The `confusable_with` field does the real work: the feedback does not merely confirm the answer, it names why the wrong one was attractive ('sequential versus concurrent', 'the write already committed'), and that named cue is what survives into a design review six months later. Per unit of authoring effort it is also the closest thing here to a senior-engineer interview simulator — and the moment a reader gets six of these right is the moment they feel like an engineer rather than a reader.

**Risk**

Needs proposal 7's cross-lesson index to be worth much, or the 'go back to lesson 6' link has nowhere to go. Scenario authoring is where quality lives or dies: every scenario must have exactly one defensible best answer with the second-best named honestly (see scenario 2, where the idempotency-key answer is genuinely arguable), because a contestable answer key with no acknowledgement destroys credibility faster than anything else in this set. Keep to 6 scenarios — 20 turns a discrimination drill into a quiz. Business courses need their own drills (fixed-price vs hourly vs retainer against the same described client) authored by someone with real engagement experience, not generated.
