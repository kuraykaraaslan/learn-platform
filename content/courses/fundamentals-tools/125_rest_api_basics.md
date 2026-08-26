# 125. REST API Basics — Resource & CRUD Design

## Coverage Level
**Not assessed** — added during the roadmap gap review. This is the prerequisite beneath API Design Philosophy (#107) and API Versioning Strategies (#9). Self-check: could you design the URL/method pairs for a new resource without reaching for an example to copy?

## What It Is
REST's core idea is modeling your domain as **resources** (nouns — `projects`, `invoices`, `users`) reachable by URL, and using HTTP methods to express the *action* on that resource instead of encoding the verb into the URL. A collection endpoint (`/projects`) represents the set; an item endpoint (`/projects/{id}`) represents one member. CRUD maps onto this almost mechanically: create is POST to the collection, read is GET on either, update is PUT/PATCH on the item, delete is DELETE on the item.

Where it gets real is nesting and filtering. A resource that only makes sense inside another (`/projects/{id}/tasks`) should be nested; a resource that's independently addressable (`/tasks/{id}` also works standalone) usually shouldn't be forced under a parent everywhere. Filtering, sorting, and pagination belong in query parameters (`?status=open&sort=-createdAt&page=2`), not in the path — the path identifies *what* resource, the query string narrows *which* of them.

## Key Concepts
- **Nouns, not verbs**: `/api/projects`, not `/api/getProjects` or `/api/createProject`
- **Collection vs item**: `POST /projects` creates; `GET/PUT/PATCH/DELETE /projects/{id}` acts on one
- **Nesting**: only when the child is meaningless without the parent (`/projects/{id}/tasks`)
- **Query params for filtering/sorting/pagination**: never encode these into the path
- **Response envelope consistency**: pick one shape (`{ data, meta }` or bare resource) and use it everywhere
- **Status codes as part of the contract**: 201 for created (with a `Location` header), 204 for a successful delete with no body, 422 for validation errors

## Example Code
```typescript
// app/api/projects/route.ts — collection endpoint
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const projects = await prisma.project.findMany({ where: { status } });
  return Response.json({ data: projects });
}

export async function POST(req: Request) {
  const body = await req.json();
  const project = await prisma.project.create({ data: body });
  return Response.json({ data: project }, { status: 201 });
}

// app/api/projects/[id]/route.ts — item endpoint
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json();
  const project = await prisma.project.update({ where: { id: params.id }, data: body });
  return Response.json({ data: project });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await prisma.project.delete({ where: { id: params.id } });
  return new Response(null, { status: 204 });
}
```

## When to Use
- Any new API surface — decide the resource model before writing route handlers
- An action that doesn't map cleanly to CRUD (e.g. "archive project") — model it as a sub-resource or state field (`PATCH /projects/{id}` with `{ status: "archived" }`), not a verb-shaped endpoint, unless it's genuinely a command (`POST /projects/{id}/archive` is acceptable for non-CRUD actions)
- Designing filtering/pagination from the start, even for an endpoint with little data today

## Common Mistakes
- Verb-based URLs (`/api/getUser`, `/api/updateProject`) that fight the HTTP method instead of using it
- Inconsistent pluralization or casing across endpoints (`/project` here, `/Users` there)
- Mixing RPC-style actions into REST resources without naming them clearly as commands
- Ignoring pagination until a collection has grown large enough that `GET /projects` is a production incident

## Further Reading
- "REST API Design Rulebook" by Mark Massé
- Microsoft REST API Guidelines (github.com/microsoft/api-guidelines)
- Roy Fielding's dissertation, chapter 5 (the original source — dense, but worth skimming once)
