import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function SectionHeading({ title, description, href, linkLabel = "View all", id }: { title: string; description?: string; href?: string; linkLabel?: string; id?: string }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-4">
      <div>
        <h2 id={id} className="text-display text-[1.6rem] font-medium leading-tight sm:text-[1.85rem]">{title}</h2>
        {description && <p className="mt-1 text-[15px] text-muted-foreground">{description}</p>}
      </div>
      {href && (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          {linkLabel}
          <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
        </Link>
      )}
    </div>
  );
}
