# 152. Advanced RAG: Chunking, Reranking, and Grounding Verification

## What It Is
The basic RAG loop — embed a query, fetch nearest chunks, stuff them into the prompt — is the easy 20% of building a retrieval system. The other 80% is retrieval quality engineering, and it's where most RAG features actually live or die, because a language model given the wrong context will confidently generate a wrong answer from it. The first quality lever is chunking strategy: how you split source documents before embedding directly determines what can ever be retrieved. Fixed-size chunking with overlap (e.g., 500 tokens per chunk, 50 tokens of overlap) is the simple baseline, but naive splitting can cut a sentence or a table row in half; the better version splits at semantic boundaries — section headers, paragraph breaks — so no chunk starts or ends mid-thought.

The second lever is retrieval precision, and pure vector similarity search is often not enough on its own. Hybrid search — combining dense vector retrieval with keyword-based search like BM25 — catches cases where the right answer uses specific terminology that embeddings alone under-weight (product SKUs, exact error codes, proper nouns). A reranking pass after initial retrieval (a cross-encoder scoring each candidate chunk against the query more precisely than the embedding's cosine similarity) further improves precision when you can afford the extra latency. And a similarity score threshold — discarding chunks below roughly 0.75 cosine similarity — prevents low-relevance chunks from diluting the context just because they were the "best available" among a bad set.

The third and most underused lever is grounding verification: an explicit check, after generation, that the model's answer is actually supported by the retrieved context, rather than trusting that "we gave it good context" is sufficient. For high-stakes domains — legal, medical, financial — a second, cheap model call (Haiku is the right tier here) that answers only "GROUNDED" or "NOT GROUNDED" against the retrieved text catches hallucination that survives good retrieval. RAG narrows what the model *can* draw from; it does not guarantee what it *actually did* draw from, and treating retrieval quality as a substitute for output validation is the single most common RAG production bug.

```quiz
- q: "Answers are missing detail. Raise top-k from 5 to 20?"
  anchor: "more chunks add cost and dilute what the model attends to, they don't improve answer quality"
  options:
    - text: "Yes — more context can only help"
      correct: false
      why: "More chunks add cost and dilute what the model attends to. They do not improve answer quality."
    - text: "No — 3-5 is typically sufficient; look at retrieval quality instead"
      correct: true
      why: "A similarity threshold that discards weak chunks does more than raising k ever will."
    - text: "Yes, and lower the similarity threshold to fill the extra slots"
      correct: false
      why: "That fills the context with exactly the chunks the threshold existed to exclude."

- q: "A better embedding model ships. Use it for new documents only?"
  anchor: "never mix vectors from different embedding models in one index — changing embedding models requires re-embedding the entire corpus"
  options:
    - text: "Yes — new documents get better vectors, and the old ones still work"
      correct: false
      why: "Never mix vectors from different embedding models in one index. The distances are not comparable."
    - text: "No — changing the model means re-embedding the whole corpus"
      correct: true
      why: "Otherwise similarity across the two halves of the index means nothing."
    - text: "Yes, keeping both models' vectors in separate fields"
      correct: false
      why: "That is two indexes, which is a different design from the one being asked about."

- q: "Where do retrieved chunks go in the request?"
  anchor: "retrieved chunks go in the user message (with source tags for citation), not the system prompt, so they don't pollute prompt caching"
  options:
    - text: "The system prompt, so they carry the most weight"
      correct: false
      why: "That pollutes prompt caching: the cached prefix would change on every query."
    - text: "The user message, with source tags for citation"
      correct: true
      why: "It keeps the system prompt stable, and therefore cacheable."
    - text: "Split across both, for redundancy"
      correct: false
      why: "Duplicating context pays for it twice and still breaks the cache."
```

## Key Concepts
- **Chunk at semantic boundaries, not fixed character counts**: split at headers/paragraphs where possible; use overlap (~10% of chunk size) to avoid losing context at boundaries
- **Hybrid search**: combine dense vector similarity with keyword/BM25 search to catch exact-term queries embeddings miss
- **Reranking**: a cross-encoder pass over the top candidates after initial retrieval, trading latency for precision
- **Similarity score threshold**: discard chunks below a minimum relevance score rather than always returning the top-k regardless of quality
- **Top-k discipline**: 3-5 chunks is typically sufficient; more chunks add cost and dilute what the model attends to, they don't improve answer quality
- **Grounding verification**: a second, cheaper model call that checks whether the generated answer is actually supported by the retrieved context
- **Embedding model consistency**: never mix vectors from different embedding models in one index — changing embedding models requires re-embedding the entire corpus
- **Context placement**: retrieved chunks go in the user message (with source tags for citation), not the system prompt, so they don't pollute prompt caching

## Example Code
```typescript
const MIN_SIMILARITY = 0.75;
const TOP_K = 4;

async function retrieveRelevantChunks(queryVector: number[]) {
  const candidates = await vectorStore.search(queryVector, { topK: TOP_K * 3 });
  const aboveThreshold = candidates.filter((c) => c.score >= MIN_SIMILARITY);
  const reranked = await rerank(candidates.query, aboveThreshold); // cross-encoder pass
  return reranked.slice(0, TOP_K);
}

/**
 * What a retrieval step hands back. `filename` is not decoration: without a
 * source identifier on every chunk the model cannot cite, you cannot show the
 * user where an answer came from, and you cannot check grounding afterwards.
 * `score` is kept so the threshold filter above is auditable rather than magic.
 */
type RetrievedChunk = {
  text: string;
  filename: string;
  score: number;
};

function buildRAGUserMessage(query: string, chunks: RetrievedChunk[]): string {
  const context = chunks
    .map((c, i) => `<source id="${i + 1}" file="${c.filename}">\n${c.text}\n</source>`)
    .join('\n\n');
  return `<context>\n${context}\n</context>\n\nQuestion: ${query}`;
}

// Grounding verification — only for high-stakes features (legal, medical, financial)
async function verifyGrounding(context: string, answer: string): Promise<boolean> {
  const response = await anthropic.messages.create({
    model: 'claude-haiku-4-5', // cheap tier — this is a binary check, not generation
    max_tokens: 10,
    system: 'You are a fact-checker. Answer only "GROUNDED" or "NOT GROUNDED".',
    messages: [{
      role: 'user',
      content: `Context:\n${context}\n\nClaim: "${answer}"\n\nIs this claim fully supported by the context?`,
    }],
  });
  return extractText(response).trim().toUpperCase().startsWith('GROUNDED');
}

export async function answerWithGroundingCheck(question: string): Promise<{ answer: string; grounded: boolean }> {
  const chunks = await retrieveRelevantChunks(await embed(question));
  const userMessage = buildRAGUserMessage(question, chunks);
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-5',
    max_tokens: 500,
    system: RAG_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
  });
  const answer = extractText(response);
  const context = chunks.map((c) => c.text).join('\n');
  return { answer, grounded: await verifyGrounding(context, answer) };
}
```

## When to Use
- After a basic RAG feature is live and eval results show retrieval misses (right document exists, but the wrong chunk was retrieved)
- Any corpus with exact-match-sensitive content (SKUs, error codes, IDs) where pure vector similarity underperforms
- High-stakes domains (legal, medical, financial, compliance) where an ungrounded hallucination has real consequences
- When top-k is set high (>8) to "be safe" and answer quality hasn't improved — that's a signal to add a threshold and reranking instead

## Common Mistakes
- Chunking purely by fixed character/token count with no regard for section or paragraph boundaries, fragmenting meaning across chunks
- Assuming that good retrieval automatically means a grounded answer — the model can still ignore, misread, or extrapolate beyond the provided context
- Increasing top-k to compensate for poor retrieval precision instead of fixing chunking, hybrid search, or the similarity threshold
- Re-embedding only new documents after switching embedding models, leaving old and new vectors incompatible in the same index

## Further Reading
- Pinecone — "Chunking Strategies for LLM Applications" (learn.pinecone.io)
- Anthropic — "Contextual Retrieval" cookbook/blog post on improving RAG chunk relevance
- [Voyage AI documentation](https://docs.voyageai.com/) — embedding models and reranking

```recall
- q: "How do you chunk, and why the overlap?"
  must:
    - "split at semantic boundaries — headers and paragraphs — rather than fixed character counts"
    - "use overlap of roughly 10% of chunk size, to avoid losing context at boundaries"

- q: "What is hybrid search, and what is reranking?"
  must:
    - "hybrid search combines dense vector similarity with keyword or BM25 search, to catch exact-term queries embeddings miss"
    - "reranking is a cross-encoder pass over the top candidates after initial retrieval, trading latency for precision"

- q: "What is grounding verification?"
  must:
    - "a second, cheaper model call"
    - "it checks whether the generated answer is actually supported by the retrieved context"
```
