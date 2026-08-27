# 103. Browser Internals — Rendering Pipeline, V8, Event Loop, Memory

## What It Is
The browser is a deterministic machine with a well-documented execution model. When you don't understand it, you write code that works fine at small scale and degrades unpredictably under real usage — layout thrashing, 300 ms frame drops on scroll, hidden memory leaks that crash long-lived tabs. Understanding the rendering pipeline, event loop, and V8 optimization model turns "it feels slow" into a specific, fixable diagnosis.

The **critical rendering path** is the sequence of steps the browser takes to convert HTML/CSS/JS bytes into pixels. In order: parse HTML into DOM, parse CSS into CSSOM, combine into Render Tree (only visible nodes), calculate geometry in Layout, determine which elements go where in z-order during Paint, and finally Composite layers into the final frame. JavaScript execution and style recalculations block this pipeline. React's reconciler and Next.js RSC both exist to minimize how often you trigger the expensive middle stages.

The **event loop** is the scheduler that decides what executes when. It is not a single queue — there is a macrotask queue (setTimeout, setInterval, I/O callbacks, UI events), a microtask queue (Promise resolutions, queueMicrotask), and animation frame callbacks (requestAnimationFrame). Microtasks run to completion before the next macrotask. A chain of resolved Promises that triggers more resolved Promises can starve the macrotask queue — and therefore starve the UI — even with no infinite loop.

## Key Concepts
- **Layout thrashing**: Reading a layout property (`offsetWidth`, `getBoundingClientRect`) immediately after a DOM write forces the browser to synchronously flush pending style calculations — you've turned an async batched operation into a synchronous one per loop iteration.
- **Composite-only properties**: `transform` and `opacity` can be animated by the compositor thread without triggering Layout or Paint. Animating `width`, `top`, or `background-color` does trigger those stages — always prefer `transform: translateX()` over `left`.
- **Macrotask vs. microtask**: `setTimeout(fn, 0)` queues a macrotask (runs after rendering). `Promise.resolve().then(fn)` queues a microtask (runs before next macrotask, before any rendering). Use `queueMicrotask` to defer cheaply; use `setTimeout` to yield to the renderer.
- **V8 hidden classes (shapes)**: V8 creates a hidden class for each unique object property shape. Adding properties in different orders creates different hidden classes and prevents inline cache optimization. Always initialize object shapes consistently.
- **Inline caches (ICs)**: V8 caches the property lookup path for a given call site. If the same call site sees objects of different shapes ("megamorphic"), the IC degrades and falls back to slower hash-map lookup.
- **Flame graph anatomy**: The x-axis is time (wider = more time spent), the y-axis is call stack depth (taller = deeper calls). The actionable insight is wide, flat bars near the bottom of a hot path — that's your bottleneck function.
- **Retained size vs. shallow size**: In a heap snapshot, shallow size is the object itself. Retained size is everything that would be freed if this object were garbage collected. A 48-byte object with a 40 MB retained size is holding a reference tree.
- **Long Tasks**: Any script execution that exceeds 50 ms blocks the main thread and is visible as jank. The Long Tasks API and PerformanceObserver flag these for you.

## Example Code

```typescript
// --- 1. Layout thrashing — the problem and fix ---

// BAD: reads and writes interleaved — forces synchronous layout per element
function badResize(elements: HTMLElement[]): void {
  elements.forEach((el) => {
    const width = el.offsetWidth; // READ — forces layout flush
    el.style.width = width * 1.2 + "px"; // WRITE
    // Next iteration: READ again on dirty layout — another forced flush
  });
}

// GOOD: batch all reads, then all writes
function goodResize(elements: HTMLElement[]): void {
  const widths = elements.map((el) => el.offsetWidth); // all READs first
  elements.forEach((el, i) => {
    el.style.width = widths[i] * 1.2 + "px"; // all WRITEs second
  });
}

// --- 2. Microtask vs. macrotask scheduling ---

function demonstrateEventLoop(): void {
  console.log("1 — sync");

  setTimeout(() => console.log("2 — macrotask (setTimeout 0)"), 0);

  Promise.resolve()
    .then(() => console.log("3 — microtask (Promise)"))
    .then(() => console.log("4 — microtask chained"));

  queueMicrotask(() => console.log("5 — microtask (queueMicrotask)"));

  console.log("6 — sync");
  // Output order: 1, 6, 3, 5, 4, 2
  // Microtasks (3, 5, 4) all run before the macrotask (2)
}

// --- 3. V8 hidden class / shape stability ---

// BAD: different insertion order = different hidden class = IC miss
function createBadUser(admin: boolean) {
  const user: Record<string, unknown> = { name: "Alice" };
  if (admin) user.role = "admin"; // conditional property → polymorphic shape
  user.email = "alice@example.com";
  return user;
}

// GOOD: always create same shape, use null/undefined for absent values
function createGoodUser(admin: boolean) {
  return {
    name: "Alice",
    role: admin ? "admin" : null, // same shape, different value
    email: "alice@example.com",
  };
}

// --- 4. Reading a DevTools Performance flame graph ---
// (Conceptual guide, not executable code)
//
// 1. Record > click "Record" > do the interaction > "Stop"
// 2. Look at the "Main" track. Find the red triangle bars — those are Long Tasks.
// 3. Click a Long Task. Bottom-up view shows the hottest self-time functions.
// 4. In the flame graph, the widest bar that is lowest in the stack is your target.
//    e.g., a wide "processItems" block means that function itself is slow,
//    not a callee. A wide "renderList" with a wide callee "reconcileChildren"
//    means React is doing heavy work — check for unnecessary re-renders first.
// 5. Check "Layout" and "Recalculate Style" events — if they appear repeatedly
//    in tight loops, you have thrashing.
```

## When to Use
- **Profiling perceived performance**: Before reaching for virtualization or memoization, record a DevTools Performance trace and identify the actual bottleneck — it's rarely where you guess.
- **Diagnosing jank during scroll/animation**: If `requestAnimationFrame` callbacks are taking >16 ms (60 fps budget), the flame graph will show you exactly what's eating that budget.
- **Memory leak investigation**: When a long-running tab's memory grows continuously (visible in the DevTools Memory timeline), take heap snapshots before and after the suspected action, compare retained objects.
- **Optimizing React renders**: Hidden-class instability often manifests as slow object diffing in React's reconciler. Stable prop shapes help V8 optimize the comparison.
- **SSR vs. CSR cost analysis**: Understanding that hydration runs on the main thread helps you justify Server Components — they move rendering cost off the client's event loop entirely.

## Common Mistakes
- **Animating layout-triggering properties**: Using CSS `transition: width 0.3s` triggers Layout on every frame. Use `transform: scaleX()` instead — it runs on the compositor thread and never touches Layout.
- **Unresolved Promise chains blocking render**: A tight loop of `await someInstantPromise()` drains the microtask queue and starves `requestAnimationFrame`. If you're doing CPU work across ticks, use `setTimeout(fn, 0)` to yield to the renderer between chunks.
- **Forgetting to remove event listeners**: `addEventListener` on a DOM element keeps the callback and its closure in memory as long as the element exists. In single-page apps, components that add listeners on `window` or `document` and don't remove them on unmount are a classic source of memory leaks.
- **Reading heap snapshot shallow size**: Engineers see "this object is only 200 bytes" and conclude there's no leak. Always check retained size — a small object holding a reference to a large array or closure keeps the entire subtree alive.

## Further Reading
- [Google: Critical Rendering Path](https://web.dev/articles/critical-rendering-path) — the authoritative walkthrough with diagrams
- [Jake Archibald: Tasks, microtasks, queues and schedules](https://jakearchibald.com/2015/tasks-microtasks-queues-and-schedules/) — the clearest event loop explainer written
- [V8: Shapes and Inline Caches](https://v8.dev/blog/shapes-and-inline-caches) — official V8 blog post, directly relevant to how TypeScript objects compile
- [HTML Standard — parsing](https://html.spec.whatwg.org/multipage/parsing.html) — the normative tokenizer and tree-construction algorithm every browser implements
