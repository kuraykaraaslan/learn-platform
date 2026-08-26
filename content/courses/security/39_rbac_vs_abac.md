# 39. RBAC vs ABAC

## Coverage Level
**Covered** — You have a clean RBAC implementation: `TenantMemberRole` (OWNER / ADMIN / USER) controls access within a tenant, and a separate system-level `userRole` (USER / ADMIN) handles platform-level separation. System admins bypass tenant membership checks. Role-based guards wrap your service methods and API routes. This is RBAC done correctly for your current scale. What follows explains why RBAC is the right choice now, what ABAC is, and the specific patterns that indicate when your authorization model will need to grow.

## What It Is
RBAC (Role-Based Access Control) assigns permissions to roles, and users are assigned roles. A user with the ADMIN role inherits all permissions that the ADMIN role grants. The model is simple, easy to audit ("what can an ADMIN do?"), and covers the vast majority of authorization requirements for SaaS applications. The limitation of RBAC is that roles are global to a context: an ADMIN can either do X or cannot do X; you cannot express "ADMIN can do X but only on resources they created" or "USER can do X but only during business hours" without adding special-case logic that pollutes the role model.

ABAC (Attribute-Based Access Control) evaluates policies against attributes of the subject (user), resource (the thing being accessed), action (what is being done), and environment (time, IP, tenant context). Instead of checking "is this user an ADMIN?", an ABAC policy checks "is the user's department == the resource's department AND the current time is within business hours AND the resource is not marked confidential?". This expresses arbitrarily complex authorization rules cleanly. The tradeoff is that ABAC policies are harder to reason about, harder to audit, and harder to debug than role assignments.

For your SaaS, you are currently at the right level of abstraction. You have RBAC within tenants and RBAC at the system level. The pressure toward ABAC will come when customers ask for: resource-level permissions ("this team member can only access project A, not project B"), time-based restrictions ("users can only log in during business hours"), or context-sensitive rules ("an ADMIN cannot delete resources created by the OWNER"). These are ABAC characteristics. You can often satisfy them with RBAC extensions (adding more granular roles, or explicit resource ownership checks) before needing a full ABAC engine.

## Key Concepts
- **RBAC** — Permissions assigned to roles; users assigned to roles; simple, auditable, correct for 80% of SaaS use cases
- **Role hierarchy** — OWNER > ADMIN > USER; higher roles inherit lower role permissions (you implement this correctly with explicit guards)
- **System vs tenant role separation** — System ADMIN and tenant OWNER are distinct concepts in your model; this prevents privilege escalation across the tenant boundary
- **ABAC** — Policy evaluated against (subject, resource, action, environment) attributes; expressive but complex
- **ReBAC (Relationship-Based Access Control)** — A variant of ABAC where access depends on the graph of relationships between users and resources; used by Google (Zanzibar), Airbnb, and GitHub for fine-grained repo permissions
- **Permission matrix** — A table mapping roles to permitted actions on resource types; the simplest way to document and audit your RBAC
- **Principle of least privilege** — Assign the minimum role required; avoid creating "super roles" that span multiple unrelated permissions
- **Policy enforcement point (PEP)** — Where the authorization check happens; in your codebase, this is your service layer and route wrappers

## Example Code
```typescript
// Your current RBAC — solid foundation
// modules/tenant_member/tenant_member.enums.ts (you have this)
export type TenantMemberRole = 'OWNER' | 'ADMIN' | 'USER';

// Role hierarchy: any role at or above the required level passes
const ROLE_HIERARCHY: Record<TenantMemberRole, number> = {
  USER: 1,
  ADMIN: 2,
  OWNER: 3,
};

export function hasRequiredRole(
  userRole: TenantMemberRole,
  requiredRole: TenantMemberRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

// ─── Permission matrix — document what each role can do ───────────────────

type Action = 'read' | 'write' | 'delete' | 'invite' | 'manage_billing';
type Resource = 'member' | 'project' | 'billing' | 'settings' | 'audit_log';

type PermissionMatrix = Record<TenantMemberRole, Partial<Record<Resource, Action[]>>>;

const PERMISSIONS: PermissionMatrix = {
  USER: {
    member: ['read'],
    project: ['read', 'write'],
  },
  ADMIN: {
    member: ['read', 'write', 'invite'],
    project: ['read', 'write', 'delete'],
    settings: ['read', 'write'],
    audit_log: ['read'],
  },
  OWNER: {
    member: ['read', 'write', 'invite', 'delete'],
    project: ['read', 'write', 'delete'],
    billing: ['read', 'write', 'manage_billing'],
    settings: ['read', 'write'],
    audit_log: ['read'],
  },
};

export function canPerform(
  role: TenantMemberRole,
  resource: Resource,
  action: Action
): boolean {
  return PERMISSIONS[role][resource]?.includes(action) ?? false;
}

// ─── ABAC extension: resource ownership check ─────────────────────────────
// This is the pattern you will reach for first before a full ABAC engine.
// "A USER can delete a project only if they are the project creator."

interface Project {
  projectId: string;
  createdByUserId: string;
  tenantId: string;
}

function canDeleteProject(
  userId: string,
  role: TenantMemberRole,
  project: Project
): boolean {
  // OWNER and ADMIN can delete any project
  if (hasRequiredRole(role, 'ADMIN')) return true;
  // USER can delete only their own projects
  return project.createdByUserId === userId;
}

// ─── When ABAC becomes justified: a Cedar/OPA policy example ──────────────
// This is what a proper ABAC policy looks like in Cedar (AWS Verified Permissions):
/*
permit (
  principal is TenantMember,
  action == Action::"delete",
  resource is Project
)
when {
  principal.role == "OWNER" ||
  (principal.role == "ADMIN" && principal.tenantId == resource.tenantId) ||
  (principal.userId == resource.createdByUserId && resource.status != "locked")
};
*/
// You do not need this yet — but if you have 10+ conditional permission rules,
// evaluate AWS Verified Permissions or OpenFGA (Google Zanzibar OSS) instead
// of adding more if/else to your service layer.
```

## When to Use
- **RBAC** — Always start here; it covers team membership, billing access, settings access, and most administrative operations in a SaaS
- **RBAC extensions** — Add resource-ownership checks and explicit permission columns before reaching for a full ABAC engine
- **ABAC** — When customers require resource-level permissions (user A can see project X but not project Y within the same tenant), or when authorization rules involve more than 3-4 conditions
- **ReBAC (Zanzibar-style)** — When your access model is fundamentally a graph: "can this user access this document given the folder hierarchy and team memberships?"

## Common Mistakes
- **Role explosion** — Creating ADMIN_WITH_BILLING, ADMIN_WITHOUT_BILLING, MANAGER_READ_ONLY etc.; a sign that ABAC attributes would be cleaner than more roles
- **Bypassing the role check in "emergency" situations** — Commented-out authorization guards accumulate and become permanent security gaps
- **Checking roles in the UI only** — The UI might hide the "Delete" button for non-OWNERs, but if the API route does not also check, a direct API call bypasses it; enforce at the service/route layer, not only in the UI
- **System admin can access all tenant data without tenant role** — Your design already handles this correctly (system ADMIN bypasses tenant membership check), but it means system admin accounts are high-value targets that deserve extra protection (MFA, impersonation audit log)

## Further Reading
- [OWASP Authorization Testing Guide](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/)
- [Google Zanzibar — ReBAC at scale (paper)](https://research.google/pubs/pub48190/)
- [OpenFGA — open-source Zanzibar implementation](https://openfga.dev/)
