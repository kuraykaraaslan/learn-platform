import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SettingsPage } from './SettingsPage';

describe('SettingsPage', () => {
  it('renders export and import controls', () => {
    const html = renderToStaticMarkup(React.createElement(SettingsPage));
    expect(html).toContain('Export as JSON');
    expect(html).toContain('Import from JSON');
  });
});
