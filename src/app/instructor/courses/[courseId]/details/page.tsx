import type { Metadata } from "next";
import { CourseDetailsForm } from "@/components/builder/details/course-details-form";
import { requireInstructorPage } from "@/server/auth/guards";
import { getCourseDetailsForEditor, getCourseEditorHeader } from "@/server/queries/instructor";

export async function generateMetadata(props: PageProps<"/instructor/courses/[courseId]/details">): Promise<Metadata> {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage();
  const course = await getCourseEditorHeader(viewer, courseId);
  return { title: `Details · ${course.title}` };
}

export default async function CourseDetailsPage(props: PageProps<"/instructor/courses/[courseId]/details">) {
  const { courseId } = await props.params;
  const viewer = await requireInstructorPage(`/instructor/courses/${courseId}/details`);
  const { course, categories } = await getCourseDetailsForEditor(viewer, courseId);
  return <CourseDetailsForm course={course} categories={categories} />;
}
