# 130. Data Structures & Algorithms in Practice — Trees, Graphs, Sorting, Recursion

## What It Is
Most application-level "algorithms" work reduces to recognizing which of a handful of standard shapes a problem fits, then applying the structure that matches. A comment thread with replies-to-replies is a **tree** — traverse it depth-first if you want a single flattened conversation order, breadth-first if you want it level by level (e.g. "show 2 levels of replies"). A permission system where roles inherit from other roles is a **graph** — walking inherited permissions is graph traversal with cycle-detection as a real concern. Category hierarchies, org charts, and file systems are all trees wearing different names.

**Recursion** is the natural way to walk these structures: a function that calls itself on a smaller sub-problem, with a base case that stops it. The two things that make recursion fail are the same two things every time: a missing or unreachable base case (stack overflow), and redoing overlapping work exponentially (fixed by memoization — see #69). **Binary search** is the other workhorse — O(log n) instead of O(n) — but it has one precondition people forget: the data must already be sorted (or otherwise monotonic) along the dimension you're searching.


```quiz
- q: "Binary search returns -1 for a value you can see in the array. What is the most likely cause?"
  anchor: "the data must already be sorted (or otherwise monotonic) along the dimension you're searching"
  options:
    - text: "An off-by-one in the loop bounds"
      correct: false
      why: "Possible in general, but the precondition is the far more common cause and it fails exactly this way \u2014 a confident wrong answer, not a crash."
    - text: "The array is not sorted along the dimension being searched"
      correct: true
      why: "Binary search assumes monotonic order. Nothing checks it, so unsorted (or descending) input makes it discard the half that holds the target."
    - text: "The array is too small for binary search to work"
      correct: false
      why: "It works at any size, down to one element. Size is not a precondition; order is."

- q: "Which two failure modes does the lesson name for recursion?"
  anchor: "a missing or unreachable base case (stack overflow)"
  options:
    - text: "Too many parameters, and too much memory per frame"
      correct: false
      why: "Neither is what the lesson names. Frame size matters only once the recursion is already running away."
    - text: "A missing or unreachable base case, and redoing overlapping work exponentially"
      correct: true
      why: "Those are the two, every time: the first blows the stack, the second is fixed by memoization."
    - text: "Mutating shared state, and forgetting to return a value"
      correct: false
      why: "Both are ordinary bugs that recursion does not cause. The lesson names termination and overlapping subproblems."
```

## Key Concepts
- **Tree traversal**: DFS (pre/in/post-order) goes deep before wide, good for "flatten this hierarchy"; BFS goes level by level, good for "shortest path" or "first N levels"
- **Graph representation**: adjacency list (map of node → neighbors) is the default for sparse graphs; adjacency matrix for dense ones
- **Recursion**: base case + recursive case + trust that the smaller call works — the call stack cost is real for deep trees
- **Binary search**: O(log n), but only valid on sorted/monotonic data — check the precondition before reaching for it
- **When a hash map beats a tree**: if you only need lookup-by-key with no ordering requirement, `Map` (O(1)) beats a search tree (O(log n))

## Example Code
```typescript
// DFS over a nested category tree — the recursive shape most hierarchical UI data takes
interface Category {
  id: string;
  name: string;
  children: Category[];
}

function flattenDepthFirst(node: Category, depth = 0): { id: string; name: string; depth: number }[] {
  const result = [{ id: node.id, name: node.name, depth }];
  for (const child of node.children) {
    result.push(...flattenDepthFirst(child, depth + 1)); // recursive case
  }
  return result; // base case is implicit: no children means the loop just doesn't run
}

// Iterative BFS — level by level, useful when you need "first 2 levels only" without walking the whole tree
function flattenBreadthFirst(root: Category): Category[] {
  const result: Category[] = [];
  const queue: Category[] = [root];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    queue.push(...node.children);
  }
  return result;
}
```

Binary search's one precondition, run for real: the same ten numbers ascending and descending, searching for a value that is present in both. Predict whether the second search finds it before revealing the probes.

```proof sha=257fc432dcdb3117 at=2026-09-02 commit=9614387
$ node search.js
--- searching for 72 in the ascending array ---
  [2, 5, 8, 12, 16, 23, 38, 56, 72, 91]
  probe index 4 -> 16
  probe index 7 -> 56
  probe index 8 -> 72
  result: found at index 8
  is 72 actually in this array? true

--- searching for 72 in the descending array ---
  [91, 72, 56, 38, 23, 16, 12, 8, 5, 2]
  probe index 4 -> 23
  probe index 7 -> 8
  probe index 8 -> 5
  probe index 9 -> 2
  result: not found (-1)
  is 72 actually in this array? true

both arrays hold the same ten numbers, and both are sorted —
but binary search assumes ascending, so the second one silently misses.
it returns -1 rather than raising: the precondition is never checked.
```

## When to Use
- Modeling any hierarchical domain data (categories, comment threads, org structures, nested permissions)
- Choosing DFS when order/flattening matters, BFS when "closest/shallowest first" matters
- Reaching for binary search only after confirming the data is sorted along the search dimension — otherwise sort it first or use a different structure

## Common Mistakes
- Recursion with no reachable base case, or a base case that's technically reachable but only after an impractically deep call stack
- Using linear array search (`.find()`, `.includes()`) inside a loop over hierarchical data instead of building an index first
- Reinventing a graph traversal with ad-hoc nested loops instead of a standard BFS/DFS, missing cycle detection and reprocessing the same node repeatedly
- Applying binary search to unsorted data, silently getting wrong results instead of an error

## Further Reading
- "Grokking Algorithms" by Aditya Bhargava — approachable, visual, covers exactly this territory
- "Algorithms, 4th Edition" by Sedgewick & Wayne (algs4.cs.princeton.edu — free online)
- visualgo.net — interactive visualizations of tree/graph traversal and sorting

```recall
- q: "Before reaching for binary search, what must you confirm, and what happens if you skip it?"
  must:
    - "the data must already be sorted along the dimension you are searching"
    - "nothing checks the precondition at runtime"
    - "it returns not-found for a value that is present, rather than raising"

- q: "Which standard shape does a comment thread with nested replies fit, and how do the two traversals differ?"
  must:
    - "it is a tree"
    - "depth-first gives a single flattened conversation order"
    - "breadth-first gives it level by level, for showing N levels of replies"

- q: "What are the two ways recursion fails, and the fix for each?"
  must:
    - "a missing or unreachable base case, which overflows the stack"
    - "redoing overlapping work exponentially, fixed by memoization"
```
