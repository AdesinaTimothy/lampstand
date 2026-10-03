import { cn } from "@/lib/utils";

/** Two-column settings-style section: heading + help on the left, controls on the right. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("grid gap-5 border-b border-border py-8 first:pt-0 last:border-0 lg:grid-cols-[16rem_1fr] lg:gap-10", className)}>
      <div>
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {description && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>}
      </div>
      <div className="min-w-0 space-y-5">{children}</div>
    </section>
  );
}
