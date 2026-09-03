// The class recipes every enrichment widget composes from. Before this file
// the primary action button existed as five near-identical strings that
// differed only by an accidentally-omitted `text-xs` or a missing set of
// `disabled:*` variants, and `transition-colors` was present on roughly half
// the controls that needed it.
//
// Plain strings rather than a copied kui-react <Button>: upstream's `primary`
// is a solid `bg-primary text-primary-fg` button, while every Run/Show button
// here is deliberately the quieter `border-primary bg-primary/10` tint —
// these sit *inside prose*, not in a toolbar. Adopting upstream would mean
// adding a `tint` variant to a copied file, which PROVENANCE.md forbids, and
// swapping components would risk FailureDrillCard.test.ts's literal `<button`
// count. A class string changes no markup at all.
//
// RADIUS CONVENTION (there are no radius tokens — tailwind-merge can't reason
// about a custom `--radius-*` key, so `cn('rounded-md', className)` would emit
// both and let source order decide):
//   rounded-lg   section-level cards only (LessonSectionCard, FailureDrillCard)
//   rounded-md   the widget shell and every control — button, chip, field, pane
//   rounded-sm   inline text controls, where a full radius would look wrong
//   rounded-full Badge and BracketBar only
//   rounded      banned — it was scattered across 9 files at 3 different sizes
import { cn } from '@/libs/utils/cn';

/** Baked into every recipe below. Before this, CopyButton was the only
 *  control on a lesson page with any focus style at all — quiz options, diff
 *  toggles, Run buttons, assessment chips and the drill triggers had none. */
export const FOCUS_RING = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus';

const BTN_BASE = cn(
  'inline-flex items-center justify-center gap-1.5 rounded-md border px-3 py-1',
  'text-xs font-medium transition-colors',
  'disabled:cursor-not-allowed disabled:opacity-50',
  FOCUS_RING
);

/** Run / Run Project / Show / Show real output — starts something. */
export const BTN_PRIMARY = cn(BTN_BASE, 'border-primary bg-primary/10 text-primary hover:bg-primary/20');

/** Reset / Copy / Download / Show original / Show the arithmetic — toolbar. */
export const BTN_SECONDARY = cn(
  BTN_BASE,
  'border-border text-text-secondary hover:bg-surface-overlay hover:text-text-primary'
);

/** Cancel — ProjectRunner only. */
export const BTN_DESTRUCTIVE = cn(BTN_BASE, 'border-error text-error-fg hover:bg-error-subtle');

/** Pick again / Expand all — a text link, not a box. */
export const BTN_LINK = cn(
  'rounded-sm text-xs text-text-secondary underline underline-offset-2 transition-colors hover:text-text-primary',
  FOCUS_RING
);

/** A quiz option or a tradeoff side — a large selectable surface. */
export const CHOICE_BASE = cn(
  'w-full rounded-md border px-3 py-2 text-left text-sm transition-colors disabled:cursor-default',
  FOCUS_RING
);
export const CHOICE_IDLE = 'border-border bg-surface-base text-text-primary hover:border-primary';

/** An assessment chip or a diff toggle — a small selectable surface. */
export const CHIP_BASE = cn('rounded-md border px-2 py-1 text-xs font-medium transition-colors', FOCUS_RING);
export const CHIP_IDLE = 'border-border text-text-secondary hover:border-border-strong hover:text-text-primary';
export const CHIP_ON = 'border-primary bg-primary/10 text-primary';

/** Every boxed text field. `border-border-strong`, not `border-border`:
 *  WCAG 1.4.11 wants 3:1 for a form-control boundary and that's the only
 *  token which reaches it. */
export const FIELD = cn(
  'w-full rounded-md border border-border-strong bg-surface-overlay px-2 py-1.5 text-sm text-text-primary',
  'placeholder:text-text-disabled outline-none transition-colors',
  'focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-border-focus'
);

/** The two code editors (RunMount, SqlRunner). twMerge folds px/py into p-3. */
export const FIELD_CODE = cn(FIELD, 'resize-y p-3 font-mono text-xs');

/** TemplateFormCard's `ch`-width inline fields — a fillable DOCUMENT, not a
 *  form (docs/phases/04-template-widgets.md). Preserving the template's own
 *  line breaks and indentation is the entire point, so these stay underlines
 *  and never become boxes. No ring: there's no room inline, so a faint fill
 *  marks focus instead. */
export const FIELD_INLINE = cn(
  'mx-0.5 inline border-0 border-b border-border-strong bg-transparent font-mono text-xs text-text-primary',
  'outline-none transition-colors focus-visible:border-primary focus-visible:bg-primary/5'
);

/** Native checkbox, themed off --color-primary. Without accent-* these render
 *  in browser-default blue and ignore the theme toggle entirely. */
export const CHECKBOX = cn('mt-0.5 h-3.5 w-3.5 shrink-0 accent-primary', FOCUS_RING);

/** An inset pane inside a widget body: prediction echo, SQL plan, run output. */
export const PANE =
  'overflow-x-auto whitespace-pre-wrap rounded-md border border-border bg-surface-overlay p-2 font-mono text-xs text-text-primary';

/** Runtime status boxes — one language replacing four. Note the `-fg` tokens:
 *  --error and --warning are BORDER hues, and as body text on a light surface
 *  --warning (#f59e0b) is 1.76:1, genuinely unreadable. --warning-fg is 7.45:1. */
export const NOTE_WARNING = 'rounded-md border border-warning bg-warning-subtle px-2 py-1.5 text-xs text-warning-fg';
export const NOTE_ERROR = 'rounded-md border border-error bg-error-subtle px-2 py-1.5 text-xs text-error-fg';
