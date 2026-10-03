import * as React from "react";
import { Stat } from "@/components/ui/stat";
import { Delta } from "./delta";

export function KpiTile({
  label,
  value,
  icon,
  delta,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ReactNode;
  delta?: React.ComponentProps<typeof Delta>;
  hint?: React.ReactNode;
}) {
  return (
    <Stat
      label={label}
      value={value}
      icon={icon}
      hint={
        delta || hint ? (
          <span className="flex flex-col gap-1">
            {delta && <Delta {...delta} />}
            {hint && <span>{hint}</span>}
          </span>
        ) : undefined
      }
    />
  );
}
