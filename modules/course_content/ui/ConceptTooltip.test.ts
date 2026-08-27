import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConceptTooltipProvider } from './ConceptTooltip';

describe('ConceptTooltipProvider', () => {
  it('renders its children and no popover when nothing is active', () => {
    const html = renderToStaticMarkup(
      React.createElement(ConceptTooltipProvider, {
        concepts: {},
        className: 'space-y-4',
        children: React.createElement('p', null, 'Some prose with a term button.'),
      })
    );
    expect(html).toContain('Some prose with a term button.');
    expect(html).not.toContain('concept-tooltip');
    expect(html).toContain('space-y-4');
  });
});
