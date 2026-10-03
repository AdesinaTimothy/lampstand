import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/page-header";
import { SettingsForm } from "@/components/admin/settings/settings-form";
import { formatDate } from "@/lib/format";
import { requirePagePermission } from "@/server/auth/guards";
import { getOrganizationSettings } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  // Owners only: other staff are redirected to /forbidden.
  const viewer = await requirePagePermission("organization:manage", "/admin/settings");
  const org = await getOrganizationSettings(viewer);

  return (
    <div className="mx-auto max-w-3xl space-y-6 animate-fade-in">
      <PageHeader title="Settings" description={`Organization-wide preferences for ${org.name}. Last updated ${formatDate(org.updatedAt)}.`} />
      <SettingsForm
        initialLogoUrl={org.logoUrl}
        initial={{
          name: org.name,
          tagline: org.tagline ?? "",
          description: org.description ?? "",
          website: org.website ?? "",
          email: org.email ?? "",
          logoId: org.logoId,
          allowSelfRegistration: org.allowSelfRegistration,
          requireEmailVerification: org.requireEmailVerification,
          certificateSignatoryName: org.certificateSignatoryName ?? "",
          certificateSignatoryTitle: org.certificateSignatoryTitle ?? "",
          timezone: org.timezone,
        }}
      />
    </div>
  );
}
