"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/checkbox";
import { Tooltip } from "@/components/ui/tooltip";
import { setCourseFeaturedAction } from "@/actions/admin";
import { runWithToast } from "../run-action";

/** Optimistic featured toggle; reverts if the server refuses. */
export function FeaturedSwitch({ courseId, title, featured, published }: { courseId: string; title: string; featured: boolean; published: boolean }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = React.useOptimistic(featured);
  const [, startTransition] = React.useTransition();
  const disabled = !published && !featured;

  const control = (
    <Switch
      checked={optimistic}
      disabled={disabled}
      aria-label={`Feature “${title}” on the home page`}
      onCheckedChange={(next) =>
        startTransition(async () => {
          setOptimistic(next);
          const result = await runWithToast(setCourseFeaturedAction({ courseId, featured: next }), next ? `“${title}” is now featured.` : `“${title}” is no longer featured.`);
          if (result.ok) router.refresh();
        })
      }
    />
  );
  if (!disabled) return control;
  return (
    <Tooltip content="Only published courses can be featured">
      <span className="inline-flex" tabIndex={0}>
        {control}
      </span>
    </Tooltip>
  );
}
