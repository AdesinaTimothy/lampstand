import Image from "next/image";
import { cn } from "@/lib/utils";

// Calm, on-brand palettes for generated covers (used until an image is uploaded).
const PALETTES = [
  ["#1f5145", "#2e7a66", "#e9dcc0"],
  ["#2b4a6b", "#4f7aa3", "#efe3cc"],
  ["#5b3a2e", "#9a6a4a", "#f3e6d0"],
  ["#3d4a2a", "#6e8452", "#ece5cf"],
  ["#4a3557", "#7b5f8c", "#f0e5d5"],
  ["#2f3e46", "#52796f", "#e8dfc9"],
];

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function GeneratedCover({ seed, className }: { seed: string; className?: string }) {
  const h = hash(seed);
  const [bg, mid, light] = PALETTES[h % PALETTES.length]!;
  const variant = (h >> 4) % 3;
  const cx = 120 + ((h >> 8) % 200);
  return (
    <svg viewBox="0 0 480 270" preserveAspectRatio="xMidYMid slice" className={cn("size-full", className)} aria-hidden>
      <rect width="480" height="270" fill={bg} />
      {variant === 0 && (
        <>
          <circle cx={cx} cy="300" r="190" fill={mid} opacity="0.55" />
          <circle cx={cx + 140} cy="40" r="70" fill={light} opacity="0.85" />
          <path d={`M0 210 Q ${cx} 150 480 200 L480 270 L0 270Z`} fill={light} opacity="0.18" />
        </>
      )}
      {variant === 1 && (
        <>
          <rect x="300" y="-40" width="220" height="360" rx="110" fill={mid} opacity="0.5" transform="rotate(18 400 130)" />
          <circle cx="110" cy="120" r="54" fill={light} opacity="0.9" />
          <path d="M0 230 L480 160 L480 270 L0 270Z" fill={mid} opacity="0.35" />
        </>
      )}
      {variant === 2 && (
        <>
          {[0, 1, 2, 3, 4].map((i) => (
            <circle key={i} cx={cx} cy="135" r={40 + i * 38} fill="none" stroke={light} strokeOpacity={0.5 - i * 0.08} strokeWidth="1.5" />
          ))}
          <circle cx={cx} cy="135" r="26" fill={light} opacity="0.9" />
        </>
      )}
    </svg>
  );
}

export function CourseCover({
  src,
  title,
  seed,
  className,
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw",
  preload,
}: {
  src: string | null;
  title: string;
  seed: string;
  className?: string;
  sizes?: string;
  preload?: boolean;
}) {
  return (
    <div className={cn("relative aspect-video overflow-hidden bg-surface-sunken", className)}>
      {src ? (
        <Image src={src} alt="" fill sizes={sizes} className="object-cover" preload={preload} />
      ) : (
        <GeneratedCover seed={seed} />
      )}
      <span className="sr-only">{title}</span>
    </div>
  );
}
