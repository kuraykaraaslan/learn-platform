# 90. Accessibility (a11y) — WCAG 2.1 AA Compliance

## What It Is
Web accessibility is the practice of building user interfaces that can be used by people with disabilities — visual, auditory, motor, cognitive. The Web Content Accessibility Guidelines (WCAG) are the international standard, published by the W3C. WCAG 2.1 Level AA is the compliance target for most legal requirements, including the European Accessibility Act (mandatory for digital products in the EU from 2025), UK Equality Act, and the standard used in US ADA litigation.

WCAG 2.1 AA is organized around four principles (POUR): **Perceivable** (content can be perceived by all senses — not just vision), **Operable** (all functionality works without a mouse — keyboard navigation, no seizure-inducing content), **Understandable** (content and UI behavior are predictable and error-tolerant), and **Robust** (content is compatible with current and future assistive technologies like screen readers). Each principle has guidelines and specific measurable success criteria — AA compliance means meeting all Level A and Level AA criteria.

For a Next.js SaaS, the highest-impact accessibility work falls into five areas: semantic HTML (using the correct element for the correct purpose so screen readers have the right context), ARIA attributes (filling gaps where HTML semantics are insufficient), keyboard navigability (every interactive element reachable and operable without a mouse), color contrast (text must have at least 4.5:1 contrast ratio against its background for normal text, 3:1 for large text), and focus management (when dialogs open, focus moves to them; when dialogs close, focus returns to the trigger). Getting these five right covers the majority of WCAG 2.1 AA criteria for a typical SaaS dashboard.

## Key Concepts
- **WCAG 2.1 AA**: The compliance level required by most legal frameworks; builds on Level A and adds 20 additional criteria including color contrast (1.4.3), reflow (1.4.10), and focus visible (2.4.7)
- **Semantic HTML**: Using `<button>` instead of `<div onclick>`, `<nav>` for navigation, `<main>` for main content, `<h1>`–`<h6>` in logical order — screen readers depend on these to announce the page structure
- **ARIA (Accessible Rich Internet Applications)**: Attributes that add semantic meaning to non-semantic elements; `aria-label`, `aria-describedby`, `aria-expanded`, `role` — use ARIA only when no native HTML element fits
- **First rule of ARIA**: If you can use a native HTML element with the correct semantics, do so — ARIA on a `<div>` does not automatically make it keyboard-accessible like a real `<button>` does
- **Color contrast ratio**: Minimum 4.5:1 for normal text (under 18px or 14px bold), 3:1 for large text; measure with tools, never by eye
- **Focus trap**: In modal dialogs, focus must be trapped within the modal while it is open — Tab cycles through focusable elements inside the modal only; Escape closes the modal and returns focus to the trigger
- **Skip links**: A visually hidden "Skip to main content" link as the first focusable element on the page allows keyboard users to bypass repeated navigation
- **axe-core and pa11y**: The two most widely used automated accessibility testing tools; axe-core can be integrated into Jest/Playwright tests for CI-level a11y checking

## Example Code or Template

```tsx
// Accessible modal dialog — keyboard trap, ARIA, focus management
// Compatible with Next.js App Router and Tailwind CSS

'use client';
import { useEffect, useRef, useCallback } from 'react';

interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  triggerRef?: React.RefObject<HTMLElement>; // to restore focus on close
}

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

export function AccessibleModal({
  isOpen,
  onClose,
  title,
  children,
  triggerRef,
}: AccessibleModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;

  // Focus management: move focus into modal on open, restore on close
  useEffect(() => {
    if (!isOpen) {
      // Return focus to the trigger that opened the modal
      triggerRef?.current?.focus();
      return;
    }

    const modal = modalRef.current;
    if (!modal) return;

    // Focus the first focusable element inside the modal
    const firstFocusable = modal.querySelector<HTMLElement>(FOCUSABLE_SELECTORS);
    firstFocusable?.focus();
  }, [isOpen, triggerRef]);

  // Keyboard trap: Tab/Shift+Tab cycles within modal; Escape closes
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Escape') {
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      const modal = modalRef.current;
      if (!modal) return;

      const focusableElements = Array.from(
        modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS)
      ).filter((el) => !el.closest('[aria-hidden="true"]'));

      const firstFocusable = focusableElements[0];
      const lastFocusable = focusableElements[focusableElements.length - 1];

      if (event.shiftKey) {
        // Shift+Tab: if on first element, wrap to last
        if (document.activeElement === firstFocusable) {
          event.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        // Tab: if on last element, wrap to first
        if (document.activeElement === lastFocusable) {
          event.preventDefault();
          firstFocusable?.focus();
        }
      }
    },
    [onClose]
  );

  if (!isOpen) return null;

  return (
    // Backdrop — click outside closes, but not a focusable element
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      aria-hidden="true" // backdrop itself is not announced
      onClick={onClose}
    >
      {/* Modal container — stops backdrop click propagation */}
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl"
        onKeyDown={handleKeyDown}
        onClick={(e) => e.stopPropagation()} // prevent backdrop close on modal click
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute end-4 top-4 rounded p-1 hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Close dialog"
        >
          {/* Use aria-hidden on the icon so the label is not read twice */}
          <span aria-hidden="true">✕</span>
        </button>

        {/* Title — linked to the dialog via aria-labelledby */}
        <h2 id={titleId} className="mb-4 text-lg font-semibold">
          {title}
        </h2>

        {children}
      </div>
    </div>
  );
}

// ============================================================
// Skip link — add as first element in your root layout
// ============================================================
// <a
//   href="#main-content"
//   className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4
//              focus:z-50 focus:rounded focus:bg-white focus:px-4 focus:py-2
//              focus:text-blue-700 focus:shadow-lg"
// >
//   Skip to main content
// </a>
// ...
// <main id="main-content" tabIndex={-1}>
```

## When to Use
- Before your SaaS targets any EU customers — the European Accessibility Act requires digital products to meet WCAG 2.1 AA from June 2025 for private sector services; this is a legal requirement, not a nice-to-have
- When an enterprise client includes accessibility compliance in their vendor requirements — having an accessibility statement and audit results is a procurement differentiator
- When building a shared component library for your boilerplate — building accessible base components (modal, dropdown, form field, alert) once means every feature built on them inherits the accessibility properties
- When adding Playwright/Cypress end-to-end tests — add `@axe-core/playwright` or `cypress-axe` to run automated accessibility scans in CI; this catches regressions before they reach production
- When a contractor builds UI for you — add accessibility criteria to your code review rubric (semantic HTML, keyboard navigation, ARIA usage) so it is checked at review time, not after deployment

## Common Mistakes
- **Using `<div>` and `<span>` for interactive elements**: A `<div onClick>` does not receive keyboard focus, does not fire on Enter/Space, and is announced as "blank" by screen readers; always use `<button>` for clickable actions and `<a>` for navigation
- **Adding ARIA without keyboard support**: `role="button"` tells screen readers "this is a button" but does not make the element focusable or operable via keyboard; ARIA attributes do not add behavior, only semantics — pair every ARIA role with the corresponding keyboard interaction
- **Skipping color contrast testing**: Designers often choose colors that look fine on a well-calibrated monitor but fail 4.5:1 contrast; run your color palette through a contrast checker during design, not after implementation
- **Not managing focus in SPAs**: When a page changes in a Next.js application, the browser does not move focus to the new content — screen reader users hear nothing; use `router.events` or server component navigation callbacks to announce page changes and move focus to the main heading

## Further Reading
- **"Inclusive Components" — Heydon Pickering (inclusive-components.design)** — Pattern library of accessible UI components with full explanations; each pattern includes the HTML, CSS, JavaScript, and ARIA used; the modal, dropdown, and card patterns are directly applicable to your SaaS
- **WebAIM (webaim.org)** — The most practical accessibility resource for web developers; their contrast checker, screen reader survey, and WCAG quick reference are daily-use tools
- **axe DevTools browser extension (deque.com/axe/devtools)** — The fastest way to audit a page; runs automated checks against WCAG 2.1 and reports violations with explanations and remediation guidance; the free browser extension catches roughly 30–40% of all WCAG issues automatically
