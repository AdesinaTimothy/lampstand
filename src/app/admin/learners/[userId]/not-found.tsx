import Link from "next/link";
import { UserX } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function PersonNotFound() {
  return (
    <EmptyState
      icon={<UserX />}
      title="Person not found"
      description="They may have been removed, or the link is incorrect."
      action={
        <Link href="/admin/learners" className={buttonVariants({ variant: "outline" })}>
          Back to people
        </Link>
      }
    />
  );
}
