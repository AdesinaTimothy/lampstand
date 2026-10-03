"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function VerifyForm({ defaultValue = "", autoFocus }: { defaultValue?: string; autoFocus?: boolean }) {
  const router = useRouter();
  const [code, setCode] = React.useState(defaultValue);
  const [error, setError] = React.useState<string | null>(null);
  const [pending, start] = React.useTransition();
  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        const cleaned = code.trim();
        if (cleaned.replace(/[^0-9a-z]/gi, "").length < 8) return setError("Enter the full certificate ID, e.g. LS-7K2M-9QXP-4T.");
        setError(null);
        start(() => router.push(`/verify/${encodeURIComponent(cleaned.toUpperCase())}`));
      }}
      noValidate
    >
      <label htmlFor="cert-code" className="text-sm font-medium">
        Certificate ID
      </label>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row">
        <Input
          id="cert-code"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="LS-XXXX-XXXX-XX"
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          autoFocus={autoFocus}
          className="h-12 font-mono text-base tracking-wider sm:flex-1"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "cert-code-error" : "cert-code-help"}
          maxLength={40}
        />
        <Button type="submit" size="lg" className="h-12" loading={pending}>
          <Search aria-hidden /> Verify
        </Button>
      </div>
      {error ? (
        <p id="cert-code-error" role="alert" className="mt-2 text-sm text-danger">
          {error}
        </p>
      ) : (
        <p id="cert-code-help" className="mt-2 text-sm text-muted-foreground">
          You&apos;ll find the ID at the bottom of the certificate.
        </p>
      )}
    </form>
  );
}
