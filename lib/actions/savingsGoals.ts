"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";
import { requireUserId } from "@/lib/auth/requireUser";
import { metasContent } from "@/lib/content/metas";
import {
  GoalLimitError,
  GoalNotFoundError,
  assignToSavingsGoal,
  cancelSavingsGoal,
  createSavingsGoal,
  pauseSavingsGoal,
  releaseSavingsGoal,
  resumeSavingsGoal,
  updateSavingsGoal,
} from "@/lib/services/savingsGoalService";
import {
  assignSavingsGoalSchema,
  createSavingsGoalSchema,
  savingsGoalIdSchema,
  updateSavingsGoalSchema,
} from "@/lib/validators/savingsGoal";
import type { AssignGoalFormState, GoalFormState } from "@/features/metas/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): GoalFormState["fieldErrors"] {
  const fieldErrors: NonNullable<GoalFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "name") {
      fieldErrors.name = metasContent.errors.emptyName;
    } else if (key === "targetAmount") {
      fieldErrors.targetAmount =
        issue.message === "invalid_money" || issue.code !== "too_small"
          ? metasContent.errors.invalidTarget
          : metasContent.errors.emptyTarget;
    } else if (key === "assignedAmount") {
      fieldErrors.assignedAmount = metasContent.errors.invalidAssigned;
    } else if (key === "targetMonth") {
      fieldErrors.targetMonth = metasContent.errors.emptyMonth;
    } else if (key === "currency") {
      fieldErrors.currency = metasContent.errors.emptyCurrency;
    }
  }
  return fieldErrors;
}

function payloadFromForm(formData: FormData, includeAssigned: boolean) {
  const payload = {
    name: readString(formData, "name"),
    targetAmount: readString(formData, "targetAmount"),
    currency: readString(formData, "currency") || "ARS",
    targetMonth: readString(formData, "targetMonth"),
  };
  if (!includeAssigned) {
    return payload;
  }
  return { ...payload, assignedAmount: readString(formData, "assignedAmount") };
}

function revalidateGoals() {
  revalidatePath("/metas", "layout");
  revalidatePath("/inicio");
}

function mapSaveError(error: unknown): GoalFormState {
  if (error instanceof GoalLimitError) {
    return { error: metasContent.errors.tooMany };
  }
  if (error instanceof GoalNotFoundError) {
    return { error: metasContent.errors.notFound };
  }
  return { error: metasContent.errors.generic };
}

/** Creates a savings overlay for the signed-in user. */
export async function createSavingsGoalAction(
  _prev: GoalFormState | undefined,
  formData: FormData,
): Promise<GoalFormState> {
  const userId = await requireUserId();
  const parsed = createSavingsGoalSchema.safeParse(payloadFromForm(formData, true));
  if (!parsed.success) {
    return {
      error: metasContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await createSavingsGoal(userId, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidateGoals();
  redirect("/metas");
}

/** Updates an owned savings goal. */
export async function updateSavingsGoalAction(
  _prev: GoalFormState | undefined,
  formData: FormData,
): Promise<GoalFormState> {
  const userId = await requireUserId();
  const payload = { id: readString(formData, "id"), ...payloadFromForm(formData, false) };
  const parsed = updateSavingsGoalSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: metasContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await updateSavingsGoal(userId, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidateGoals();
  redirect(`/metas/${parsed.data.id}`);
}

/** Adds to assigned on an owned goal without moving accounts. */
export async function assignSavingsGoalAction(
  _prev: AssignGoalFormState | undefined,
  formData: FormData,
): Promise<AssignGoalFormState> {
  const userId = await requireUserId();
  const parsed = assignSavingsGoalSchema.safeParse({
    id: readString(formData, "id"),
    amount: readString(formData, "amount"),
  });
  if (!parsed.success) {
    const amountIssue = parsed.error.issues.find((issue) => String(issue.path[0]) === "amount");
    return {
      error: metasContent.errors.invalidInput,
      fieldErrors: {
        amount:
          amountIssue?.message === "invalid_money" || amountIssue?.code !== "too_small"
            ? metasContent.errors.invalidAmount
            : metasContent.errors.emptyAmount,
      },
    };
  }
  try {
    await assignToSavingsGoal(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof GoalNotFoundError) {
      return { error: metasContent.errors.notFound };
    }
    return { error: metasContent.errors.generic };
  }
  revalidateGoals();
  redirect(`/metas/${parsed.data.id}`);
}

async function mutateOwned(formData: FormData, run: (userId: string, id: string) => Promise<void>) {
  const userId = await requireUserId();
  const parsed = savingsGoalIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await run(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof GoalNotFoundError) {
      return;
    }
    throw error;
  }
  revalidateGoals();
}

/** Pauses an owned active goal. */
export async function pauseSavingsGoalAction(formData: FormData): Promise<void> {
  await mutateOwned(formData, pauseSavingsGoal);
}

/** Resumes an owned paused goal. */
export async function resumeSavingsGoalAction(formData: FormData): Promise<void> {
  await mutateOwned(formData, resumeSavingsGoal);
}

/** Releases assigned on a reached goal so Libre recovers. */
export async function releaseSavingsGoalAction(formData: FormData): Promise<void> {
  await mutateOwned(formData, releaseSavingsGoal);
}

/** Cancels an owned goal and releases assigned. */
export async function cancelSavingsGoalAction(formData: FormData): Promise<void> {
  await mutateOwned(formData, cancelSavingsGoal);
  redirect("/metas");
}
