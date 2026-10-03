import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requirePageViewer } from "@/server/auth/guards";
import { getProfile } from "@/server/queries/learner";
import { ProfileView } from "@/components/learner/profile-view";

export const metadata: Metadata = { title: "Your profile" };

export default async function MyProfilePage() {
  const viewer = await requirePageViewer("/profile");
  const profile = await getProfile(viewer, viewer.organizationId, viewer.id);
  if (!profile || profile.hidden) notFound();
  return <ProfileView profile={profile} />;
}
