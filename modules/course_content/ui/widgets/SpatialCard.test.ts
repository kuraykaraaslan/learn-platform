import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { SpatialCard } from './SpatialCard';
import { parseSpatial } from '../../course_content.spatial';

const YAML = `
title: "A wall that fell out of the storey"
ask: "Which node should the wall hang from, and which relationship puts it there?"
reveal: "IfcRelContainedInSpatialStructure attaches an element to exactly one IfcBuildingStorey"
root:
  id: "1xS3BCk291UvhgP2a6eflL"
  type: IfcProject
  name: "Riverside Depot"
  children:
    - id: "2rSuRi_lD5$O4Op8DVOCkd"
      type: IfcBuildingStorey
      name: "Ground floor"
      rel: aggregates
      children:
        - id: "3Xt7zPfNb2vgqR1YkEwNsq"
          type: IfcWallStandardCase
          name: "Bay wall"
          rel: contained
          flag: focus
          props:
            - set: Pset_WallCommon
              name: FireRating
              value: "REI 60"
              inherited: true
`;

function render(verified: boolean) {
  return renderToStaticMarkup(React.createElement(SpatialCard, { widget: parseSpatial(YAML), verified }));
}

describe('SpatialCard', () => {
  it('renders every node, its IFC type and the relationship entity on each edge', () => {
    const html = render(true);
    expect(html).toContain('IfcProject');
    expect(html).toContain('IfcBuildingStorey');
    expect(html).toContain('IfcWallStandardCase');
    // The teaching bit lives on the edge, which is why this is not a diagram.
    expect(html).toContain('IfcRelAggregates');
    expect(html).toContain('IfcRelContainedInSpatialStructure');
  });

  it('shows a property with its set, its value and whether it came from the type', () => {
    const html = render(true);
    expect(html).toContain('Pset_WallCommon');
    expect(html).toContain('REI 60');
    expect(html).toContain('inherited from type');
  });

  it('keeps the reveal shut behind the write-first gate on a verified lesson', () => {
    const html = render(true);
    expect(html).toContain('Which node should the wall hang from');
    expect(html).toContain('answer hidden');
    // Reveal text is absent, and Show starts disabled — nothing written yet.
    expect(html).not.toContain('attaches an element to exactly one');
    expect(html).toContain('disabled=""');
  });

  // The difference from QuizCard/RecallCard, which return null outright: a
  // tree is a reference, not an exercise, so it still renders — only the
  // `ask` obeys the stopping rule (docs/phases/README.md invariant #3).
  it('still renders the tree on an unverified lesson, with no ask and no reveal', () => {
    const html = render(false);
    expect(html).toContain('IfcWallStandardCase');
    expect(html).not.toContain('Which node should the wall hang from');
    expect(html).not.toContain('attaches an element to exactly one');
    expect(html).not.toContain('<textarea');
  });

  // WidgetShell's own rule, asserted by MermaidBlock.test.ts for the shell —
  // the open/close marks here are CSS boxes, not glyphs and not icons.
  it('draws its expand marks without an inline <svg>', () => {
    expect(render(true)).not.toContain('<svg');
  });
});

// Same mechanical bundle guard CalcCard.test.ts carries. course_content.
// spatial.ts top-level imports yaml + zod for build-time parsing; a value
// import from a 'use client' component would put both into the shipped lesson
// chunk, which docs/phases/06-quiz-tradeoff-diff.md forbids.
describe('SpatialCard bundle boundary', () => {
  it('imports course_content.spatial as a type only, never as a value', async () => {
    const { readFileSync } = await import('node:fs');
    const source = readFileSync(new URL('./SpatialCard.tsx', import.meta.url), 'utf-8');
    const imports = source.match(/^import .*course_content\.spatial';$/gm) ?? [];
    expect(imports).toHaveLength(1);
    expect(imports[0]).toMatch(/^import type /);
  });

  // P14's acceptance criterion: the 15-character gate is SHARED with
  // RecallCard, not copied — a second literal would be a number that can
  // drift apart from the argument that produced it.
  it('takes the reveal gate from the shared module, and so does RecallCard', async () => {
    const { readFileSync } = await import('node:fs');
    const spatial = readFileSync(new URL('./SpatialCard.tsx', import.meta.url), 'utf-8');
    const recall = readFileSync(new URL('./RecallCard.tsx', import.meta.url), 'utf-8');
    for (const source of [spatial, recall]) {
      expect(source).toMatch(/from '\.\.\/reveal-gate'/);
      expect(source).not.toMatch(/MIN_ANSWER_LENGTH\s*=/);
    }
  });
});
