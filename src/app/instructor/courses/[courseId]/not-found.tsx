import Link from "next/link";
import { BookX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function CourseNotFound() {
  return (
    <EmptyState
      icon={<BookX />}
      title="We couldn't find that"
      description="It may have been deleted, or you may not be one of the instructors for this course."
      action={
        <Button asChild>
          <Link href="/instructor/courses">Back to courses</Link>
        </Button>
      }
    />
  );
}
