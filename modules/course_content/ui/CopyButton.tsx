// Hand-rolled SVG icons instead of @fortawesome/react-fontawesome: lesson
// pages ship zero client JS today, and this is the first client component on
// that route, so there's no shared FontAwesome runtime already paid for here.
// Keeping this self-contained protects the ~2KB gz first-load budget P0 sets.
'use client';

import { useState } from 'react';
import { cn } from '@/libs/utils/cn';

export function CopyButton({ source, className }: { source: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(source).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : 'Copy code'}
      className={cn(
        'inline-flex items-center justify-center w-7 h-7 rounded-md text-text-secondary bg-surface-raised/80 border border-border',
        'hover:text-text-primary hover:bg-surface-overlay transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus',
        className
      )}
    >
      {copied ? (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none">
          <path d="M3 8.5 6.5 12 13 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true" fill="none">
          <rect x="5.5" y="5.5" width="8" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3.5 10.5h-1a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )}
      <span aria-live="polite" className="sr-only">
        {copied ? 'Copied' : ''}
      </span>
    </button>
  );
}
