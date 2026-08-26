// Renders one parsed lesson section (already-HTML string from the remark/
// rehype pipeline, see course_content.markdown.ts) as a titled card. The
// prose styling here follows the same "Tailwind arbitrary-variant selectors
// instead of @tailwindcss/typography" approach as kui-react's PostContent
// component (modules/domains/blog/post/PostContent.tsx) — not copied
// verbatim since the section set differs, but the same technique.
import { cn } from '@/libs/utils/cn';

const PROSE_CLASSES = cn(
  'text-text-primary leading-relaxed text-sm',
  '[&_p]:mb-3 [&_p:last-child]:mb-0',
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
  '[&_blockquote]:border-l-2 [&_blockquote]:border-border-strong [&_blockquote]:pl-3 [&_blockquote]:text-text-secondary'
);

export function LessonSectionCard({
  title,
  html,
  className,
}: {
  title: string;
  html: string;
  className?: string;
}) {
  if (!html) return null;

  return (
    <section className={cn('rounded-lg border border-border bg-surface-raised p-5', className)}>
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        {title}
      </h2>
      {/* eslint-disable-next-line react/no-danger -- html is our own build-time markdown pipeline output, not user input */}
      <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
