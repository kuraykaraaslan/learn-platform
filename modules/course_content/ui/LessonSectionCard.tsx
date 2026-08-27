// Renders one parsed lesson section as a titled card. A section is a sequence
// of blocks (course_content.blocks.ts): 'html' runs go through the same
// remark/rehype pipeline output as before (dangerouslySetInnerHTML), 'code'
// blocks get their own <CodeBlock> with a copy button. The prose styling here
// follows the same "Tailwind arbitrary-variant selectors instead of
// @tailwindcss/typography" approach as kui-react's PostContent component
// (modules/domains/blog/post/PostContent.tsx) — not copied verbatim since the
// section set differs, but the same technique.
import { cn } from '@/libs/utils/cn';
import type { LessonBlock } from '../course_content.blocks';
import { CodeBlock } from './CodeBlock';

// Exported for course_content.blocks.test.ts's margin-regression guard.
export const PROSE_CLASSES = cn(
  'text-text-primary leading-relaxed text-sm',
  '[&_p]:mb-3 [&>:last-child>:last-child]:mb-0',
  '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-3 [&_ol]:space-y-1',
  '[&_strong]:font-semibold [&_strong]:text-text-primary',
  '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 hover:[&_a]:text-primary-hover',
  '[&_code]:bg-surface-sunken [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
  '[&_pre]:bg-surface-sunken [&_pre]:p-4 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:mb-3 [&_pre]:text-xs',
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
  '[&_aside]:rounded-lg [&_aside]:border-l-4 [&_aside]:px-4 [&_aside]:py-3 [&_aside]:mb-3 [&_aside>:last-child]:mb-0',
  '[&_aside[data-callout="note"]]:bg-info-subtle [&_aside[data-callout="note"]]:border-info [&_aside[data-callout="note"]]:text-info-fg',
  '[&_aside[data-callout="tip"]]:bg-success-subtle [&_aside[data-callout="tip"]]:border-success [&_aside[data-callout="tip"]]:text-success-fg',
  '[&_aside[data-callout="warning"]]:bg-warning-subtle [&_aside[data-callout="warning"]]:border-warning [&_aside[data-callout="warning"]]:text-warning-fg',
  '[&_aside[data-callout="caution"]]:bg-error-subtle [&_aside[data-callout="caution"]]:border-error [&_aside[data-callout="caution"]]:text-error-fg',
  '[&_aside[data-callout="pitfall"]]:bg-error-subtle [&_aside[data-callout="pitfall"]]:border-error [&_aside[data-callout="pitfall"]]:text-error-fg'
);

function BlockView({ block }: { block: LessonBlock }) {
  switch (block.kind) {
    case 'html':
      // eslint-disable-next-line react/no-danger -- block.html is our own build-time markdown pipeline output, not user input
      return <div dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'code':
      return <CodeBlock block={block} />;
    case 'widget':
      // No fence maps to 'widget' until P4 retags template fences.
      return null;
  }
}

export function LessonSectionCard({
  title,
  blocks,
  className,
}: {
  title: string;
  blocks: LessonBlock[];
  className?: string;
}) {
  if (blocks.length === 0) return null;

  return (
    <section className={cn('rounded-lg border border-border bg-surface-raised p-5', className)}>
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className={PROSE_CLASSES}>
        {blocks.map((block) => (
          <BlockView key={block.id} block={block} />
        ))}
      </div>
    </section>
  );
}
