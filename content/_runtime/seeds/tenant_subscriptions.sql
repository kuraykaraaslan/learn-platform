-- Seed for lesson 86 (SaaS metrics). One table, because every query in that
-- lesson reads exactly one: tenant_subscription.
--
-- Shaped so the five queries all return something worth looking at: signups
-- spread across 11 months, a mix of monthly and annual billing, and ~1 in 5
-- subscriptions cancelled a month or three after signup, so churn, cohort
-- retention and NRR have real movement rather than a wall of zeroes.
DROP TABLE IF EXISTS tenant_subscription;

CREATE TABLE tenant_subscription (
  tenant_id      int PRIMARY KEY,
  plan_id        text NOT NULL,
  status         text NOT NULL,
  started_at     timestamptz NOT NULL,
  cancelled_at   timestamptz,
  billing_cycle  text NOT NULL,
  monthly_price  numeric NOT NULL,
  annual_price   numeric NOT NULL
);

INSERT INTO tenant_subscription
  (tenant_id, plan_id, status, started_at, cancelled_at, billing_cycle, monthly_price, annual_price)
VALUES
  (1, 'scale', 'active', '2025-10-11', NULL, 'monthly', 299, 2990),
  (2, 'starter', 'active', '2025-10-24', NULL, 'monthly', 29, 290),
  (3, 'scale', 'active', '2025-10-04', NULL, 'monthly', 299, 2990),
  (4, 'pro', 'active', '2025-11-19', NULL, 'monthly', 99, 990),
  (5, 'starter', 'active', '2025-11-02', NULL, 'annual', 29, 290),
  (6, 'starter', 'active', '2025-11-03', NULL, 'monthly', 29, 290),
  (7, 'pro', 'active', '2025-12-05', NULL, 'monthly', 99, 990),
  (8, 'pro', 'active', '2025-12-14', NULL, 'monthly', 99, 990),
  (9, 'scale', 'active', '2025-12-23', NULL, 'annual', 299, 2990),
  (10, 'pro', 'active', '2026-01-24', NULL, 'monthly', 99, 990),
  (11, 'pro', 'active', '2026-01-13', NULL, 'monthly', 99, 990),
  (12, 'pro', 'cancelled', '2026-01-09', '2026-04-09', 'monthly', 99, 990),
  (13, 'pro', 'active', '2026-01-23', NULL, 'monthly', 99, 990),
  (14, 'pro', 'active', '2026-01-04', NULL, 'monthly', 99, 990),
  (15, 'starter', 'active', '2026-01-13', NULL, 'annual', 29, 290),
  (16, 'scale', 'active', '2026-02-25', NULL, 'monthly', 299, 2990),
  (17, 'scale', 'cancelled', '2026-02-26', '2026-04-26', 'annual', 299, 2990),
  (18, 'starter', 'active', '2026-02-02', NULL, 'monthly', 29, 290),
  (19, 'starter', 'active', '2026-02-13', NULL, 'monthly', 29, 290),
  (20, 'scale', 'active', '2026-03-21', NULL, 'monthly', 299, 2990),
  (21, 'scale', 'active', '2026-03-06', NULL, 'monthly', 299, 2990),
  (22, 'starter', 'active', '2026-03-24', NULL, 'monthly', 29, 290),
  (23, 'starter', 'cancelled', '2026-03-25', '2026-05-25', 'monthly', 29, 290),
  (24, 'starter', 'active', '2026-04-19', NULL, 'monthly', 29, 290),
  (25, 'pro', 'cancelled', '2026-04-14', '2026-05-14', 'monthly', 99, 990),
  (26, 'starter', 'cancelled', '2026-04-14', '2026-06-14', 'annual', 29, 290),
  (27, 'scale', 'active', '2026-04-25', NULL, 'annual', 299, 2990),
  (28, 'pro', 'active', '2026-04-09', NULL, 'monthly', 99, 990),
  (29, 'scale', 'cancelled', '2026-05-25', '2026-06-25', 'annual', 299, 2990),
  (30, 'scale', 'cancelled', '2026-05-13', '2026-06-13', 'monthly', 299, 2990),
  (31, 'scale', 'active', '2026-05-06', NULL, 'monthly', 299, 2990),
  (32, 'pro', 'active', '2026-05-26', NULL, 'annual', 99, 990),
  (33, 'starter', 'active', '2026-06-15', NULL, 'annual', 29, 290),
  (34, 'scale', 'active', '2026-06-21', NULL, 'annual', 299, 2990),
  (35, 'pro', 'active', '2026-06-11', NULL, 'annual', 99, 990),
  (36, 'scale', 'active', '2026-07-02', NULL, 'monthly', 299, 2990),
  (37, 'scale', 'active', '2026-07-05', NULL, 'monthly', 299, 2990),
  (38, 'scale', 'active', '2026-07-18', NULL, 'monthly', 299, 2990),
  (39, 'scale', 'active', '2026-07-16', NULL, 'annual', 299, 2990),
  (40, 'scale', 'active', '2026-07-04', NULL, 'monthly', 299, 2990),
  (41, 'scale', 'active', '2026-08-23', NULL, 'monthly', 299, 2990),
  (42, 'scale', 'active', '2026-08-23', NULL, 'monthly', 299, 2990),
  (43, 'pro', 'active', '2026-08-08', NULL, 'annual', 99, 990),
  (44, 'starter', 'active', '2026-08-18', NULL, 'monthly', 29, 290);
