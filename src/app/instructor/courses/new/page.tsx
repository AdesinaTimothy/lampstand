import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { NewCourseForm } from "@/components/builder/courses/new-course-dialog";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { requireInstructorPage } from "@/server/auth/guards";
import { listCategoryOptions } from "@/server/queries/instructor";

export const metadata: Metadata = { title: "New course" };

export default async function NewCoursePage() {
  const viewer = await requireInstructorPage("/instructor/courses/new");
  const categories = await listCategoryOptions(viewer);
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <Link href="/instructor/courses" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ChevronLeft className="size-4" aria-hidden /> All courses
      </Link>
      <PageHeader title="Start a new course" description="Give it a working title — you can change everything later. It stays a private draft until you publish." />
      <Card className="overflow-hidden">
        <NewCourseForm categories={categories} />
      </Card>
    </div>
  );
}
