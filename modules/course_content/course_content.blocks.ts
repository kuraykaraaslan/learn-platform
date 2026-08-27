import { toHtml } from 'hast-util-to-html';
import type { Root as HastRoot, RootContent, Element } from 'hast';
import type { LessonSections } from './course_content.types';
import { parseTemplate, parseChecklist, looksLikeChecklist, type LessonWidget } from './course_content.templates';

export type { LessonWidget } from './course_content.templates';

/** P0 always produces { run: false, opts: {} }. P8 extends this shape
 *  (entry?, seed?) without touching LessonBlock's discriminant fields. */
export type FenceMeta = { run: boolean; opts: Record<string, unknown> };

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

    const lang = extractLang(node);
    const source = findCode(node)?.data?.source ?? '';
    const html = toHtml(node);
    const id = `${sectionKey}-${ordinal++}`;

    // `template` is a mechanical retag (scripts/retag-template-fences.ts) of
    // every fence measured to be form-shaped — always a widget. A fence
    // still tagged `md`/`markdown` was NOT form-shaped (that retag is
    // exhaustive over the corpus), so if it also has checkbox items it's the
    // corpus's other widget shape: a plain checklist, never both.
    let widget: LessonWidget | null = null;
    if (lang === 'template') widget = parseTemplate(source);
    else if ((lang === 'md' || lang === 'markdown') && looksLikeChecklist(source)) widget = parseChecklist(source);

    blocks.push(
      widget
        ? { kind: 'widget', id, widget, html }
        : { kind: 'code', id, lang, meta: { run: false, opts: {} }, source, html }
    );
  }
  flushHtml();

  return blocks;
}
