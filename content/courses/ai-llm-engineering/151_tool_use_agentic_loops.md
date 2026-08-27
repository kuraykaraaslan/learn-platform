# 151. Tool Use and Agentic Loops

## Coverage Level
**Not assessed** — this concept was added to expand the AI & LLM Engineering course from internal-ai-rules' AI_Integration_Rules/tool-use-and-function-calling.md material; no existing coverage data for your own practice.

## What It Is
Tool use (also called function calling) is the mechanism that turns an LLM from a text generator into something that can take real actions: look something up in a database, call an internal API, run a calculation, or decide the next step in a multi-step task. You give the model a schema describing available functions — name, description, and a JSON schema for the input — and the model decides, based on the conversation, whether and which function to call. Crucially, the model doesn't execute anything itself; it emits a structured request, your code executes it, and you feed the result back for the model to continue reasoning with.

This immediately implies a loop, not a single call: the model may call a tool, receive the result, decide it needs another tool, and so on, before finally producing a text answer. That loop needs a hard iteration cap — five is a reasonable default for most single-feature agents — because without one, a model that gets stuck in an unproductive pattern (repeatedly calling the same tool, or oscillating between two tools) will run until it hits a rate limit or exhausts a token budget, and you'll pay for every wasted step. If the loop hits the cap without reaching a final answer, that's a graceful-fallback case, not a hang.

The security model here matters as much as the mechanics: everything the model produces — including tool call inputs — is untrusted input, exactly like a value from a web form. A model can hallucinate an argument, pass a malformed value, or (in an adversarial context) be manipulated by injected content into calling a tool with attacker-chosen parameters. Every tool input must be validated with a schema (Zod, matching the same discipline as request-body validation) before it touches your service layer, and any tool that performs an irreversible action — sending an email, charging a card, deleting data — needs an explicit human confirmation step in the UI before the loop is allowed to execute it, not just a description telling the model to "ask first."

## Key Concepts
- **Tool schema**: `name`, `description`, and `input_schema` — the model uses the description to decide *when* to call the tool, so vague descriptions cause both missed calls and wrong calls
- **The agentic loop**: call the model → check `stop_reason` → if `tool_use`, execute and feed results back as a new message → repeat → until `end_turn` or the step cap is hit
- **Step cap is mandatory**: an uncapped loop is a cost and reliability risk, not just a theoretical edge case
- **Centralized tool dispatch**: one `dispatchTool(name, input)` switch statement, never scattered `if (toolName === ...)` checks across the codebase
- **Zod validation on every tool input**: treat model-generated arguments as untrusted, exactly like user input from a form
- **Irreversible actions require a confirmation gate**: tools that send, charge, or delete must pause for explicit user approval before the loop executes them
- **Description quality determines correctness**: "Gets products" causes the model to under- or over-call the tool; a precise description of when and why to call it does not
- **Tool descriptions are visible to the model, not to end users**: never leak internal schema details, IDs, or anything sensitive into a description string

## Example Code
```typescript
import type { Tool, MessageParam, ToolResultBlockParam } from '@anthropic-ai/sdk/resources/messages';
import { z } from 'zod';

const searchProductsTool: Tool = {
  name: 'search_products',
  description: 'Search the product catalog by keyword and optional category. Use when the user asks what products are available, asks for prices, or wants to browse a category.',
  input_schema: {
    type: 'object',
    properties: {
      query: { type: 'string', description: 'Search keywords' },
      category: { type: 'string', enum: ['electronics', 'clothing', 'books'] },
      max_results: { type: 'number', description: 'Default 5' },
    },
    required: ['query'],
  },
};

const SearchProductsInput = z.object({
  query: z.string().min(1).max(200),
  category: z.enum(['electronics', 'clothing', 'books']).optional(),
  max_results: z.number().int().min(1).max(20).default(5),
});

async function dispatchTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case 'search_products':
      return searchProducts(SearchProductsInput.parse(input));
    default:
      throw new AppError(`Unknown tool: ${name}`, 500);
  }
}

const MAX_AGENT_STEPS = 5;

export async function runAgentLoop(userMessage: string): Promise<string> {
  const messages: MessageParam[] = [{ role: 'user', content: userMessage }];

  for (let step = 0; step < MAX_AGENT_STEPS; step++) {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: AGENT_SYSTEM_PROMPT,
      tools: [searchProductsTool],
      messages,
    });

    if (response.stop_reason === 'end_turn') return extractText(response);

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const toolResults: ToolResultBlockParam[] = [];
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue;
        const result = await dispatchTool(block.name, block.input); // validated inside dispatchTool
        toolResults.push({ type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) });
      }
      messages.push({ role: 'user', content: toolResults });
      continue;
    }
    break;
  }
  throw new AppError('Agent loop did not complete within step limit', 500);
}
```

## When to Use
- The model needs to guarantee a structured schema by actually taking an action, not just describing one in text
- The feature requires real-time data the model can't know (a database lookup, current inventory, live pricing)
- Building an agent that chains multiple steps together to answer a single user request
- Never reach for tool use when a simple prompt plus Zod-validated JSON output (see the Structured Output lesson) would suffice — it adds real latency and complexity

## Common Mistakes
- Running the agentic loop with no iteration cap, letting a stuck model burn tokens indefinitely
- Executing a tool call's input without schema validation, trusting the model's output as if it were pre-vetted
- Wiring an irreversible-action tool (send email, delete record, charge payment) without a human confirmation step in the UI
- Writing a vague tool description ("process the request") that leaves the model guessing about when to call it

## Further Reading
- Anthropic — "Tool use with Claude" (official documentation, including parallel and sequential tool calling)
- Anthropic — "Building effective agents" (the agentic loop pattern and when to reach for it)
- OWASP Top 10 for LLM Applications — LLM06 Excessive Agency, directly relevant to unbounded or unconfirmed tool actions
