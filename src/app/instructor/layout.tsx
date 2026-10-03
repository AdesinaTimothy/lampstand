import type { Metadata } from "next";
import { ArrowLeft, BookOpen, Inbox, LayoutDashboard } from "lucide-react";
import { ConsoleShell, type ConsoleNavGroup } from "@/components/layout/console-shell";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { requireInstructorPage } from "@/server/auth/guards";
import { db } from "@/server/db";
import { getShellData } from "@/server/queries/shell";

export const metadata: Metadata = { title: { default: "Instructor studio", template: "%s · Instructor studio" }, robots: { index: false } };

export default async function InstructorLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireInstructorPage("/instructor");
  const [{ org, viewer: menuViewer, unread }, pendingReviews] = await Promise.all([
    getShellData(),
    db.assignmentSubmission.count({
      where: { status: "SUBMITTED", assignment: { lesson: { deletedAt: null, course: { instructors: { some: { userId: viewer.id } } } } } },
    }),
  ]);
  const groups: ConsoleNavGroup[] = [
    {
      items: [
        { href: "/instructor", label: "Overview", icon: <LayoutDashboard />, exact: true },
        { href: "/instructor/courses", label: "Courses", icon: <BookOpen /> },
        { href: "/instructor/submissions", label: "Submissions", icon: <Inbox />, badge: pendingReviews },
      ],
    },
    {
      label: "Learning",
      items: [{ href: "/dashboard", label: "Back to learning", icon: <ArrowLeft /> }],
    },
  ];
  return (
    <ConsoleShell
      title="Instructor studio"
      orgName={org.name}
      groups={groups}
      headerRight={
        <>
          <NotificationBell initialUnread={unread} />
          {menuViewer && <UserMenu viewer={menuViewer} />}
        </>
      }
    >
      {children}
    </ConsoleShell>
  );
}
