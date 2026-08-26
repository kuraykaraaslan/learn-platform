// Course-scoped shell — THIS is where DashboardShell actually gets used.
// Pattern follows kui-react's app/theme/api-doc/layout.tsx almost exactly:
// build a `sidebar` nav data structure, hand it to DashboardShell, render
// children inside it.
import Link from 'next/link';
import { DashboardShell } from '@/modules/shared/ui/DashboardShell';
import { CourseContentService } from '@/modules/course_content/course_content.service';

export default async function CourseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ courseSlug: string }>;
}) {
  const { courseSlug } = await params;
  const navGroups = CourseContentService.getSidebarNavGroups(courseSlug);

  return (
    <DashboardShell
      logo={
        <Link href="/" className="text-sm font-bold text-primary hover:text-primary-hover transition-colors">
          learn.kuray.dev
        </Link>
      }
      compactLogo={
        <Link href="/" className="text-xs font-bold text-primary hover:text-primary-hover transition-colors">
          U
        </Link>
      }
      mobileSidebarTitle="Course Content"
      navGroups={navGroups}
    >
      {children}
    </DashboardShell>
  );
}
