import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PlayerShell } from "@/components/player/player-shell";
import { getViewer } from "@/server/auth/viewer";
import { getCurrentOrganization } from "@/server/organization";
import { getCourseForPlayer, getPlayerData } from "@/server/queries/player";

export async function generateMetadata(props: PageProps<"/learn/[courseSlug]/[lessonId]">): Promise<Metadata> {
  const { courseSlug } = await props.params;
  const org = await getCurrentOrganization();
  const course = await getCourseForPlayer(org.id, courseSlug);
  return { title: course ? course.title : "Lesson" };
}

export default async function LessonPage(props: PageProps<"/learn/[courseSlug]/[lessonId]">) {
  const { courseSlug, lessonId } = await props.params;
  const [org, viewer] = await Promise.all([getCurrentOrganization(), getViewer()]);
  const course = await getCourseForPlayer(org.id, courseSlug);
  if (!course) notFound();

  const { access, data } = await getPlayerData(viewer, course, lessonId);
  if (access.kind === "not-found") notFound();
  if (access.kind === "sign-in") redirect(`/login?next=${encodeURIComponent(`/learn/${courseSlug}/${lessonId}`)}`);
  if (access.kind === "enrol" || !data) redirect(`/courses/${courseSlug}?enrol=1`);

  return <PlayerShell key={data.lesson.id} data={data} />;
}
