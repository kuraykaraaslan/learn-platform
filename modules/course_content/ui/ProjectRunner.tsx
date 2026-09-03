// Always present on a `run project` block — same "always-present light
// wrapper" shape as RunMount.tsx, except there's no separate lazy-loaded
// heavy component to split off: runtime/webcontainer.client.ts already keeps
// its only expensive import (@webcontainer/api) inside the async function
// runProject() calls, never at module top level, so importing that module
// here statically still ships zero WebContainer bytes until Run Project is
// actually clicked.
//
// No xterm — a plain <pre> with auto-scroll is ~200KB cheaper and this only
// ever needs to show streamed text, never accept terminal input.
'use client';

import { useRef, useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { runProject, type RunProjectHandle } from '../runtime/webcontainer.client';
import type { LessonBlock } from '../course_content.blocks';
import { WidgetShell } from './WidgetShell';
import { BTN_DESTRUCTIVE, BTN_PRIMARY, NOTE_ERROR, PANE } from './widget-ui';

type Status = 'idle' | 'running' | 'server-ready' | 'done' | 'error';

export function ProjectRunner({ block }: { block: Extract<LessonBlock, { kind: 'code' }> }) {
  const [status, setStatus] = useState<Status>('idle');
  const [statusText, setStatusText] = useState('');
  const [output, setOutput] = useState('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const handleRef = useRef<RunProjectHandle | null>(null);
  const outputRef = useRef<HTMLPreElement>(null);

  function appendOutput(text: string) {
    setOutput((prev) => prev + text);
    // Auto-scroll — the one bit of behavior a plain <pre> doesn't give for
    // free, which is the entire cost of not using a real terminal widget.
    requestAnimationFrame(() => {
      if (outputRef.current) outputRef.current.scrollTop = outputRef.current.scrollHeight;
    });
  }

  function start() {
    setStatus('running');
    setOutput('');
    setPreviewUrl(null);
    setErrorMessage(null);

    handleRef.current = runProject(block.source, block.meta.entry, block.meta.cmd, (event) => {
      switch (event.type) {
        case 'status':
          setStatusText(event.text);
          break;
        case 'output':
          appendOutput(event.text);
          break;
        case 'server-ready':
          setStatus('server-ready');
          setPreviewUrl(event.url);
          break;
        case 'error':
          setStatus('error');
          setErrorMessage(event.message);
          break;
        case 'exit':
          setStatus((s) => (s === 'server-ready' ? s : 'done'));
          break;
      }
    });
  }

  function cancel() {
    handleRef.current?.cancel();
    setStatus('idle');
    setStatusText('Cancelled.');
  }

  return (
    // statusText moves into the strip's status slot — it was competing with
    // the buttons for the same row, and the strip is where every other
    // widget's "where am I" line now lives.
    <WidgetShell kind="project" status={statusText || undefined} bodyClassName="p-3 text-xs">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button type="button" onClick={start} disabled={status === 'running'} className={BTN_PRIMARY}>
          Run Project
        </button>
        {status === 'running' && (
          <button type="button" onClick={cancel} className={BTN_DESTRUCTIVE}>
            Cancel
          </button>
        )}
      </div>

      {output && (
        <pre ref={outputRef} className={cn(PANE, 'max-h-64 overflow-y-auto')}>
          {output}
        </pre>
      )}

      {errorMessage && <pre className={cn(NOTE_ERROR, 'mt-2 whitespace-pre-wrap font-mono')}>{errorMessage}</pre>}

      {previewUrl && (
        <div className="mt-2">
          <p className="mb-1 text-text-secondary">Live preview:</p>
          <iframe
            src={previewUrl}
            // bg-white, not a token: this frame renders a third-party page
            // that assumes a white canvas, so theming it would be a bug.
            className="h-96 w-full rounded-md border border-border bg-white"
            title={`Preview for ${block.id}`}
          />
        </div>
      )}
    </WidgetShell>
  );
}
