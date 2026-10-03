"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Crown, Search } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormError } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { ROLE_LABELS } from "@/lib/roles";
import type { InstructorOption } from "@/server/queries/admin";
import { setCourseInstructorsAction } from "@/actions/admin";
import { runWithToast } from "../run-action";

export function ManageInstructorsDialog({
  open,
  onOpenChange,
  courseId,
  courseTitle,
  current,
  options,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  courseTitle: string;
  current: string[];
  options: InstructorOption[];
}) {
  const router = useRouter();
  const [selected, setSelected] = React.useState<string[]>(current);
  const [filter, setFilter] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [pending, startTransition] = React.useTransition();
  const searchId = React.useId();

  // Assigned people who are no longer eligible (e.g. suspended) still show so they can be removed.
  const known = new Set(options.map((o) => o.id));
  // Currently assigned people first (lead at the top), in a stable order while editing.
  const rank = (id: string) => {
    const i = current.indexOf(id);
    return i === -1 ? Number.MAX_SAFE_INTEGER : i;
  };
  const visible = [...options].sort((a, b) => rank(a.id) - rank(b.id)).filter((o) => {
    const q = filter.trim().toLowerCase();
    return !q || o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q);
  });

  function toggle(id: string, checked: boolean) {
    setError(null);
    setSelected((s) => (checked ? [...s, id] : s.filter((x) => x !== id)));
  }

  function save() {
    const ids = selected.filter((id) => known.has(id));
    if (ids.length === 0) return setError("Choose at least one instructor.");
    startTransition(async () => {
      const result = await runWithToast(setCourseInstructorsAction({ courseId, instructorIds: ids }));
      if (result.ok) {
        onOpenChange(false);
        router.refresh();
      } else setError(result.error);
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (o) {
          setSelected(current);
          setFilter("");
          setError(null);
        }
        onOpenChange(o);
      }}
    >
      <DialogContent size="md">
        <DialogHeader>
          <DialogTitle>Manage instructors</DialogTitle>
          <DialogDescription>
            Choose who teaches “{courseTitle}”. The first person selected is the lead instructor and appears on certificates.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="grid gap-3">
          <FormError message={error} />
          <div className="relative">
            <label htmlFor={searchId} className="sr-only">
              Filter instructors
            </label>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle-foreground" aria-hidden />
            <Input id={searchId} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by name or email" className="pl-9" />
          </div>
          <fieldset>
            <legend className="sr-only">Instructors</legend>
            <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border scrollbar-thin">
              {visible.length === 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground">No instructors match.</li>}
              {visible.map((o) => {
                const checked = selected.includes(o.id);
                const lead = selected.find((id) => known.has(id)) === o.id;
                const inputId = `${searchId}-${o.id}`;
                return (
                  <li key={o.id} className="flex items-center gap-3 px-3 py-2.5">
                    <Checkbox id={inputId} checked={checked} onCheckedChange={(v) => toggle(o.id, v === true)} />
                    <label htmlFor={inputId} className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                      <Avatar name={o.name} src={o.avatarUrl} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium">{o.name}</span>
                        <span className="block truncate text-xs text-muted-foreground">
                          {ROLE_LABELS[o.role]} · {o.email}
                        </span>
                      </span>
                    </label>
                    {lead ? (
                      <Badge variant="accent">
                        <Crown aria-hidden />
                        Lead
                      </Badge>
                    ) : checked ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelected((s) => [o.id, ...s.filter((x) => x !== o.id)])}
                        aria-label={`Make ${o.name} the lead instructor`}
                      >
                        Make lead
                      </Button>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </fieldset>
          <p className="text-xs text-muted-foreground" aria-live="polite">
            {selected.filter((id) => known.has(id)).length} selected
          </p>
        </DialogBody>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={save} loading={pending}>
            Save instructors
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
