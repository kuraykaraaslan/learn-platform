// Everything that styles markdown-pipeline HTML, in the same "Tailwind
// arbitrary-variant selectors instead of @tailwindcss/typography" approach as
// kui-react's PostContent component (modules/domains/blog/post/PostContent.tsx).
//
// Why this lives on the *wrapper of a pipeline-HTML run* and not on the
// section container: an arbitrary descendant variant compiles to `.cls el` —
// specificity (0,1,1) — which beats a widget's own `.pl-4` (0,1,0) regardless
// of source order, and cn/tailwind-merge can't help because it only dedupes
// within one className call. While these sat on the container, every widget
// was a descendant, so `[&_ul]:list-disc` put bullets next to ChecklistCard's
// checkboxes and `[&_pre]:p-4 [&_pre]:bg-surface-sunken` overrode the inset
// panes in PredictOutputCard/SqlRunner/ProjectRunner/TemplateFormCard —
// their authored `p-2 bg-surface-overlay` never actually rendered.
//
// Only three things render pipeline HTML: an 'html' block, CodeBlock's <pre>,
// and MermaidBlock's source fallback. Applied to those three, a widget is a
// *sibling* of the styled wrapper and is structurally out of reach.
//
// Kept as its own module rather than in LessonSectionCard.tsx because
// CodeBlock imports it and LessonSectionCard imports CodeBlock.
import { cn } from '@/libs/utils/cn';

export const MD_CLASSES = cn(
  // Each run ends flush; the gap between blocks is the per-block wrapper's
  // job (LessonSectionCard's `mb-4 last:mb-0`), not the last paragraph's.
  '[&>:last-child]:mb-0',
  '[&_p]:mb-3',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1',
  '[&_strong]:font-semibold [&_strong]:text-text-primary',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-hover',
  '[&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded-md [&_code]:text-xs [&_code]:font-mono',
  '[&_pre]:bg-surface-sunken [&_pre]:p-4 [&_pre]:rounded-md [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:text-xs',
  '[&_pre_code]:bg-transparent [&_pre_code]:p-0',
  '[&_table]:w-full [&_table]:text-xs [&_table]:mb-3 [&_table]:border-collapse',
  '[&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-surface-overlay [&_th]:text-left',
  '[&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1',
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary',
  // Callouts (remark-callouts.ts): a blockquote starting with `[!KIND]`
  // becomes `<aside data-callout="kind">`. Zero client JS — theme tokens
  // carry light/dark automatically. note/tip lean informational, warning is
  // its own token, caution and pitfall (this corpus's inline Common Mistakes
  // equivalent) both read as "this will actually break something".
  //
  // These stay a separate visual language from the runtime status boxes in
  // widget-ui.ts (NOTE_WARNING/NOTE_ERROR): a callout is authored content,
  // a status box is something that just happened.
  '[&_aside]:rounded-lg [&_aside]:border-l-4 [&_aside]:px-4 [&_aside]:py-3 [&_aside]:mb-3 [&_aside>:last-child]:mb-0',
  '[&_aside[data-callout="note"]]:bg-info-subtle [&_aside[data-callout="note"]]:border-info [&_aside[data-callout="note"]]:text-info-fg',
  '[&_aside[data-callout="tip"]]:bg-success-subtle [&_aside[data-callout="tip"]]:border-success [&_aside[data-callout="tip"]]:text-success-fg',
  '[&_aside[data-callout="warning"]]:bg-warning-subtle [&_aside[data-callout="warning"]]:border-warning [&_aside[data-callout="warning"]]:text-warning-fg',
  '[&_aside[data-callout="caution"]]:bg-error-subtle [&_aside[data-callout="caution"]]:border-error [&_aside[data-callout="caution"]]:text-error-fg',
  '[&_aside[data-callout="pitfall"]]:bg-error-subtle [&_aside[data-callout="pitfall"]]:border-error [&_aside[data-callout="pitfall"]]:text-error-fg',
  // Concept terms (remark-concepts.ts): a real <button>, reset off its
  // default browser chrome so it reads as inline text with a dotted
  // underline, not a form control. ui/ConceptTooltip.tsx wires up the click.
  '[&_button.concept-term]:appearance-none [&_button.concept-term]:border-0 [&_button.concept-term]:bg-transparent [&_button.concept-term]:p-0 [&_button.concept-term]:m-0 [&_button.concept-term]:font-inherit [&_button.concept-term]:text-inherit',
  '[&_button.concept-term]:underline [&_button.concept-term]:decoration-dotted [&_button.concept-term]:decoration-text-secondary [&_button.concept-term]:underline-offset-2 [&_button.concept-term]:cursor-pointer',
  'hover:[&_button.concept-term]:text-primary'
);
