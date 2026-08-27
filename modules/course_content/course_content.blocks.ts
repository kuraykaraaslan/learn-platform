import { toHtml } from 'hast-util-to-html';
import type { Root as HastRoot, RootContent, Element } from 'hast';
import type { LessonSections } from './course_content.types';

/** P0 always produces { run: false, opts: {} }. P8 extends this shape
 *  (entry?, seed?) without touching LessonBlock's discriminant fields. */
export type FenceMeta = { run: boolean; opts: Record<string, unknown> };

/** Placeholder — no block of kind 'widget' is ever produced in P0. P4 defines
 *  the concrete shape (TemplateFormCard / ChecklistCard data) here without
 *  changing LessonBlock's { kind, id, widget, html } signature. */
export type LessonWidget = unknown;

export type LessonBlock =
  | { kind: 'html'; id: string; html: string }
  | { kind: 'code'; id: string; lang: string; meta: FenceMeta; source: string; html: string }
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
    blocks.push({
      kind: 'code',
      id: `${sectionKey}-${ordinal++}`,
      lang: extractLang(node),
      meta: { run: false, opts: {} },
      source: findCode(node)?.data?.source ?? '',
      html: toHtml(node),
    });
  }
  flushHtml();

  return blocks;
}
