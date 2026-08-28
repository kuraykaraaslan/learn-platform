// Landing/catalog tier — deliberately NOT wrapped in DashboardShell.
// Per appshell-compliance.md's "Static content pages" exception: a plain
// layout is fine here, the full sidebar+topbar shell only makes sense once
// a visitor is inside a specific course (see courses/[courseSlug]/layout.tsx).
import Link from 'next/link';
import { ThemeToggle } from '@/modules/shared/ui/ThemeToggle';

export default function FrontendLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface-base">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-semibold text-text-primary hover:text-primary transition-colors">
          learn.kuray.dev
        </Link>
        <div className="flex items-center gap-4">
          <Link href="/review" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Review
          </Link>
          <Link href="/settings" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
            Settings
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main id="main-content" className="mx-auto max-w-5xl px-6 py-10">
        {children}
      </main>
    </div>
  );
}
