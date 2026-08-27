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

  const prefix = `${courseSlug}/${lessonFile}#${blockId}:`;
  const values: Record<string, string> = {};
  const checked: Record<string, boolean> = {};
  for (const [key, value] of Object.entries(allValues)) if (key.startsWith(prefix)) values[key.slice(prefix.length)] = value;
  for (const [key, value] of Object.entries(allChecked)) if (key.startsWith(prefix)) checked[key.slice(prefix.length)] = value;

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
    <div className="rounded-lg border border-border bg-surface-sunken p-4">
      <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
        <button type="button" onClick={handleCopy} className="rounded-md border border-border px-2 py-1 hover:bg-surface-overlay">
          {copied ? 'Copied' : 'Copy filled document'}
        </button>
        <button type="button" onClick={handleDownload} className="rounded-md border border-border px-2 py-1 hover:bg-surface-overlay">
          Download .md
        </button>
        <button type="button" onClick={handleReset} className="rounded-md border border-border px-2 py-1 hover:bg-surface-overlay">
          Reset
        </button>
        <button
          type="button"
          onClick={() => setShowOriginal((v) => !v)}
          className="rounded-md border border-border px-2 py-1 hover:bg-surface-overlay"
        >
          {showOriginal ? 'Show filled' : 'Show original'}
        </button>
        {emptyCount > 0 && (
          <span className="text-text-secondary">
            {emptyCount} field{emptyCount === 1 ? '' : 's'} still empty
          </span>
        )}
      </div>

      {showOriginal ? (
        <pre className="whitespace-pre-wrap font-mono text-xs text-text-secondary">{widget.raw}</pre>
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
                          className="mx-0.5 w-full max-w-full resize-y rounded border-b border-border-strong bg-transparent align-bottom font-mono text-xs text-text-primary outline-none focus-visible:border-primary"
                        />
                      ) : (
                        <input
                          key={key}
                          type={token.inputType === 'date' ? 'text' : token.inputType}
                          value={values[token.id] ?? ''}
                          onChange={(e) => setTemplateValue(storageKey(token.id), e.target.value)}
                          placeholder={token.placeholder}
                          style={{ width: `${fieldWidth(token.placeholder)}ch` }}
                          className={cn(
                            'mx-0.5 inline border-b border-border-strong bg-transparent font-mono text-xs text-text-primary outline-none',
                            'focus-visible:border-primary'
                          )}
                        />
                      );
                    case 'checkbox':
                      return (
                        <label key={key} className="mr-1 inline-flex items-center gap-1 align-middle">
                          <input
                            type="checkbox"
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
    </div>
  );
}
