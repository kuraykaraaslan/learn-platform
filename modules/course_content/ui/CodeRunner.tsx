// Loaded via next/dynamic({ssr:false}) from RunMount.tsx, only after the
// reader actually clicks Run — this module (and everything it imports,
// including sucrase) never ships to a page until that click happens.
'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/libs/utils/cn';
import { transpileForSandbox } from '../course_content.transpile';
import { buildSandboxHtml } from '../course_content.sandbox';

type LogEntry = { level: 'log' | 'warn' | 'error' | 'table'; parts: string[] };
type Status = 'running' | 'done' | 'error' | 'timeout';

const WATCHDOG_MS = 3000;
// Independent of course_content.sandbox.ts's per-value serializer caps
// (depth/entries) — this bounds the total number of console.* CALLS
// accumulated before the watchdog fires, so a `while(true) console.log(...)`
// can't make the parent tab janky re-rendering thousands of log lines during
// the 3 seconds it takes the watchdog to notice.
const MAX_LOG_ENTRIES = 200;

export function CodeRunner({ source, lang }: { source: string; lang: string }) {
  const [status, setStatus] = useState<Status>('running');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [error, setError] = useState<{ message: string; stack: string } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const transpiled = transpileForSandbox(source, lang);
    if (!transpiled.ok) {
      setStatus('error');
      setError({ message: transpiled.error, stack: '' });
      return;
    }
    const code = transpiled.code; // rebound so the closure below narrows correctly

    const nonce = crypto.randomUUID();
    const iframe = document.createElement('iframe');
    iframe.setAttribute('sandbox', 'allow-scripts'); // deliberately NOT allow-same-origin — opaque origin
    iframe.style.display = 'none'; // headless: nothing in the srcdoc is meant to be looked at, only its console output
    iframe.srcdoc = buildSandboxHtml(nonce);

    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let settled = false;

    function cleanup() {
      if (watchdog) clearTimeout(watchdog);
      window.removeEventListener('message', onMessage);
      iframe.remove();
    }

    function onMessage(event: MessageEvent) {
      // The frame is opaque-origin, so event.origin is the literal string
      // "null" — authentication is the nonce, not the origin.
      if (!event.data || event.data.nonce !== nonce) return;

      if (event.data.type === 'ready') {
        iframe.contentWindow?.postMessage({ nonce, type: 'run', code }, '*');
        watchdog = setTimeout(() => {
          if (settled) return;
          settled = true;
          setStatus('timeout');
          setError({ message: `Timed out after ${WATCHDOG_MS / 1000}s (likely an infinite loop) — stopped.`, stack: '' });
          cleanup();
        }, WATCHDOG_MS);
        return;
      }
      if (event.data.type === 'log') {
        setLogs((prev) =>
          prev.length >= MAX_LOG_ENTRIES ? prev : [...prev, { level: event.data.level, parts: event.data.parts }]
        );
        return;
      }
      if (event.data.type === 'done') {
        if (settled) return;
        settled = true;
        setStatus('done');
        cleanup();
        return;
      }
      if (event.data.type === 'error') {
        if (settled) return;
        settled = true;
        setStatus('error');
        setError({ message: event.data.message, stack: event.data.stack ?? '' });
        cleanup();
      }
    }

    window.addEventListener('message', onMessage);
    containerRef.current?.appendChild(iframe);

    return () => {
      if (!settled) cleanup();
    };
  }, [source, lang]);

  return (
    <div className="mt-2 rounded-md border border-border bg-surface-sunken p-3 font-mono text-xs">
      <div ref={containerRef} />
      {status === 'running' && <p className="text-text-secondary">Running…</p>}
      {logs.map((entry, i) => (
        <pre
          key={i}
          className={cn(
            'whitespace-pre-wrap',
            entry.level === 'error' ? 'text-error' : entry.level === 'warn' ? 'text-warning' : 'text-text-primary'
          )}
        >
          {entry.parts.join(' ')}
        </pre>
      ))}
      {status === 'done' && logs.length === 0 && <p className="text-text-secondary">(no output)</p>}
      {error && (
        <pre className="whitespace-pre-wrap text-error">
          {error.message}
          {error.stack ? `\n${error.stack}` : ''}
        </pre>
      )}
    </div>
  );
}
