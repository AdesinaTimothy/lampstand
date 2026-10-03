"use client";

import * as React from "react";
import { BadgeCheck, Check, Copy, Download, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CertificateActions({
  pdfHref,
  verifyUrl,
  courseTitle,
  organizationName,
  issuedAt,
  code,
}: {
  pdfHref: string;
  verifyUrl: string;
  courseTitle: string;
  organizationName: string;
  issuedAt: string;
  code: string;
}) {
  const [copied, setCopied] = React.useState(false);
  const [canShare, setCanShare] = React.useState(false);
  React.useEffect(() => {
    // Feature detection must happen after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCanShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  const issued = new Date(issuedAt);
  const linkedIn = new URL("https://www.linkedin.com/profile/add");
  linkedIn.search = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: courseTitle,
    organizationName,
    issueYear: String(issued.getUTCFullYear()),
    issueMonth: String(issued.getUTCMonth() + 1),
    certUrl: verifyUrl,
    certId: code,
  }).toString();

  return (
    <div className="flex flex-wrap gap-2">
      <Button asChild>
        <a href={pdfHref} download>
          <Download aria-hidden /> Download PDF
        </a>
      </Button>
      <Button
        variant="outline"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(verifyUrl);
            setCopied(true);
            toast.success("Verification link copied");
            setTimeout(() => setCopied(false), 2000);
          } catch {
            toast.error("Couldn't copy. Select the link below instead.");
          }
        }}
      >
        {copied ? <Check aria-hidden /> : <Copy aria-hidden />} Copy verification link
      </Button>
      {canShare && (
        <Button
          variant="outline"
          onClick={() => navigator.share({ title: `Certificate: ${courseTitle}`, text: `I completed ${courseTitle} with ${organizationName}.`, url: verifyUrl }).catch(() => undefined)}
        >
          <Share2 aria-hidden /> Share
        </Button>
      )}
      <Button asChild variant="ghost">
        <a href={linkedIn.toString()} target="_blank" rel="noopener noreferrer">
          <BadgeCheck aria-hidden /> Add to LinkedIn
        </a>
      </Button>
    </div>
  );
}
