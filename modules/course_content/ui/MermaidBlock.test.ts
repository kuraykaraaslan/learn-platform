import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MermaidBlock } from './MermaidBlock';

describe('MermaidBlock', () => {
  it('renders the fallback source html before the diagram has loaded (JS off / pre-hydration)', () => {
    const html = renderToStaticMarkup(
      React.createElement(MermaidBlock, {
        source: 'graph TD; A-->B;',
        html: '<pre>graph TD; A--&gt;B;</pre>',
      })
    );
    expect(html).toContain('graph TD');
    // No IntersectionObserver runs during SSR, so nothing has been loaded —
    // the pending-state fallback (the raw fence html) is what a reader with
    // JS disabled is stuck with, which is the whole point.
    expect(html).not.toContain('<svg');
  });
});
