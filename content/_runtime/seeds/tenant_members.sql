-- Shared seed for the P10 SQL-runner pilot lessons (database-caching-performance
-- 16, 17, 18). Same tenants/users/tenant_members domain those lessons already
-- use in prose — "50 tenants with their owners" is lesson 16's own N+1 example.
--
-- generate_series() builds real row counts from a few hundred bytes of SQL —
-- the seed file itself stays tiny (well under the 50 KB cap enforced at build
-- time) while genuinely creating tens of thousands of rows inside the
-- reader's own browser-side Postgres. ANALYZE at the end is what makes the
-- planner's row estimates in EXPLAIN meaningful instead of a cold default.

CREATE TABLE tenants (
  id serial PRIMARY KEY,
  name text NOT NULL
);

CREATE TABLE users (
  id serial PRIMARY KEY,
  email text NOT NULL,
  display_name text NOT NULL
);

CREATE TABLE tenant_members (
  id serial PRIMARY KEY,
  tenant_id integer NOT NULL REFERENCES tenants(id),
  user_id integer NOT NULL REFERENCES users(id),
  role text NOT NULL,
  status text NOT NULL,
  last_active_at timestamp NOT NULL
);

INSERT INTO tenants (name)
SELECT 'Tenant ' || i
FROM generate_series(1, 400) AS i;

INSERT INTO users (email, display_name)
SELECT 'user' || i || '@example.com', 'User ' || i
FROM generate_series(1, 20000) AS i;

-- A user can belong to more than one tenant, so tenant_members rows
-- (50,000) outnumber users (20,000) — user_id is a random valid reference,
-- not generate_series' own counter, which would exceed the user id range.
INSERT INTO tenant_members (tenant_id, user_id, role, status, last_active_at)
SELECT
  (random() * 399 + 1)::integer,
  (random() * 19999 + 1)::integer,
  CASE WHEN random() < 0.05 THEN 'owner' ELSE 'member' END,
  CASE WHEN random() < 0.85 THEN 'active' ELSE 'suspended' END,
  now() - (random() * 180 || ' days')::interval
FROM generate_series(1, 50000) AS i;

ANALYZE tenants;
ANALYZE users;
ANALYZE tenant_members;
