"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { markNotificationsReadAction } from "@/actions/learning";
import { NotificationRow, type NotificationDTO } from "@/components/layout/notification-bell";
import { Button } from "@/components/ui/button";

export function MarkAllReadButton({ disabled }: { disabled: boolean }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [pending, start] = React.useTransition();
  return (
    <Button
      variant="outline"
      disabled={disabled}
      loading={pending}
      onClick={() =>
        start(async () => {
          const res = await markNotificationsReadAction();
          if (!res.ok) return void toast.error(res.error);
          await queryClient.invalidateQueries({ queryKey: ["notifications"] });
          router.refresh();
        })
      }
    >
      <CheckCheck aria-hidden /> Mark all as read
    </Button>
  );
}

export function NotificationsList({ items }: { items: NotificationDTO[] }) {
  const router = useRouter();
  return (
    <ul className="overflow-hidden rounded-xl border border-border bg-surface">
      {items.map((n) => (
        <NotificationRow
          key={n.id}
          n={n}
          onNavigate={() => {
            if (!n.readAt) void markNotificationsReadAction([n.id]).then(() => router.refresh());
          }}
        />
      ))}
    </ul>
  );
}
