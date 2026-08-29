// Internal client piece of DashboardShell — NOT a separate shell (see
// appshell-compliance.md). Its only job is to own the one bit of state that
// kui-react's AppShell + AppSidebar must share: whether the sidebar is
// collapsed. Upstream's intended pattern (see kui-react app-shell.showcase
// `AppShellFullDemo`) is a client component that threads `sidebarCollapsed`
// into AppShell AND `collapsed` + `onCollapsedChange` into AppSidebar. Without
// that wiring the aside shrinks but AppShell keeps rendering the full-width
// `logo` inside a 56px `overflow-hidden` box, clipping the wordmark.
//
// DashboardShell stays a Server Component and hands the already-built nav data,
// logo nodes and topbar node down as props.
'use client';
import { useState } from 'react';
import type { AppSidebarNavGroup } from '@kui/app/AppSidebar';
import { AppShell } from '@kui/app/AppShell';
import { AppSidebar } from '@kui/app/AppSidebar';

type DashboardChromeProps = {
  logo?: React.ReactNode;
  compactLogo?: React.ReactNode;
  navGroups?: AppSidebarNavGroup[];
  activeId?: string;
  mobileSidebarTitle?: string;
  topbar?: React.ReactNode;
  children: React.ReactNode;
};

export function DashboardChrome({
  logo,
  compactLogo,
  navGroups,
  activeId,
  mobileSidebarTitle = 'Navigation',
  topbar,
  children,
}: DashboardChromeProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  return (
    <AppShell
      logo={logo}
      compactLogo={compactLogo}
      sidebarCollapsed={sidebarCollapsed}
      mobileSidebarTitle={mobileSidebarTitle}
      sidebar={
        navGroups ? (
          <AppSidebar
            navGroups={navGroups}
            activeId={activeId}
            collapsed={sidebarCollapsed}
            onCollapsedChange={setSidebarCollapsed}
          />
        ) : undefined
      }
      topbar={topbar}
    >
      {children}
    </AppShell>
  );
}
