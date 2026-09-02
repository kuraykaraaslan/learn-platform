// P12's ⌘K search (docs/phases/12-search-and-review-queue.md). A centered
// command-palette, not a side Drawer — reuses the same shared overlay
// primitives Drawer itself is built on (focus trap, portal, presence,
// scroll lock) rather than either hand-rolling those or repurposing a
// side-drawer component for a palette-shaped UI it wasn't designed for.
//
// public/search-index.json (scripts/build-search-index.ts, ~30 KB gz) is
// fetched once, lazily, on first open — never on page load, so a reader
// who never opens search pays nothing for it.
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { cn } from '@/libs/utils/cn';
import { useFocusTrap } from '@kui/ui/Overlays/shared/useFocusTrap';
import { usePortal } from '@kui/ui/Overlays/shared/usePortal';
import { usePresence } from '@kui/ui/Overlays/shared/usePresence';
import { useScrollLock } from '@kui/ui/Overlays/shared/useScrollLock';
import { createPortal } from 'react-dom';
import { search as searchRecords, type SearchRecord, type SearchResult } from '../search-client';

function isMac(): boolean {
  return typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
}

export function SearchLauncher() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<SearchRecord[] | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const { mounted, state } = usePresence(open);
  useFocusTrap(panelRef, { active: open, onEscape: () => setOpen(false) });
  useScrollLock(open);
  const portalNode = usePortal();

  // Global ⌘K / Ctrl+K — works from anywhere on a course page, not just
  // while the launcher button has focus.
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((o) => !o);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open && records === null) {
      fetch('/search-index.json')
        .then((r) => r.json())
        .then(setRecords)
        .catch(() => setRecords([]));
    }
  }, [open, records]);

  // Same shape: the highlighted row resets when the query changes, which is
  // derived state, not a synchronization with anything outside React. Tracking
  // the previous query and adjusting during render is React's documented
  // replacement for a reset-on-change effect.
  const [lastQuery, setLastQuery] = useState(query);
  if (query !== lastQuery) {
    setLastQuery(query);
    setActiveIndex(0);
  }

  const results: SearchResult[] = records ? searchRecords(records, query) : [];

  function closeAfterNavigate() {
    setOpen(false);
    setQuery('');
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIndex]) {
      // Clicks the corresponding <Link>'s real <a> element rather than
      // calling a router directly — one navigation path (Link's own click
      // handler) for both mouse and keyboard, instead of two to keep in
      // sync.
      resultRefs.current[activeIndex]?.click();
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs text-text-secondary hover:border-primary hover:text-text-primary"
      >
        <span>Search</span>
        <kbd className="rounded border border-border-strong bg-surface-sunken px-1 py-0.5 font-mono text-[10px]">
          {isMac() ? '⌘K' : 'Ctrl K'}
        </kbd>
      </button>

      {mounted &&
        portalNode &&
        createPortal(
          <div
            className={cn('fixed inset-0 z-[100] flex items-start justify-center pt-24', state !== 'open' && 'pointer-events-none')}
            role="dialog"
            aria-modal="true"
            aria-label="Search the course content"
            data-state={state}
          >
            <div
              className={cn('absolute inset-0 bg-black/50 transition-opacity duration-200', state === 'open' ? 'opacity-100' : 'opacity-0')}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            <div
              ref={panelRef}
              tabIndex={-1}
              data-state={state}
              className={cn(
                'relative z-[101] w-full max-w-lg rounded-lg border border-border bg-surface-raised shadow-xl',
                'transition-transform duration-200 focus-visible:outline-none',
                state === 'open' ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
              )}
            >
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search by symptom or topic — “lock timeout”, “double charge”…"
                autoFocus
                className="w-full border-b border-border bg-transparent px-4 py-3 text-sm text-text-primary outline-none placeholder:text-text-secondary"
              />
              <ul className="max-h-96 overflow-y-auto p-1.5">
                {records === null && query.length >= 2 && (
                  <li className="px-3 py-2 text-xs text-text-secondary">Loading…</li>
                )}
                {results.map((r, i) => (
                  <li key={`${r.record.courseSlug}/${r.record.lessonSlug}`}>
                    <Link
                      ref={(el) => {
                        resultRefs.current[i] = el;
                      }}
                      href={`/courses/${r.record.courseSlug}/${r.record.lessonSlug}`}
                      onClick={closeAfterNavigate}
                      onMouseEnter={() => setActiveIndex(i)}
                      className={cn(
                        'block w-full rounded-md px-3 py-2 text-left',
                        i === activeIndex ? 'bg-primary/10' : 'hover:bg-surface-sunken'
                      )}
                    >
                      <p className="text-sm text-text-primary">{r.record.title}</p>
                      <p className="text-xs text-text-secondary">
                        {r.record.courseTitle}
                        {r.matchedMistake ? ` — ${r.matchedMistake}` : ''}
                      </p>
                    </Link>
                  </li>
                ))}
                {query.trim().length >= 2 && records !== null && results.length === 0 && (
                  <li className="px-3 py-2 text-xs text-text-secondary">No matches for &ldquo;{query}&rdquo;.</li>
                )}
              </ul>
            </div>
          </div>,
          portalNode
        )}
    </>
  );
}
