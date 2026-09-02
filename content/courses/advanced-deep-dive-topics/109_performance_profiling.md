# 109. Performance Profiling — Flame Graphs, Heap Snapshots, Memory Leak Detection

## What It Is
Performance problems come in two categories: CPU (something is doing too much work) and memory (something is holding onto objects it should release). Both require different tools and mental models. Guessing is expensive — profiling is how you find the actual bottleneck, not the suspected one.

A CPU flame graph shows where your program spends time. The x-axis is time, the y-axis is call depth. Wide bars at the top mean a function is directly consuming CPU. Wide bars in the middle mean a function's callees are slow. You find the optimization by looking for wide bars near the top.

Memory profiling catches leaks: objects that accumulate over time because something holds a reference to them, preventing garbage collection. In long-running Node.js servers (including Next.js in production), a leak will eventually exhaust memory and crash the process. The symptom is memory that grows monotonically over hours or days.

```quiz
- q: "A 40 MB object is never collected. Its only reference is a callback registered on a global emitter. What is that?"
  anchor: "the function is kept alive (e.g., in a global event listener), so the object is never collected"
  options:
    - text: "A collector bug — an object that large should be reclaimed"
      correct: false
      why: "The object is reachable. The registration keeps the function alive, and the closure keeps the object."
    - text: "A closure leak — the live listener holds the captured object"
      correct: true
      why: "The function captured it, and the function outlives everything else because nothing ever unregisters it."
    - text: "Fragmentation — the memory is free but not returned to the OS"
      correct: false
      why: "That describes memory the collector already reclaimed, not an object it cannot reclaim."

- q: "In a heap snapshot, which column does a leak investigation start from?"
  anchor: "Memory a node keeps alive (itself + everything reachable only through it). Leak investigation starts here"
  options:
    - text: "Shallow size — the object's own footprint"
      correct: false
      why: "It is usually small, and it says nothing about what the object is holding open."
    - text: "Retained size — the object plus everything reachable only through it"
      correct: true
      why: "That is the number telling you what freeing this node would actually recover."
    - text: "Allocation count — how many instances of the type exist"
      correct: false
      why: "Useful for spotting growth, but not where the investigation starts."

- q: "A single heap snapshot shows 800 MB live. What can you conclude?"
  anchor: "Comparing two snapshots shows what was allocated and not collected"
  options:
    - text: "There is a leak — 800 MB is well past a healthy heap"
      correct: false
      why: "One snapshot has no baseline. Large and growing are different claims."
    - text: "Very little — a leak shows up in the diff between two snapshots"
      correct: true
      why: "The comparison is what reveals which objects were allocated and never collected."
    - text: "Nothing at all until a heap timeline is also recorded"
      correct: false
      why: "The timeline tells you which functions allocate most; the two-snapshot diff answers this question directly."
```

## Key Concepts
- **Flame graph**: Visualization of CPU time per function. Width = time spent. Read top-down for hot paths.
- **Heap snapshot**: A dump of all live objects in V8's heap at a moment in time. Comparing two snapshots shows what was allocated and not collected.
- **Heap timeline**: Continuous recording of memory allocation. Shows which functions allocate the most.
- **Retained size**: Memory a node keeps alive (itself + everything reachable only through it). Leak investigation starts here.
- **Shallow size**: Memory the object itself uses, not counting references. Usually small.
- **GC root**: Objects that are always reachable (global scope, active call stack). Anything reachable from a GC root cannot be collected.
- **Closure leak**: A function captures a large object in its closure; the function is kept alive (e.g., in a global event listener), so the object is never collected.
- **`--inspect` flag**: Starts Node.js with Chrome DevTools Protocol enabled. Connect Chrome DevTools to a running Node.js process.

## Example Code

```tsx
// Deliberate memory leak — spot this pattern in production code
class EventBus {
  private static handlers: Map<string, Function[]> = new Map();

  static on(event: string, handler: Function) {
    const existing = this.handlers.get(event) ?? [];
    this.handlers.set(event, [...existing, handler]);
    // BUG: no off() method — handlers accumulate forever
    // If handler closes over a large object (e.g., a request context), that object leaks
  }

  static emit(event: string, data: unknown) {
    this.handlers.get(event)?.forEach(h => h(data));
  }
}

// Fixed version
class EventBusSafe {
  private static handlers: Map<string, Set<Function>> = new Map();

  static on(event: string, handler: Function): () => void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
    // Returns an unsubscribe function — caller is responsible for cleanup
    return () => this.handlers.get(event)?.delete(handler);
  }
}
```

```bash
# Start Next.js with inspector enabled
node --inspect ./node_modules/.bin/next start

# Or for a custom server
node --inspect dist/server.js

# Then open Chrome and go to:
# chrome://inspect → Click "inspect" under your Node process

# --- CLI profiling without DevTools ---
# Record a CPU profile for 10 seconds
node --prof server.js
# (run load against it, then Ctrl+C)
node --prof-process isolate-*.log > profile.txt

# --- clinic.js — easiest flame graph for Node.js ---
npx clinic flame -- node server.js
# Opens a browser with an interactive flame graph after you stop the process
```

```typescript
// Detecting memory growth in production — add to your health endpoint
import v8 from 'v8';
import process from 'process';

export function getMemoryStats() {
  const heap = process.memoryUsage();
  const v8Stats = v8.getHeapStatistics();
  return {
    heapUsedMB: Math.round(heap.heapUsed / 1024 / 1024),
    heapTotalMB: Math.round(heap.heapTotal / 1024 / 1024),
    rssMB: Math.round(heap.rss / 1024 / 1024),           // resident set size
    externalMB: Math.round(heap.external / 1024 / 1024), // Buffer allocations
    heapLimitMB: Math.round(v8Stats.heap_size_limit / 1024 / 1024),
  };
}
// Log this every 60s — if heapUsedMB grows without bound, you have a leak
```

## When to Use
- Response times have degraded but database queries are fast — CPU profiling
- Memory grows over time and the process eventually OOM-crashes — heap profiling
- A specific endpoint is slow and you don't know which function is causing it — flame graph
- After a major refactor, before shipping to production — baseline memory and CPU usage

## Common Mistakes
- Profiling in development instead of production — V8 optimizes differently under load; dev profiling can point to the wrong bottleneck
- Ignoring RSS and looking only at heapUsed — native addons and Buffers live outside the V8 heap
- Taking one heap snapshot instead of two — you need before/after comparison to isolate what grew
- Fixing symptoms instead of roots — increasing Node.js `--max-old-space-size` delays the crash, doesn't fix the leak

## Further Reading
- [clinic.js](https://clinicjs.org) — the fastest path to a Node.js flame graph, zero config
- [Chrome DevTools: fix memory problems](https://developer.chrome.com/docs/devtools/memory-problems) — the official guide to heap snapshots and allocation timelines
- *Node.js Design Patterns* — Mario Casciaro: Chapter on performance covers V8 internals, streams, and profiling workflow

```recall
- q: "What is a GC root, and what follows from being reachable from one?"
  must:
    - "objects that are always reachable — global scope, the active call stack"
    - "anything reachable from a GC root cannot be collected"

- q: "How do you attach a profiler to a running Node process?"
  must:
    - "start it with the `--inspect` flag"
    - "that enables the Chrome DevTools Protocol"
    - "connect Chrome DevTools to the running process"

- q: "What does a heap timeline show that a snapshot does not?"
  must:
    - "a continuous recording of memory allocation"
    - "it shows which functions allocate the most"
```
