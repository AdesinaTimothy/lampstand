import type { CourseStatus, EnrollmentStatus, MemberRole, MembershipStatus, SubmissionStatus } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/roles";

const ROLE_VARIANT = { OWNER: "accent", ADMIN: "info", INSTRUCTOR: "primary", LEARNER: "neutral" } as const;

export function RoleBadge({ role }: { role: MemberRole }) {
  return <Badge variant={ROLE_VARIANT[role]}>{ROLE_LABELS[role]}</Badge>;
}

export function MemberStatusBadge({ status }: { status: MembershipStatus }) {
  return status === "ACTIVE" ? <Badge variant="success">Active</Badge> : <Badge variant="danger">Suspended</Badge>;
}

const COURSE_STATUS = {
  DRAFT: { label: "Draft", variant: "neutral" },
  PUBLISHED: { label: "Published", variant: "success" },
  ARCHIVED: { label: "Archived", variant: "outline" },
} as const;

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  const s = COURSE_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const ENROLLMENT_STATUS = {
  ACTIVE: { label: "In progress", variant: "info" },
  COMPLETED: { label: "Completed", variant: "success" },
  DROPPED: { label: "Left", variant: "outline" },
} as const;

export function EnrollmentStatusBadge({ status }: { status: EnrollmentStatus }) {
  const s = ENROLLMENT_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}

const SUBMISSION_STATUS = {
  SUBMITTED: { label: "Awaiting review", variant: "warning" },
  NEEDS_REVISION: { label: "Needs revision", variant: "danger" },
  APPROVED: { label: "Approved", variant: "success" },
} as const;

export function SubmissionStatusBadge({ status }: { status: SubmissionStatus }) {
  const s = SUBMISSION_STATUS[status];
  return <Badge variant={s.variant}>{s.label}</Badge>;
}
