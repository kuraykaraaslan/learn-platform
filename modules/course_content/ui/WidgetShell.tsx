// The one card shell every enrichment widget wears. Before this there were
// three unrelated shells for the same job (`mt-2 rounded-md p-3`,
// `rounded-lg p-4` with no margin, and the section-level `rounded-lg p-5`),
// and not one of the thirteen widget kinds told the reader what it was.
//
// Deliberately NOT a client component: CodeBlock is a server component and
// renders this for all 505 corpus code fences. A 'use client' here would push
// every highlighted code string into the RSC flight payload as a prop, on top
// of the HTML it already streams.
//
// That rules out FontAwesomeIcon (context-based), which is the same call
// CopyButton.tsx already made for its own reasons. It also rules out inline
// <svg>: MermaidBlock.test.ts asserts `not.toContain('<svg')` on the SSR
// fallback, and this shell is inside it. Hence CSS-drawn marks — no SVG, no
// glyph-coverage gamble (Geist has no guaranteed ◆/▶/▣), no dependency.
import type React from 'react';
import { cn } from '@/libs/utils/cn';

export type WidgetKind =
  | 'quiz'
  | 'tradeoff'
  | 'recall'
  | 'calc'
  | 'checklist'
  | 'template'
  | 'diff'
  | 'mermaid'
  | 'run'
  | 'sql'
  | 'project'
  | 'proof'
  | 'code';

/** The one naming vocabulary. LessonFeatureChips imports this so a course
 *  overview's chip and the in-lesson card header say the same word — the
 *  chips already named these things, the cards just never did. */
export const WIDGET_LABEL: Record<WidgetKind, string> = {
  quiz: 'quiz',
  tradeoff: 'trade-off',
  recall: 'recall',
  calc: 'calculator',
  checklist: 'checklist',
  template: 'fill-in',
  diff: 'broken → fixed',
  mermaid: 'diagram',
  run: 'live code',
  sql: 'live SQL',
  project: 'run project',
  // Two kinds with no chip on the overview page, since they aren't lesson
  // "features" the catalog advertises — but they still need a header word.
  proof: 'predict output',
  code: 'code',
};

/** Five families, not thirteen marks: what's worth recognising at a glance is
 *  the kind of work a block is asking for; the word beside it says which one. */
type Family = 'answer' | 'fill' | 'run' | 'reveal' | 'read';

const FAMILY: Record<WidgetKind, Family> = {
  quiz: 'answer',
  tradeoff: 'answer',
  recall: 'answer',
  calc: 'fill',
  checklist: 'fill',
  template: 'fill',
  run: 'run',
  sql: 'run',
  project: 'run',
  proof: 'reveal',
  diff: 'reveal',
  code: 'read',
  mermaid: 'read',
};

const MARK: Record<Family, string> = {
  answer: 'size-2 rotate-45 bg-current', // diamond
  fill: 'size-2 rounded-[1px] border-2 border-current', // hollow square
  run: 'size-0 border-y-4 border-y-transparent border-l-[7px] border-l-current', // triangle
  reveal: 'size-2 rounded-full border-2 border-current', // ring
  read: 'h-0.5 w-2.5 rounded-full bg-current', // bar
};

export function WidgetShell({
  kind,
  label,
  status,
  actions,
  bodyClassName,
  className,
  children,
}: {
  kind: WidgetKind;
  /** Overrides WIDGET_LABEL[kind]. Only `code` uses it, for the fence language. */
  label?: string;
  /** Right side of the strip: "1/3 answered", "revealed", "3 fields empty".
   *  Never a percentage, a streak, or anything aggregated across widgets —
   *  docs/phases/README.md invariant #4. If derived from useProgressStore,
   *  the CALLER must gate it on useHydrated() or the strip will not match
   *  the SSR HTML. */
  status?: React.ReactNode;
  /** The only place a control may live in the strip (CopyButton). */
  actions?: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('overflow-hidden rounded-md border border-border bg-surface-sunken', className)}>
      <div className="flex items-center gap-2 border-b border-border px-3 py-1.5">
        <span aria-hidden="true" className={cn('inline-block shrink-0 text-text-secondary', MARK[FAMILY[kind]])} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-text-secondary">
          {label ?? WIDGET_LABEL[kind]}
        </span>
        <span className="ml-auto flex items-center gap-2 text-[11px] tabular-nums text-text-secondary">
          {status}
          {actions}
        </span>
      </div>
      <div className={cn('p-3', bodyClassName)}>{children}</div>
    </div>
  );
}
