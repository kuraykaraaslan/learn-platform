// P31: a `numbers` fence — docs/investigate/04-roadmap.md's T2.2, as a widget
// rather than the `##` section it originally specified (the reasoning is in
// docs/phases/31-numbers-that-matter.md: P4 built a card system after the
// roadmap was written, and a fence leaves HEADING_RULES untouched).
//
// Deliberately NOT a client component. The table is inert — there is nothing
// to click — so it renders on the server and ships zero bytes. That also
// keeps course_content.numbers.ts's yaml/zod out of the lesson chunk, which
// is the boundary CalcCard.test.ts had to learn the hard way; the import
// below is `import type` for exactly that reason.
import type { NumbersWidget } from '../course_content.numbers';
import { WidgetShell } from './WidgetShell';

/** Renders `measure` and `at_scale`, which are prose with inline code spans
 *  rather than markdown — a backticked run of text becomes a <code>. Nothing
 *  else is interpreted, so a table cell cannot smuggle markup into the page. */
function withInlineCode(text: string): React.ReactNode[] {
  return text.split(/(`[^`]+`)/g).map((part, i) =>
    part.startsWith('`') && part.endsWith('`') && part.length > 2 ? (
      <code key={i} className="rounded-sm bg-surface px-1 py-0.5 text-[0.9em]">
        {part.slice(1, -1)}
      </code>
    ) : (
      part
    )
  );
}

export function NumbersCard({ widget }: { widget: NumbersWidget }) {
  return (
    <WidgetShell kind="numbers" status={`${widget.rows.length} ${widget.rows.length === 1 ? 'value' : 'values'}`}>
      {widget.caption ? <p className="mb-3 text-sm text-text-secondary">{widget.caption}</p> : null}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[38rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border text-[11px] uppercase tracking-wider text-text-secondary">
              <th className="py-1.5 pr-3 font-medium">Quantity</th>
              <th className="py-1.5 pr-3 font-medium">Default</th>
              <th className="py-1.5 pr-3 font-medium">Why it is wrong at scale</th>
              <th className="py-1.5 font-medium">Measure your own</th>
            </tr>
          </thead>
          <tbody>
            {widget.rows.map((row) => (
              <tr key={row.quantity} className="border-b border-border/60 align-top last:border-b-0">
                <td className="py-2 pr-3 font-medium">{withInlineCode(row.quantity)}</td>
                <td className="py-2 pr-3 tabular-nums">
                  {row.source ? (
                    <a
                      href={row.source}
                      className="underline decoration-border underline-offset-2 hover:decoration-current"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {withInlineCode(row.default)}
                    </a>
                  ) : (
                    withInlineCode(row.default)
                  )}
                </td>
                <td className="py-2 pr-3 text-text-secondary">{withInlineCode(row.at_scale)}</td>
                <td className="py-2">{withInlineCode(row.measure)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </WidgetShell>
  );
}
