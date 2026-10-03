import type { Metadata } from "next";
import { StatusPage } from "@/components/layout/status-page";

export const metadata: Metadata = { title: "Access restricted", robots: { index: false } };

export default function ForbiddenPage() {
  return (
    <StatusPage
      code="403"
      title="This area is restricted"
      description="Your account doesn't have access to this page. If you think that's a mistake, ask your church administrator to check your role."
    />
  );
}
