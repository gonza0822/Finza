"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";
import { requireUserId } from "@/lib/auth/requireUser";
import { planificacionContent } from "@/lib/content/planificacion";
import {
  RecurrenceAccountUnavailableError,
  RecurrenceCardUnavailableError,
  RecurrenceCategoryUnavailableError,
  RecurrenceEndsBeforeStartError,
  RecurrenceLimitError,
  RecurrenceNotFoundError,
  RecurrenceOccurrenceClosedError,
  confirmOccurrence,
  createRecurrenceRule,
  deleteRecurrenceRule,
  omitOccurrence,
  pauseRecurrenceRule,
  resumeRecurrenceRule,
  updateRecurrenceRule,
} from "@/lib/services/recurrenceService";
import {
  createRecurrenceRuleSchema,
  recurrenceOccurrenceIdSchema,
  recurrenceRuleIdSchema,
} from "@/lib/validators/recurrence";
import type { RecurrenceFormState } from "@/features/planificacion/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): RecurrenceFormState["fieldErrors"] {
  const fieldErrors: NonNullable<RecurrenceFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "name") {
      fieldErrors.name =
        issue.code === "too_small"
          ? planificacionContent.errors.emptyName
          : planificacionContent.errors.nameTooLong;
    } else if (key === "kind") {
      fieldErrors.kind = planificacionContent.errors.emptyKind;
    } else if (key === "ruleClass") {
      fieldErrors.ruleClass = planificacionContent.errors.emptyClass;
    } else if (key === "amount") {
      fieldErrors.amount =
        issue.message === "invalid_money" || issue.code !== "too_small"
          ? planificacionContent.errors.invalidAmount
          : planificacionContent.errors.emptyAmount;
    } else if (key === "frequency") {
      fieldErrors.frequency = planificacionContent.errors.emptyFrequency;
    } else if (key === "dueDay") {
      fieldErrors.dueDay = planificacionContent.errors.emptyDueDay;
    } else if (key === "dueMonth") {
      fieldErrors.dueMonth = planificacionContent.errors.emptyDueMonth;
    } else if (key === "accountId") {
      fieldErrors.accountId = planificacionContent.errors.emptyAccount;
    } else if (key === "creditCardId") {
      fieldErrors.creditCardId = planificacionContent.errors.emptyCard;
    } else if (key === "categoryId") {
      fieldErrors.categoryId = planificacionContent.errors.emptyCategory;
    } else if (key === "startsOn") {
      fieldErrors.startsOn = planificacionContent.errors.invalidDate;
    } else if (key === "endsOn") {
      fieldErrors.endsOn = planificacionContent.errors.invalidDate;
    }
  }
  return fieldErrors;
}

function payloadFromForm(formData: FormData) {
  const kind = readString(formData, "kind") || "gasto";
  const paidWith = kind === "ingreso" ? "cuenta" : readString(formData, "paidWith") || "cuenta";
  const frequency = readString(formData, "frequency") || "mensual";
  const base = {
    name: readString(formData, "name"),
    kind,
    ruleClass: readString(formData, "ruleClass"),
    amount: readString(formData, "amount"),
    frequency,
    dueDay: readString(formData, "dueDay"),
    startsOn: readString(formData, "startsOn"),
    endsOn: readString(formData, "endsOn"),
    categoryId: readString(formData, "categoryId"),
    paidWith,
  };
  if (frequency === "anual") {
    return {
      ...base,
      dueMonth: readString(formData, "dueMonth"),
      ...(paidWith === "tarjeta"
        ? { creditCardId: readString(formData, "creditCardId") }
        : { accountId: readString(formData, "accountId") }),
    };
  }
  return {
    ...base,
    ...(paidWith === "tarjeta"
      ? { creditCardId: readString(formData, "creditCardId") }
      : { accountId: readString(formData, "accountId") }),
  };
}

function revalidatePlanning() {
  revalidatePath("/planificacion", "layout");
  revalidatePath("/movimientos");
  revalidatePath("/inicio");
  revalidatePath("/cuentas");
  revalidatePath("/tarjetas");
}

function mapSaveError(error: unknown): RecurrenceFormState {
  if (error instanceof RecurrenceLimitError) {
    return { error: planificacionContent.errors.tooMany };
  }
  if (error instanceof RecurrenceAccountUnavailableError) {
    return { error: planificacionContent.errors.accountUnavailable };
  }
  if (error instanceof RecurrenceCardUnavailableError) {
    return { error: planificacionContent.errors.cardUnavailable };
  }
  if (error instanceof RecurrenceCategoryUnavailableError) {
    return { error: planificacionContent.errors.categoryUnavailable };
  }
  if (error instanceof RecurrenceEndsBeforeStartError) {
    return { error: planificacionContent.errors.endsBeforeStart };
  }
  if (error instanceof RecurrenceNotFoundError) {
    return { error: planificacionContent.errors.notFound };
  }
  return { error: planificacionContent.errors.generic };
}

/** Creates a recurrence rule for the signed-in user. */
export async function createRecurrenceRuleAction(
  _prev: RecurrenceFormState | undefined,
  formData: FormData,
): Promise<RecurrenceFormState> {
  const userId = await requireUserId();
  const parsed = createRecurrenceRuleSchema.safeParse(payloadFromForm(formData));
  if (!parsed.success) {
    return {
      error: planificacionContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await createRecurrenceRule(userId, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidatePlanning();
  redirect("/planificacion?tab=recurrentes");
}

/** Updates an owned recurrence rule. */
export async function updateRecurrenceRuleAction(
  _prev: RecurrenceFormState | undefined,
  formData: FormData,
): Promise<RecurrenceFormState> {
  const userId = await requireUserId();
  const idParsed = recurrenceRuleIdSchema.safeParse({ id: readString(formData, "id") });
  const parsed = createRecurrenceRuleSchema.safeParse(payloadFromForm(formData));
  if (!idParsed.success || !parsed.success) {
    return {
      error: planificacionContent.errors.invalidInput,
      fieldErrors: parsed.success ? undefined : mapFieldErrors(parsed.error.issues),
    };
  }
  try {
    await updateRecurrenceRule(userId, idParsed.data.id, parsed.data);
  } catch (error: unknown) {
    return mapSaveError(error);
  }
  revalidatePlanning();
  redirect("/planificacion?tab=recurrentes");
}

/** Confirms this month’s occurrence into a ledger movement. */
export async function confirmOccurrenceAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = recurrenceOccurrenceIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await confirmOccurrence(userId, parsed.data.id);
  } catch (error: unknown) {
    if (
      error instanceof RecurrenceNotFoundError ||
      error instanceof RecurrenceOccurrenceClosedError
    ) {
      revalidatePlanning();
      return;
    }
    throw error;
  }
  revalidatePlanning();
}

/** Omits this month’s occurrence without creating a movement. */
export async function omitOccurrenceAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = recurrenceOccurrenceIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await omitOccurrence(userId, parsed.data.id);
  } catch (error: unknown) {
    if (
      error instanceof RecurrenceNotFoundError ||
      error instanceof RecurrenceOccurrenceClosedError
    ) {
      revalidatePlanning();
      return;
    }
    throw error;
  }
  revalidatePlanning();
}

/** Pauses an owned rule. */
export async function pauseRecurrenceRuleAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = recurrenceRuleIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await pauseRecurrenceRule(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof RecurrenceNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePlanning();
}

/** Resumes an owned paused rule. */
export async function resumeRecurrenceRuleAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = recurrenceRuleIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await resumeRecurrenceRule(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof RecurrenceNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePlanning();
}

/** Finishes a rule and drops future programmed occurrences. */
export async function deleteRecurrenceRuleAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = recurrenceRuleIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await deleteRecurrenceRule(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof RecurrenceNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePlanning();
  redirect("/planificacion?tab=recurrentes");
}
