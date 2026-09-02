# 138. Frontend State Management Architecture — Client vs Server State

## What It Is
The single most common frontend architecture mistake is treating all state the same way. **Server state** — data that actually lives in a database and is merely cached on the client (a list of projects, a user profile) — has a fundamentally different lifecycle than **client UI state** — state that only exists in the browser and has no server counterpart (a modal being open, a form draft, a selected tab). Server state needs caching, revalidation, background refetching, and de-duplication of concurrent requests for the same data; a library like React Query or SWR exists specifically to solve that problem, and reimplementing it with `useState` + `useEffect` recreates its hardest bugs (race conditions between stale and fresh responses, no cache, no retry) from scratch.

**URL state** is the third, often-forgotten category: anything that should survive a page refresh or be shareable via link — a search filter, the current page number, a selected tab — belongs in the URL's search params, not in a `useState` that vanishes on reload. The practical architecture question for any new piece of state is simply "which of these three is this?", and most unnecessary global-store complexity comes from skipping that question and defaulting everything into one big client-side store.

```quiz
- q: "You fetch the user list with React Query and also mirror it into Zustand for convenience. What did that create?"
  anchor: "it goes stale independently of the cache that's supposed to manage it"
  options:
    - text: "A faster read path, at the cost of a little memory"
      correct: false
      why: "And a second source of truth that goes stale independently of the cache meant to manage it."
    - text: "A duplicate source of truth that goes stale on its own"
      correct: true
      why: "The cache's revalidation no longer reaches the copy people are actually reading."
    - text: "Nothing — Zustand subscribes to the query cache automatically"
      correct: false
      why: "It does not. Mirroring is a manual copy, and it stays a copy."

- q: "A filter the user should be able to bookmark and send to a colleague. Where does it live?"
  anchor: "anything that should survive refresh or be shareable — belongs in search params, not component state"
  options:
    - text: "In a global store, so any component can read it"
      correct: false
      why: "A global store does not survive a refresh, and there is nothing to paste into a message."
    - text: "In the URL's search params"
      correct: true
      why: "That is what URL state means: survives a refresh, and can be shared."
    - text: "In `localStorage`, so it survives a refresh"
      correct: false
      why: "It survives and is still not shareable — and it silently differs per browser."

- q: "A piece of state is used by exactly one component. Where does it go?"
  anchor: "lifting to a global store is a deliberate escalation, not a default"
  options:
    - text: "The global store — something else may need it later"
      correct: false
      why: "Lifting is a deliberate escalation, not a default. Move it when a second consumer actually exists."
    - text: "In that component — state lives as close as possible to where it is used"
      correct: true
      why: "Colocation is the default; the global store is what you escalate to."
    - text: "In the URL, since that is the most durable place"
      correct: false
      why: "URL state is for what should survive a refresh or be shareable, not for everything."
```

## Key Concepts
- **Server state**: owned by the backend, client only holds a cache — needs revalidation, not just storage (React Query, SWR)
- **Client UI state**: exists only in the browser, no server counterpart — `useState`/`useReducer`/a lightweight store (Zustand) is enough
- **URL state**: anything that should survive refresh or be shareable — belongs in search params, not component state
- **Colocation**: state should live as close as possible to where it's used; lifting to a global store is a deliberate escalation, not a default
- **Avoiding duplicate sources of truth**: don't copy server state into a global client store — it goes stale independently of the cache that's supposed to manage it

## Example Code
```typescript
// Server state: React Query owns caching, revalidation, loading/error states — don't reimplement this
function useProjects(status?: string) {
  return useQuery({
    queryKey: ["projects", status],
    queryFn: () => fetch(`/api/projects?status=${status ?? ""}`).then((r) => r.json()),
    staleTime: 30_000,
  });
}

// Client UI state: no server counterpart, a plain store or useState is enough — no need for React Query here
const useUiStore = create<{ isSidebarOpen: boolean; toggleSidebar: () => void }>((set) => ({
  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
}));

// URL state: the filter survives refresh and is shareable via link — it belongs in search params
function useStatusFilter() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const status = searchParams.get("status") ?? "all";
  const setStatus = (next: string) => router.push(`?status=${next}`);
  return [status, setStatus] as const;
}
```

## When to Use
- Deciding where new state belongs — ask "is this from the server, is it UI-only, or should it survive a refresh/be shareable" before reaching for any library
- Any component tree beyond trivial single-component state, where prop drilling is starting to hurt
- Migrating away from putting fetched data into `useState` + `useEffect`, which recreates caching/race-condition bugs a data-fetching library already solved

## Common Mistakes
- Copying server data into a global client store (Redux/Zustand) — it duplicates React Query/SWR's job and goes stale independently of the actual cache
- Reaching for a global state library before `useState`/`useContext` has been shown to be actually insufficient
- Storing derived state (a filtered/sorted list) instead of computing it from the source state on render, causing the two to drift out of sync
- Putting filter/pagination state in component state instead of the URL, so a refresh or shared link loses it

## Further Reading
- [Practical React Query — TkDodo](https://tkdodo.eu/blog/practical-react-query) — from a React Query maintainer; the series on defaults and query keys is the useful part
- Kent C. Dodds — "State Colocation will make your React app faster"
- [TanStack Query](https://tanstack.com/query/latest) and [Zustand](https://zustand.docs.pmnd.rs/) — server state and client state, kept deliberately separate

```recall
- q: "What is server state, and what does it need?"
  must:
    - "owned by the backend, with the client holding only a cache"
    - "it needs revalidation, not merely storage"
    - "React Query, SWR"

- q: "What is client UI state, and what suffices for it?"
  must:
    - "it exists only in the browser, with no server counterpart"
    - "`useState`, `useReducer`, or a lightweight store such as Zustand is enough"

- q: "Where does URL state belong, and what is colocation?"
  must:
    - "anything that should survive a refresh or be shareable belongs in search params, not component state"
    - "state should live as close as possible to where it is used"
    - "lifting to a global store is a deliberate escalation, not a default"
```
