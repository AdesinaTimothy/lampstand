import { notFound, redirect } from "next/navigation";
import { requirePageViewer } from "@/server/auth/guards";
import { getCurrentOrganization } from "@/server/organization";
import { getCourseForPlayer, getResumeLessonId } from "@/server/queries/player";

/** /learn/<course> resumes where the learner left off. */
export default async function LearnCoursePage(props: PageProps<"/learn/[courseSlug]">) {
  const { courseSlug } = await props.params;
  const viewer = await requirePageViewer(`/learn/${courseSlug}`);
  const org = await getCurrentOrganization();
  const course = await getCourseForPlayer(org.id, courseSlug);
  if (!course) notFound();
  const lessonId = await getResumeLessonId(viewer, course.id);
  if (!lessonId) redirect(`/courses/${course.slug}`);
  redirect(`/learn/${course.slug}/${lessonId}`);
}
