"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";
import { requireUserId } from "@/lib/auth/requireUser";
import { planificacionContent } from "@/lib/content/planificacion";
import {
  BudgetCategoryUnavailableError,
  BudgetDuplicateError,
  BudgetLimitError,
  BudgetNotFoundError,
  createBudget,
  deleteBudget,
  updateBudget,
} from "@/lib/services/budgetService";
import {
  budgetIdSchema,
  createBudgetSchema,
  updateBudgetSchema,
} from "@/lib/validators/budget";
import type { BudgetFormState } from "@/features/planificacion/budgetTypes";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): BudgetFormState["fieldErrors"] {
  const fieldErrors: NonNullable<BudgetFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "categoryId") {
      fieldErrors.categoryId = planificacionContent.budgetErrors.emptyCategory;
    } else if (key === "yearMonth") {
      fieldErrors.yearMonth = planificacionContent.budgetErrors.emptyMonth;
    } else if (key === "amount") {
      fieldErrors.amount =
        issue.message === "invalid_money" || issue.code !== "too_small"
          ? planificacionContent.budgetErrors.invalidAmount
          : planificacionContent.budgetErrors.emptyAmount;
    } else if (key === "currency") {
      fieldErrors.currency = planificacionContent.budgetErrors.emptyCurrency;
    }
  }
  return fieldErrors;
}

function payloadFromForm(formData: FormData) {
  return {
    categoryId: readString(formData, "categoryId"),
    yearMonth: readString(formData, "yearMonth"),
    amount: readString(formData, "amount"),
    currency: readString(formData, "currency") || "ARS",
  };
}

function revalidateBudgets() {
  revalidatePath("/planificacion", "layout");
  revalidatePath("/inicio");
}

function mapSaveError(error: unknown): BudgetFormState {
  if (error instanceof BudgetLimitError) {
    return { error: planificacionContent.budgetErrors.tooMany };
  }
  if (error instanceof BudgetDuplicateError) {
    return { error: planificacionContent.budgetErrors.duplicate };
  }
  if (error instanceof BudgetCategoryUnavailableError) {
    return { error: planificacionContent.budgetErrors.categoryUnavailable };
  }
  if (error instanceof BudgetNotFoundError) {
    return { error: planificacionContent.budgetErrors.notFound };
  }
  return { error: planificacionContent.budgetErrors.generic };
}

function redirectToMonth(yearMonth: string): never {
  redirect(`/planificacion?tab=presupuestos&mes=${yearMonth}`);
}

/** Creates a monthly category cap for the signed-in user. */
export async function createBudgetAction(
  _prev: BudgetFormState | undefined,
  formData: FormData,
): Promise<BudgetFormState> {
  const userId = await requireUserId();
  const parsed = createBudgetSchema.safeParse(payloadFromForm(formData));
  if (!parsed.success) {
    return {
      error: planificacionContent.budgetErrors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await createBudget(userId, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidateBudgets();
  redirectToMonth(parsed.data.yearMonth);
}

/** Updates an owned budget. */
export async function updateBudgetAction(
  _prev: BudgetFormState | undefined,
  formData: FormData,
): Promise<BudgetFormState> {
  const userId = await requireUserId();
  const payload = { id: readString(formData, "id"), ...payloadFromForm(formData) };
  const parsed = updateBudgetSchema.safeParse(payload);
  if (!parsed.success) {
    return {
      error: planificacionContent.budgetErrors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await updateBudget(userId, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidateBudgets();
  redirectToMonth(parsed.data.yearMonth);
}

/** Deletes an owned budget. */
export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = budgetIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  const yearMonth = readString(formData, "yearMonth");
  try {
    await deleteBudget(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof BudgetNotFoundError) {
      return;
    }
    throw error;
  }
  revalidateBudgets();
  if (yearMonth) {
    redirectToMonth(yearMonth);
  }
  redirect("/planificacion?tab=presupuestos");
}
