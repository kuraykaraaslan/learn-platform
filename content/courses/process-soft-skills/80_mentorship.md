# 80. Mentorship — Pair Programming Structure, Junior Guidance

## What It Is
Mentorship in a software context is the practice of deliberately accelerating another developer's growth through structured interaction — pair programming, code review feedback, guided problem-solving, and career conversation. It is distinct from management (which focuses on outcomes and accountability) and from teaching (which is one-directional). Mentorship is interactive and iterative: you help someone develop their own judgment, not just their ability to follow your instructions.

The most concrete mentorship tool is pair programming. Done well, pairing is not two people writing code together — it is a structured skill transfer. In the "driver-navigator" model, one person writes code (driver) while the other thinks about the broader approach and catches mistakes (navigator). The roles switch regularly. For mentorship purposes, the junior developer is usually the driver: they write the code while you narrate your thinking as the navigator. This forces them to translate your reasoning into working code, which is far more effective than watching you write it yourself.

For a solo developer hiring their first contractor or junior developer, the transition to mentorship is a real leverage shift. You stop doing the work and start multiplying your capacity. The pitfall is doing it poorly: jumping in and rewriting rather than guiding, giving answers instead of asking questions, skipping the pairing entirely and just reviewing the output. The investment in structured mentorship pays back in code quality, in fewer revision cycles, and in contractors who can take on increasing responsibility rather than requiring supervision on every task.

## Key Concepts
- **Driver-navigator pairing**: Driver writes code, navigator thinks strategically and guides — roles switch every 15–25 minutes
- **Pomodoro pairing**: Pair for 25 minutes, take a 5-minute break, switch driver — reduces fatigue and keeps both people engaged
- **Teaching by asking, not telling**: "What would happen if this input were null?" is more effective than "You need to handle null here" — it builds judgment, not just compliance
- **The 5-minute rule**: Before giving an answer, give the mentee 5 minutes to try it themselves; the struggle is where learning happens
- **Growth edge identification**: Understand what skill the mentee is working on developing and focus pairing sessions on that edge specifically
- **Feedback structure (SBI model)**: Situation, Behavior, Impact — "In this PR [S], I noticed you did not validate the input before the database call [B], which could allow injection if the client sends malformed data [I]"
- **Pairing anti-patterns**: Keyboard takeover, completing their sentences, not explaining rationale, treating pairing as code review in disguise
- **Async mentorship**: Code review comments written as questions and explanations (not just corrections) are mentorship; Loom walkthroughs of your own code decisions are mentorship

## Example Code or Template

```template
# Pairing Session Plan

## Session Info
**Date**: YYYY-MM-DD
**Duration**: [45 min | 60 min | 90 min]
**Mentee**: [Name]
**Mentee's current level**: [Junior | Mid | Senior in specific area]
**Navigator/Mentor**: [Your name]

---

## Session Goal
One specific, completable outcome:
> "By the end of this session, [mentee] will have implemented the
> tenant-scoped data isolation pattern independently in the
> notification module."

---

## Pre-Session Prep (Mentor)
- [ ] Identify the growth edge this session targets (e.g., "understanding
      why tenant isolation must happen at the query layer, not the application layer")
- [ ] Prepare one leading question to open the session:
      > "[Question that reveals the gap without giving the answer]"
- [ ] Identify the "floor" — the minimum they must accomplish for the session to be valuable
- [ ] Identify the "ceiling" — the stretch goal if they move faster than expected

---

## Session Structure

### Opening (5 min)
- Recap what was built last session
- State the goal for this session
- Ask mentee to explain their current understanding of the problem
  (listen for misunderstandings before they write a line of code)

### Work Block 1 (20–25 min) — Mentee drives
- Mentee shares screen, you navigate
- Your job: ask questions, point to documentation, catch blockers early
- Do NOT touch the keyboard unless asked or unless there is a genuine blocker
- Narrate your own thinking when relevant: "The reason I'd check for null
  here is because this value comes from user input — here's how I think
  about trust boundaries..."

### Switch (1 min)
- Swap driver/navigator roles

### Work Block 2 (20–25 min) — You drive (optional for advanced pairing)
- You write, mentee navigates
- Ask mentee to catch your "mistakes" (you can plant one intentionally)
- Explain decisions as you make them

### Closing (5–10 min)
- What did the mentee learn? (ask them to state it, not you)
- What would they do differently next time?
- Note one thing they did well — specific behavior, not generic praise
- Assign one follow-up task they can complete independently before next session

---

## Post-Session Notes (Mentor fills out within 1 hour)
- **What the mentee grasped quickly**:
- **Where they got stuck**:
- **Growth edge update**: Is this still the right edge, or should we shift focus?
- **Next session goal**:
```

## When to Use
- When onboarding a contractor to your codebase — a single pairing session on the tenant isolation pattern saves weeks of back-and-forth review cycles
- When a junior developer's PRs consistently have the same category of issue — pairing on that specific issue is more effective than repeated review comments
- When you are the most senior technical person a client's team has access to — even an hour of guided pairing per week has significant leverage
- When a client asks you to "review and mentor" their in-house developer as part of a retainer engagement — having a structured format signals professionalism
- When you are learning something new yourself — pairing with someone more experienced (reverse mentorship) is one of the fastest ways to onboard to an unfamiliar area

## Common Mistakes
- **Taking over the keyboard**: The moment you take over, the mentee stops thinking and starts watching — every takeover is a missed learning opportunity; if you must show something, narrate every keystroke
- **Mentoring on output, not thinking**: "Here's the correct code" teaches the answer; "What question should we ask before writing any code?" teaches the process; only one of these scales
- **No follow-up task**: A pairing session without a concrete independent task to complete before the next session means you will redo the same teaching next session — the follow-up task is what converts pairing into retained skill
- **Confusing mentorship with management**: Mentorship is about the mentee's growth; management is about task completion — mixing the two creates sessions where you're really just supervising work, not teaching, and the mentee makes no lasting progress

## Further Reading
- **"The Coaching Habit" — Michael Bungay Stanier** — Seven questions that make you a better mentor in any context; the "What's the real challenge here for you?" question alone transforms how you approach junior developer guidance
- **"Pair Programming Illuminated" — Laurie Williams and Robert Kessler** — The foundational academic text on pair programming; includes empirical data on its effectiveness and practical guidance on making it work
- [**"Being Glue" — Tanya Reilly](https://noidea.dog/glue)** — A talk and essay about the non-coding work that holds teams together; relevant when you are the senior person deciding how to invest mentorship time
