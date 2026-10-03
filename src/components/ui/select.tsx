"use client";

import * as React from "react";
import { Select as S } from "radix-ui";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClass } from "./input";

export type SelectOption = { value: string; label: string; description?: string };

export function Select({
  value,
  onValueChange,
  options,
  placeholder = "Select…",
  id,
  className,
  disabled,
  "aria-invalid": ariaInvalid,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: {
  value: string | undefined;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  "aria-invalid"?: boolean;
  "aria-label"?: string;
  "aria-describedby"?: string;
}) {
  return (
    <S.Root value={value} onValueChange={onValueChange} disabled={disabled}>
      <S.Trigger
        id={id}
        aria-invalid={ariaInvalid}
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
        className={cn(inputClass, "flex h-10 items-center justify-between gap-2 text-left sm:text-sm data-[placeholder]:text-subtle-foreground", className)}
      >
        <S.Value placeholder={placeholder} />
        <S.Icon>
          <ChevronDown className="size-4 text-subtle-foreground" aria-hidden />
        </S.Icon>
      </S.Trigger>
      <S.Portal>
        <S.Content
          position="popper"
          sideOffset={6}
          className="z-50 max-h-[min(22rem,var(--radix-select-content-available-height))] min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-xl border border-border bg-surface shadow-lg data-[state=open]:animate-scale-in"
        >
          <S.Viewport className="p-1.5">
            {options.map((o) => (
              <S.Item
                key={o.value}
                value={o.value}
                className="relative flex cursor-pointer select-none flex-col rounded-md py-2 pl-8 pr-3 text-sm outline-none data-[highlighted]:bg-surface-muted data-[state=checked]:font-medium"
              >
                <S.ItemIndicator className="absolute left-2.5 top-2.5">
                  <Check className="size-4 text-primary" aria-hidden />
                </S.ItemIndicator>
                <S.ItemText>{o.label}</S.ItemText>
                {o.description && <span className="text-xs text-muted-foreground">{o.description}</span>}
              </S.Item>
            ))}
          </S.Viewport>
        </S.Content>
      </S.Portal>
    </S.Root>
  );
}
