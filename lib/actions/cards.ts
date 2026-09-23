"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ZodIssue } from "zod";
import { requireUserId } from "@/lib/auth/requireUser";
import { cardsContent } from "@/lib/content/cards";
import {
  archiveCreditCard,
  createCreditCard,
  CreditCardLimitError,
  CreditCardNotFoundError,
  CreditCardPaymentCurrencyError,
  CreditCardPaymentUnavailableError,
  restoreCreditCard,
  updateCreditCard,
} from "@/lib/services/creditCardService";
import {
  createCreditCardSchema,
  creditCardIdSchema,
  updateCreditCardSchema,
} from "@/lib/validators/creditCard";
import type { CreditCardFormState } from "@/features/cards/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): CreditCardFormState["fieldErrors"] {
  const fieldErrors: NonNullable<CreditCardFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "name") {
      fieldErrors.name =
        issue.code === "too_small"
          ? cardsContent.errors.emptyName
          : cardsContent.errors.nameTooLong;
    } else if (key === "brand") {
      fieldErrors.brand = cardsContent.errors.emptyBrand;
    } else if (key === "lastFour") {
      fieldErrors.lastFour = cardsContent.errors.invalidLastFour;
    } else if (key === "currency") {
      fieldErrors.currency = cardsContent.errors.emptyCurrency;
    } else if (key === "creditLimit") {
      fieldErrors.creditLimit =
        issue.code === "too_small"
          ? cardsContent.errors.emptyLimit
          : cardsContent.errors.invalidLimit;
    } else if (key === "closeDay") {
      fieldErrors.closeDay = cardsContent.errors.emptyCloseDay;
    } else if (key === "dueDay") {
      fieldErrors.dueDay = cardsContent.errors.emptyDueDay;
    } else if (key === "paymentAccountId") {
      fieldErrors.paymentAccountId = cardsContent.errors.emptyPaymentAccount;
    } else if (key === "notes") {
      fieldErrors.notes = cardsContent.errors.notesTooLong;
    }
  }
  return fieldErrors;
}

function cardPayload(formData: FormData) {
  return {
    name: readString(formData, "name"),
    brand: readString(formData, "brand"),
    lastFour: readString(formData, "lastFour"),
    currency: readString(formData, "currency") || "ARS",
    creditLimit: readString(formData, "creditLimit"),
    closeDay: readString(formData, "closeDay"),
    dueDay: readString(formData, "dueDay"),
    paymentAccountId: readString(formData, "paymentAccountId"),
    notes: readString(formData, "notes"),
  };
}

/** Creates a credit card for the signed-in user. */
export async function createCreditCardAction(
  _prev: CreditCardFormState | undefined,
  formData: FormData,
): Promise<CreditCardFormState> {
  const userId = await requireUserId();
  const parsed = createCreditCardSchema.safeParse(cardPayload(formData));
  if (!parsed.success) {
    return {
      error: cardsContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await createCreditCard(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof CreditCardLimitError) {
      return { error: cardsContent.errors.tooMany };
    }
    if (error instanceof CreditCardPaymentCurrencyError) {
      return { error: cardsContent.errors.paymentCurrency };
    }
    if (error instanceof CreditCardPaymentUnavailableError) {
      return { error: cardsContent.errors.paymentUnavailable };
    }
    return { error: cardsContent.errors.generic };
  }

  revalidatePath("/tarjetas");
  redirect("/tarjetas");
}

/** Updates an owned credit card. */
export async function updateCreditCardAction(
  _prev: CreditCardFormState | undefined,
  formData: FormData,
): Promise<CreditCardFormState> {
  const userId = await requireUserId();
  const parsed = updateCreditCardSchema.safeParse({
    id: readString(formData, "id"),
    ...cardPayload(formData),
  });
  if (!parsed.success) {
    return {
      error: cardsContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await updateCreditCard(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof CreditCardNotFoundError) {
      return { error: cardsContent.errors.notFound };
    }
    if (error instanceof CreditCardPaymentCurrencyError) {
      return { error: cardsContent.errors.paymentCurrency };
    }
    if (error instanceof CreditCardPaymentUnavailableError) {
      return { error: cardsContent.errors.paymentUnavailable };
    }
    return { error: cardsContent.errors.generic };
  }

  revalidatePath("/tarjetas");
  revalidatePath(`/tarjetas/${parsed.data.id}`);
  redirect("/tarjetas");
}

/** Archives an owned card (no delete). */
export async function archiveCreditCardAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = creditCardIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await archiveCreditCard(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof CreditCardNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePath("/tarjetas");
  revalidatePath(`/tarjetas/${parsed.data.id}`);
  redirect("/tarjetas");
}

/** Restores an archived owned card. */
export async function restoreCreditCardAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = creditCardIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await restoreCreditCard(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof CreditCardNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePath("/tarjetas");
  revalidatePath(`/tarjetas/${parsed.data.id}`);
  redirect("/tarjetas");
}
