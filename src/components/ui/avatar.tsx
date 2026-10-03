import { cn, initials } from "@/lib/utils";

const SIZES = { xs: "size-6 text-[10px]", sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg", xl: "size-24 text-3xl" };

// Deterministic, calm background tones for initials.
const TONES = [
  "bg-primary-soft text-primary-soft-foreground",
  "bg-accent-soft text-accent-soft-foreground",
  "bg-info-soft text-info",
  "bg-success-soft text-success",
  "bg-surface-sunken text-foreground",
];

export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  const tone = TONES[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % TONES.length];
  return (
    <span className={cn("relative inline-grid shrink-0 place-items-center overflow-hidden rounded-full font-semibold", SIZES[size], !src && tone, className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- avatars are pre-sized 512px webp
        <img src={src} alt="" className="size-full object-cover" loading="lazy" decoding="async" />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
      <span className="sr-only">{name}</span>
    </span>
  );
}
