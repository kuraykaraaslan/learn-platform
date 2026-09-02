// Display formatting for a `calc` output. Split out of course_content.calc.ts
// on purpose: that module imports `yaml` and `zod` at the top level for its
// build-time parsing, and CalcCard needs this formatter at *runtime*, in the
// browser. A value import from calc.ts would drag the whole YAML parser into
// the client bundle — measured, not assumed: doing exactly that put 8 `yaml`
// and 1 `zod` marker into the lesson chunk and broke the acceptance criterion
// docs/phases/06-quiz-tradeoff-diff.md already set ("YAML parser client
// bundle'a girmiyor").
//
// QuizCard and TradeoffCard avoid the same trap by importing only `import
// type` from their parsers. CalcCard needs a real function, so the function
// moves here instead, to a module with no build-time-only dependencies.
// CalcCard.test.ts asserts the type-only import stays type-only.

export const CALC_FORMATS = ['number', 'eur', 'usd', 'percent'] as const;
export type CalcFormat = (typeof CALC_FORMATS)[number];

const CURRENCY_SYMBOL: Record<string, string> = { eur: '€', usd: '$' };

/**
 * Formats a computed value for display. A non-finite result (divide by zero,
 * an empty field the reader has not filled in yet) renders as an em dash
 * rather than "Infinity"/"NaN" — the reader is mid-typing, not looking at a
 * bug.
 */
export function formatCalcValue(value: number, format: CalcFormat): string {
  if (!Number.isFinite(value)) return '—';

  if (format === 'percent') {
    return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(value)}%`;
  }

  const symbol = CURRENCY_SYMBOL[format];
  const formatted = new Intl.NumberFormat('en-US', {
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(value);

  return symbol ? `${symbol}${formatted}` : formatted;
}
