# 86. SaaS Metrics — MRR, Churn, LTV, CAC

## Coverage Level
**Partial** — You have subscription plans with monthly/yearly pricing and trial days modeled in your schema. What you are missing is the instrumentation layer: the SQL queries that compute MRR, churn, and LTV from your existing data, and the tracking of CAC from your acquisition channels.

## What It Is
SaaS metrics are the set of financial and behavioral indicators that describe how healthy a subscription business is. Unlike one-time sales businesses, a SaaS company's financial health cannot be read from revenue alone — a business with high gross revenue but high churn is worth less than one with lower revenue and low churn, because the first business is constantly replacing customers it loses. Understanding which metrics to track and how to calculate them from your own data transforms you from a developer who builds subscription features into an operator who understands the financial machine they are running.

Monthly Recurring Revenue (MRR) is the monthly revenue from all active subscriptions, normalized to a monthly figure (so an annual subscriber paying $120/year contributes $10/month of MRR). Churn Rate is the percentage of MRR or customers lost in a period. LTV (Lifetime Value) is the average revenue a customer generates over their entire relationship with you. CAC (Customer Acquisition Cost) is how much you spend to acquire one customer. The LTV:CAC ratio is the single most important health indicator for an early SaaS — a ratio below 3:1 means you are not running a sustainable business at scale.

The advanced metric that most early-stage operators miss is **Net Revenue Retention (NRR)**. NRR measures whether existing customers are expanding their spend (upgrades, add-ons) faster than others are churning. An NRR above 100% means your existing customer base grows on its own without adding new customers — this is the defining characteristic of the most valuable SaaS businesses. Your boilerplate has tenant subscriptions, plans, and pricing tiers — the queries below let you compute all of these directly from your data.

## Key Concepts
- **MRR**: Monthly Recurring Revenue — sum of all active subscriptions normalized to monthly; the most fundamental SaaS metric
- **MRR movements**: New MRR (new customers), Expansion MRR (upgrades), Contraction MRR (downgrades), Churned MRR (cancellations), Reactivation MRR — tracking all five gives a complete picture
- **Gross Revenue Retention (GRR)**: MRR retained from existing customers, ignoring expansion; can only be ≤ 100%; shows how leaky your bucket is
- **Net Revenue Retention (NRR)**: MRR retained from existing customers including expansion; can exceed 100%; the indicator of product-led growth potential
- **Churn rate**: Monthly customer churn = customers lost / customers at start of period; monthly revenue churn = MRR lost / MRR at start of period — they differ; revenue churn matters more
- **LTV**: Average revenue per account / monthly churn rate; or average contract value × average customer lifespan
- **CAC**: Total sales and marketing spend in a period / new customers acquired in that period; for a solo operator, include your own time at your hourly rate
- **Payback period**: CAC / monthly gross profit per customer — how many months to recover the cost of acquiring a customer; target < 12 months for self-funded businesses

## Example Code or Template

```sql
-- Assumes tables: tenant_subscription (tenant_id, plan_id, status, started_at,
--   cancelled_at, billing_cycle [monthly|annual], monthly_price)
-- Adjust column names to match your actual schema

-- =========================================================
-- 1. ACTIVE MRR: Current normalized monthly revenue
-- =========================================================
SELECT
  SUM(
    CASE billing_cycle
      WHEN 'annual' THEN annual_price / 12.0
      ELSE monthly_price
    END
  ) AS current_mrr
FROM tenant_subscription
WHERE status = 'active';


-- =========================================================
-- 2. MRR MOVEMENTS: New, Expansion, Churn for a given month
-- =========================================================
WITH monthly_mrr AS (
  SELECT
    tenant_id,
    DATE_TRUNC('month', started_at) AS month_start,
    CASE billing_cycle
      WHEN 'annual' THEN annual_price / 12.0
      ELSE monthly_price
    END AS mrr
  FROM tenant_subscription
  WHERE status IN ('active', 'cancelled')
)
SELECT
  month_start,
  SUM(CASE WHEN prev_mrr IS NULL THEN mrr ELSE 0 END) AS new_mrr,
  SUM(CASE WHEN prev_mrr IS NOT NULL AND mrr > prev_mrr THEN mrr - prev_mrr ELSE 0 END) AS expansion_mrr,
  SUM(CASE WHEN prev_mrr IS NOT NULL AND mrr < prev_mrr AND mrr > 0 THEN prev_mrr - mrr ELSE 0 END) AS contraction_mrr,
  SUM(CASE WHEN mrr = 0 AND prev_mrr > 0 THEN prev_mrr ELSE 0 END) AS churned_mrr
FROM (
  SELECT
    tenant_id,
    month_start,
    mrr,
    LAG(mrr) OVER (PARTITION BY tenant_id ORDER BY month_start) AS prev_mrr
  FROM monthly_mrr
) movements
GROUP BY month_start
ORDER BY month_start;


-- =========================================================
-- 3. MONTHLY CHURN RATE (customer-based)
-- =========================================================
WITH cohort AS (
  SELECT
    DATE_TRUNC('month', started_at) AS cohort_month,
    COUNT(DISTINCT tenant_id) AS new_customers
  FROM tenant_subscription
  GROUP BY 1
),
churned AS (
  SELECT
    DATE_TRUNC('month', cancelled_at) AS churn_month,
    COUNT(DISTINCT tenant_id) AS churned_customers
  FROM tenant_subscription
  WHERE cancelled_at IS NOT NULL
  GROUP BY 1
)
SELECT
  c.cohort_month,
  c.new_customers,
  COALESCE(ch.churned_customers, 0) AS churned_customers,
  ROUND(
    COALESCE(ch.churned_customers, 0)::numeric / NULLIF(c.new_customers, 0) * 100,
    2
  ) AS monthly_churn_pct
FROM cohort c
LEFT JOIN churned ch ON ch.churn_month = c.cohort_month
ORDER BY c.cohort_month;


-- =========================================================
-- 4. LTV — Lifetime Value per plan
-- =========================================================
SELECT
  plan_id,
  AVG(
    CASE billing_cycle
      WHEN 'annual' THEN annual_price / 12.0
      ELSE monthly_price
    END
  ) AS avg_monthly_mrr,
  AVG(
    EXTRACT(EPOCH FROM (COALESCE(cancelled_at, NOW()) - started_at)) / 86400 / 30
  ) AS avg_lifespan_months,
  AVG(
    CASE billing_cycle
      WHEN 'annual' THEN annual_price / 12.0
      ELSE monthly_price
    END
  ) *
  AVG(
    EXTRACT(EPOCH FROM (COALESCE(cancelled_at, NOW()) - started_at)) / 86400 / 30
  ) AS ltv
FROM tenant_subscription
GROUP BY plan_id;


-- =========================================================
-- 5. NET REVENUE RETENTION (NRR) — month over month
-- =========================================================
WITH base AS (
  SELECT
    tenant_id,
    DATE_TRUNC('month', started_at) AS month,
    CASE billing_cycle WHEN 'annual' THEN annual_price / 12.0 ELSE monthly_price END AS mrr
  FROM tenant_subscription WHERE status IN ('active', 'cancelled')
),
compared AS (
  SELECT
    b1.month AS base_month,
    SUM(b1.mrr) AS starting_mrr,
    SUM(COALESCE(b2.mrr, 0)) AS ending_mrr
  FROM base b1
  LEFT JOIN base b2 ON b1.tenant_id = b2.tenant_id
    AND b2.month = b1.month + INTERVAL '1 month'
  GROUP BY b1.month
)
SELECT
  base_month,
  ROUND((ending_mrr / NULLIF(starting_mrr, 0)) * 100, 1) AS nrr_pct
FROM compared
ORDER BY base_month;
```

## When to Use
- At the end of every month — run MRR, churn, and NRR queries and record the output in a simple spreadsheet; this is your business dashboard
- When evaluating a new acquisition channel (e.g., LinkedIn content vs. SEO) — track CAC separately per channel and compare to average LTV to find which channel is most efficient
- When pricing a new plan tier — model the LTV impact of the new price point against expected churn rate at that price; higher price often reduces churn, increasing LTV more than proportionally
- When fundraising or seeking partnership — investors ask for MRR, churn, and NRR first; having these numbers ready and explainable signals operational maturity
- When deciding whether to invest in retention features versus acquisition features — if NRR < 90%, retention is a higher leverage investment than acquisition; the queries above give you the evidence

## Common Mistakes
- **Using gross revenue instead of MRR**: Annual subscriptions paid upfront inflate apparent revenue; always normalize to monthly to compare periods fairly
- **Customer churn vs. revenue churn**: Losing a $10/month customer and a $200/month customer both count as "1 churned customer" in customer churn rate — revenue churn rate weights them correctly and matters more
- **Ignoring free trial conversion as a metric**: If your boilerplate includes trial days, trial-to-paid conversion rate is a leading indicator of future MRR that most operators track too late
- **LTV without gross margin**: LTV calculated on revenue, not gross profit, overstates true customer value; subtract hosting, payment processing, and support costs from MRR before calculating LTV

## Further Reading
- **"SaaS Metrics 2.0" — David Skok (forentrepreneurs.com)** — The most comprehensive freely available guide to SaaS metrics; includes formulas, benchmarks, and investor expectations by stage
- **"Winning by Design" — Jacco van der Kooij** — Revenue operations framework including NRR optimization and the metrics that predict scalable growth
- **"The SaaS CFO" — Ben Murray (thesaascfo.com)** — Practical financial modeling for SaaS founders; includes downloadable spreadsheet templates for MRR tracking and cohort analysis
