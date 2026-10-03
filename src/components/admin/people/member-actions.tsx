"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import type { MemberRole, MembershipStatus } from "@prisma/client";
import { ShieldCheck, UserRoundCheck, UserRoundX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Field } from "@/components/ui/field";
import { Select } from "@/components/ui/select";
import { changeMemberRoleAction, setMemberStatusAction } from "@/actions/admin";
import { ROLE_LABELS } from "@/lib/roles";
import { runWithToast } from "../run-action";

const ROLE_HELP: Record<MemberRole, string> = {
  OWNER: "Full control, including organization settings",
  ADMIN: "Manages people, courses and certificates",
  INSTRUCTOR: "Creates and teaches courses",
  LEARNER: "Takes courses",
};

export function MemberActions({
  userId,
  name,
  role,
  status,
  assignableRoles,
  canChangeRole,
  canChangeStatus,
  isSelf,
}: {
  userId: string;
  name: string;
  role: MemberRole;
  status: MembershipStatus;
  assignableRoles: MemberRole[];
  canChangeRole: boolean;
  canChangeStatus: boolean;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [nextRole, setNextRole] = React.useState<MemberRole>(role);
  const selectId = React.useId();

  if (isSelf) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        This is your account. Another administrator must change your role or status.
      </p>
    );
  }
  if (!canChangeRole && !canChangeStatus) {
    return (
      <p className="flex items-start gap-2 rounded-lg bg-surface-muted px-3 py-2.5 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        Only the organization owner can manage {ROLE_LABELS[role].toLowerCase()}s.
      </p>
    );
  }

  const suspended = status === "SUSPENDED";
  return (
    <div className="grid gap-4">
      {canChangeRole && (
        <Field label="Role" htmlFor={selectId} description={ROLE_HELP[nextRole]}>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              id={selectId}
              value={nextRole}
              onValueChange={(v) => setNextRole(v as MemberRole)}
              options={assignableRoles.map((r) => ({ value: r, label: ROLE_LABELS[r] }))}
              aria-describedby={`${selectId}-description`}
              className="sm:w-48"
            />
            <ConfirmDialog
              tone="primary"
              title={`Make ${name} ${nextRole === "ADMIN" || nextRole === "OWNER" ? "an" : "a"} ${ROLE_LABELS[nextRole].toLowerCase()}?`}
              description={
                <>
                  Their access changes from <strong>{ROLE_LABELS[role]}</strong> to <strong>{ROLE_LABELS[nextRole]}</strong> ({ROLE_HELP[nextRole].toLowerCase()}).
                  They&apos;ll be signed out and notified. This is recorded in the audit log.
                </>
              }
              confirmLabel="Change role"
              onConfirm={async () => {
                const result = await runWithToast(changeMemberRoleAction({ userId, role: nextRole }));
                if (result.ok) router.refresh();
                else setNextRole(role);
              }}
              trigger={
                <Button type="button" variant="outline" disabled={nextRole === role}>
                  Change role
                </Button>
              }
            />
          </div>
        </Field>
      )}
      {canChangeStatus &&
        (suspended ? (
          <ConfirmDialog
            tone="primary"
            title={`Reactivate ${name}?`}
            description="They'll be able to sign in and continue learning right away. Their progress was kept while suspended."
            confirmLabel="Reactivate"
            onConfirm={async () => {
              const result = await runWithToast(setMemberStatusAction({ userId, status: "ACTIVE" }), (d) => d.message);
              if (result.ok) router.refresh();
            }}
            trigger={
              <Button type="button" variant="soft" className="justify-self-start">
                <UserRoundCheck aria-hidden />
                Reactivate account
              </Button>
            }
          />
        ) : (
          <ConfirmDialog
            title={`Suspend ${name}?`}
            description="They'll be signed out on every device and won't be able to sign in until reactivated. Their learning history is kept."
            confirmLabel="Suspend"
            onConfirm={async () => {
              const result = await runWithToast(setMemberStatusAction({ userId, status: "SUSPENDED" }), (d) => d.message);
              if (result.ok) router.refresh();
            }}
            trigger={
              <Button type="button" variant="danger-ghost" className="justify-self-start">
                <UserRoundX aria-hidden />
                Suspend account
              </Button>
            }
          />
        ))}
    </div>
  );
}
