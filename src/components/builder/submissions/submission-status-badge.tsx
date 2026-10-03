import type { SubmissionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";

const STATUS: Record<SubmissionStatus, { label: string; variant: "accent" | "warning" | "success" }> = {
  SUBMITTED: { label: "Awaiting review", variant: "accent" },
  NEEDS_REVISION: { label: "Revision requested", variant: "warning" },
  APPROVED: { label: "Approved", variant: "success" },
};

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  return <Badge variant={STATUS[status].variant}>{STATUS[status].label}</Badge>;
}
