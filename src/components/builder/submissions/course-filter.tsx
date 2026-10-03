"use client";

import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/select";

const ALL = "__all";

/** Course filter for the submissions inbox; navigates so the filter is part of the URL. */
export function CourseFilter({ courses, value, hrefFor }: { courses: { id: string; title: string }[]; value: string | null; hrefFor: Record<string, string> }) {
  const router = useRouter();
  return (
    <div className="w-full sm:w-64">
      <label htmlFor="submission-course" className="sr-only">
        Filter by course
      </label>
      <Select
        id="submission-course"
        value={value ?? ALL}
        onValueChange={(v) => router.push(hrefFor[v] ?? hrefFor[ALL]!)}
        options={[{ value: ALL, label: "All courses" }, ...courses.map((c) => ({ value: c.id, label: c.title }))]}
      />
    </div>
  );
}
