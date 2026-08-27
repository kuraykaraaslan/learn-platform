# 140. AI/LLM Integration & Prompt Engineering — RAG, Vector DBs, Agents, Evals

## What It Is
Integrating an LLM into a product is mostly an exercise in **context engineering**, not prompting cleverness — the model only knows what's in its context window (the system prompt, the conversation, and anything you retrieve and inject), so the real design work is deciding what belongs there and in what order. **Retrieval-Augmented Generation (RAG)** is the standard pattern for grounding answers in your own data: embed your documents into vectors ahead of time, store them in a vector database (pgvector alongside your existing Postgres, or a dedicated store like Pinecone), and at query time embed the user's question, retrieve the most similar chunks, and inject them into the prompt so the model answers from *your* data instead of only its training knowledge.

**Tool/function calling** extends this from "answer using retrieved text" to "take actions" — the model is given a schema of available functions and decides when to call one, turning it into an agent that can look things up, call your APIs, or chain multiple steps together. This is powerful and also where new failure modes live: a model calling the wrong tool, looping indefinitely, or acting on untrusted retrieved content that contains an injected instruction (**prompt injection** — the LLM-era counterpart to OWASP's injection risks, #29).

**Evals** are the discipline that makes any of this maintainable: a small, versioned dataset of representative inputs with expected properties of a good output, run automatically so a prompt or model change that silently makes things worse is caught before it ships — without this, "is this prompt better or worse now" is just a guess.

## Key Concepts
- **Context window & prompt structure**: system prompt (stable instructions) + retrieved/injected context + conversation — token budget is a real, finite resource
- **RAG pipeline**: embed documents → store in a vector DB → embed the query → retrieve top-k similar chunks → inject into the prompt
- **Vector database & similarity search**: pgvector, Pinecone, etc. — nearest-neighbor search over embeddings, with the same indexing tradeoffs (#17) as any other lookup structure
- **Tool/function calling**: giving the model a schema of callable functions, turning generation into action — the basis of agentic systems
- **Evals**: a versioned dataset + automated scoring (exact match, rubric, or LLM-as-judge) to catch regressions from prompt/model changes
- **Prompt injection**: untrusted retrieved or user-supplied content containing instructions that hijack the model's behavior — treat any injected text as untrusted input, same posture as #29 OWASP

## Example Code
```typescript
// Minimal RAG flow: embed a query, retrieve nearest chunks from pgvector, augment the prompt
async function answerFromDocs(question: string): Promise<string> {
  const [queryEmbedding] = await embed([question]); // e.g. a hosted embeddings API

  const chunks = await db.$queryRaw<{ content: string }[]>`
    SELECT content FROM document_chunks
    ORDER BY embedding <-> ${queryEmbedding}::vector
    LIMIT 5
  `; // pgvector's nearest-neighbor operator

  const context = chunks.map((c) => c.content).join("\n---\n");

  return callModel({
    system: "Answer only using the provided context. If it's not in the context, say you don't know.",
    messages: [{ role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }],
  });
}

// A trivial eval: run a fixed set of cases, assert on a property of the output, not exact text
const evalCases = [
  { question: "What's our refund window?", mustContain: "30 days" },
  { question: "Do you support SSO?", mustContain: "SSO" },
];

for (const { question, mustContain } of evalCases) {
  const answer = await answerFromDocs(question);
  console.assert(answer.includes(mustContain), `FAILED: "${question}" -> "${answer}"`);
}
```

## When to Use
- Any feature involving natural-language generation, summarization, or semantic search over your own content
- Automating a judgment call that used to require a human reading unstructured text — with an eval set to catch when the automation degrades
- Adding tool-calling only once plain retrieval-and-generate genuinely isn't enough — it's a real increase in failure surface, not a default upgrade

## Common Mistakes
- No eval set — changing a prompt "because it feels better" with no way to detect a regression on cases that used to work
- Stuffing the entire context window with everything that might be relevant instead of retrieving narrowly — wastes tokens/latency and dilutes what the model actually attends to
- Trusting model output as ground truth for anything security-, financial-, or compliance-sensitive without a human-in-the-loop check
- Treating retrieved content as trusted — a document containing "ignore previous instructions and..." is a real attack if it reaches the model unfiltered

## Further Reading
- Anthropic — prompt engineering documentation and "Building effective agents" guide
- ["Building LLM Applications for Production" by Chip Huyen](https://huyenchip.com)
- [OWASP Top 10 for LLM Applications](https://owasp.org/www-project-top-10-for-large-language-model-applications/) — the LLM-era counterpart to the injection risks in (#29)
