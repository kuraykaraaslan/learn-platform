// Parses a `spatial` fence's YAML body — same build-time-only parsing (YAML +
// zod, never shipped to the client) as course_content.quiz.ts,
// course_content.tradeoff.ts, course_content.recall.ts and
// course_content.calc.ts.
//
// P14 (docs/phases/14-bim-ifc-data-models.md) argues this widget from what the
// existing surface cannot do: a mermaid node label is one string, but what an
// IFC node teaches is a small table (which node carries Pset_WallCommon.
// FireRating, and whether it was inherited from the type). The teaching error
// lives on the EDGE — IfcRelContainedInSpatialStructure (element -> storey)
// against IfcRelAggregates (storey -> building) — and a diagram cannot hide an
// answer, take the reader's guess, and then open.
//
// The recorded objection to a viewer widget is that it invites presenting
// GENERATED data as fact: a plausible-looking IFC fragment nobody actually
// wrote. Two mechanical answers, both here rather than in review: the
// `spatial/unanchored-reveal` lint rule ties every `reveal` and every
// `props[].set` name back to the lesson's own prose, and the node budget below
// keeps a tree small enough to be read rather than skimmed.
import YAML from 'yaml';
import { z } from 'zod';

/** The IFC relationship that puts a node under its parent. Not decoration:
 *  which one it is decides where the element shows up in a viewer tree and in
 *  a per-storey quantity take-off. */
export const SPATIAL_RELS = ['aggregates', 'contained', 'voids', 'fills', 'nests', 'assigns'] as const;

/** Author's emphasis on one node — `focus` marks the node an `ask` is about. */
export const SPATIAL_FLAGS = ['good', 'bad', 'focus'] as const;

export type SpatialRel = (typeof SPATIAL_RELS)[number];
export type SpatialFlag = (typeof SPATIAL_FLAGS)[number];

const PropSchema = z
  .object({
    set: z.string().min(1).max(60),
    name: z.string().min(1).max(60),
    // string, never number: a numeric field here is an invitation to write a
    // measurement nobody took. A quantity that matters belongs in prose, with
    // a source — the roadmap's rule for any number a reader would quote.
    value: z.string().min(1).max(80),
    /** True when the value comes from the element's *type*, not the element —
     *  the single most common reason a property "disappears" from an export. */
    inherited: z.boolean().optional(),
  })
  .strict();

export type SpatialProp = z.infer<typeof PropSchema>;

export type SpatialNode = {
  /** The node's IFC GlobalId, or any stable author-chosen key. Unique per fence. */
  id: string;
  /** IFC entity name, e.g. "IfcBuildingStorey". */
  type: string;
  name: string;
  rel?: SpatialRel;
  flag?: SpatialFlag;
  props?: SpatialProp[];
  children?: SpatialNode[];
};

// z.lazy for the recursion; the explicit z.ZodType annotation is what lets TS
// resolve the cycle (the same shape zod's own docs use for a recursive type).
const NodeSchema: z.ZodType<SpatialNode> = z.lazy(() =>
  z
    .object({
      id: z.string().min(1).max(40),
      type: z.string().min(1).max(60),
      name: z.string().min(1).max(80),
      rel: z.enum(SPATIAL_RELS).optional(),
      flag: z.enum(SPATIAL_FLAGS).optional(),
      props: z.array(PropSchema).min(1).max(6).optional(),
      children: z.array(NodeSchema).min(1).max(12).optional(),
    })
    .strict()
);

const SpatialFenceSchema = z
  .object({
    title: z.string().min(1).max(120),
    /** The question put to the reader before the tree gives anything away. */
    ask: z.string().min(1).max(240).optional(),
    /** The sentence the `ask` opens onto. Anchored to the lesson's own prose
     *  by the `spatial/unanchored-reveal` rule. */
    reveal: z.string().min(1).max(240).optional(),
    root: NodeSchema,
  })
  .strict();

export type SpatialWidget = {
  type: 'spatial';
  title: string;
  ask?: string;
  reveal?: string;
  root: SpatialNode;
  raw: string;
};

/** Below this a tree is a sentence; above it, a model dump rather than a lesson. */
export const MIN_SPATIAL_NODES = 3;
export const MAX_SPATIAL_NODES = 40;
/** Project / Site / Building / Storey / Space / element is the real ceiling. */
export const MAX_SPATIAL_DEPTH = 6;

/** Every node in the tree, parents before children. */
export function flattenSpatial(root: SpatialNode): SpatialNode[] {
  return [root, ...(root.children ?? []).flatMap(flattenSpatial)];
}

function depthOf(node: SpatialNode): number {
  return 1 + Math.max(0, ...(node.children ?? []).map(depthOf));
}

/**
 * Throws on anything the schema cannot express — the same "a bad payload is a
 * build failure" stance course_content.blocks.ts already takes for quiz,
 * tradeoff, recall and calc.
 */
export function parseSpatial(raw: string): SpatialWidget {
  const parsed: unknown = YAML.parse(raw);
  const { title, ask, reveal, root } = SpatialFenceSchema.parse(parsed);

  const nodes = flattenSpatial(root);

  if (nodes.length < MIN_SPATIAL_NODES || nodes.length > MAX_SPATIAL_NODES) {
    throw new Error(
      `spatial fence has ${nodes.length} nodes — the range is ${MIN_SPATIAL_NODES}-${MAX_SPATIAL_NODES} (fewer is a sentence, more is a model dump)`
    );
  }

  const depth = depthOf(root);
  if (depth > MAX_SPATIAL_DEPTH) {
    throw new Error(`spatial fence is ${depth} levels deep — at most ${MAX_SPATIAL_DEPTH}`);
  }

  const duplicate = nodes.map((n) => n.id).find((id, i, all) => all.indexOf(id) !== i);
  if (duplicate) throw new Error(`spatial fence uses node id "${duplicate}" twice`);

  // A node that appears out of nowhere teaches nothing: the relationship IS
  // the lesson, so every non-root node has to name the one holding it there.
  if (root.rel) throw new Error(`spatial fence's root node "${root.id}" declares rel: ${root.rel} — the root has no parent to be related to`);
  const unrelated = nodes.slice(1).find((n) => !n.rel);
  if (unrelated) throw new Error(`spatial node "${unrelated.id}" has no \`rel\` — every non-root node names the relationship that puts it there`);

  // Half a gate is a spoiler: a `reveal` with no `ask` is just an answer
  // printed under the tree.
  if ((ask === undefined) !== (reveal === undefined)) {
    throw new Error('spatial fence must declare `ask` and `reveal` together, or neither');
  }

  const focused = nodes.filter((n) => n.flag === 'focus');
  if (focused.length > 1) {
    throw new Error(
      `spatial fence marks ${focused.length} nodes \`flag: focus\` (${focused.map((n) => n.id).join(', ')}) — at most one`
    );
  }

  return { type: 'spatial', title, ask, reveal, root, raw };
}
