import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

/** HTML rendition of the certificate (mirrors the PDF). Purely presentational. */
export function CertificateDocument({
  recipientName,
  courseTitle,
  organizationName,
  instructorName,
  signatoryName,
  signatoryTitle,
  completedAt,
  code,
  revoked,
  className,
}: {
  recipientName: string;
  courseTitle: string;
  organizationName: string;
  instructorName: string | null;
  signatoryName: string | null;
  signatoryTitle: string | null;
  completedAt: Date;
  code: string;
  revoked?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("@container relative", className)}>
      <div
        className={cn(
          "relative aspect-[1.414] w-full overflow-hidden rounded-lg bg-[#fcfaf5] text-[#18211e] shadow-lg ring-1 ring-black/5",
          revoked && "grayscale",
        )}
        role="img"
        aria-label={`Certificate of completion awarded to ${recipientName} for ${courseTitle} by ${organizationName}, completed ${formatDate(completedAt)}. Certificate ID ${code}.`}
      >
        <div className="absolute inset-[2.6%] border-2 border-[#1f5145]" aria-hidden />
        <div className="absolute inset-[3.6%] border border-[#a87424]/70" aria-hidden />
        <div className="absolute inset-0 flex flex-col items-center px-[9%] pt-[6.5%] text-center" aria-hidden>
          <svg viewBox="0 0 28 36" className="h-[6cqw] w-auto">
            <ellipse cx="14" cy="12" rx="7" ry="12" fill="#a87424" />
            <rect x="0" y="30" width="28" height="5" fill="#1f5145" />
          </svg>
          <p className="mt-[1.6cqw] text-[1.35cqw] font-semibold uppercase tracking-[0.2em] text-[#1f5145]">{organizationName}</p>
          <p className="text-display mt-[2.6cqw] text-[5cqw] leading-none">Certificate of Completion</p>
          <p className="text-display mt-[2.4cqw] text-[1.9cqw] italic text-[#5c6863]">This certifies that</p>
          <p className="text-display mt-[1.6cqw] max-w-full truncate border-b border-[#a87424]/60 px-[4cqw] pb-[0.8cqw] text-[4.6cqw] leading-tight">{recipientName}</p>
          <p className="text-display mt-[2.2cqw] text-[1.9cqw] italic text-[#5c6863]">has faithfully completed the course</p>
          <p className="text-display mt-[1.2cqw] line-clamp-2 text-[3cqw] leading-tight text-[#1f5145]">{courseTitle}</p>
          <div className="mt-auto mb-[10%] flex w-full justify-center gap-[5cqw]">
            {[
              { label: "Date completed", value: formatDate(completedAt, "d MMMM yyyy") },
              signatoryName ? { label: signatoryTitle ?? "On behalf of the church", value: signatoryName } : null,
              instructorName ? { label: "Instructor", value: instructorName } : null,
            ]
              .filter((c): c is { label: string; value: string } => Boolean(c))
              .map((c) => (
                <div key={c.label} className="w-[22cqw]">
                  <p className="text-display truncate border-b border-[#5c6863]/60 pb-[0.6cqw] text-[1.8cqw] italic">{c.value}</p>
                  <p className="mt-[0.6cqw] text-[1.1cqw] text-[#5c6863]">{c.label}</p>
                </div>
              ))}
          </div>
          <p className="absolute bottom-[6.5%] text-[1.05cqw] text-[#5c6863]">Certificate {code}</p>
        </div>
        {revoked && (
          <div className="absolute inset-0 grid place-items-center" aria-hidden>
            <span className="-rotate-12 rounded-lg border-4 border-[#b03d2a] px-[3cqw] py-[1cqw] text-[5cqw] font-bold uppercase tracking-widest text-[#b03d2a]">Revoked</span>
          </div>
        )}
      </div>
    </div>
  );
}
