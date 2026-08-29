// THE app shell. Per UI_Interface_Rules_Next/appshell-compliance.md, no other
// shell/layout component may be defined for an app project — every page that
// needs the sidebar+topbar chrome renders through this one. Internally it's a
// thin composition of kui-react's AppShell + AppSidebar + AppTopBar (copied
// under @kui/*, see modules/shared/ui/kui/PROVENANCE.md) plus this project's
// own ThemeToggle.
//
// Documented deviations from the standard TopBar contract (both intentional,
// see the project README / ADR):
//   - No LangSwitcher: single-language project (English-only, UI chrome and
//     lesson content alike) — an explicitly permitted exception.
//   - No UserMenu: this project has no auth/accounts at all (Kuray's explicit
//     decision), so there is no user identity to show. Not one of the rule's
//     named exceptions verbatim, but documented here in the same spirit.
//
// This file stays a Server Component (no "use client") so a page.tsx/layout.tsx
// Server Component can render it directly with server-computed nav data.
import type { AppSidebarNavGroup } from '@kui/app/AppSidebar';
import { AppTopBar } from '@kui/app/AppTopBar';
import { DashboardChrome } from './DashboardChrome';
import { ThemeToggle } from './ThemeToggle';

type DashboardShellProps = {
  logo?: React.ReactNode;
  compactLogo?: React.ReactNode;
  navGroups?: AppSidebarNavGroup[];
  activeId?: string;
  mobileSidebarTitle?: string;
  /** Extra content in the topbar right group, before ThemeToggle (e.g. search). */
  topbarExtra?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardShell({
  logo,
  compactLogo,
  navGroups,
  activeId,
  mobileSidebarTitle = 'Navigation',
  topbarExtra,
  children,
}: DashboardShellProps) {
  return (
    <DashboardChrome
      logo={logo}
      compactLogo={compactLogo}
      mobileSidebarTitle={mobileSidebarTitle}
      navGroups={navGroups}
      activeId={activeId}
      topbar={
        <AppTopBar>
          <div className="flex-1" />
          <div className="flex items-center gap-1">
            {topbarExtra}
            <ThemeToggle />
          </div>
        </AppTopBar>
      }
    >
      {children}
    </DashboardChrome>
  );
}
