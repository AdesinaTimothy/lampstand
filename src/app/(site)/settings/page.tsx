import type { Metadata } from "next";
import Link from "next/link";
import { BadgeCheck, MailWarning } from "lucide-react";
import { requirePageViewer } from "@/server/auth/guards";
import { getSettingsData } from "@/server/queries/learner";
import { ProfileForm } from "@/components/settings/profile-form";
import { PasswordForm } from "@/components/settings/password-form";
import { ResendVerificationButton } from "@/components/settings/resend-verification";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  const viewer = await requirePageViewer("/settings");
  const s = await getSettingsData(viewer);

  return (
    <div className="container-page max-w-3xl py-8 pb-24 sm:py-12 lg:pb-12">
      <PageHeader
        title="Settings"
        description={
          <>
            Manage your profile, privacy and password.{" "}
            <Link href="/profile" className="font-medium text-primary hover:underline">
              View your profile
            </Link>
          </>
        }
      />

      <div className="mt-8 space-y-8">
        <Section title="Profile" description="How you appear to instructors and other members.">
          <ProfileForm
            initial={{
              name: s.name,
              headline: s.headline ?? "",
              bio: s.bio ?? "",
              avatarId: s.avatarId,
              avatarUrl: s.avatarUrl,
              profileVisibility: s.profileVisibility,
              emailNotifications: s.emailNotifications,
            }}
          />
        </Section>

        <Section title="Email address" description="Used to sign in and for important account messages.">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-medium">{s.email}</p>
              {s.emailVerifiedAt ? (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-success">
                  <BadgeCheck className="size-4" aria-hidden /> Verified {formatDate(s.emailVerifiedAt)}
                </p>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-sm text-warning">
                  <MailWarning className="size-4" aria-hidden /> Not verified yet
                </p>
              )}
            </div>
            {!s.emailVerifiedAt && <ResendVerificationButton email={s.email} />}
          </div>
          <p className="mt-4 text-sm text-muted-foreground">To change your email address, ask a church administrator.</p>
        </Section>

        <Section title="Password" description="Changing your password signs you out on other devices.">
          {s.hasPassword ? <PasswordForm /> : <p className="text-sm text-muted-foreground">Your account signs in with a connected provider.</p>}
        </Section>

        <p className="text-center text-xs text-muted-foreground">Member since {formatDate(s.createdAt, "MMMM yyyy")}</p>
      </div>
    </div>
  );
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card className="p-5 sm:p-7">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <div className="mt-6">{children}</div>
    </Card>
  );
}
