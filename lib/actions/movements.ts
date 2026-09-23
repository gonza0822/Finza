"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";
import { requireUserId } from "@/lib/auth/requireUser";
import { movementsContent } from "@/lib/content/movements";
import {
  createMovement,
  MovementAccountUnavailableError,
  MovementAlreadyVoidedError,
  MovementCardUnavailableError,
  MovementCategoryUnavailableError,
  MovementConversionSameCurrencyError,
  MovementCurrencyMismatchError,
  MovementLimitError,
  MovementNoAjusteError,
  MovementNotFoundError,
  MovementPaymentExceedsDebtError,
  MovementSameAccountError,
  voidMovement,
} from "@/lib/services/movementService";
import { createMovementSchema, movementIdSchema } from "@/lib/validators/movement";
import type { MovementFormState } from "@/features/movements/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): MovementFormState["fieldErrors"] {
  const fieldErrors: NonNullable<MovementFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "type") {
      fieldErrors.type = movementsContent.errors.emptyType;
    } else if (key === "accountId") {
      fieldErrors.accountId = movementsContent.errors.emptyAccount;
    } else if (key === "creditCardId") {
      fieldErrors.creditCardId = movementsContent.errors.emptyCard;
    } else if (key === "counterAccountId") {
      fieldErrors.counterAccountId = movementsContent.errors.emptyCounterAccount;
    } else if (key === "categoryId") {
      fieldErrors.categoryId = movementsContent.errors.emptyCategory;
    } else if (key === "amount" || key === "counterAmount") {
      fieldErrors[key] =
        issue.code === "too_small"
          ? movementsContent.errors.emptyAmount
          : movementsContent.errors.invalidAmount;
    } else if (key === "observedBalance") {
      fieldErrors.observedBalance =
        issue.code === "too_small"
          ? movementsContent.errors.emptyObserved
          : movementsContent.errors.invalidObserved;
    } else if (key === "occurredOn") {
      fieldErrors.occurredOn =
        issue.message === "future_date"
          ? movementsContent.errors.futureDate
          : movementsContent.errors.invalidDate;
    } else if (key === "notes") {
      fieldErrors.notes =
        issue.code === "too_small"
          ? movementsContent.errors.emptyReason
          : movementsContent.errors.notesTooLong;
    } else if (key === "installmentCount") {
      fieldErrors.installmentCount = movementsContent.errors.invalidInstallments;
    }
  }
  return fieldErrors;
}

function payloadFromForm(formData: FormData) {
  const type = readString(formData, "type");
  const paidWith = readString(formData, "paidWith") || "cuenta";
  const base = {
    type,
    occurredOn: readString(formData, "occurredOn"),
    notes: readString(formData, "notes"),
  };
  if (type === "gasto" && paidWith === "tarjeta") {
    return {
      ...base,
      paidWith: "tarjeta" as const,
      creditCardId: readString(formData, "creditCardId"),
      categoryId: readString(formData, "categoryId"),
      amount: readString(formData, "amount"),
      installmentCount: readString(formData, "installmentCount") || "1",
    };
  }
  if (type === "gasto") {
    return {
      ...base,
      paidWith: "cuenta" as const,
      accountId: readString(formData, "accountId"),
      categoryId: readString(formData, "categoryId"),
      amount: readString(formData, "amount"),
    };
  }
  if (type === "ingreso") {
    return {
      ...base,
      accountId: readString(formData, "accountId"),
      categoryId: readString(formData, "categoryId"),
      amount: readString(formData, "amount"),
    };
  }
  if (type === "pago_tarjeta") {
    return {
      ...base,
      creditCardId: readString(formData, "creditCardId"),
      accountId: readString(formData, "accountId"),
      amount: readString(formData, "amount"),
    };
  }
  if (type === "transferencia") {
    return {
      ...base,
      accountId: readString(formData, "accountId"),
      counterAccountId: readString(formData, "counterAccountId"),
      amount: readString(formData, "amount"),
    };
  }
  if (type === "conversion") {
    return {
      ...base,
      accountId: readString(formData, "accountId"),
      counterAccountId: readString(formData, "counterAccountId"),
      amount: readString(formData, "amount"),
      counterAmount: readString(formData, "counterAmount"),
    };
  }
  if (type === "ajuste") {
    return {
      ...base,
      accountId: readString(formData, "accountId"),
      observedBalance: readString(formData, "observedBalance"),
    };
  }
  return { ...base, accountId: readString(formData, "accountId") };
}

/** Creates a confirmed ledger row for the signed-in user. */
export async function createMovementAction(
  _prev: MovementFormState | undefined,
  formData: FormData,
): Promise<MovementFormState> {
  const userId = await requireUserId();
  const parsed = createMovementSchema.safeParse(payloadFromForm(formData));
  if (!parsed.success) {
    return {
      error: movementsContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await createMovement(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof MovementAccountUnavailableError) {
      return { error: movementsContent.errors.accountUnavailable };
    }
    if (error instanceof MovementCategoryUnavailableError) {
      return { error: movementsContent.errors.categoryUnavailable };
    }
    if (error instanceof MovementSameAccountError) {
      return { error: movementsContent.errors.sameAccount };
    }
    if (error instanceof MovementCurrencyMismatchError) {
      return { error: movementsContent.errors.currencyMismatch };
    }
    if (error instanceof MovementConversionSameCurrencyError) {
      return { error: movementsContent.errors.conversionSameCurrency };
    }
    if (error instanceof MovementNoAjusteError) {
      return { error: movementsContent.errors.noAjuste };
    }
    if (error instanceof MovementLimitError) {
      return { error: movementsContent.errors.tooMany };
    }
    if (error instanceof MovementCardUnavailableError) {
      return { error: movementsContent.errors.cardUnavailable };
    }
    if (error instanceof MovementPaymentExceedsDebtError) {
      return { error: movementsContent.errors.paymentExceedsDebt };
    }
    return { error: movementsContent.errors.generic };
  }

  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/tarjetas");
  revalidatePath("/inicio");
  redirect("/movimientos");
}

/** Voids an owned confirmed movement so it stops affecting balances. */
export async function voidMovementAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = movementIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await voidMovement(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof MovementNotFoundError || error instanceof MovementAlreadyVoidedError) {
      return;
    }
    throw error;
  }
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/tarjetas");
  revalidatePath("/inicio");
}
