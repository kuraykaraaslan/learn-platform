import { toHtml } from 'hast-util-to-html';
import type { Root as HastRoot, RootContent, Element } from 'hast';
import type { LessonSections } from './course_content.types';
import { parseTemplate, parseChecklist, looksLikeChecklist, type TemplateWidget, type ChecklistWidget } from './course_content.templates';
import { parseQuiz, type QuizWidget } from './course_content.quiz';
import { parseTradeoff, type TradeoffWidget } from './course_content.tradeoff';
import { looksLikeDiff, parseDiff, type DiffWidget } from './course_content.diff';
import { parseRecall, type RecallWidget } from './course_content.recall';
import { parseCalc, type CalcWidget } from './course_content.calc';
import { parseSpatial, type SpatialWidget } from './course_content.spatial';
import { parseFenceMeta, type FenceMeta } from './course_content.fence-meta';
import { loadSeed } from './course_content.seeds';

export type { FenceMeta } from './course_content.fence-meta';
export type { TemplateWidget, ChecklistWidget } from './course_content.templates';
export type { QuizWidget, QuizQuestion, QuizOption } from './course_content.quiz';
export type { TradeoffWidget } from './course_content.tradeoff';
export type { DiffWidget } from './course_content.diff';
export type { RecallWidget, RecallItem } from './course_content.recall';
export type { CalcWidget, CalcInput, CalcOutput } from './course_content.calc';
// P11's record: a missing type re-export compiles under vitest and only blows
// up in `next build`'s tsc pass, so every widget's type leaves through here.
export type { SpatialWidget, SpatialNode, SpatialProp, SpatialRel } from './course_content.spatial';

export type LessonWidget =
  | TemplateWidget
  | ChecklistWidget
  | QuizWidget
  | TradeoffWidget
  | DiffWidget
  | RecallWidget
  | CalcWidget
  | SpatialWidget;

declare module 'hast' {
  interface Data {
    /** mdast-util-to-hast's own convention (lib/handlers/code.js): everything
     *  in a fence's info string after the language token. Not declared by
     *  hast's own types, since it's mdast-util-to-hast-specific, not a hast
     *  concept. */
    meta?: string;
  }
}

export type LessonBlock =
  | { kind: 'html'; id: string; html: string }
  | { kind: 'code'; id: string; lang: string; meta: FenceMeta; source: string; html: string; seedSql?: string }
  | { kind: 'widget'; id: string; widget: LessonWidget; html: string };

function isPre(node: RootContent): node is Element {
  return node.type === 'element' && node.tagName === 'pre';
}

function findCode(pre: Element): Element | undefined {
  return pre.children.find((c): c is Element => c.type === 'element' && c.tagName === 'code');
}

function extractLang(pre: Element): string {
  const classes = findCode(pre)?.properties?.className;
  const list = Array.isArray(classes) ? classes : [];
  const languageClass = list.find((c) => typeof c === 'string' && c.startsWith('language-'));
  return typeof languageClass === 'string' ? languageClass.slice('language-'.length) : '';
}

/**
 * Splits a section's hast tree at <pre> boundaries — the one shape the corpus
 * guarantees (505/505 <pre> nodes are direct children of the section root).
 * Every non-<pre> run becomes one 'html' block, rendered with the same
 * hast-util-to-html used everywhere else in the pipeline; every <pre> becomes
 * its own 'code' block, source read back from the data.source stashed by
 * rehypeStashCode (course_content.markdown.ts runs it before rehype-highlight).
 */
export function splitBlocks(root: HastRoot, sectionKey: keyof LessonSections): LessonBlock[] {
  const blocks: LessonBlock[] = [];
  let ordinal = 0;
  let run: RootContent[] = [];

  function flushHtml() {
    if (run.length === 0) return;
    blocks.push({
      kind: 'html',
      id: `${sectionKey}-${ordinal++}`,
      html: toHtml({ type: 'root', children: run }),
    });
    run = [];
  }

  for (const node of root.children) {
    if (!isPre(node)) {
      run.push(node);
      continue;
    }
    flushHtml();

    const lang = extractLang(node);
    const code = findCode(node);
    const source = code?.data?.source ?? '';
    const meta = parseFenceMeta(code?.data?.meta ?? '');
    const html = toHtml(node);
    const id = `${sectionKey}-${ordinal++}`;

    // `template` is a mechanical retag (scripts/retag-template-fences.ts) of
    // every fence measured to be form-shaped — always a widget. A fence
    // still tagged `md`/`markdown` was NOT form-shaped (that retag is
    // exhaustive over the corpus), so if it also has checkbox items it's the
    // corpus's other widget shape: a plain checklist, never both.
    //
    // quiz/tradeoff parsing can throw (bad YAML, a zod violation) — left
    // uncaught on purpose: docs/phases/06-quiz-tradeoff-diff.md calls for a
    // bad payload to be a build failure ("widget/invalid-payload"), not a
    // silently-dropped widget.
    //
    // A diff pair is detected structurally (the broken/fixed marker
    // comment), not by a dedicated fence language — it labels a shape
    // that's already sitting in whatever language the fence was written in.
    let widget: LessonWidget | null = null;
    if (lang === 'template') widget = parseTemplate(source);
    else if ((lang === 'md' || lang === 'markdown') && looksLikeChecklist(source)) widget = parseChecklist(source);
    else if (lang === 'quiz') widget = parseQuiz(source);
    else if (lang === 'tradeoff') widget = parseTradeoff(source);
    else if (lang === 'recall') widget = parseRecall(source);
    else if (lang === 'calc') widget = parseCalc(source);
    else if (lang === 'spatial') widget = parseSpatial(source);
    else if (looksLikeDiff(source)) widget = parseDiff(source);

    // Read here, not in the UI layer: loadSeed() touches node:fs, and this
    // module (unlike a `'use client'` component) is only ever reachable from
    // client bundles through a type-only `import type { LessonBlock }` —
    // erased at compile time, so fs never ends up in a webpack client build.
    const seedSql = lang === 'sql' && meta.run && meta.seed ? loadSeed(meta.seed) : undefined;

    blocks.push(
      widget ? { kind: 'widget', id, widget, html } : { kind: 'code', id, lang, meta, source, html, seedSql }
    );
  }
  flushHtml();

  return blocks;
}
