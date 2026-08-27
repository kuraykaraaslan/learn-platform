# 25. Web Vitals (LCP, CLS, INP) — Real User Data Improvement

## What It Is
Core Web Vitals are Google's standardized metrics for measuring real-user experience quality. They're measured in the field (on actual user devices, over real network conditions) not in lab simulations. There are three: **Largest Contentful Paint (LCP)** measures how long it takes for the largest visible element (usually a hero image or heading) to render — this is the main "page loaded" perception metric. **Cumulative Layout Shift (CLS)** measures visual stability — how much elements jump around as the page loads (images without dimensions, late-loading fonts, injected banners). **Interaction to Next Paint (INP)** measures responsiveness — the worst-case delay between any user interaction (click, keypress, tap) and the browser's next paint in response. INP replaced FID (First Input Delay) in 2024.

These metrics matter beyond SEO (Google uses them as a ranking signal). They directly measure user experience: a high LCP means users are waiting; a high CLS means users are clicking the wrong thing because content jumped; a high INP means the UI feels sluggish. For a SaaS, these translate to trial abandonment, support tickets about "slowness", and churn.

The critical distinction is **field data vs lab data**. Lighthouse is a lab tool — it runs on your machine under controlled conditions. Real users have slower devices, different connection speeds, browser extensions, and concurrent tabs. A Lighthouse score of 95 doesn't mean your users have a fast experience. Real User Monitoring (RUM) using the `web-vitals` library, sent to an analytics endpoint, tells you what your actual 75th percentile user experiences. The Core Web Vitals thresholds use the 75th percentile — 75% of your users must have a "good" experience.

## Key Concepts
- **LCP (Largest Contentful Paint)**: Time until largest image/text block is visible; target: ≤2.5s; main causes: slow images, render-blocking resources, slow server response
- **CLS (Cumulative Layout Shift)**: Sum of unexpected layout shifts during the page lifetime; target: ≤0.1; main causes: images/videos without dimensions, late-loading fonts, dynamically injected content
- **INP (Interaction to Next Paint)**: 98th percentile interaction delay; target: ≤200ms; main causes: long JS tasks, heavy event handlers, synchronous DOM operations
- **75th percentile threshold**: Core Web Vitals are "good" when ≥75% of page loads meet the threshold — not the average
- **Field data vs lab data**: Field data = real users (Google CrUX, your RUM); lab data = controlled test (Lighthouse, WebPageTest); optimize for field data
- **Long task**: Any JS task that blocks the main thread for >50ms; causes INP degradation; visible in Chrome DevTools Performance panel as red bars
- **Total Blocking Time (TBT)**: The lab proxy for INP; correlates well but is not identical
- **Attribution**: The `web-vitals` library's attribution feature identifies which element caused the CLS, which interaction caused the INP — essential for knowing what to fix

## Example Code
```tsx
// ─── 1. Instrument Core Web Vitals in your Next.js app ───
// npm install web-vitals

// app/components/web-vitals-reporter.tsx
'use client';

import { useEffect } from 'react';
import { onCLS, onINP, onLCP, onFCP, onTTFB, type Metric } from 'web-vitals/attribution';

export function WebVitalsReporter() {
  useEffect(() => {
    function sendMetric(metric: Metric) {
      // Send to your own analytics endpoint or a third-party service
      fetch('/api/vitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,       // 'good' | 'needs-improvement' | 'poor'
          delta: metric.delta,
          id: metric.id,
          navigationType: metric.navigationType,
          // Attribution data: tells you *what* caused the metric
          attribution: metric.attribution,
        }),
        // keepalive ensures the request completes even if the user navigates away
        keepalive: true,
      });
    }

    onCLS(sendMetric);
    onINP(sendMetric);
    onLCP(sendMetric);
    onFCP(sendMetric);
    onTTFB(sendMetric);
  }, []);

  return null;
}

// app/layout.tsx — add to root layout (renders once, reports on all pages)
import { WebVitalsReporter } from '@/components/web-vitals-reporter';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        {children}
        <WebVitalsReporter />
      </body>
    </html>
  );
}

// ─── 2. API endpoint to receive and store vitals ───
// app/api/vitals/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const metric = await request.json();

  // Store in your DB for analysis
  await db.webVitalEvent.create({
    data: {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      path: request.headers.get('referer') ?? '',
      userAgent: request.headers.get('user-agent') ?? '',
      navigationType: metric.navigationType,
      attribution: metric.attribution,
      recordedAt: new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}

// ─── 3. Common fixes per metric ───

// FIX: LCP — preload the LCP image
// In your layout or page, if you know which image will be LCP:
// <link rel="preload" as="image" href="/hero.jpg" fetchpriority="high" />

// FIX: CLS — always set width and height on images
// next/image does this automatically — prefer it over <img>
import Image from 'next/image';
function HeroImage() {
  return (
    <Image
      src="/hero.jpg"
      width={1200}
      height={600}     // width+height prevents layout shift
      alt="Hero"
      priority         // fetchpriority="high" on the LCP image
    />
  );
}

// FIX: CLS — reserve space for dynamic content
// BAD: content injects below a heading causing everything to shift
function BadBanner() {
  const [banner, setBanner] = useState<string | null>(null);
  useEffect(() => { fetchBanner().then(setBanner); }, []);
  return banner ? <div>{banner}</div> : null; // Injected — causes shift
}

// GOOD: reserve the space upfront with min-height
function GoodBanner() {
  const [banner, setBanner] = useState<string | null>(null);
  useEffect(() => { fetchBanner().then(setBanner); }, []);
  return (
    <div className="min-h-[48px]"> {/* Reserved space — no layout shift */}
      {banner && <div>{banner}</div>}
    </div>
  );
}

// FIX: INP — avoid long tasks in event handlers
// BAD: synchronous heavy computation in a click handler
function BadButton() {
  function handleClick() {
    const result = heavyComputation(); // Blocks main thread for 200ms
    setResult(result);
  }
  return <button onClick={handleClick}>Calculate</button>;
}

// GOOD: yield to the browser between work chunks using scheduler
function GoodButton() {
  async function handleClick() {
    setLoading(true);
    // Yield to browser so the button can show loading state before heavy work
    await new Promise((r) => setTimeout(r, 0)); // or scheduler.yield() in Chrome 115+
    const result = heavyComputation();
    setResult(result);
    setLoading(false);
  }
  return <button onClick={handleClick}>Calculate</button>;
}
```

## When to Use
- Start instrumenting Web Vitals before you hit 1,000 monthly active users — you want a baseline before you start optimizing
- After any significant UI change, deploy refactor, or new dependency addition — compare the before/after distribution (not just median, but 75th and 95th percentile)
- When triaging user complaints about "the app feeling slow" — INP attribution data will tell you exactly which interaction on which element is the bottleneck
- Before and after performance optimization sprints — you need real user data to confirm that your optimizations worked

## Common Mistakes
- **Using only Lighthouse scores as a performance indicator**: Lighthouse is a lab tool; your local machine is fast, your network is fast, you have no browser extensions; field data from real users is often 2–5x worse
- **Optimizing the average instead of the 75th percentile**: Core Web Vitals thresholds use the 75th percentile; a fast median with a long tail of poor experiences still fails the Core Web Vitals assessment
- **Ignoring the attribution data**: The `web-vitals` attribution build tells you which element caused CLS, which interaction caused INP, and which resource blocked LCP — without this, you're guessing what to fix
- **Not separating metrics by page/route**: Aggregating vitals across all pages hides the fact that your `/dashboard` page has terrible INP while your `/pricing` page is excellent; always segment by route

## Further Reading
- **"web.dev/vitals" — Core Web Vitals documentation** — The canonical source; includes the latest thresholds, how each metric is measured, and official improvement guides
- **"Optimize LCP", "Optimize CLS", "Optimize INP" on web.dev** — Each metric has a dedicated optimization guide with specific, actionable techniques; these are the most useful documents for a developer who has identified a specific metric to improve
- **Chrome User Experience Report (CrUX) documentation** — If your site has enough traffic, Google's CrUX provides free real-user field data in Google Search Console and PageSpeed Insights; understanding how to read CrUX data is the first step before building your own RUM pipeline
