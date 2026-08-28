import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ReviewQueue } from './ReviewQueue';

describe('ReviewQueue', () => {
  it('renders a loading state before hydration/fetch — no card content, no card count', () => {
    // useEffect (the fetch, and useHydrated's hydration check) never runs
    // during renderToStaticMarkup, so this exercises exactly the SSR/
    // first-paint state a real page load briefly shows.
    const html = renderToStaticMarkup(React.createElement(ReviewQueue));
    expect(html).toMatch(/loading/i);
    expect(html).not.toMatch(/today:\s*\d+\s*cards?/i);
  });
});
