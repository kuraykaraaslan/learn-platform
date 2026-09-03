import { describe, expect, it } from 'vitest';
import { flattenSpatial, parseSpatial } from './course_content.spatial';

// The spec's own example fence, docs/phases/14-bim-ifc-data-models.md.
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

/** A minimal legal tree, so a rule can be broken one at a time. */
function tree(children: string): string {
  return `
title: "T"
root:
  id: root
  type: IfcProject
  name: "P"
  children:
${children}
`;
}

const TWO_KIDS = `    - { id: a, type: IfcSite, name: "A", rel: aggregates }
    - { id: b, type: IfcSite, name: "B", rel: aggregates }`;

describe('parseSpatial', () => {
  it("parses the spec's example fence, keeping the tree and both halves of the gate", () => {
    const widget = parseSpatial(YAML);
    expect(widget.type).toBe('spatial');
    expect(widget.title).toBe('A wall that fell out of the storey');
    expect(widget.ask).toMatch(/which relationship puts it there/);
    expect(widget.reveal).toMatch(/^IfcRelContainedInSpatialStructure/);

    const nodes = flattenSpatial(widget.root);
    expect(nodes.map((n) => n.type)).toEqual(['IfcProject', 'IfcBuildingStorey', 'IfcWallStandardCase']);
    expect(nodes[2].props?.[0]).toEqual({
      set: 'Pset_WallCommon',
      name: 'FireRating',
      value: 'REI 60',
      inherited: true,
    });
  });

  it('accepts a tree with no gate at all — a reference tree is not an exercise', () => {
    expect(parseSpatial(tree(TWO_KIDS)).ask).toBeUndefined();
  });

  // The six rules parseSpatial enforces beyond the schema, one case each.
  it('rejects a tree below the minimum node count', () => {
    expect(() => parseSpatial(tree(`    - { id: a, type: IfcSite, name: "A", rel: aggregates }`))).toThrow(
      /2 nodes/
    );
  });

  it('rejects a tree above the maximum node count', () => {
    // 12 storeys x 3 spaces + the root: legal by every per-node cap, and still
    // a model dump rather than a lesson.
    const many = Array.from(
      { length: 12 },
      (_, i) =>
        `    - { id: s${i}, type: IfcBuildingStorey, name: "S", rel: aggregates, children: [` +
        [0, 1, 2].map((j) => `{ id: r${i}-${j}, type: IfcSpace, name: "R", rel: aggregates }`).join(', ') +
        `] }`
    );
    expect(() => parseSpatial(tree(many.join('\n')))).toThrow(/49 nodes/);
  });

  it('rejects a tree deeper than the real spatial ceiling', () => {
    // Project > Site > Building > Storey > Space > element is six; a seventh
    // level is not a spatial hierarchy any more.
    let node = '{ id: n6, type: IfcWall, name: "W", rel: contained }';
    for (let i = 5; i >= 1; i--) node = `{ id: n${i}, type: IfcSpace, name: "S", rel: aggregates, children: [${node}] }`;
    expect(() => parseSpatial(tree(`    - ${node}`))).toThrow(/7 levels deep/);
  });

  it('rejects a duplicate node id', () => {
    const dup = `    - { id: a, type: IfcSite, name: "A", rel: aggregates }
    - { id: a, type: IfcSite, name: "B", rel: aggregates }`;
    expect(() => parseSpatial(tree(dup))).toThrow(/node id "a" twice/);
  });

  it('rejects a rel on the root, and a non-root node with no rel', () => {
    expect(() =>
      parseSpatial(`
title: "T"
root: { id: root, type: IfcProject, name: "P", rel: aggregates, children: [{ id: a, type: IfcSite, name: "A", rel: aggregates }, { id: b, type: IfcSite, name: "B", rel: aggregates }] }
`)
    ).toThrow(/root has no parent/);

    const orphan = `    - { id: a, type: IfcSite, name: "A", rel: aggregates }
    - { id: b, type: IfcSite, name: "B" }`;
    expect(() => parseSpatial(tree(orphan))).toThrow(/node "b" has no `rel`/);
  });

  it('rejects half a gate in either direction', () => {
    const askOnly = tree(TWO_KIDS).replace('title: "T"', 'title: "T"\nask: "Which one?"');
    expect(() => parseSpatial(askOnly)).toThrow(/together, or neither/);

    const revealOnly = tree(TWO_KIDS).replace('title: "T"', 'title: "T"\nreveal: "This one."');
    expect(() => parseSpatial(revealOnly)).toThrow(/together, or neither/);
  });

  it('rejects more than one focus flag', () => {
    const two = `    - { id: a, type: IfcSite, name: "A", rel: aggregates, flag: focus }
    - { id: b, type: IfcSite, name: "B", rel: aggregates, flag: focus }`;
    expect(() => parseSpatial(tree(two))).toThrow(/2 nodes `flag: focus`/);
  });

  // Schema-level, but each is a mistake an author would otherwise ship.
  it('rejects an unknown key anywhere in the tree', () => {
    const typo = `    - { id: a, type: IfcSite, name: "A", rel: aggregates, propz: [] }
    - { id: b, type: IfcSite, name: "B", rel: aggregates }`;
    expect(() => parseSpatial(tree(typo))).toThrow();
  });

  it('rejects a numeric property value — a measurement nobody took', () => {
    const numeric = `    - { id: a, type: IfcSite, name: "A", rel: aggregates, props: [{ set: Pset_X, name: Area, value: 42 }] }
    - { id: b, type: IfcSite, name: "B", rel: aggregates }`;
    expect(() => parseSpatial(tree(numeric))).toThrow();
  });

  it('rejects an unknown relationship', () => {
    const bad = `    - { id: a, type: IfcSite, name: "A", rel: belongs_to }
    - { id: b, type: IfcSite, name: "B", rel: aggregates }`;
    expect(() => parseSpatial(tree(bad))).toThrow();
  });
});
