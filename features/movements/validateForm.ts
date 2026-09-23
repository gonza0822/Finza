import { CONSUMPTION_TYPES, LEDGER_TYPES, MAX_INSTALLMENT_COUNT, type LedgerType } from "@/lib/db/enums";
import { isIsoCalendarDate, localTodayIso } from "@/lib/dates/isoDate";
import { movementsContent } from "@/lib/content/movements";
import { parseMoneyToCents } from "@/lib/money/parse";
import type { MovementFormState } from "@/features/movements/types";

function isLedgerType(value: string): value is LedgerType {
  return LEDGER_TYPES.includes(value as LedgerType);
}

function isConsumption(type: string): boolean {
  return CONSUMPTION_TYPES.includes(type as (typeof CONSUMPTION_TYPES)[number]);
}

function validateDate(occurredOn: string, errors: NonNullable<MovementFormState["fieldErrors"]>) {
  if (!occurredOn) {
    errors.occurredOn = movementsContent.errors.emptyDate;
  } else if (!isIsoCalendarDate(occurredOn)) {
    errors.occurredOn = movementsContent.errors.invalidDate;
  } else if (occurredOn > localTodayIso()) {
    errors.occurredOn = movementsContent.errors.futureDate;
  }
}

function validatePositiveAmount(
  raw: string,
  field: "amount" | "counterAmount",
  errors: NonNullable<MovementFormState["fieldErrors"]>,
) {
  if (!raw) {
    errors[field] = movementsContent.errors.emptyAmount;
    return;
  }
  const cents = parseMoneyToCents(raw);
  if (cents === null) {
    errors[field] = movementsContent.errors.invalidAmount;
  } else if (cents <= 0) {
    errors[field] = movementsContent.errors.zeroAmount;
  }
}

/** Client-side field checks; native HTML validation is off. */
export function validateMovementFields(formData: FormData): NonNullable<
  MovementFormState["fieldErrors"]
> {
  const errors: NonNullable<MovementFormState["fieldErrors"]> = {};
  const type = String(formData.get("type") ?? "");
  const paidWith = String(formData.get("paidWith") ?? "cuenta");
  const accountId = String(formData.get("accountId") ?? "").trim();
  const creditCardId = String(formData.get("creditCardId") ?? "").trim();
  const counterAccountId = String(formData.get("counterAccountId") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const counterAmount = String(formData.get("counterAmount") ?? "").trim();
  const observedBalance = String(formData.get("observedBalance") ?? "").trim();
  const occurredOn = String(formData.get("occurredOn") ?? "").trim();
  const notes = String(formData.get("notes") ?? "");
  const installmentCountRaw = String(formData.get("installmentCount") ?? "").trim();

  if (!isLedgerType(type)) {
    errors.type = movementsContent.errors.emptyType;
  }
  validateDate(occurredOn, errors);

  if (type === "gasto" && paidWith === "tarjeta") {
    if (!creditCardId) {
      errors.creditCardId = movementsContent.errors.emptyCard;
    }
    if (!categoryId) {
      errors.categoryId = movementsContent.errors.emptyCategory;
    }
    validatePositiveAmount(amount, "amount", errors);
    if (installmentCountRaw) {
      const count = Number(installmentCountRaw);
      if (!Number.isInteger(count) || count < 1 || count > MAX_INSTALLMENT_COUNT) {
        errors.installmentCount = movementsContent.errors.invalidInstallments;
      }
    }
    if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
    return errors;
  }

  if (type === "pago_tarjeta") {
    if (!creditCardId) {
      errors.creditCardId = movementsContent.errors.emptyCard;
    }
    if (!accountId) {
      errors.accountId = movementsContent.errors.emptyAccount;
    }
    validatePositiveAmount(amount, "amount", errors);
    if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
    return errors;
  }

  if (!accountId) {
    errors.accountId = movementsContent.errors.emptyAccount;
  }

  if (isConsumption(type)) {
    if (!categoryId) {
      errors.categoryId = movementsContent.errors.emptyCategory;
    }
    validatePositiveAmount(amount, "amount", errors);
    if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
    return errors;
  }

  if (type === "transferencia") {
    if (!counterAccountId) {
      errors.counterAccountId = movementsContent.errors.emptyCounterAccount;
    } else if (counterAccountId === accountId) {
      errors.counterAccountId = movementsContent.errors.sameAccount;
    }
    validatePositiveAmount(amount, "amount", errors);
    if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
    return errors;
  }

  if (type === "conversion") {
    if (!counterAccountId) {
      errors.counterAccountId = movementsContent.errors.emptyCounterAccount;
    } else if (counterAccountId === accountId) {
      errors.counterAccountId = movementsContent.errors.sameAccount;
    }
    validatePositiveAmount(amount, "amount", errors);
    validatePositiveAmount(counterAmount, "counterAmount", errors);
    if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
    return errors;
  }

  if (type === "ajuste") {
    if (!observedBalance) {
      errors.observedBalance = movementsContent.errors.emptyObserved;
    } else if (parseMoneyToCents(observedBalance) === null) {
      errors.observedBalance = movementsContent.errors.invalidObserved;
    }
    if (!notes.trim()) {
      errors.notes = movementsContent.errors.emptyReason;
    } else if (notes.length > 500) {
      errors.notes = movementsContent.errors.notesTooLong;
    }
  }

  return errors;
}

export function hasMovementFieldErrors(
  errors: NonNullable<MovementFormState["fieldErrors"]>,
): boolean {
  return Boolean(
    errors.type ||
      errors.accountId ||
      errors.creditCardId ||
      errors.counterAccountId ||
      errors.categoryId ||
      errors.amount ||
      errors.counterAmount ||
      errors.observedBalance ||
      errors.occurredOn ||
      errors.notes ||
      errors.installmentCount,
  );
}
