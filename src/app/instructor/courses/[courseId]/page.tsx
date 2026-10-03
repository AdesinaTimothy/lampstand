import { redirect } from "next/navigation";

export default async function CourseEditorIndex(props: PageProps<"/instructor/courses/[courseId]">) {
  const { courseId } = await props.params;
  redirect(`/instructor/courses/${courseId}/details`);
}
