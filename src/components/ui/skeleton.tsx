import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn(
        "animate-shimmer rounded-md bg-[linear-gradient(90deg,var(--surface-muted)_0%,var(--surface-sunken)_50%,var(--surface-muted)_100%)] bg-[length:200%_100%]",
        className,
      )}
      {...props}
    />
  );
}
