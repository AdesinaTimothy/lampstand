import type { Metadata } from "next";
import { Presentation } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { AddInstructorDialog } from "@/components/admin/instructors/add-instructor-dialog";
import { InstructorList } from "@/components/admin/instructors/instructor-list";
import { formatNumber } from "@/lib/format";
import { pluralize } from "@/lib/utils";
import { requirePagePermission } from "@/server/auth/guards";
import { listInstructors } from "@/server/queries/admin";

export const metadata: Metadata = { title: "Instructors" };

export default async function InstructorsPage() {
  const viewer = await requirePagePermission("instructor:manage", "/admin/instructors");
  const instructors = await listInstructors(viewer);
  const learners = instructors.reduce((n, i) => n + i.learners, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Instructors"
        description={
          instructors.length
            ? `${pluralize(instructors.length, "person", "people")} teaching · ${formatNumber(learners)} learner enrolments across their courses`
            : "The people who create and teach your courses."
        }
        actions={<AddInstructorDialog />}
      />
      {instructors.length ? (
        <Card className="overflow-hidden">
          <InstructorList instructors={instructors} />
        </Card>
      ) : (
        <EmptyState
          icon={<Presentation />}
          title="No instructors yet"
          description="Add a pastor or ministry leader so they can start building courses."
          action={<AddInstructorDialog />}
        />
      )}
    </div>
  );
}
