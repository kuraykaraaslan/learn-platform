// Parses a `calc`-shaped fence's YAML body — same build-time-only parsing
// (YAML + zod, never shipped to the client) as course_content.quiz.ts,
// course_content.tradeoff.ts and course_content.recall.ts.
//
// P11 (docs/phases/11-recall-and-calc.md) is explicit that this widget is a
// *writing affordance*: it exists so a lesson can ask the reader to put their
// own numbers in, rather than reading someone else's worked example. That is
// why every expression is validated here, at build time — a typo'd `expr`
// must fail `npm run content:check`, not render as a blank cell for a reader.
import YAML from 'yaml';
import { z } from 'zod';
import { parseExpr, identifiersIn, type ExprNode } from './course_content.expr';
import { CALC_FORMATS } from './course_content.calc-format';

// Re-exported so server-side callers keep a single import site; CalcCard
// deliberately does NOT come through here (see course_content.calc-format.ts).
export { formatCalcValue, type CalcFormat } from './course_content.calc-format';

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

const CalcInputSchema = z.object({
  // Must be a legal identifier because it is what an `expr` refers to.
  id: z.string().regex(IDENTIFIER, 'input id must be a plain identifier (letters, digits, _)'),
  label: z.string().min(1),
  type: z.literal('number'),
  default: z.number(),
  // Optional bounds — the input still accepts anything typed, these only drive
  // the number field's own step/min hints.
  min: z.number().optional(),
  step: z.number().optional(),
});

const CalcOutputSchema = z.object({
  label: z.string().min(1),
  expr: z.string().min(1),
  format: z.enum(CALC_FORMATS).default('number'),
});

const CalcFenceSchema = z.object({
  inputs: z.array(CalcInputSchema).min(1).max(6),
  outputs: z.array(CalcOutputSchema).min(1).max(4),
});

export type CalcInput = z.infer<typeof CalcInputSchema>;
export type CalcOutput = z.infer<typeof CalcOutputSchema> & { ast: ExprNode };

export type CalcWidget = {
  type: 'calc';
  inputs: CalcInput[];
  outputs: CalcOutput[];
  raw: string;
};

export function parseCalc(raw: string): CalcWidget {
  const parsed: unknown = YAML.parse(raw);
  const { inputs, outputs } = CalcFenceSchema.parse(parsed);

  const duplicate = inputs.map((i) => i.id).find((id, idx, all) => all.indexOf(id) !== idx);
  if (duplicate) throw new Error(`calc fence declares input "${duplicate}" twice`);

  const declared = new Set(inputs.map((i) => i.id));

  const withAst = outputs.map((output) => {
    // Throws ExprError on a malformed expression — deliberately uncaught, the
    // same "bad payload is a build failure" stance course_content.blocks.ts
    // takes for quiz and tradeoff.
    const ast = parseExpr(output.expr);
    const unknown = identifiersIn(ast).filter((name) => !declared.has(name));
    if (unknown.length > 0) {
      throw new Error(
        `calc output "${output.label}" refers to ${unknown.map((u) => `"${u}"`).join(', ')}, which ${unknown.length === 1 ? 'is not a declared input' : 'are not declared inputs'} (declared: ${[...declared].join(', ')})`
      );
    }
    return { ...output, ast };
  });

  return { type: 'calc', inputs, outputs: withAst, raw };
}
