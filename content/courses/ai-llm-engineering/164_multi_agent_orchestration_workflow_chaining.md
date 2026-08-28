# 164. Multi-Agent Orchestration and Workflow Chaining

## What It Is
A single agentic loop — one model, one system prompt, looping over tool calls until it produces a final answer — is a fundamentally different shape from multi-agent orchestration, where several distinct agents, each with its own narrow scope, its own system prompt, and often its own model tier, are chained together to complete a larger process. The distinction matters because the failure modes are different: a single agent's loop can get stuck or misuse a tool, but a chain of agents can additionally suffer from a bad handoff, where one agent's output doesn't actually give the next agent what it needs, or two agents disagree about what state the artifact is in. Treat the boundary between agents as an explicit contract — the complete, validated output of stage N is the entire input to stage N+1 — rather than a shared mutable context both stages read and write, which is exactly the kind of implicit coupling that makes a chain unpredictable as it grows.

Model tier assignment is where multi-agent design connects directly back to single-call model selection, except now the decision is made per stage instead of once for the whole feature. A triage or classification stage that's early in the chain and produces a small structured decision is frequently a strong Haiku candidate, while a synthesis, drafting, or risk-review stage further downstream — the kind of work where a missed nuance actually costs something — can justify Sonnet or Opus. Applying one expensive tier uniformly across every stage "to be safe" is the multi-agent version of the same mistake single-call model selection warns against: paying premium latency and cost for stages that never needed it. Document the model choice per agent stage the same way you would for any single call, because six months from now the reason a triage stage runs on a cheap model and a review stage doesn't should be legible from a comment, not reconstructed from memory.

Sequencing discipline is what keeps a chain reliable in practice. Never run two agents against the same artifact concurrently — a code-review agent and a test-writer agent operating on the same diff in parallel will produce conflicting, unreconcilable outputs, because neither has seen the other's changes. Chain sequentially instead, and validate the output at every stage boundary, not only at the final one, since an unvalidated intermediate handoff is where a schema drift or a hallucinated field quietly corrupts everything downstream of it. The untrusted-content posture from prompt injection defense doesn't stop applying after the first stage, either: if any stage in the chain ingests external content (an email, a scraped document, a user-supplied file), every subsequent stage that touches the output of that stage inherits the same injection risk, so "context, not commands" has to be part of every stage's instructions that touches external input, not just the entry point's. And workflow definitions — the system prompt or operating procedure for a given stage — should be revised only after a pattern of repeated failures, three or more similar breakdowns, not after a single anomalous run; overfitting a shared workflow file to one bad output makes it worse for every other case that was already working.

## Key Concepts
- **Single-agent loop vs. multi-agent orchestration**: one model looping over tools to finish one task, versus multiple distinct agents — each scoped, prompted, and often modeled separately — chained to complete a larger process
- **Explicit handoff contract between stages**: stage N's complete, validated output is stage N+1's entire input — not a shared mutable context both stages read and write
- **Model tier assigned per stage, not per pipeline**: a cheap tier for early triage/classification stages, a stronger tier reserved for the stages where a missed nuance has real cost
- **Document the model choice per agent**, same discipline as a single-call model decision — auditable later, not reconstructed from memory
- **Never run two agents on the same artifact concurrently**: sequential chaining avoids irreconcilable conflicting edits or verdicts
- **Validate at every stage boundary, not just the final one**: an unvalidated intermediate handoff is where schema drift or a hallucinated field silently corrupts everything downstream
- **Untrusted-content posture applies at every stage that touches external input**: injection risk isn't confined to the entry point of the chain
- **Revise a shared workflow only after a pattern of failures (3+), never after one bad run** — a single-case fix tends to overfit and degrade the cases that were already working

## Example Code
```typescript
import { z } from 'zod';

const ClassificationOutput = z.object({ category: z.enum(['bug', 'feature', 'question']), confidence: z.number() });
const DraftOutput = z.object({ draft: z.string().min(1) });
const ReviewOutput = z.object({ verdict: z.enum(['approve', 'revise']), notes: z.string() });

// Each stage: its own model tier, its own scoped system prompt, validated output
async function classifyStage(ticketText: string) {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5', // cheap — small structured decision, high volume
    max_tokens: 50,
    system: CLASSIFY_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `<ticket>\n${ticketText}\n</ticket>` }],
  });
  return ClassificationOutput.parse(JSON.parse(extractText(response)));
}

async function draftStage(ticketText: string, category: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5', // open-ended generation — the default tier
    max_tokens: 500,
    system: DRAFT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `<ticket category="${category}">\n${ticketText}\n</ticket>` }],
  });
  return DraftOutput.parse(JSON.parse(extractText(response)));
}

async function reviewStage(draft: string) {
  const response = await anthropic.messages.create({
    model: 'claude-opus-5', // highest stakes stage — a missed issue here reaches the customer
    max_tokens: 300,
    system: REVIEW_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: `<draft>\n${draft}\n</draft>` }],
  });
  return ReviewOutput.parse(JSON.parse(extractText(response)));
}

// Sequential chain — never parallel, each stage validated before the next runs
export async function runSupportReplyChain(ticketText: string) {
  const classification = await classifyStage(ticketText); // stage 1 output is fully validated...
  const draft = await draftStage(ticketText, classification.category); // ...before stage 2 ever sees it
  const review = await reviewStage(draft.draft);

  if (review.verdict === 'revise') {
    throw new AppError(`Draft failed review: ${review.notes}`, 422); // do not hand off a rejected artifact
  }
  return { category: classification.category, reply: draft.draft };
}
```

## When to Use
- A business process naturally decomposes into distinct stages (triage, draft, review, finalize) where each stage has a different scope and reasoning demand
- A single system prompt has grown to try to handle several unrelated jobs at once and quality has degraded — splitting into focused, chained agents is often the fix
- Different stages of a process have genuinely different cost/latency/quality requirements that a single model tier can't serve well simultaneously
- Building any workflow where one stage's output must be independently verifiable before the next stage acts on it

## Common Mistakes
- **Two agents work on the same document at the same time, and their outputs need reconciling afterward** — Running two agents against the same document or artifact in parallel and attempting to reconcile conflicting outputs afterward
- **Every stage in a multi-step chain uses the same expensive model tier, including the simple ones** — Using one expensive model tier uniformly across every stage in a chain instead of matching tier to each stage's actual reasoning demand
- **A chain validates its final output only, trusting every handoff in between** — Validating only the chain's final output and treating intermediate handoffs as trusted, letting a schema drift or hallucination three stages back corrupt everything after it
- **Only the first stage that reads external input gets prompt-injection defenses** — Applying the untrusted-content/prompt-injection posture only to the first stage that ingests external input, forgetting that every later stage touching its output inherits the same risk
- **A shared workflow prompt gets rewritten right after one unusual failure case shows up** — Rewriting a shared workflow prompt after a single unusual failure, degrading it for the broader set of cases it was already handling correctly

## Further Reading
- Anthropic — "Building effective agents" (the prompt-chaining and orchestrator-worker patterns, directly applicable to this lesson)
- Anthropic engineering blog — "How we built our multi-agent research system"
- Chip Huyen, "AI Engineering" (O'Reilly) — chapter on compound AI systems and multi-agent pipeline design
