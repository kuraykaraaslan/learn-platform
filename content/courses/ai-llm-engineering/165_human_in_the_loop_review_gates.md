# 165. Human-in-the-Loop Review Gates and Structured Verdicts

## What It Is
When an AI system's output feeds into a consequential decision — merging code, signing a contract, sending a final invoice, publishing generated content — a paragraph of freeform commentary is the wrong output shape, no matter how well-written it is, because a human reading prose has to reconstruct the actual verdict and can miss what the model actually flagged. The fix is to make the model produce a structured, closed-vocabulary verdict instead: a fixed set of categories, each rated independently against named criteria (PASS/WARN/FAIL, HIGH/MEDIUM/LOW, GO/NO-GO), rolled up into one overall verdict that follows deterministically from the category results. This is what turns "an AI reviewed this" into something a human can actually audit in ten seconds by scanning a table, rather than something they have to trust on faith because untangling free text back into a decision is more work than doing the review themselves.

A structured verdict is only trustworthy if every negative finding is backed by a concrete citation — a file and line number, a quoted contract clause, a specific named item that's missing — not a vague impression like "this seems risky." Citations are what let a human spot-check the review without redoing all of it, and they're what stop the AI from padding a report with confident-sounding but unfounded flags. The closed vocabulary earns its keep over time, too: because PASS/WARN/FAIL is a fixed enum, you can track a FAIL rate per category across weeks or months and notice a category quietly getting worse — a trend a paragraph-based review could never surface, because there's nothing to aggregate. This is the same reasoning behind evals treating output as scored properties rather than freeform judgments; a review gate is really an eval applied to a single artifact instead of a batch.

The gate only works, though, if it's actually a gate — three properties have to hold structurally, not just as guidance in the prompt. First, a blocking verdict (FAIL, HIGH risk, NO-GO) must never be auto-approved by the surrounding system; only an explicit, logged human override should be able to proceed past it. Second, the reviewing agent must never itself execute the consequential action it's reviewing — a code-review agent flags issues, it doesn't merge the PR; a delivery-audit agent reports GO/NO-GO, it doesn't send the invoice — because collapsing the reviewer and the actor into one call removes the entire point of having a gate. Third, the agent's own operating instructions must explicitly forbid marking anything as passing "based on assumption" when the underlying evidence wasn't actually checked, and must require every category in scope to be reviewed rather than silently skipped for being tedious — a review that quietly skips a section and still reports an overall PASS is worse than admitting no review happened, because it manufactures false confidence exactly where a human stopped looking.

## Key Concepts
- **Structured, closed-vocabulary verdict over freeform prose**: fixed categories rated against named criteria (PASS/WARN/FAIL, HIGH/MED/LOW, GO/NO-GO), rolled up into one deterministic overall verdict
- **Every negative finding needs a concrete citation**: a file/line, a quoted clause, a named missing item — never a vague "this seems risky" with nothing to check it against
- **Closed vocabulary enables trend tracking**: an escalating FAIL rate in one category across weeks is a real signal a freeform review can't produce
- **The gate must be a structural gate, not just a prompt instruction**: no automatic proceed past a blocking verdict — only an explicit, logged human override advances past it
- **The reviewing agent never executes the action it reviews**: a review/audit agent flags or reports; it never merges, sends, signs, or publishes on its own output
- **Forbid "pass based on assumption" explicitly in the agent's instructions**: an item that wasn't actually verified must be marked unverified, never marked passing
- **Every in-scope category must be reviewed, none silently skipped**: a partial review reported as a full PASS creates false confidence exactly where nobody was actually looking
- **An unambiguous verdict, not a hedge**: the report must state a clear conclusion a human can act on immediately, not a both-ways answer that pushes the decision back onto the reader

## Example Code
```typescript
import { z } from 'zod';

const CategoryResult = z.object({
  category: z.string(),
  verdict: z.enum(['PASS', 'WARN', 'FAIL']),
  issues: z.array(z.object({ location: z.string(), description: z.string() })), // citation required per issue
});

const ReviewReport = z.object({
  categories: z.array(CategoryResult).min(1),
  overallVerdict: z.enum(['PASS', 'PASS_WITH_WARNINGS', 'FAIL']),
  rationale: z.string().min(1), // must be an explicit, unambiguous conclusion
});
type ReviewReport = z.infer<typeof ReviewReport>;

// The gate itself: structural, not just a prompt instruction
async function mergeIfApproved(prNumber: string, report: ReviewReport, humanOverride?: { approver: string; reason: string }) {
  const blocked = report.overallVerdict === 'FAIL';

  if (blocked && !humanOverride) {
    logger.info('merge_blocked', { prNumber, verdict: report.overallVerdict });
    return { merged: false, reason: 'Blocking verdict — requires explicit human override to proceed.' };
  }

  if (blocked && humanOverride) {
    // The override is logged separately and by name — never silent, never automatic
    logger.warn('merge_override', { prNumber, approver: humanOverride.approver, reason: humanOverride.reason });
  }

  await mergePullRequest(prNumber); // the review agent itself never calls this — a separate, human-triggered action does
  return { merged: true };
}

// Enforcing "no category silently skipped" at the schema level
function assertAllCategoriesReviewed(report: ReviewReport, requiredCategories: string[]) {
  const reviewed = new Set(report.categories.map((c) => c.category));
  const missing = requiredCategories.filter((c) => !reviewed.has(c));
  if (missing.length > 0) {
    throw new AppError(`Review incomplete — missing categories: ${missing.join(', ')}`, 422);
  }
}
```

## When to Use
- Before any AI-assisted decision gates an irreversible or high-stakes action: merging code, signing a contract, sending a final invoice, publishing generated content
- Building any review or audit agent whose output other people, or other automated systems, will act on directly
- Whenever there's a temptation to let one agent invocation both flag issues and take the consequential action in the same step — that's exactly the case this pattern exists to prevent
- Tracking review quality over time — a structured verdict format is what makes a category-level trend (an escalating FAIL rate) visible at all

## Common Mistakes
- Accepting a freeform written review as a substitute for a structured verdict, leaving a human to reconstruct the actual decision from prose
- Letting a downstream system treat a non-blocking read of an otherwise-blocking report as good enough to proceed automatically
- Having the same agent invocation both perform the review and execute the reviewed action, eliminating the independence the gate depends on
- Marking a checklist item as passed without a citation, on the assumption that it was "probably fine"
- Silently skipping a tedious category and still reporting an overall PASS, manufacturing confidence in a section nobody actually checked

## Further Reading
- Anthropic — "Building effective agents" (the evaluator-optimizer and human-in-the-loop patterns this lesson generalizes from)
- NIST AI Risk Management Framework — human oversight controls for consequential AI-assisted decisions
- Google SRE Book — change management and review-gate philosophy, which generalizes directly to AI-assisted approval gates
