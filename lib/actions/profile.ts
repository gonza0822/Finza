"use server";

import { revalidatePath } from "next/cache";
import { requireUserId } from "@/lib/auth/requireUser";
import { perfilContent } from "@/lib/content/perfil";
import {
  updateUserSettings,
  UserSettingsNotFoundError,
} from "@/lib/services/userSettingsService";
import { updateProfileSchema } from "@/lib/validators/profile";
import type { ProfileFormState } from "@/features/perfil/types";
import type { ZodIssue } from "zod";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): ProfileFormState["fieldErrors"] {
  const fieldErrors: NonNullable<ProfileFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "name") {
      fieldErrors.name =
        issue.code === "too_small"
          ? perfilContent.errors.emptyName
          : perfilContent.errors.nameTooLong;
    } else if (key === "defaultCurrency") {
      fieldErrors.defaultCurrency = perfilContent.errors.emptyCurrency;
    } else if (key === "goalsCountAsCommitted") {
      fieldErrors.goalsCountAsCommitted = perfilContent.errors.emptyGoals;
    }
  }
  return fieldErrors;
}

/** Saves profile prefs for the signed-in user only. */
export async function updateProfileAction(
  _prev: ProfileFormState | undefined,
  formData: FormData,
): Promise<ProfileFormState> {
  const userId = await requireUserId();
  const parsed = updateProfileSchema.safeParse({
    name: readString(formData, "name"),
    defaultCurrency: readString(formData, "defaultCurrency"),
    goalsCountAsCommitted: readString(formData, "goalsCountAsCommitted"),
  });
  if (!parsed.success) {
    return {
      error: perfilContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await updateUserSettings(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof UserSettingsNotFoundError) {
      return { error: perfilContent.errors.notFound };
    }
    return { error: perfilContent.errors.generic };
  }

  revalidatePath("/", "layout");
  revalidatePath("/inicio");
  revalidatePath("/mas/perfil");
  return { success: perfilContent.saved };
}
