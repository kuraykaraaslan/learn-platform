import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ConceptTooltipProvider } from './ConceptTooltip';

describe('ConceptTooltipProvider', () => {
  it('renders its children and no popover when nothing is active', () => {
    const html = renderToStaticMarkup(
      // react/no-children-prop assumes JSX, where <X>{...}</X> is available.
      // This suite is .ts (vitest include: '**/*.test.ts') and builds elements
      // through createElement, and ConceptTooltipProvider declares children as
      // required — so the variadic form the rule wants does not satisfy the
      // props type. Passing it as a prop is what actually typechecks here.
      // eslint-disable-next-line react/no-children-prop
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
