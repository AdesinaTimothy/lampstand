"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ImageIcon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SwitchField } from "@/components/ui/checkbox";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { FileUpload } from "@/components/media/file-upload";
import { organizationSettingsSchema } from "@/lib/validation/admin";
import { updateOrganizationSettingsAction } from "@/actions/admin";
import { runWithToast } from "../run-action";
import { COMMON_TIMEZONES } from "./timezones";

type Values = z.input<typeof organizationSettingsSchema>;
type Output = z.output<typeof organizationSettingsSchema>;

const FIELDS = [
  "name",
  "tagline",
  "description",
  "website",
  "email",
  "logoId",
  "allowSelfRegistration",
  "requireEmailVerification",
  "certificateSignatoryName",
  "certificateSignatoryTitle",
  "timezone",
] as const satisfies readonly (keyof Values)[];

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  );
}

export function SettingsForm({ initial, initialLogoUrl }: { initial: Values; initialLogoUrl: string | null }) {
  const router = useRouter();
  const [logoUrl, setLogoUrl] = React.useState(initialLogoUrl);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [savedAt, setSavedAt] = React.useState<Date | null>(null);
  const form = useForm<Values, unknown, Output>({ resolver: zodResolver(organizationSettingsSchema), defaultValues: initial });
  const { errors, isSubmitting, isDirty } = form.formState;

  // Keep a stored timezone selectable even if it isn't in the common list.
  const timezones = COMMON_TIMEZONES.some((t) => t.value === initial.timezone)
    ? COMMON_TIMEZONES
    : [{ value: initial.timezone, label: initial.timezone }, ...COMMON_TIMEZONES];

  const onSubmit = form.handleSubmit(async (values) => {
    setFormError(null);
    // Success is confirmed inline in the save bar (a toast would cover it); errors still toast.
    const result = await runWithToast(updateOrganizationSettingsAction(values), () => undefined);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        const field = FIELDS.find((f) => f === key);
        if (field) form.setError(field, { message: messages[0] });
      }
      setFormError(result.error);
      return;
    }
    form.reset(values);
    setSavedAt(new Date());
    router.refresh();
  });

  const text = (name: "name" | "tagline" | "website" | "email" | "certificateSignatoryName" | "certificateSignatoryTitle", extra?: React.ComponentProps<typeof Input>) => (
    <Input
      id={`org-${name}`}
      aria-invalid={Boolean(errors[name])}
      aria-describedby={describedBy(`org-${name}`, errors[name]?.message, true)}
      {...extra}
      {...form.register(name)}
    />
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <FormError message={formError} />

      <Section title="Organization" description="How your church or ministry appears across Lampstand, in emails and on certificates.">
        <Field label="Name" htmlFor="org-name" error={errors.name?.message} required>
          {text("name", { autoComplete: "organization" })}
        </Field>
        <Field label="Tagline" htmlFor="org-tagline" error={errors.tagline?.message} description="A short line shown on the home page." optional>
          {text("tagline", { maxLength: 160 })}
        </Field>
        <Field label="Description" htmlFor="org-description" error={errors.description?.message} description="A few sentences about your community." optional>
          <Textarea
            id="org-description"
            rows={4}
            aria-invalid={Boolean(errors.description)}
            aria-describedby={describedBy("org-description", errors.description?.message, true)}
            {...form.register("description")}
          />
        </Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Website" htmlFor="org-website" error={errors.website?.message} description="Starting with https://" optional>
            {text("website", { type: "url", inputMode: "url", placeholder: "https://" })}
          </Field>
          <Field label="Contact email" htmlFor="org-email" error={errors.email?.message} description="Shown to members who need help." optional>
            {text("email", { type: "email", inputMode: "email" })}
          </Field>
        </div>
        <Field label="Timezone" htmlFor="org-timezone" error={errors.timezone?.message} description="Used for learning streaks, reports and dates.">
          <NativeSelect
            id="org-timezone"
            aria-invalid={Boolean(errors.timezone)}
            aria-describedby={describedBy("org-timezone", errors.timezone?.message, true)}
            {...form.register("timezone")}
          >
            {timezones.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </Section>

      <Section title="Logo" description="Square images work best. Shown in the header, emails and certificates.">
        <Controller
          control={form.control}
          name="logoId"
          render={({ field }) => (
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border border-border bg-surface-muted">
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- logo is re-encoded to ≤512px on upload
                  <img src={logoUrl} alt="Current logo" className="size-full object-contain" />
                ) : (
                  <ImageIcon className="size-6 text-subtle-foreground" aria-hidden />
                )}
              </div>
              <div className="grid flex-1 gap-2">
                <FileUpload
                  purpose="organization-logo"
                  compact
                  label={logoUrl ? "Replace logo" : "Upload a logo"}
                  onUploaded={(asset) => {
                    field.onChange(asset.id);
                    setLogoUrl(asset.url);
                  }}
                />
                {logoUrl && (
                  <Button
                    type="button"
                    variant="danger-ghost"
                    size="sm"
                    className="justify-self-start"
                    onClick={() => {
                      field.onChange(null);
                      setLogoUrl(null);
                    }}
                  >
                    <Trash2 aria-hidden />
                    Remove logo
                  </Button>
                )}
              </div>
            </div>
          )}
        />
      </Section>

      <Section title="Membership" description="Control how people join your organization.">
        <Controller
          control={form.control}
          name="allowSelfRegistration"
          render={({ field }) => (
            <SwitchField
              id="org-self-registration"
              label="Allow anyone to create an account"
              description="When off, only people you invite can join."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        <Controller
          control={form.control}
          name="requireEmailVerification"
          render={({ field }) => (
            <SwitchField
              id="org-email-verification"
              label="Require email verification"
              description="New members confirm their email address before they can enrol."
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
      </Section>

      <Section title="Certificates" description="The signatory printed on newly issued certificates. Existing certificates keep the names they were issued with.">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Signatory name" htmlFor="org-certificateSignatoryName" error={errors.certificateSignatoryName?.message} optional>
            {text("certificateSignatoryName", { placeholder: "e.g. Rev. Daniel Okafor" })}
          </Field>
          <Field label="Signatory title" htmlFor="org-certificateSignatoryTitle" error={errors.certificateSignatoryTitle?.message} optional>
            {text("certificateSignatoryTitle", { placeholder: "e.g. Senior Pastor" })}
          </Field>
        </div>
      </Section>

      <Card className="sticky bottom-4 z-10 shadow-md">
        <CardFooter className="justify-between border-0">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {isDirty
              ? "You have unsaved changes."
              : savedAt
                ? `Settings saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`
                : "All changes saved."}
          </p>
          <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
            Save settings
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
