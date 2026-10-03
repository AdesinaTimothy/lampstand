import { Award, BookOpen, ClipboardCheck, GraduationCap, Inbox, Users } from "lucide-react";
import type { InstructorOverview } from "@/server/queries/instructor";
import { Stat } from "@/components/ui/stat";
import { formatNumber, formatPercent } from "@/lib/format";
import { pluralize } from "@/lib/utils";

export function OverviewStats({ data }: { data: InstructorOverview }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      <Stat
        label="Courses"
        icon={<BookOpen />}
        value={formatNumber(data.courses.total)}
        hint={`${data.courses.published} published · ${data.courses.drafts} ${data.courses.drafts === 1 ? "draft" : "drafts"}`}
      />
      <Stat label="Learners" icon={<Users />} value={formatNumber(data.learners)} hint="Active and completed" />
      <Stat label="Completions" icon={<GraduationCap />} value={formatNumber(data.completions)} hint="Courses finished" />
      <Stat
        label="Completion rate"
        icon={<Award />}
        value={data.completionRate === null ? "—" : formatPercent(data.completionRate)}
        hint={data.completionRate === null ? "No enrolments yet" : "Of all enrolments"}
      />
      <Stat
        label="Avg. quiz score"
        icon={<ClipboardCheck />}
        value={data.averageQuizScore === null ? "—" : formatPercent(data.averageQuizScore)}
        hint={data.quizAttempts > 0 ? `Across ${pluralize(data.quizAttempts, "attempt")}` : "No attempts yet"}
      />
      <Stat
        label="To review"
        icon={<Inbox />}
        value={formatNumber(data.pendingCount)}
        hint={data.pendingCount > 0 ? "Submissions waiting" : "Inbox is clear"}
      />
    </div>
  );
}
