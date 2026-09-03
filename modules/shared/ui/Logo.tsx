// The brand mark + wordmark for learn.kuray.dev. Every place that shows the
// brand — both shells, the collapsed sidebar rail, the mobile drawer — renders
// this, so there is exactly one lockup to change.
//
// Geometry lives in ./logo.geometry.ts because the static assets (favicon,
// apple icon, OG card) are generated from the same numbers by
// scripts/generate-brand-assets.ts. Colors here are the *theme tokens*, not the
// hex constants: the in-app mark has to follow light/dark like the rest of the
// chrome, while the static assets can't and use LOGO_COLORS instead.
//
// Server Component on purpose — the shells that render it are server-rendered.
import Link from 'next/link';
import { cn } from '@/libs/utils/cn';
import {
  LOGO_NODES,
  LOGO_NODE_RADIUS,
  LOGO_PATHS,
  LOGO_STROKE_WIDTH,
  LOGO_VIEW_BOX,
} from './logo.geometry';

type LogoMarkProps = {
  /** `brand` = primary/secondary tokens (default). `mono` = inherits currentColor. */
  variant?: 'brand' | 'mono';
  className?: string;
};

export function LogoMark({ variant = 'brand', className }: LogoMarkProps) {
  const brand = variant === 'brand';
  return (
    <svg
      viewBox={LOGO_VIEW_BOX}
      className={cn('h-6 w-6 shrink-0', className)}
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <g
        className={brand ? 'stroke-primary' : 'stroke-current'}
        strokeWidth={LOGO_STROKE_WIDTH}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {LOGO_PATHS.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      {LOGO_NODES.map((n) => (
        <circle
          key={`${n.cx}-${n.cy}`}
          cx={n.cx}
          cy={n.cy}
          r={LOGO_NODE_RADIUS}
          className={brand ? 'fill-secondary' : 'fill-current'}
        />
      ))}
    </svg>
  );
}

/** The wordmark alone — `learn.kuray` at full weight, `.dev` stepped back. */
export function LogoWordmark({ className }: { className?: string }) {
  return (
    <span className={cn('font-semibold tracking-tight text-text-primary', className)}>
      learn.kuray<span className="font-medium text-text-secondary">.dev</span>
    </span>
  );
}

type LogoProps = {
  /** Where the lockup links to; `null` renders it as plain content. */
  href?: string | null;
  /** Mark only (collapsed sidebar rail) — the name stays for screen readers. */
  compact?: boolean;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
};

export function Logo({
  href = '/',
  compact = false,
  className,
  markClassName,
  wordmarkClassName,
}: LogoProps) {
  const content = (
    <>
      <LogoMark className={cn(compact ? 'h-7 w-7' : 'h-6 w-6', markClassName)} />
      {compact ? (
        <span className="sr-only">learn.kuray.dev</span>
      ) : (
        <LogoWordmark className={cn('text-sm', wordmarkClassName)} />
      )}
    </>
  );

  const layout = cn('inline-flex items-center gap-2', className);

  if (href === null) {
    return <span className={layout}>{content}</span>;
  }

  return (
    <Link
      href={href}
      aria-label="learn.kuray.dev — home"
      className={cn(
        layout,
        'rounded-md transition-opacity hover:opacity-80',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border-focus'
      )}
    >
      {content}
    </Link>
  );
}
