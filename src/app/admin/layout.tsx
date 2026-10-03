import type { Metadata } from "next";
import { ArrowLeft, Award, BookOpen, FolderTree, LayoutDashboard, Megaphone, Presentation, ScrollText, Settings, Users } from "lucide-react";
import { ConsoleShell, type ConsoleNavGroup } from "@/components/layout/console-shell";
import { NotificationBell } from "@/components/layout/notification-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { requireStaffPage } from "@/server/auth/guards";
import { can } from "@/server/authz/policies";
import { getShellData } from "@/server/queries/shell";

export const metadata: Metadata = { title: { default: "Administration", template: "%s · Administration" }, robots: { index: false } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const viewer = await requireStaffPage("/admin");
  const { org, viewer: menuViewer, unread } = await getShellData();
  const groups: ConsoleNavGroup[] = [
    {
      items: [
        { href: "/admin", label: "Overview", icon: <LayoutDashboard />, exact: true },
        { href: "/admin/learners", label: "People", icon: <Users /> },
        { href: "/admin/instructors", label: "Instructors", icon: <Presentation /> },
        { href: "/admin/courses", label: "Courses", icon: <BookOpen /> },
        { href: "/admin/categories", label: "Categories", icon: <FolderTree /> },
        { href: "/admin/certificates", label: "Certificates", icon: <Award /> },
        { href: "/admin/announcements", label: "Announcements", icon: <Megaphone /> },
      ],
    },
    {
      label: "Organization",
      items: [
        ...(can(viewer, "organization:manage") ? [{ href: "/admin/settings", label: "Settings", icon: <Settings /> }] : []),
        { href: "/admin/audit-log", label: "Audit log", icon: <ScrollText /> },
        { href: "/dashboard", label: "Back to learning", icon: <ArrowLeft /> },
      ],
    },
  ];
  return (
    <ConsoleShell
      title="Administration"
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
