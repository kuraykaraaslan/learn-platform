# 151. Tool Use and Agentic Loops

## What It Is
Tool use (also called function calling) is the mechanism that turns an LLM from a text generator into something that can take real actions: look something up in a database, call an internal API, run a calculation, or decide the next step in a multi-step task. You give the model a schema describing available functions — name, description, and a JSON schema for the input — and the model decides, based on the conversation, whether and which function to call. Crucially, the model doesn't execute anything itself; it emits a structured request, your code executes it, and you feed the result back for the model to continue reasoning with.

This immediately implies a loop, not a single call: the model may call a tool, receive the result, decide it needs another tool, and so on, before finally producing a text answer. That loop needs a hard iteration cap — five is a reasonable default for most single-feature agents — because without one, a model that gets stuck in an unproductive pattern (repeatedly calling the same tool, or oscillating between two tools) will run until it hits a rate limit or exhausts a token budget, and you'll pay for every wasted step. If the loop hits the cap without reaching a final answer, that's a graceful-fallback case, not a hang.

The security model here matters as much as the mechanics: everything the model produces — including tool call inputs — is untrusted input, exactly like a value from a web form. A model can hallucinate an argument, pass a malformed value, or (in an adversarial context) be manipulated by injected content into calling a tool with attacker-chosen parameters. Every tool input must be validated with a schema (Zod, matching the same discipline as request-body validation) before it touches your service layer, and any tool that performs an irreversible action — sending an email, charging a card, deleting data — needs an explicit human confirmation step in the UI before the loop is allowed to execute it, not just a description telling the model to "ask first."

```quiz
- q: "The model returns `stop_reason: 'tool_use'`. What happens next?"
  anchor: "if `tool_use`, execute and feed results back as a new message"
  options:
    - text: "Return the tool call to the user for approval"
      correct: false
      why: "Only for irreversible actions. The loop's default is to execute and feed the result back."
    - text: "Execute the tool, feed the result back as a new message, and repeat"
      correct: true
      why: "Until `end_turn`, or until the step cap is hit."
    - text: "Retry the request with that tool removed"
      correct: false
      why: "The model asked for it because it needs it. Removing it does not answer the question."

- q: "Your agentic loop has no step cap. How bad is that?"
  anchor: "an uncapped loop is a cost and reliability risk, not just a theoretical edge case"
  options:
    - text: "Theoretical — models terminate on their own in practice"
      correct: false
      why: "Named explicitly as not just a theoretical edge case."
    - text: "A real cost and reliability risk — the cap is mandatory"
      correct: true
      why: "Every iteration is a paid call, and nothing outside the loop bounds it."
    - text: "Fine, since `end_turn` arrives eventually"
      correct: false
      why: "That is precisely the assumption the mandatory cap exists so you do not rely on."

- q: "A tool receives its arguments from the model. Do you validate them?"
  anchor: "treat model-generated arguments as untrusted, exactly like user input from a form"
  options:
    - text: "No — the model generated them from your own schema"
      correct: false
      why: "Treat model-generated arguments as untrusted, exactly like user input from a form."
    - text: "Yes — Zod on every tool input, same as form input"
      correct: true
      why: "The schema tells the model what to produce; it does not guarantee what arrives."
    - text: "Only for tools that write something"
      correct: false
      why: "A read tool with an unvalidated argument is still a route to data nobody intended to expose."
```

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
      model: 'claude-sonnet-5',
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
- **An agentic loop has no cap on how many iterations it can run** — Running the agentic loop with no iteration cap, letting a stuck model burn tokens indefinitely
- **A tool call's input gets executed directly, no schema validation first** — Executing a tool call's input without schema validation, trusting the model's output as if it were pre-vetted
- **A "delete record" tool executes the moment the model calls it, no confirmation step** — Wiring an irreversible-action tool (send email, delete record, charge payment) without a human confirmation step in the UI
- **A tool is described as "process the request"** — Writing a vague tool description ("process the request") that leaves the model guessing about when to call it

## Further Reading
- Anthropic — "Tool use with Claude" (official documentation, including parallel and sequential tool calling)
- Anthropic — "Building effective agents" (the agentic loop pattern and when to reach for it)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — LLM06 Excessive Agency is the entry that maps directly onto unbounded or unconfirmed tool use

```recall
- q: "What is in a tool schema, and why does the description matter so much?"
  must:
    - "`name`, `description` and `input_schema`"
    - "the model uses the description to decide *when* to call the tool"
    - "vague descriptions cause both missed calls and wrong calls"

- q: "How are tools dispatched, and what needs a confirmation gate?"
  must:
    - "one centralized `dispatchTool(name, input)` switch, never scattered `if (toolName === ...)` checks across the codebase"
    - "tools that send, charge or delete must pause for explicit user approval before the loop executes them"

- q: "Who reads a tool description, and what follows from that?"
  must:
    - "it is visible to the model, not to end users"
    - "never leak internal schema details, IDs, or anything sensitive into a description string"
```
