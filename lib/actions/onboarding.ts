"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { APP_HOME_PATH } from "@/lib/auth/paths";
import { accountsContent } from "@/lib/content/accounts";
import { cardsContent } from "@/lib/content/cards";
import { planificacionContent } from "@/lib/content/planificacion";
import { SETUP_COOKIE, SETUP_COOKIE_MAX_AGE } from "@/lib/onboarding/setupCookie";
import {
  createMoneyAccount,
  MoneyAccountLimitError,
} from "@/lib/services/moneyAccountService";
import {
  createCreditCard,
  CreditCardLimitError,
  CreditCardPaymentCurrencyError,
  CreditCardPaymentUnavailableError,
} from "@/lib/services/creditCardService";
import {
  RecurrenceAccountUnavailableError,
  RecurrenceCardUnavailableError,
  RecurrenceCategoryUnavailableError,
  RecurrenceEndsBeforeStartError,
  RecurrenceLimitError,
  RecurrenceNotFoundError,
  createRecurrenceRule,
} from "@/lib/services/recurrenceService";
import { createMoneyAccountSchema } from "@/lib/validators/moneyAccount";
import { createCreditCardSchema } from "@/lib/validators/creditCard";
import { createRecurrenceRuleSchema } from "@/lib/validators/recurrence";
import type { MoneyAccountFormState } from "@/features/accounts/types";
import type { CreditCardFormState } from "@/features/cards/types";
import type { RecurrenceFormState } from "@/features/planificacion/types";
import type { ZodIssue } from "zod";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

async function markSetupInProgress(): Promise<void> {
  const jar = await cookies();
  jar.set(SETUP_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: SETUP_COOKIE_MAX_AGE,
    secure: process.env.NODE_ENV === "production",
  });
}

async function clearSetupCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SETUP_COOKIE);
}

function mapAccountFieldErrors(issues: ZodIssue[]): MoneyAccountFormState["fieldErrors"] {
  const fieldErrors: NonNullable<MoneyAccountFormState["fieldErrors"]> = {};
  for (const issue of issues) {
    const key = String(issue.path[0] ?? "");
    if (key === "name") {
      fieldErrors.name =
        issue.code === "too_small"
          ? accountsContent.errors.emptyName
          : accountsContent.errors.nameTooLong;
    } else if (key === "type") {
      fieldErrors.type = accountsContent.errors.emptyType;
    } else if (key === "currency") {
      fieldErrors.currency = accountsContent.errors.emptyCurrency;
    } else if (key === "initialBalance") {
      fieldErrors.initialBalance =
        issue.code === "too_small"
          ? accountsContent.errors.emptyBalance
          : accountsContent.errors.invalidBalance;
    } else if (key === "notes") {
      fieldErrors.notes = accountsContent.errors.notesTooLong;
    }
  }
  return fieldErrors;
}

function recurrencePayload(formData: FormData) {
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

/** First-run account, then optional card step. */
export async function onboardingCreateAccountAction(
  _prev: MoneyAccountFormState | undefined,
  formData: FormData,
): Promise<MoneyAccountFormState> {
  const userId = await requireUserId();
  const parsed = createMoneyAccountSchema.safeParse({
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    currency: readString(formData, "currency") || "ARS",
    initialBalance: readString(formData, "initialBalance"),
    notes: readString(formData, "notes"),
  });
  if (!parsed.success) {
    return {
      error: accountsContent.errors.invalidInput,
      fieldErrors: mapAccountFieldErrors(parsed.error.issues),
    };
  }
  try {
    await createMoneyAccount(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof MoneyAccountLimitError) {
      return { error: accountsContent.errors.tooMany };
    }
    return { error: accountsContent.errors.generic };
  }
  await markSetupInProgress();
  revalidatePath("/cuentas");
  revalidatePath("/inicio");
  redirect("/onboarding/tarjeta");
}

/** Optional first card during setup. */
export async function onboardingCreateCardAction(
  _prev: CreditCardFormState | undefined,
  formData: FormData,
): Promise<CreditCardFormState> {
  const userId = await requireUserId();
  const parsed = createCreditCardSchema.safeParse({
    name: readString(formData, "name"),
    brand: readString(formData, "brand"),
    lastFour: readString(formData, "lastFour"),
    currency: readString(formData, "currency") || "ARS",
    creditLimit: readString(formData, "creditLimit"),
    closeDay: readString(formData, "closeDay"),
    dueDay: readString(formData, "dueDay"),
    paymentAccountId: readString(formData, "paymentAccountId"),
    notes: readString(formData, "notes"),
  });
  if (!parsed.success) {
    return { error: cardsContent.errors.invalidInput };
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
  await markSetupInProgress();
  revalidatePath("/tarjetas");
  revalidatePath("/inicio");
  redirect("/onboarding/recurrente");
}

/** Optional first recurrence during setup. */
export async function onboardingCreateRecurrenceAction(
  _prev: RecurrenceFormState | undefined,
  formData: FormData,
): Promise<RecurrenceFormState> {
  const userId = await requireUserId();
  const parsed = createRecurrenceRuleSchema.safeParse(recurrencePayload(formData));
  if (!parsed.success) {
    return { error: planificacionContent.errors.invalidInput };
  }
  try {
    await createRecurrenceRule(userId, parsed.data);
  } catch (error: unknown) {
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
  await clearSetupCookie();
  revalidatePath("/planificacion");
  revalidatePath("/inicio");
  redirect(APP_HOME_PATH);
}

/** Leaves optional setup steps and opens Inicio. */
export async function skipOnboardingAction(): Promise<void> {
  await requireUserId();
  await clearSetupCookie();
  revalidatePath("/inicio");
  redirect(APP_HOME_PATH);
}
