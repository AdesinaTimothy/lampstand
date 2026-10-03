import type { Metadata } from "next";
import { LessonEditor } from "@/components/builder/lesson/lesson-editor";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseEditorHeader, getLessonForEditor } from "@/server/queries/instructor";

type Props = PageProps<"/instructor/courses/[courseId]/lessons/[lessonId]">;

export async function generateMetadata(props: Props): Promise<Metadata> {
  const { courseId, lessonId } = await props.params;
  const viewer = await requireInstructorPage();
  const [course, { lesson }] = await Promise.all([getCourseEditorHeader(viewer, courseId), getLessonForEditor(viewer, courseId, lessonId)]);
  return { title: `${lesson.title} · ${course.title}` };
}

export default async function LessonEditorPage(props: Props) {
  const { courseId, lessonId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/lessons/${lessonId}`);
  const data = await getLessonForEditor(viewer, courseId, lessonId);
  return <LessonEditor courseId={courseId} data={data} requiresApproval={data.lesson.course.requireAssignmentApproval} />;
}
