// Renders one parsed lesson section as a titled card. A section is a sequence
// of blocks (course_content.blocks.ts): 'html' runs go through the same
// remark/rehype pipeline output as before (dangerouslySetInnerHTML), 'code'
// blocks get their own <CodeBlock> with a copy button. The markdown styling
// itself lives in ui/prose.ts (MD_CLASSES) and is applied per pipeline-HTML
// run, not to this container — see that file for why.
import { cn } from '@/libs/utils/cn';
import { MD_CLASSES } from './prose';
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
import { CalcCard } from './widgets/CalcCard';
import { SpatialCard } from './widgets/SpatialCard';

// Tried next/dynamic() here to keep this JS out of the ~324 lesson pages
// with no widget block — measured worse (8.59 kB vs 7.22 kB gz) and, per
// .next/static/chunks, produced no separate chunk at all: every one of the
// 412 [courseSlug]/[lessonSlug] pages is statically generated from the same
// route template, so the bundler had nothing per-param to split against. A
// plain import is both simpler and smaller here.

/** Section-level card chrome, shared with FailureDrillCard — which builds its
 *  own <section> in drill mode and had been carrying a byte-identical copy of
 *  both strings that was already drifting (its <h2> had a different margin).
 *  ReviewQueue uses it too, which is why `scroll-mt-20` is NOT in here: that
 *  offset belongs to being an anchor target, not to being a card. */
export const SECTION_SHELL = 'rounded-lg border border-border bg-surface-raised p-5';
export const SECTION_TITLE = 'text-sm font-semibold uppercase tracking-wide text-text-primary';

// Only the inherited type scale and the margin-regression guard live here now;
// every descendant rule moved to ui/prose.ts's MD_CLASSES, which is applied to
// each pipeline-HTML run instead of to this container. text-sm/leading-relaxed
// reach widgets by *inheritance*, which is what we want — the descendant
// variants reached them by specificity, which is what we didn't.
//
// Exported for course_content.blocks.test.ts's margin-regression guard.
export const PROSE_CLASSES = cn(
  'text-text-primary leading-relaxed text-sm',
  '[&>:last-child>:last-child]:mb-0'
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
      return <div className={MD_CLASSES} dangerouslySetInnerHTML={{ __html: block.html }} />;
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
        // No `verified` gate, unlike RecallCard/QuizCard: a calc fence makes
        // no generated claim to be wrong about — it runs the reader's own
        // numbers through a model the lesson prose states in the open.
        case 'calc':
          return (
            <CalcCard widget={block.widget} blockId={block.id} courseSlug={courseSlug} lessonFile={lessonFile} />
          );
        // `verified` is passed but does NOT gate the whole card: a spatial
        // tree is a reference, not an exercise, so it renders on any lesson.
        // Only its `ask` half obeys the stopping rule (SpatialCard.tsx).
        case 'spatial':
          return <SpatialCard widget={block.widget} verified={verified} />;
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
    <section id={sectionAnchorId(title)} className={cn(SECTION_SHELL, 'scroll-mt-20', className)}>
      <h2 className={cn(SECTION_TITLE, 'mb-3')}>{title}</h2>
      <div className={PROSE_CLASSES}>
        {/* The one place vertical rhythm between blocks is declared. It used
            to be each widget's own `mt-2` (or, for three of them, nothing at
            all), which is why two consecutive widgets collapsed to 8px while
            a paragraph followed by a widget got 20px. */}
        {blocks.map((block) => (
          <div key={block.id} className="mb-4 last:mb-0">
            <BlockView block={block} courseSlug={courseSlug} lessonFile={lessonFile} verified={verified} />
          </div>
        ))}
      </div>
    </section>
  );
}
