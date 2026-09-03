// A fillable document, not a web form — docs/phases/04-template-widgets.md
// is explicit that preserving the source template's exact shape (line
// breaks, indentation, the surrounding prose) is the whole point, so this
// renders the parsed line/token stream inline rather than laying fields out
// as a conventional stacked form.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';
import {
  useProgressStore,
  widgetFieldKey,
} from '@/modules/progress/progress.store';
import type { TemplateWidget } from '../../course_content.templates';
import { useHydrated } from '@/modules/progress/useHydrated';
import { WidgetShell } from '../WidgetShell';
import { BTN_SECONDARY, CHECKBOX, FIELD_INLINE, PANE } from '../widget-ui';
import { composeFilledText, countEmptyFields } from '../../course_content.templates';

function fieldWidth(placeholder: string): number {
  return Math.max(4, Math.min(placeholder.length + 2, 40));
}

export function TemplateFormCard({
  widget,
  blockId,
  courseSlug,
  lessonFile,
}: {
  widget: TemplateWidget;
  blockId: string;
  courseSlug: string;
  lessonFile: string;
}) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [copied, setCopied] = useState(false);

  const allValues = useProgressStore((s) => s.templateValues);
  const allChecked = useProgressStore((s) => s.checklistChecked);
  const setTemplateValue = useProgressStore((s) => s.setTemplateValue);
  const setChecklistChecked = useProgressStore((s) => s.setChecklistChecked);
  // persist() reads localStorage synchronously, so an ungated store read
  // during render can disagree with the SSR HTML. Both maps stay empty until
  // hydration, which is exactly what the server rendered.
  const hydrated = useHydrated();

  const prefix = `${courseSlug}/${lessonFile}#${blockId}:`;
  const values: Record<string, string> = {};
  const checked: Record<string, boolean> = {};
  if (hydrated) {
    for (const [key, value] of Object.entries(allValues)) if (key.startsWith(prefix)) values[key.slice(prefix.length)] = value;
    for (const [key, value] of Object.entries(allChecked)) if (key.startsWith(prefix)) checked[key.slice(prefix.length)] = value;
  }

  const emptyCount = countEmptyFields(widget, values);
  const storageKey = (fieldId: string) => widgetFieldKey(courseSlug, lessonFile, blockId, fieldId);

  function handleCopy() {
    navigator.clipboard.writeText(composeFilledText(widget, values, checked)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    const blob = new Blob([composeFilledText(widget, values, checked)], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${lessonFile.replace(/\.md$/, '')}-filled.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleReset() {
    for (const line of widget.lines) {
      for (const token of line) {
        if (token.kind === 'field') setTemplateValue(storageKey(token.id), '');
        if (token.kind === 'checkbox') setChecklistChecked(storageKey(token.id), false);
      }
    }
  }

  return (
    <WidgetShell
      kind="template"
      status={emptyCount > 0 ? `${emptyCount} field${emptyCount === 1 ? '' : 's'} empty` : 'complete'}
      bodyClassName="p-4"
    >
      {/* Four buttons stay in the body rather than the strip — that's more
          than a header row can hold without becoming the loudest thing here. */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={handleCopy} className={BTN_SECONDARY}>
          {copied ? 'Copied' : 'Copy filled document'}
        </button>
        <button type="button" onClick={handleDownload} className={BTN_SECONDARY}>
          Download .md
        </button>
        <button type="button" onClick={handleReset} className={BTN_SECONDARY}>
          Reset
        </button>
        <button type="button" onClick={() => setShowOriginal((v) => !v)} className={BTN_SECONDARY}>
          {showOriginal ? 'Show filled' : 'Show original'}
        </button>
      </div>

      {showOriginal ? (
        <pre className={cn(PANE, 'text-text-secondary')}>{widget.raw}</pre>
      ) : (
        <div className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-text-primary">
          {widget.lines.map((line, lineIndex) => (
            <div key={lineIndex}>
              {line.length === 0 ? (
                ' '
              ) : (
                line.map((token, tokenIndex) => {
                  const key = `${lineIndex}-${tokenIndex}`;
                  switch (token.kind) {
                    case 'text':
                      return <span key={key}>{token.value}</span>;
                    case 'bold':
                      return (
                        <strong key={key} className="font-semibold">
                          {token.value}
                        </strong>
                      );
                    case 'field':
                      return token.inputType === 'textarea' ? (
                        <textarea
                          key={key}
                          value={values[token.id] ?? ''}
                          onChange={(e) => setTemplateValue(storageKey(token.id), e.target.value)}
                          placeholder={token.placeholder}
                          rows={2}
                          className={cn(FIELD_INLINE, 'block w-full max-w-full resize-y align-bottom')}
                        />
                      ) : (
                        <input
                          key={key}
                          type={token.inputType === 'date' ? 'text' : token.inputType}
                          value={values[token.id] ?? ''}
                          onChange={(e) => setTemplateValue(storageKey(token.id), e.target.value)}
                          placeholder={token.placeholder}
                          style={{ width: `${fieldWidth(token.placeholder)}ch` }}
                          className={FIELD_INLINE}
                        />
                      );
                    case 'checkbox':
                      return (
                        <label key={key} className="mr-1 inline-flex items-center gap-1 align-middle">
                          <input
                            type="checkbox"
                            className={cn(CHECKBOX, 'mt-0')}
                            checked={checked[token.id] ?? token.checked}
                            onChange={(e) => setChecklistChecked(storageKey(token.id), e.target.checked)}
                          />
                          <span>{token.label}</span>
                        </label>
                      );
                  }
                })
              )}
            </div>
          ))}
        </div>
      )}
    </WidgetShell>
  );
}
