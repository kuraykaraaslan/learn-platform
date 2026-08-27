// remark-concepts.ts renders every linked term as plain server HTML —
// `<button data-concept="slug">` — inside a section's dangerouslySetInnerHTML
// block, not a React component (there's no hydration boundary inside raw
// HTML). This wraps a lesson page's content in ONE click-delegating listener
// that shows a SHARED popover for whichever button was clicked, instead of
// mounting a component per mention — the JS cost stays roughly constant
// whether a lesson uses 1 concept or the 4-per-lesson maximum.
'use client';

import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePortal } from '@kui/ui/Overlays/shared/usePortal';
import { useDismiss } from '@kui/ui/Overlays/shared/useDismiss';
import { cn } from '@/libs/utils/cn';
import type { ConceptSummary } from '../course_content.concepts';

type Active = { slug: string; rect: DOMRect };

const POPOVER_WIDTH = 260;

export function ConceptTooltipProvider({
  concepts,
  children,
  className,
}: {
  concepts: Record<string, ConceptSummary>;
  children: React.ReactNode;
  className?: string;
}) {
  const [active, setActive] = useState<Active | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const portalNode = usePortal();

  const close = useCallback(() => {
    setActive(null);
    triggerRef.current?.focus();
  }, []);

  useDismiss({ active: active !== null, ref: popoverRef, onDismiss: close });

  // Delegated: a term button is server-rendered raw HTML somewhere inside
  // `children`, never an individually mounted component (see file header).
  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    const button = target.closest<HTMLElement>('[data-concept]');
    if (!button) return;
    const slug = button.dataset.concept;
    if (!slug || !concepts[slug]) return;

    triggerRef.current = button;
    setActive({ slug, rect: button.getBoundingClientRect() });
  }

  const concept = active ? concepts[active.slug] : null;

  return (
    <div className={className} onClick={handleClick}>
      {children}
      {concept && active && portalNode
        ? createPortal(
            <div
              ref={popoverRef}
              id="concept-tooltip"
              style={{
                position: 'fixed',
                top: active.rect.bottom + 8,
                left: Math.max(8, Math.min(active.rect.left, window.innerWidth - POPOVER_WIDTH - 8)),
                width: POPOVER_WIDTH,
              }}
              className={cn(
                'z-50 rounded-lg border border-border bg-surface-raised p-3 text-xs shadow-lg',
                'text-text-secondary'
              )}
            >
              <p className="mb-1 font-semibold text-text-primary">{concept.term}</p>
              <p className="mb-2 leading-relaxed">{concept.short}</p>
              <Link
                href={concept.href}
                onClick={close}
                className="text-primary underline underline-offset-2 hover:text-primary-hover"
              >
                Full lesson → {concept.lessonTitle}
              </Link>
            </div>,
            portalNode
          )
        : null}
    </div>
  );
}
