# 84. Technical Interview Design — Asking and Evaluating

## What It Is
A technical interview is a structured evaluation process designed to predict how well a candidate will perform the specific work you need done. The key word is "predict" — a technical interview is not a hazing ritual, a quiz of obscure language features, or a test of whether someone can solve algorithmic puzzles under stress. It is a measurement instrument, and like all measurement instruments, it should be designed with a specific target in mind and validated against actual job performance.

Most self-designed technical interviews fail for one of two reasons: they test the wrong things (algorithmic puzzles that have nothing to do with the actual work), or they lack evaluation rubrics (the interviewer likes a candidate and cannot explain why). Both problems lead to bad hires, which cost more than the engineering salary of the candidate: onboarding cost, opportunity cost of work not done, and the cost of the eventual offboarding.

For a solo developer hiring a first contractor or full-time developer, the interview should be designed around the actual work the candidate will do, at the actual level of complexity they will encounter. This means: look at your codebase, pick three representative problems, design a home exercise or pair programming session around them, and build a rubric that lets you score the response consistently. The rubric is the differentiator — it separates "I liked them" from "they demonstrated X, Y, and Z at level N."

```quiz
- q: "Algorithm puzzle, or work sample?"
  anchor: "predicts job performance 3× better than algorithm puzzles"
  options:
    - text: "The algorithm puzzle — standardized, and easy to compare across candidates"
      correct: false
      why: "Comparability is what the structured format provides. Predictiveness is a different property."
    - text: "The work sample — a simplified version of actual work from your codebase"
      correct: true
      why: "The most predictive format there is, at roughly 3× the puzzle."
    - text: "Both, weighted equally"
      correct: false
      why: "Equal weight spends half the signal budget on the weaker predictor."

- q: "\"How would you implement X?\" or \"here is a broken X — what is wrong with it?\""
  anchor: "diagnosis reveals judgment better than synthesis under artificial conditions"
  options:
    - text: "The first — it shows how the candidate thinks from scratch"
      correct: false
      why: "Synthesis under artificial conditions is exactly the setting the lesson says reveals less."
    - text: "The second — diagnosis reveals judgement better"
      correct: true
      why: "A broken implementation gives the candidate something real to reason about."
    - text: "Neither is better; it depends on the seniority of the role"
      correct: false
      why: "The lesson states the ranking without a seniority carve-out."

- q: "Why should the person asking a question not also score it in real time?"
  anchor: "scoring while asking reduces question quality"
  options:
    - text: "Because it biases the score toward first impressions"
      correct: false
      why: "A real risk, but not the reason given here."
    - text: "Because scoring while asking degrades the questions themselves"
      correct: true
      why: "Separating the roles keeps the interviewer's attention on the question being asked."
    - text: "Because two independent scores are more reliable than one"
      correct: false
      why: "That is an argument for multiple scorers, not for splitting the two roles."
```

## Key Concepts
- **Job task analysis**: Start by listing the 5 most common tasks the hire will do; design your interview to sample those tasks directly
- **Work sample test**: The most predictive interview format — give the candidate a simplified version of actual work from your codebase; predicts job performance 3× better than algorithm puzzles
- **Structured interview**: All candidates get the same questions in the same order; reduces bias and makes comparisons valid
- **Evaluation rubric**: A scoring guide with specific observable behaviors at each level (1–4 or 1–5); prevents "vibe" decisions
- **Separation of roles in the interview**: The person who asks the question should not be the person scoring it in real-time — scoring while asking reduces question quality
- **Red flags vs. yellow flags**: A red flag (absolute disqualifier) versus a yellow flag (area to probe further, not automatic disqualifier) distinction prevents over-indexing on one weak answer
- **Practical vs. theoretical questions**: "How would you implement X?" tells you less than "here is a broken implementation of X — what's wrong with it?" — diagnosis reveals judgment better than synthesis under artificial conditions
- **Candidate experience**: A candidate who has a poor interview experience, even if they decline or are rejected, has an experience that affects your employer brand; treat every candidate as a potential referral

## Example Code or Template

```markdown
# Technical Interview Rubric — Full-Stack TypeScript / Next.js Role

## Role Context
[2 sentences about the role, the team context, and what success looks like
in the first 90 days]

---

## Interview Structure

| Stage        | Format          | Duration | What it evaluates              |
|--------------|-----------------|----------|--------------------------------|
| Screening    | Async take-home | 90 min   | Baseline code quality, problem-solving |
| Live session | Pair programming| 60 min   | Collaboration, communication, adaptability |
| Culture fit  | Conversation    | 30 min   | Values, work style, questions they ask |

---

## Take-Home Exercise Brief

> "Here is a simplified version of a module from our codebase.
> It has one bug, one performance issue, and one missing edge case.
> Please fix the bug, address the performance issue, and add handling
> for the missing case. Add any tests you think are appropriate.
> Time limit: 90 minutes. We care more about your reasoning than
> completeness — leave a comment where you ran out of time."

[Attach the actual code file — a real but de-identified module from your project]

---

## Evaluation Rubric — Take-Home

### Criterion 1: Bug Identification and Fix (25 points)

| Score | Observable Behavior |
|-------|---------------------|
| 25    | Correctly identifies root cause, fixes it, and adds a test that would have caught it |
| 20    | Correctly identifies and fixes the bug, no test added |
| 15    | Fixes a symptom of the bug but not the root cause |
| 10    | Identifies the bug but fix introduces a new problem |
| 0     | Does not identify or fix the bug |

### Criterion 2: Performance Issue (25 points)

| Score | Observable Behavior |
|-------|---------------------|
| 25    | Identifies the N+1 / missing index / unbounded loop, fixes it, explains the tradeoff |
| 20    | Identifies and fixes the issue without explanation |
| 15    | Identifies the issue but fix is incomplete or incorrect |
| 5     | Notes that performance "could be improved" without specifics |
| 0     | No mention of performance |

### Criterion 3: Edge Case Handling (25 points)

| Score | Observable Behavior |
|-------|---------------------|
| 25    | Handles the expected case plus identifies one additional edge case not mentioned |
| 20    | Handles the expected edge case correctly with test |
| 15    | Handles the case but handling is incomplete (e.g., no error message, silent failure) |
| 5     | Mentions the edge case in a comment but does not handle it |
| 0     | Does not address the edge case |

### Criterion 4: Code Quality and Communication (25 points)

| Score | Observable Behavior |
|-------|---------------------|
| 25    | Code is clean, idiomatic TypeScript; comments explain non-obvious decisions; README or inline note explains time constraints |
| 20    | Code is functional and readable; minimal documentation |
| 15    | Code works but has noticeable style issues or unclear naming |
| 5     | Code is functional but difficult to understand or maintain |
| 0     | Code does not run |

---

## Red Flags (automatic second review required)
- [ ] Evidence of copy-pasted LLM output without understanding (ask them to walk through it live)
- [ ] Fix that works but destroys the existing test suite
- [ ] No error handling in a function that clearly touches external I/O

## Yellow Flags (probe in live session)
- [ ] Used a different approach than expected — understand why before scoring down
- [ ] Tests are present but test implementation rather than behavior
- [ ] Performance fix is correct but over-engineered for the problem size
```

## When to Use
- Before posting any job or contractor listing — design the rubric first, so you are hiring against criteria, not intuition
- When a candidate seems strong in conversation but you cannot articulate why — if you cannot map your impression to rubric criteria, you do not have enough signal
- When reviewing contractor output after a few weeks — compare what you see to the rubric criteria from the interview; if there is a gap, the interview failed to predict performance in that area and should be updated
- When a client asks you to help them hire a developer (a natural extension of your consulting work) — a rubric-based interview process is a deliverable that demonstrates consulting depth
- After any hire that does not work out — root-cause the interview: which rubric criterion did they pass that predicted the failure? Update accordingly

## Common Mistakes
- **Testing trivia instead of judgment**: "What does `typeof null === 'object'` return?" tests memorization; "here is a function that uses `typeof` to check types — is there a bug?" tests the same knowledge through applied reasoning, which is what you need on the job
- **No rubric, pure intuition**: Without a rubric, interviewers consistently prefer candidates who are similar to themselves (affinity bias), confident talkers over careful thinkers, and people who use familiar frameworks; a rubric does not eliminate bias but it constrains it
- **Live coding under pressure as the primary signal**: Some developers perform very poorly in live coding under observation but perform very well given a reasonable time window; a take-home with a live walkthrough gives you signal about the work without filtering for stress-tolerance specifically
- **Not giving candidates time to ask questions**: A candidate who asks sharp, specific questions about your architecture or workflow is demonstrating curiosity and due diligence; a candidate who has no questions either did no research or has no standards — both are signal

## Further Reading
- **"Work Rules!" — Laszlo Bock (Google's former SVP of People Operations)** — Includes Google's research on what actually predicts job performance versus what interviews typically measure; the chapter on structured interviews is directly applicable
- **"The Effective Hiring Manager" — Mark Horstman** — Practical guide to designing work sample tests and evaluation rubrics for technical and non-technical roles
- **"Hiring Engineers" — Gergely Orosz (Pragmatic Engineer)** — Industry-level breakdown of how top engineering teams design interviews, with worked examples from companies whose bar you can calibrate against

```recall
- q: "Where does interview design start?"
  must:
    - "job task analysis — list the 5 most common tasks the hire will do"
    - "design the interview to sample those tasks directly"

- q: "What makes an interview structured, and what does that buy?"
  must:
    - "all candidates get the same questions in the same order"
    - "it reduces bias"
    - "it makes comparisons valid"

- q: "What is an evaluation rubric, and what does it prevent?"
  must:
    - "a scoring guide with specific observable behaviors at each level, 1-4 or 1-5"
    - "it prevents \"vibe\" decisions"

- q: "Distinguish red flags from yellow flags."
  must:
    - "a red flag is an absolute disqualifier"
    - "a yellow flag is an area to probe further, not an automatic disqualifier"
    - "the distinction prevents over-indexing on one weak answer"
```
