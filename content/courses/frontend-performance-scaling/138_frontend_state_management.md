# 138. Frontend State Management Architecture — Client vs Server State

## Coverage Level
**Not assessed** — added during the roadmap gap review. React Server Components (#23) and Streaming SSR (#26) cover where rendering happens; this covers the state architecture layer that sits on top once the page is interactive — never addressed directly.

## What It Is
The single most common frontend architecture mistake is treating all state the same way. **Server state** — data that actually lives in a database and is merely cached on the client (a list of projects, a user profile) — has a fundamentally different lifecycle than **client UI state** — state that only exists in the browser and has no server counterpart (a modal being open, a form draft, a selected tab). Server state needs caching, revalidation, background refetching, and de-duplication of concurrent requests for the same data; a library like React Query or SWR exists specifically to solve that problem, and reimplementing it with `useState` + `useEffect` recreates its hardest bugs (race conditions between stale and fresh responses, no cache, no retry) from scratch.

**URL state** is the third, often-forgotten category: anything that should survive a page refresh or be shareable via link — a search filter, the current page number, a selected tab — belongs in the URL's search params, not in a `useState` that vanishes on reload. The practical architecture question for any new piece of state is simply "which of these three is this?", and most unnecessary global-store complexity comes from skipping that question and defaulting everything into one big client-side store.

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
- TkDodo (React Query maintainer) — "Practical React Query" blog series (tkdodo.eu/blog)
- Kent C. Dodds — "State Colocation will make your React app faster"
- TanStack Query and Zustand official documentation
