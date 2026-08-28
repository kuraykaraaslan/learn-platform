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
import { TemplateFormCard } from './widgets/TemplateFormCard';
import { ChecklistCard } from './widgets/ChecklistCard';
import { MermaidBlock } from './MermaidBlock';
import { RunMount } from './RunMount';
import { ProjectRunner } from './ProjectRunner';
import { SqlRunner } from './SqlRunner';
import { PredictOutputCard } from './PredictOutputCard';
import { QuizCard } from './QuizCard';
import { TradeoffCard } from './TradeoffCard';
import { DiffCard } from './DiffCard';
import { RecallCard } from './widgets/RecallCard';

// Tried next/dynamic() here to keep this JS out of the ~324 lesson pages
// with no widget block — measured worse (8.59 kB vs 7.22 kB gz) and, per
// .next/static/chunks, produced no separate chunk at all: every one of the
// 412 [courseSlug]/[lessonSlug] pages is statically generated from the same
// route template, so the bundler had nothing per-param to split against. A
// plain import is both simpler and smaller here.

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
  '[&_aside[data-callout="pitfall"]]:bg-error-subtle [&_aside[data-callout="pitfall"]]:border-error [&_aside[data-callout="pitfall"]]:text-error-fg',
  // Concept terms (remark-concepts.ts): a real <button>, reset off its
  // default browser chrome so it reads as inline text with a dotted
  // underline, not a form control. ui/ConceptTooltip.tsx wires up the click.
  '[&_button.concept-term]:appearance-none [&_button.concept-term]:border-0 [&_button.concept-term]:bg-transparent [&_button.concept-term]:p-0 [&_button.concept-term]:m-0 [&_button.concept-term]:font-inherit [&_button.concept-term]:text-inherit',
  '[&_button.concept-term]:underline [&_button.concept-term]:decoration-dotted [&_button.concept-term]:decoration-text-secondary [&_button.concept-term]:underline-offset-2 [&_button.concept-term]:cursor-pointer',
  'hover:[&_button.concept-term]:text-primary'
);

function BlockView({
  block,
  courseSlug,
  lessonFile,
  verified,
}: {
  block: LessonBlock;
  courseSlug: string;
  lessonFile: string;
  verified: boolean;
}) {
  switch (block.kind) {
    case 'html':
      // eslint-disable-next-line react/no-danger -- block.html is our own build-time markdown pipeline output, not user input
      return <div dangerouslySetInnerHTML={{ __html: block.html }} />;
    case 'code':
      // The mermaid library itself is loaded only inside MermaidBlock, only
      // once it's actually visible — MermaidBlock's own module has no static
      // import of 'mermaid', so this branch costs ~nothing on the 412 pages
      // that never hit it.
      if (block.lang === 'mermaid') return <MermaidBlock source={block.source} html={block.html} />;
      // A `proof` fence (P5) is never a Run button — its body is real
      // stdout scripts/stamp-verify.ts already captured, not something the
      // reader executes. PredictOutputCard hides it behind a prediction.
      if (block.lang === 'proof') {
        return <PredictOutputCard block={block} courseSlug={courseSlug} lessonFile={lessonFile} />;
      }
      // `run project` (P9, WebContainer — real npm install + server) takes
      // priority over plain `run` (P8, browser sandbox): the corpus's own
      // fence syntax marks both tokens together (`run project entry=...`),
      // and a project needs the heavier runner, not the transpile-in-an-
      // iframe one.
      if (block.meta.project) return <ProjectRunner block={block} />;
      // A `sql run` fence goes to PGlite (P10, real single-process Postgres
      // in-browser), never the P8 JS sandbox — `seed=` names a file under
      // content/_runtime/seeds/, already read into block.seedSql by
      // course_content.blocks.ts (server-side, build time — "inlined at
      // build time" for a statically generated lesson page).
      if (block.lang === 'sql' && block.meta.run) {
        return <SqlRunner block={block} seedSql={block.seedSql ?? ''} courseSlug={courseSlug} lessonFile={lessonFile} />;
      }
      // RunMount replaces the plain highlighted+copy display for a `run`
      // fence — it has its own editable textarea and Run button. The actual
      // sandbox (CodeRunner) inside it is not imported until that button is
      // clicked, so this costs ~nothing on a page with no `run` fence either.
      if (block.meta.run) return <RunMount block={block} courseSlug={courseSlug} lessonFile={lessonFile} />;
      return <CodeBlock block={block} />;
    case 'widget':
      switch (block.widget.type) {
        case 'template':
          return (
            <TemplateFormCard widget={block.widget} blockId={block.id} courseSlug={courseSlug} lessonFile={lessonFile} />
          );
        case 'checklist':
          return (
            <ChecklistCard widget={block.widget} blockId={block.id} courseSlug={courseSlug} lessonFile={lessonFile} />
          );
        case 'quiz':
          return <QuizCard widget={block.widget} verified={verified} />;
        case 'tradeoff':
          return <TradeoffCard widget={block.widget} />;
        case 'diff':
          return <DiffCard widget={block.widget} />;
        case 'recall':
          return (
            <RecallCard widget={block.widget} blockId={block.id} courseSlug={courseSlug} lessonFile={lessonFile} verified={verified} />
          );
      }
  }
}

/** "What It Is" -> "what-it-is" — deep-link anchor for P12's search
 *  results and any other in-page section link. Exported so
 *  FailureDrillCard's own <section> (which bypasses this component
 *  entirely in drill mode) can render the identical id for "Common
 *  Mistakes", keeping every section's anchor computed one way. */
export function sectionAnchorId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export function LessonSectionCard({
  title,
  blocks,
  courseSlug,
  lessonFile,
  className,
  // Gates QuizCard only (docs/phases/06's constraint #1) — defaults to
  // false, the safe direction: a caller that doesn't know or pass a
  // lesson's verified status never accidentally opens a quiz.
  verified = false,
}: {
  title: string;
  blocks: LessonBlock[];
  courseSlug: string;
  lessonFile: string;
  className?: string;
  verified?: boolean;
}) {
  if (blocks.length === 0) return null;

  return (
    <section id={sectionAnchorId(title)} className={cn('scroll-mt-20 rounded-lg border border-border bg-surface-raised p-5', className)}>
      <h2 className="text-sm font-semibold text-text-primary uppercase tracking-wide mb-3">
        {title}
      </h2>
      <div className={PROSE_CLASSES}>
        {blocks.map((block) => (
          <BlockView key={block.id} block={block} courseSlug={courseSlug} lessonFile={lessonFile} verified={verified} />
        ))}
      </div>
    </section>
  );
}
