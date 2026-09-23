import { ACCOUNT_TYPES, CURRENCIES } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { parseMoneyToCents } from "@/lib/money/parse";
import type { MoneyAccountFormState } from "@/features/accounts/types";

/** Client-side field checks; native HTML validation is off. */
export function validateAccountFields(formData: FormData): NonNullable<
  MoneyAccountFormState["fieldErrors"]
> {
  const errors: NonNullable<MoneyAccountFormState["fieldErrors"]> = {};
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const currency = String(formData.get("currency") ?? "");
  const initialBalance = String(formData.get("initialBalance") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");

  if (!name) {
    errors.name = accountsContent.errors.emptyName;
  } else if (name.length > 80) {
    errors.name = accountsContent.errors.nameTooLong;
  }

  if (!ACCOUNT_TYPES.includes(type as (typeof ACCOUNT_TYPES)[number])) {
    errors.type = accountsContent.errors.emptyType;
  }

  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    errors.currency = accountsContent.errors.emptyCurrency;
  }

  if (!initialBalance) {
    errors.initialBalance = accountsContent.errors.emptyBalance;
  } else if (parseMoneyToCents(initialBalance) === null) {
    errors.initialBalance = accountsContent.errors.invalidBalance;
  }

  if (notes.length > 500) {
    errors.notes = accountsContent.errors.notesTooLong;
  }

  return errors;
}

export function hasAccountFieldErrors(
  errors: NonNullable<MoneyAccountFormState["fieldErrors"]>,
): boolean {
  return Boolean(
    errors.name || errors.type || errors.currency || errors.initialBalance || errors.notes,
  );
}
