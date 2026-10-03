import { CourseEditorHeader } from "@/components/builder/editor-shell/course-editor-header";
import { CourseEditorTabs } from "@/components/builder/editor-shell/course-editor-tabs";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseEditorHeader } from "@/server/queries/instructor";

export default async function CourseEditorLayout(props: LayoutProps<"/instructor/courses/[courseId]">) {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}`);
  const course = await getCourseEditorHeader(viewer, courseId);
  return (
    <div className="space-y-6">
      <div className="space-y-5">
        <CourseEditorHeader course={course} />
        <CourseEditorTabs courseId={course.id} />
      </div>
      <div className="animate-fade-in">{props.children}</div>
    </div>
  );
}
