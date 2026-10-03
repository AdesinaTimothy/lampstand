"use client";

import { RadioGroup as R } from "radix-ui";
import { CategoryIcon } from "@/components/course/category-icon";
import { CATEGORY_ICONS } from "@/lib/category-icons";
import { cn } from "@/lib/utils";

const label = (name: string) => name.replace(/-/g, " ");

/** Arrow-key navigable icon grid (radio group semantics). */
export function IconPicker({ value, onChange, id }: { value: string; onChange: (icon: string) => void; id?: string }) {
  return (
    <R.Root id={id} value={value} onValueChange={onChange} aria-label="Category icon" className="grid grid-cols-6 gap-2 sm:grid-cols-8">
      {CATEGORY_ICONS.map((icon) => (
        <R.Item
          key={icon}
          value={icon}
          aria-label={label(icon)}
          title={label(icon)}
          className={cn(
            "grid aspect-square place-items-center rounded-lg border border-border bg-surface text-muted-foreground transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
            "data-[state=checked]:border-primary data-[state=checked]:bg-primary-soft data-[state=checked]:text-primary",
          )}
        >
          <CategoryIcon name={icon} className="size-5" />
        </R.Item>
      ))}
    </R.Root>
  );
}
