"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { accountsContent } from "@/lib/content/accounts";
import {
  archiveMoneyAccount,
  createMoneyAccount,
  MoneyAccountLimitError,
  MoneyAccountNotFoundError,
  restoreMoneyAccount,
  updateMoneyAccount,
} from "@/lib/services/moneyAccountService";
import {
  createMoneyAccountSchema,
  moneyAccountIdSchema,
  updateMoneyAccountSchema,
} from "@/lib/validators/moneyAccount";
import type { ZodIssue } from "zod";
import type { MoneyAccountFormState } from "@/features/accounts/types";

function readString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

function mapFieldErrors(issues: ZodIssue[]): MoneyAccountFormState["fieldErrors"] {
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

/** Creates a money account for the signed-in user. */
export async function createMoneyAccountAction(
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
      fieldErrors: mapFieldErrors(parsed.error.issues),
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

  revalidatePath("/cuentas");
  redirect("/cuentas");
}

/** Updates an owned money account. */
export async function updateMoneyAccountAction(
  _prev: MoneyAccountFormState | undefined,
  formData: FormData,
): Promise<MoneyAccountFormState> {
  const userId = await requireUserId();
  const parsed = updateMoneyAccountSchema.safeParse({
    id: readString(formData, "id"),
    name: readString(formData, "name"),
    type: readString(formData, "type"),
    currency: readString(formData, "currency") || "ARS",
    initialBalance: readString(formData, "initialBalance"),
    notes: readString(formData, "notes"),
  });
  if (!parsed.success) {
    return {
      error: accountsContent.errors.invalidInput,
      fieldErrors: mapFieldErrors(parsed.error.issues),
    };
  }

  try {
    await updateMoneyAccount(userId, parsed.data);
  } catch (error: unknown) {
    if (error instanceof MoneyAccountNotFoundError) {
      return { error: accountsContent.errors.notFound };
    }
    return { error: accountsContent.errors.generic };
  }

  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${parsed.data.id}`);
  redirect("/cuentas");
}

/** Archives an owned account (no delete). */
export async function archiveMoneyAccountAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = moneyAccountIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await archiveMoneyAccount(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof MoneyAccountNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${parsed.data.id}`);
  redirect("/cuentas");
}

/** Restores an archived owned account. */
export async function restoreMoneyAccountAction(formData: FormData): Promise<void> {
  const userId = await requireUserId();
  const parsed = moneyAccountIdSchema.safeParse({ id: readString(formData, "id") });
  if (!parsed.success) {
    return;
  }
  try {
    await restoreMoneyAccount(userId, parsed.data.id);
  } catch (error: unknown) {
    if (error instanceof MoneyAccountNotFoundError) {
      return;
    }
    throw error;
  }
  revalidatePath("/cuentas");
  revalidatePath(`/cuentas/${parsed.data.id}`);
  redirect("/cuentas");
}
