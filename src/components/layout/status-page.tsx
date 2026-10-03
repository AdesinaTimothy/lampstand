import Link from "next/link";
import { Button } from "@/components/ui/button";

/** Full-page status message used by not-found, forbidden and error boundaries. */
export function StatusPage({
  code,
  title,
  description,
  children,
}: {
  code?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="container-page flex min-h-[60dvh] flex-col items-center justify-center py-20 text-center">
      {code && <p className="font-mono text-sm font-medium tracking-widest text-accent">{code}</p>}
      <h1 className="text-display mt-3 text-[2.25rem] font-medium leading-tight sm:text-[2.75rem]">{title}</h1>
      <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted-foreground">{description}</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        {children ?? (
          <>
            <Button asChild>
              <Link href="/dashboard">Go to my dashboard</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/courses">Browse courses</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
