import type { Metadata } from "next";
import { CourseSettingsForm } from "@/components/builder/settings/course-settings-form";
import { DangerZone } from "@/components/builder/settings/danger-zone";
import { requireInstructorPage } from "@/server/auth/guards";
import { env } from "@/server/env";
import { getCourseEditorHeader, getCourseSettingsForEditor } from "@/server/queries/instructor";

export async function generateMetadata(props: PageProps<"/instructor/courses/[courseId]/settings">): Promise<Metadata> {
  const { courseId } = await props.params;
  const course = await getCourseEditorHeader(await requireInstructorPage(), courseId);
  return { title: `Settings · ${course.title}` };
}

export default async function CourseSettingsPage(props: PageProps<"/instructor/courses/[courseId]/settings">) {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/settings`);
  const course = await getCourseSettingsForEditor(viewer, courseId);
  return (
    <div className="space-y-10">
      <CourseSettingsForm course={course} origin={env.APP_URL} />
      <DangerZone
        courseId={course.id}
        title={course.title}
        status={course.status}
        enrollmentCount={course.enrollmentCount}
        canDeleteAny={course.canDeleteAny}
      />
    </div>
  );
}
