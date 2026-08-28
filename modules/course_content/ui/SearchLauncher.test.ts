import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SearchLauncher } from './SearchLauncher';

describe('SearchLauncher', () => {
  it('renders the launcher button with a keyboard-shortcut hint, no results modal before opening', () => {
    const html = renderToStaticMarkup(React.createElement(SearchLauncher));
    expect(html).toContain('Search');
    expect(html).toMatch(/⌘K|Ctrl K/);
    // The modal is only mounted client-side after `open` flips true (via
    // usePresence) — SSR/first paint renders just the launcher button.
    expect(html).not.toContain('role="dialog"');
  });
});
