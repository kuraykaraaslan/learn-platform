# 92. Analytics Integration — Event Design, Funnel Analysis

## What It Is
Product analytics is the practice of tracking user behavior in your application — what actions they take, in what sequence, with what frequency — so you can make decisions about what to build, what to fix, and what to remove. It is distinct from infrastructure monitoring (which tracks error rates and latency) and business metrics (which track revenue). Analytics answers the question "what are users actually doing?" which often differs significantly from what you and your clients assume they are doing.

The foundation of analytics is event design: defining the specific user actions you will track, what data you attach to each event, and what taxonomy (naming convention) you use. Good event design is not about tracking everything — it is about tracking the right things with the right context. An event called `button_clicked` is nearly useless; an event called `subscription_upgrade_initiated` with properties `{ from_plan: 'starter', to_plan: 'pro', trigger: 'feature_gate', tenant_id: '...'}` is immediately actionable. The event name captures the business action, not the UI mechanism.

Funnel analysis is the sequenced view of a conversion process: what percentage of users who reach step 1 proceed to step 2, step 3, and so on. For a SaaS, the most important funnels are the signup funnel (visitor → trial → verified → first action), the activation funnel (new user → first value moment), and the upgrade funnel (trial → paid → expanded). Identifying where users drop off in these funnels tells you exactly where to invest in improving the product. Without instrumented funnels, you can only guess.

## Key Concepts
- **Event taxonomy**: A naming convention for all events; common pattern is `[noun]_[verb]` (e.g., `subscription_created`, `feature_gate_shown`, `invitation_sent`) — noun first makes events group alphabetically by subject
- **Event properties (traits)**: Context attached to every event — user ID, tenant ID, plan, source; these enable segmentation (how do starter plan users behave differently from pro plan users?)
- **Identify vs. track calls**: `identify(userId, traits)` records who the user is; `track(eventName, properties)` records what they did; both must be in every analytics client implementation
- **Group call**: For multi-tenant SaaS, `group(tenantId, tenantTraits)` is the third pillar — it lets you analyze behavior at the tenant level, not just the user level
- **Activation event**: The specific action that predicts a user will continue using the product ("aha moment"); for your SaaS this might be completing first tenant setup or inviting first team member — find and optimize for this
- **Funnel steps**: Ordered sequence of events that define a conversion process; each step has a conversion rate; the lowest conversion rate step is your highest-leverage optimization target
- **Analytics abstraction**: Never call Mixpanel, Amplitude, or PostHog directly from your components — always go through a thin analytics service layer so you can swap providers without rewriting every call site
- **Privacy and GDPR compliance**: Analytics must respect user consent; in the EU, tracking cookies and event tracking require explicit consent; analytics calls must be gated on consent status

## Example Code or Template

```tsx
// Analytics service abstraction layer
// File: libs/analytics/analytics.service.ts

// This layer lets you swap providers (PostHog → Mixpanel → custom)
// without touching component code. Start with PostHog — it's the
// best self-hostable option and has strong Next.js support.

export type AnalyticsUser = {
  id: string;
  email?: string;
  name?: string;
  createdAt?: Date;
  plan?: string;
};

export type AnalyticsTenant = {
  id: string;
  name?: string;
  plan?: string;
  memberCount?: number;
  createdAt?: Date;
};

// ============================================================
// EVENT TAXONOMY — define all events as typed constants
// This prevents typos and makes all tracked events discoverable
// ============================================================
export const AnalyticsEvents = {
  // Authentication
  USER_SIGNED_UP: 'user_signed_up',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  PASSWORD_RESET_REQUESTED: 'password_reset_requested',

  // Onboarding / Activation
  TENANT_CREATED: 'tenant_created',
  FIRST_MEMBER_INVITED: 'first_member_invited',
  ONBOARDING_COMPLETED: 'onboarding_completed',  // ← your activation event

  // Subscription
  TRIAL_STARTED: 'trial_started',
  SUBSCRIPTION_CREATED: 'subscription_created',
  SUBSCRIPTION_UPGRADED: 'subscription_upgraded',
  SUBSCRIPTION_DOWNGRADED: 'subscription_downgraded',
  SUBSCRIPTION_CANCELLED: 'subscription_cancelled',
  PAYMENT_FAILED: 'payment_failed',

  // Feature engagement
  FEATURE_GATE_SHOWN: 'feature_gate_shown',    // user hit a paywall
  FEATURE_GATE_CLICKED: 'feature_gate_clicked', // user clicked upgrade from paywall
  INVITATION_SENT: 'invitation_sent',
  INVITATION_ACCEPTED: 'invitation_accepted',
} as const;

export type AnalyticsEventName = typeof AnalyticsEvents[keyof typeof AnalyticsEvents];

// ============================================================
// ANALYTICS SERVICE — thin wrapper over PostHog
// ============================================================
class AnalyticsService {
  private isEnabled(): boolean {
    return (
      typeof window !== 'undefined' &&
      process.env.NODE_ENV === 'production' &&
      !!process.env.NEXT_PUBLIC_POSTHOG_KEY
    );
  }

  identify(user: AnalyticsUser): void {
    if (!this.isEnabled()) return;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        plan: user.plan,
        created_at: user.createdAt?.toISOString(),
      });
    });
  }

  group(tenant: AnalyticsTenant): void {
    if (!this.isEnabled()) return;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.group('tenant', tenant.id, {
        name: tenant.name,
        plan: tenant.plan,
        member_count: tenant.memberCount,
        created_at: tenant.createdAt?.toISOString(),
      });
    });
  }

  track(
    event: AnalyticsEventName,
    properties?: Record<string, string | number | boolean | null | undefined>
  ): void {
    if (!this.isEnabled()) return;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.capture(event, properties);
    });
  }

  reset(): void {
    if (!this.isEnabled()) return;
    import('posthog-js').then(({ default: posthog }) => {
      posthog.reset();
    });
  }
}

export const analytics = new AnalyticsService();

// ============================================================
// USAGE EXAMPLES
// ============================================================

// After successful subscription creation:
// analytics.track(AnalyticsEvents.SUBSCRIPTION_CREATED, {
//   plan_id: plan.id,
//   billing_cycle: 'monthly',
//   amount_cents: plan.monthlyPrice,
//   source: 'onboarding_flow',
// });

// After user hits a feature gate:
// analytics.track(AnalyticsEvents.FEATURE_GATE_SHOWN, {
//   feature: 'advanced_reporting',
//   current_plan: tenant.planId,
//   upgrade_plan: 'pro',
// });
```

## When to Use
- Before launching your SaaS to paying customers — analytics instrumentation should be in place before launch so you have data from the first user, not from the user who prompted you to add it
- When designing a new feature — define the events you will track to measure success before writing any UI code; this forces you to clarify what "success" means
- When a feature has low adoption — analytics funnels tell you whether users do not know the feature exists, reach it but do not engage, or start and drop off; each requires a different response
- When a client asks "why are users not upgrading?" — the upgrade funnel, with `feature_gate_shown` and `feature_gate_clicked` events, answers this directly instead of guessing
- When evaluating your LinkedIn/SEO content strategy — UTM parameters on your acquisition links plus analytics tell you which content source produces the users with the best activation rate

## Common Mistakes
- **Tracking UI actions instead of business actions**: `button_clicked` with no context is nearly useless; track what the button did (`subscription_upgrade_initiated`), not that it was clicked
- **Not tracking tenant identity (group calls)**: In a multi-tenant SaaS, user-level analytics are incomplete — if you only track users, you cannot answer "what do enterprise tenants do differently from solo tenants?" — group calls are mandatory
- **Adding analytics directly in components**: When you call `posthog.capture()` directly in 40 components, switching providers requires 40 changes; the service abstraction layer means one change point
- **No consent management**: In the EU, tracking users without explicit consent is a GDPR violation; gate all `analytics.identify()` and `analytics.track()` calls on a consent flag stored in localStorage or a cookie consent service

## Further Reading
- **PostHog Documentation (posthog.com/docs)** — PostHog is the best self-hostable analytics platform for SaaS; their Next.js integration guide covers SSR-compatible setup, feature flags, and session recording in one document
- **"Measuring What Matters" — John Doerr** — OKR framework for product companies; the chapter on leading vs. lagging indicators directly addresses which product events to track and which business metrics to derive from them
- **Segment Analytics Academy (segment.com/academy)** — Free course on event tracking taxonomy, identify/track/group patterns, and funnel design; written by the people who built the industry-standard analytics routing layer
