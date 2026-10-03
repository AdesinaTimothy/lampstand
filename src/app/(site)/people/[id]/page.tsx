import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Lock } from "lucide-react";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { getProfile } from "@/server/queries/learner";
import { ProfileView } from "@/components/learner/profile-view";
import { EmptyState } from "@/components/ui/empty-state";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

export default async function PersonPage(props: PageProps<"/people/[id]">) {
  const { id } = await props.params;
  const [viewer, org] = await Promise.all([getViewer(), getCurrentOrganization()]);
  if (viewer?.id === id) redirect("/profile");
  const profile = await getProfile(viewer, org.id, id);
  if (!profile) notFound();
  if (profile.hidden) {
    return (
      <div className="container-page max-w-2xl py-16">
        <EmptyState icon={<Lock />} title="This profile is private" description={viewer ? undefined : "Sign in as a church member to see more."} />
      </div>
    );
  }
  return <ProfileView profile={profile} />;
}
