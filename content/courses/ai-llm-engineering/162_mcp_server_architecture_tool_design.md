# 162. MCP Server Architecture and Tool Design

## Coverage Level
**Not assessed** — this concept was added to expand the AI & LLM Engineering course from internal-ai-rules' MCP_Server_Design_Rules/mcp-server-master.md and tool-naming-conventions.md material; no existing coverage data for your own practice.

## What It Is
The Model Context Protocol standardizes how an AI client discovers and calls capabilities you expose, and it gives you exactly three primitives to model those capabilities with: a **Tool** for anything the AI needs to take an action on or fetch data with parameters, a **Resource** for a document, file, or structured record the AI reads by URI, and a **Prompt** for a static, pre-built instruction template the host injects. The overwhelming majority of real integrations are Tools — default to Tool for any new capability, and reach for Resource or Prompt only when the use case is a clearly better fit (Resources for read-only content by identifier, Prompts for genuinely static templates, never for data that changes per call). Getting this primitive choice wrong early is expensive later, because clients build expectations around each primitive's semantics — a Resource is assumed to be side-effect-free, for instance, so putting an action behind one violates the contract the protocol was designed around.

Server scope is the next architectural decision, and the rule is one domain per server: a server that mixes files, issues, and users is really three servers merged badly, and it will eventually need three different auth scopes, three different rate-limit budgets, or three different release cadences that a single merged server can't cleanly support. Inside that single domain, handlers follow the same discipline as any other production request handler: no business logic lives in the handler itself — it validates input, delegates to a service layer, and returns the result, exactly the separation you'd expect from a REST controller. Handlers must be stateless (no module-level mutable variables carrying context between calls, since a server may be handling many concurrent, unrelated tool calls) and must never block synchronously, because a blocking handler stalls every other in-flight call on the same server. When something goes wrong, the handler fails loudly with a structured error — it never returns a partial result that looks complete, and it never lets a raw exception escape to the client.

Tool naming and description quality is where MCP server design intersects directly with prompt engineering, because the tool's name and description are the *only* interface the model has for deciding when and how to call it — there's no README, no onboarding, just the schema you shipped. The convention `{domain}_{verb}_{noun}` (e.g., `project_list_members`, `issue_create_item`) from a closed, approved verb vocabulary (list, get, search, create, update, delete, upload, download, analyze, export, validate) keeps names predictable across a growing tool catalog, and forbidding generic names (`do_thing`, `process`, `handle`) forces you to actually think through what the tool does before shipping it. A tool's description must state, in order: what it does, its preconditions, a summary of its input shape, a summary of its output shape, and the error cases the AI client should expect — omitting any of these means the model is guessing, and a model guessing about preconditions is exactly how you get a tool called at the wrong time with the wrong assumptions.

## Key Concepts
- **Three MCP primitives**: Tool (parameterized action or fetch — the default), Resource (read-only document/record by URI), Prompt (static instruction template) — pick the primitive that matches the actual semantics, not whichever is easiest to wire up
- **One domain per server**: a server spanning multiple bounded contexts eventually needs different auth scopes, rate limits, or release cycles it can't support as a single unit
- **No business logic in handlers**: a tool handler validates input and delegates to a service layer — the same separation as a REST controller, not a place to embed domain rules
- **Stateless handlers**: no module-level mutable state between calls — a server serves many concurrent, unrelated tool invocations
- **Fail loudly, never partially**: return a structured error rather than a raw exception, and never return an incomplete result without explicitly signaling it's incomplete
- **`{domain}_{verb}_{noun}` naming from a closed verb vocabulary**: predictable names at scale; no generic verbs (`do_thing`, `process`, `handle`), no abbreviations, no version numbers in tool names
- **Tool descriptions are the model's entire interface**: must state what it does, its preconditions, input/output shape, and known error cases — nothing else informs the model's decision to call it
- **Transport matches deployment shape**: stdio for local/single-user/dev, SSE or streamable HTTP for a remote, multi-tenant, production server — never stdio in a multi-tenant context

## Example Code
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server';
import { z } from 'zod';

const server = new McpServer({ name: 'project-server', version: '1.0.0' });

// Naming: {domain}_{verb}_{noun} — "project" domain, "list" verb, "members" noun
server.tool(
  'project_list_members',
  `Lists all members of a project.
  Precondition: caller must have viewer role or higher on the project.
  Input: projectId (string, required).
  Output: array of { userId, email, role }.
  Errors: NOT_FOUND if project does not exist, UNAUTHORIZED if access is denied.`,
  { projectId: z.string() },
  async ({ projectId }) => {
    // Handler validates input (via the Zod schema above) and delegates — no business logic here
    const members = await projectService.listMembers(projectId);
    return { content: [{ type: 'text', text: JSON.stringify(members) }] };
  },
);

// Stateless — no module-level cache of "current project" or "last caller" between calls
server.tool(
  'project_create_item',
  `Creates a new item in a project. Requires an idempotencyKey to prevent duplicate creation.
  Input: projectId, name, type, idempotencyKey.
  Output: { id, name, createdAt }.
  Errors: VALIDATION_ERROR if name is empty, UPSTREAM_ERROR if the backing API fails.`,
  {
    projectId: z.string(),
    name: z.string().min(1),
    type: z.string(),
    idempotencyKey: z.string(),
  },
  async ({ projectId, name, type, idempotencyKey }) => {
    const result = await projectService.createItem({ projectId, name, type, idempotencyKey });
    return { content: [{ type: 'text', text: JSON.stringify(result) }] };
  },
);

// Resource — read-only, by URI, never used for anything with a side effect
server.resource('project-member', 'project://{projectId}/members/{userId}', async (uri) => {
  const member = await projectService.getMember(uri.params.projectId, uri.params.userId);
  return { contents: [{ uri: uri.toString(), text: JSON.stringify(member) }] };
});
```

## When to Use
- Designing a new MCP server for any internal tool, client-facing integration, or agent-accessible capability
- When an existing tool catalog is growing past roughly 15 tools or starting to span more than one auth scope — that's the signal to split into multiple domain-scoped servers
- Whenever a tool's description feels hard to write in one clean paragraph — that's usually a sign the tool is doing more than one job and should be decomposed
- Before publishing any server that another team's or client's AI agent will call — naming and description quality directly determine how reliably the model uses it

## Common Mistakes
- Modeling an action with a side effect as a Resource because "it's just returning data," breaking the read-only contract clients assume for Resources
- Merging unrelated domains (files, issues, users) into one server instead of splitting along auth scope and release cadence boundaries
- Writing business logic directly inside a tool handler instead of delegating to a service layer, making the rule untestable outside the MCP transport
- Using a generic tool name (`process`, `handle`, `do_thing`) or an abbreviated one (`proj_lst_mem`) instead of the full `{domain}_{verb}_{noun}` form
- Shipping a tool description that omits preconditions or error cases, leaving the model to guess when the tool is safe to call

## Further Reading
- Model Context Protocol specification (modelcontextprotocol.io) — the authoritative reference for Tool, Resource, and Prompt semantics
- Anthropic — "Model Context Protocol" documentation and reference server implementations
- Anthropic — "Building effective agents," for the broader design philosophy of giving a model well-scoped, well-described capabilities
