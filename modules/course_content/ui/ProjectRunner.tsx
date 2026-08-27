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
    <div className="mt-2 rounded-md border border-border bg-surface-sunken p-3 text-xs">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={start}
          disabled={status === 'running'}
          className="rounded-md border border-primary bg-primary/10 px-3 py-1 font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Run Project
        </button>
        {status === 'running' && (
          <button
            type="button"
            onClick={cancel}
            className="rounded-md border border-error px-3 py-1 font-medium text-error hover:bg-error-subtle"
          >
            Cancel
          </button>
        )}
        {statusText && <span className="text-text-secondary">{statusText}</span>}
      </div>

      {output && (
        <pre
          ref={outputRef}
          className="max-h-64 overflow-y-auto whitespace-pre-wrap rounded bg-surface-overlay p-2 font-mono text-text-primary"
        >
          {output}
        </pre>
      )}

      {errorMessage && (
        <pre className={cn('mt-2 whitespace-pre-wrap rounded p-2 font-mono text-error', output ? '' : 'bg-surface-overlay')}>
          {errorMessage}
        </pre>
      )}

      {previewUrl && (
        <div className="mt-2">
          <p className="mb-1 text-text-secondary">Live preview:</p>
          <iframe
            src={previewUrl}
            className="h-96 w-full rounded border border-border bg-white"
            title={`Preview for ${block.id}`}
          />
        </div>
      )}
    </div>
  );
}
