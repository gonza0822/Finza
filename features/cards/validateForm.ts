import { CARD_BRANDS, CURRENCIES } from "@/lib/db/enums";
import { cardsContent } from "@/lib/content/cards";
import { parseMoneyToCents } from "@/lib/money/parse";
import type { CreditCardFormState } from "@/features/cards/types";

function isCycleDay(value: string): boolean {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 28;
}

/** Client-side field checks; native HTML validation is off. */
export function validateCardFields(formData: FormData): NonNullable<
  CreditCardFormState["fieldErrors"]
> {
  const errors: NonNullable<CreditCardFormState["fieldErrors"]> = {};
  const name = String(formData.get("name") ?? "").trim();
  const brand = String(formData.get("brand") ?? "");
  const lastFour = String(formData.get("lastFour") ?? "").trim();
  const currency = String(formData.get("currency") ?? "");
  const creditLimit = String(formData.get("creditLimit") ?? "").trim();
  const closeDay = String(formData.get("closeDay") ?? "");
  const dueDay = String(formData.get("dueDay") ?? "");
  const paymentAccountId = String(formData.get("paymentAccountId") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");

  if (!name) {
    errors.name = cardsContent.errors.emptyName;
  } else if (name.length > 80) {
    errors.name = cardsContent.errors.nameTooLong;
  }

  if (!CARD_BRANDS.includes(brand as (typeof CARD_BRANDS)[number])) {
    errors.brand = cardsContent.errors.emptyBrand;
  }

  if (!lastFour) {
    errors.lastFour = cardsContent.errors.emptyLastFour;
  } else if (!/^\d{4}$/.test(lastFour)) {
    errors.lastFour = cardsContent.errors.invalidLastFour;
  }

  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    errors.currency = cardsContent.errors.emptyCurrency;
  }

  if (!creditLimit) {
    errors.creditLimit = cardsContent.errors.emptyLimit;
  } else {
    const cents = parseMoneyToCents(creditLimit);
    if (cents === null) {
      errors.creditLimit = cardsContent.errors.invalidLimit;
    } else if (cents <= 0) {
      errors.creditLimit = cardsContent.errors.zeroLimit;
    }
  }

  if (!isCycleDay(closeDay)) {
    errors.closeDay = cardsContent.errors.emptyCloseDay;
  }
  if (!isCycleDay(dueDay)) {
    errors.dueDay = cardsContent.errors.emptyDueDay;
  }
  if (!paymentAccountId) {
    errors.paymentAccountId = cardsContent.errors.emptyPaymentAccount;
  }
  if (notes.length > 500) {
    errors.notes = cardsContent.errors.notesTooLong;
  }

  return errors;
}

export function hasCardFieldErrors(
  errors: NonNullable<CreditCardFormState["fieldErrors"]>,
): boolean {
  return Boolean(
    errors.name ||
      errors.brand ||
      errors.lastFour ||
      errors.currency ||
      errors.creditLimit ||
      errors.closeDay ||
      errors.dueDay ||
      errors.paymentAccountId ||
      errors.notes,
  );
}
