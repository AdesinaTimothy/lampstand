"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/validation/admin";
import type { ActionResult } from "@/lib/errors";
import { parse, runAction } from "@/server/action";
import { requireViewer } from "@/server/auth/guards";
import { updateProfile } from "@/server/services/organization";

export async function updateProfileAction(input: unknown): Promise<ActionResult> {
  return runAction(async () => {
    const viewer = await requireViewer();
    await updateProfile(viewer, parse(profileSchema, input));
    revalidatePath("/", "layout");
  }, "Your profile has been saved.");
}
