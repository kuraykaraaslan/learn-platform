# 130. Data Structures & Algorithms in Practice — Trees, Graphs, Sorting, Recursion

## Coverage Level
**Not assessed** — added during the roadmap gap review. Big O Analysis (#68) covers *measuring* complexity; this is the layer of actual structures/algorithms it's measuring. Self-check: could you traverse a nested comment thread without looking up "tree traversal" first?

## What It Is
Most application-level "algorithms" work reduces to recognizing which of a handful of standard shapes a problem fits, then applying the structure that matches. A comment thread with replies-to-replies is a **tree** — traverse it depth-first if you want a single flattened conversation order, breadth-first if you want it level by level (e.g. "show 2 levels of replies"). A permission system where roles inherit from other roles is a **graph** — walking inherited permissions is graph traversal with cycle-detection as a real concern. Category hierarchies, org charts, and file systems are all trees wearing different names.

**Recursion** is the natural way to walk these structures: a function that calls itself on a smaller sub-problem, with a base case that stops it. The two things that make recursion fail are the same two things every time: a missing or unreachable base case (stack overflow), and redoing overlapping work exponentially (fixed by memoization — see #69). **Binary search** is the other workhorse — O(log n) instead of O(n) — but it has one precondition people forget: the data must already be sorted (or otherwise monotonic) along the dimension you're searching.

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
