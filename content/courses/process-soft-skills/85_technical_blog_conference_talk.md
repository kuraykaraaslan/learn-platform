# 85. Technical Blog / Conference Talk — Structuring Your Thoughts

## What It Is
A technical blog post or conference talk is a piece of public writing or speaking that transfers a specific, hard-won insight from your brain to someone else's, in a form they can act on. The key word is "specific." The most effective technical content is not "here is everything I know about multi-tenant SaaS" — it is "here is the one mistake I kept making with row-level security and how I finally stopped making it." Specificity is what makes content findable, shareable, and memorable.

For developers who have never written publicly, the biggest obstacle is the belief that the topic must be novel. It does not. Most technical writing that gets traction is not breaking new ground — it is making existing knowledge more accessible, showing a specific application of a known technique to an uncommon problem, or documenting a solution that everyone struggles with but nobody has written up clearly. The specific intersection you work at is almost always more unusual than it feels from the inside: a stack combination, an industry constraint, a migration you survived, a tool used against its intended grain. Writing from that intersection is differentiated without needing a novel idea.

Conference talks are structured technical writing plus delivery. The structural difference is that a talk must be consumable in real time without the ability to re-read, so it requires more repetition, clearer signposting, and a stronger narrative arc than a blog post. Both formats share the same underlying structure: a problem the audience recognizes, the path to a solution, the solution itself with enough detail to be actionable, and the implications of that solution. The formats differ in density and delivery, not in substance.

## Key Concepts
- **The "one insight" rule**: Every post or talk should be built around one transferable insight; if you cannot state it in one sentence, the content is not focused enough yet
- **The audience's existing belief**: The most engaging content starts by acknowledging a widespread belief and then complicating or overturning it ("Everyone says to use Row-Level Security for multi-tenancy — here is when that advice fails")
- **The problem-solution arc**: Problem (audience recognizes it) → failed approaches (audience has tried these) → insight (the turning point) → solution (actionable) → implications (what to do next)
- **Technical depth as a differentiator**: Shallow "intro to X" posts are commoditized; specific deep posts ("how I debugged a 10× slowdown in PostgreSQL tenant queries") have long-tail SEO value and attract senior readers
- **Code samples as proof, not decoration**: Code in a technical post should demonstrate the specific point being made; not generic boilerplate that pads the post
- **The "curse of knowledge"**: The more you know a topic, the harder it is to remember what it was like not to know it; fight this by writing for "past you" — the person you were six months before you learned this
- **Talk structure vs. post structure**: Talks need a strong opening hook (the first 60 seconds determines whether the audience mentally checks in), repetition of key points, and a memorable closing; posts can be more dense because readers can pause and re-read
- **Publishing cadence over perfection**: One post published beats ten posts in drafts; write a draft, let it sit for 24 hours, cut 20% of it, publish it

## Example Code or Template

```markdown
# Blog Post Structure Template

## Pre-Writing: The "One Insight" Test
State your core insight in one sentence before writing anything else.
If you cannot do this, you do not have a post yet — you have notes.

> "The insight I'm sharing is: ______________________________________"

---

## Post Structure

### 1. The Hook (100–200 words)
Open with the problem, not with context about yourself or the topic.
The reader should think "yes, that's exactly what I'm struggling with" 
within the first paragraph.

Bad hook: "In this post I'm going to explain how multi-tenant SaaS works."
Good hook: "Your PostgreSQL query is fast in development and returns in 800ms
            in production. You've checked your indexes. You've run EXPLAIN ANALYZE.
            And then you notice: every query is missing the tenant filter."

### 2. Why the Obvious Solution Fails (200–400 words)
Acknowledge the approach the reader has probably tried.
Explain specifically why it fails or where it breaks down.
This builds credibility: you have been where they are.

### 3. The Insight (100–200 words)
State the key insight clearly and directly. Do not bury it.
This is the turning point of the post.

### 4. The Solution (400–800 words)
Step-by-step. Concrete. Code where it helps. 
Write for "I just want to implement this" — the reader who wants the
theory can look it up; the reader who wants to solve the problem right now
is who you are writing for.

### 5. The Edge Cases / Gotchas (200–400 words)
What would bite the reader if they implemented the solution as described
without this section? This is where experienced writers differentiate from
beginners — the gotchas show that you have actually implemented this.

### 6. The Takeaway (50–100 words)
Restate the insight in light of everything the reader just learned.
End with one action the reader can take right now.

---

## Conference Talk Outline (20-minute format)

### Opening (2 min): The Unexpected Claim
State something the audience probably believes, then tell them you are going
to show them why it is wrong or incomplete. This creates tension that sustains
attention for 20 minutes.

### Setup (4 min): Establish Stakes
Why does this matter? What goes wrong if the audience does not know this?
Use a concrete failure story — your own, not a hypothetical.

### The Core (10 min): The Solution
Walk through your insight with enough specificity to be actionable.
Include a code walkthrough or live demo for technical talks.
Repeat the key point three times in three different framings.

### Implications (3 min): What Changes Now
What should the audience do differently starting today?
Specific, achievable actions.

### Close (1 min): One Sentence
End with the one sentence you want people to tweet or repeat to a colleague.
Make it memorable and self-contained.

---

## Topic Mining from Your Own Work
Questions to find publishable insights in work you have already done:

1. What was the hardest bug you fixed this year? What made it hard?
2. What decision did you make that you would make differently now?
3. What question do clients or junior developers always ask you?
4. What does your tech stack do that most tutorials get wrong?
5. What would you have wanted to read before starting your current project?
```

## When to Use
- When you have just solved a hard problem — capture it within 48 hours before the "curse of knowledge" sets in and you forget what was actually hard about it
- When a client asks you to explain something for the third time — that explanation is a blog post waiting to be written; write it once, share it many times
- When building your developer brand for client acquisition — a portfolio of specific, deep technical posts is more credible to technical buyers than a LinkedIn summary
- When applying for speaking slots at conferences — start with local meetups or virtual conference lightning talks (10 minutes) before targeting full 45-minute slots
- When your LinkedIn content is getting engagement — a technical post with a link to a deep blog post converts better than LinkedIn-only content because it demonstrates depth

## Common Mistakes
- **Writing for everyone**: A post about "how Next.js works" has infinite competition; a post about "how to isolate tenant data in Next.js server actions without leaking across requests" has almost none — specificity is your competitive advantage
- **Waiting until you are an expert**: The best time to write about learning something is while you are learning it — "here is what I got wrong the first three times I implemented webhook idempotency" is more useful than "here is a comprehensive guide to webhook idempotency"
- **Skipping the editing pass**: Most first drafts are 30% longer than they need to be; the editing pass (specifically: cut everything that does not directly support the one insight) is what makes posts readable
- **No call to action**: A post that ends without telling the reader what to do next is a dead end; even "let me know if this helped" or "here's the GitHub repo" creates engagement

## Further Reading
- [Josh Comeau](https://www.joshwcomeau.com/) — his posts on writing and on interactive explanation are the model worth studying, more than any guide about writing
- **"The Presentation Secrets of Steve Jobs" — Carmine Gallo** — Despite the title, applicable to any technical talk; covers narrative structure, the opening hook, and how to make technical content memorable
- **"Show Your Work!" — Austin Kleon** — Short, motivating book about the value of publishing work-in-progress; directly addresses the "I'm not expert enough to publish" mental block
