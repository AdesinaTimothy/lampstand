"use client";

import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { deleteCategoryAction } from "@/actions/admin";
import { runWithToast } from "../run-action";

export function DeleteCategoryButton({ id, name, courseCount }: { id: string; name: string; courseCount: number }) {
  const router = useRouter();
  return (
    <ConfirmDialog
      title={`Delete “${name}”?`}
      description={
        courseCount > 0
          ? `This category still holds ${courseCount} course${courseCount === 1 ? "" : "s"}. Move ${courseCount === 1 ? "it" : "them"} to another category first; deletion will be refused until then.`
          : "This can't be undone. The category disappears from the catalogue."
      }
      confirmLabel="Delete category"
      onConfirm={async () => {
        const result = await runWithToast(deleteCategoryAction(id));
        if (result.ok) router.refresh();
      }}
      trigger={
        <Button variant="ghost" size="icon-sm" aria-label={`Delete ${name}`}>
          <Trash2 />
        </Button>
      }
    />
  );
}
