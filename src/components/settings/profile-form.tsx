"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { toast } from "sonner";
import { Globe, Lock, Users } from "lucide-react";
import { updateProfileAction } from "@/actions/account";
import { applyFieldErrors } from "@/components/auth/use-action-form";
import { FileUpload } from "@/components/media/file-upload";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem, SwitchField } from "@/components/ui/checkbox";
import { Field, FormError, describedBy } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { profileSchema } from "@/lib/validation/admin";
import { cn } from "@/lib/utils";

type ProfileInput = z.input<typeof profileSchema>;

const VISIBILITY = [
  { value: "PUBLIC", label: "Public", description: "Anyone with the link can see your profile, milestones and certificates.", icon: Globe },
  { value: "MEMBERS", label: "Church members", description: "Only signed-in members of your church can see your profile.", icon: Users },
  { value: "PRIVATE", label: "Only me", description: "Only you (and church administrators) can see your profile.", icon: Lock },
] as const;

export function ProfileForm({ initial }: { initial: ProfileInput & { avatarUrl: string | null } }) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = React.useState(initial.avatarUrl);
  const { avatarUrl: _ignored, ...defaults } = initial;
  void _ignored;
  const form = useForm<ProfileInput>({ resolver: zodResolver(profileSchema), defaultValues: defaults, mode: "onTouched" });
  const { errors, isSubmitting, isDirty } = form.formState;
  const name = form.watch("name");

  async function onSubmit(values: ProfileInput) {
    setFormError(null);
    const res = await updateProfileAction(values);
    if (!res.ok) {
      applyFieldErrors(form, res);
      setFormError(res.error);
      return;
    }
    toast.success(res.message ?? "Saved");
    form.reset(values);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-6">
      <FormError message={formError} />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={name || "?"} src={avatarUrl} size="xl" />
        <div className="flex-1 space-y-2">
          <p className="text-sm font-medium">Profile photo</p>
          <FileUpload
            purpose="avatar"
            compact
            label="Upload a photo"
            hint="JPG, PNG or WebP. Square works best."
            onUploaded={(asset) => {
              setAvatarUrl(asset.url);
              form.setValue("avatarId", asset.id, { shouldDirty: true });
            }}
          />
          {avatarUrl && (
            <Button
              type="button"
              variant="link"
              size="sm"
              className="h-auto p-0 text-muted-foreground"
              onClick={() => {
                setAvatarUrl(null);
                form.setValue("avatarId", null, { shouldDirty: true });
              }}
            >
              Remove photo
            </Button>
          )}
        </div>
      </div>

      <Field label="Full name" htmlFor="name" error={errors.name?.message} required>
        <Input id="name" autoComplete="name" aria-invalid={!!errors.name} aria-describedby={describedBy("name", errors.name?.message)} {...form.register("name")} />
      </Field>
      <Field label="Headline" htmlFor="headline" optional description="A short line about you, e.g. “Small group leader at Grace Harbor”." error={errors.headline?.message}>
        <Input id="headline" maxLength={100} aria-describedby={describedBy("headline", errors.headline?.message, true)} {...form.register("headline")} />
      </Field>
      <Field label="About you" htmlFor="bio" optional error={errors.bio?.message}>
        <Textarea id="bio" rows={4} maxLength={1000} {...form.register("bio")} />
      </Field>

      <fieldset>
        <legend className="text-sm font-medium">Who can see your profile</legend>
        <Controller
          control={form.control}
          name="profileVisibility"
          render={({ field }) => (
            <RadioGroup value={field.value} onValueChange={field.onChange} className="mt-3 grid gap-2">
              {VISIBILITY.map((v) => {
                const Icon = v.icon;
                const id = `visibility-${v.value}`;
                return (
                  <label
                    key={v.value}
                    htmlFor={id}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition-colors hover:bg-surface-muted",
                      field.value === v.value ? "border-primary bg-primary-soft/40" : "border-border",
                    )}
                  >
                    <RadioGroupItem id={id} value={v.value} className="mt-0.5" />
                    <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span>
                      <span className="block text-sm font-medium">{v.label}</span>
                      <span className="block text-sm text-muted-foreground">{v.description}</span>
                    </span>
                  </label>
                );
              })}
            </RadioGroup>
          )}
        />
      </fieldset>

      <Controller
        control={form.control}
        name="emailNotifications"
        render={({ field }) => (
          <SwitchField
            id="email-notifications"
            label="Email me about my learning"
            description="Feedback on assignments, certificates and announcements. Security emails are always sent."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <div className="flex justify-end">
        <Button type="submit" loading={isSubmitting} disabled={!isDirty}>
          Save changes
        </Button>
      </div>
    </form>
  );
}
