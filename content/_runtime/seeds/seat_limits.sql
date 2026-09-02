-- Seed for the optimistic-locking lesson (database-advanced 42). The seat-limit
-- race is that lesson's own opening example: "transaction A reads 4 of 5 seats
-- used, transaction B reads 4 of 5 seats used, both add a member".
--
-- A `version` column is the whole mechanism under test, so it is part of the
-- schema rather than something the fence has to add. generate_series() keeps
-- the file tiny (far under the 50 KB cap) while still producing enough rows
-- that the reader can experiment on tenants other than the one in the example.

CREATE TABLE tenant_plans (
  tenant_id  integer PRIMARY KEY,
  plan       text    NOT NULL,
  seat_limit integer NOT NULL,
  seats_used integer NOT NULL,
  version    integer NOT NULL DEFAULT 1
);

INSERT INTO tenant_plans (tenant_id, plan, seat_limit, seats_used)
SELECT
  i,
  CASE WHEN i % 10 = 0 THEN 'scale' ELSE 'team' END,
  5,
  4
FROM generate_series(1, 200) AS i;

ANALYZE tenant_plans;
