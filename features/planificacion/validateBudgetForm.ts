import { CURRENCIES } from "@/lib/db/enums";
import { isYearMonth } from "@/lib/dates/isoDate";
import { parseMoneyToCents } from "@/lib/money/parse";
import { planificacionContent } from "@/lib/content/planificacion";
import type { BudgetFormState } from "@/features/planificacion/budgetTypes";

/** Client-side field checks; native HTML validation is off. */
export function validateBudgetFields(
  formData: FormData,
): NonNullable<BudgetFormState["fieldErrors"]> {
  const errors: NonNullable<BudgetFormState["fieldErrors"]> = {};
  const categoryId = String(formData.get("categoryId") ?? "").trim();
  const yearMonth = String(formData.get("yearMonth") ?? "").trim();
  const amount = String(formData.get("amount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "");

  if (!categoryId) {
    errors.categoryId = planificacionContent.budgetErrors.emptyCategory;
  }
  if (!isYearMonth(yearMonth)) {
    errors.yearMonth = planificacionContent.budgetErrors.emptyMonth;
  }
  if (!amount) {
    errors.amount = planificacionContent.budgetErrors.emptyAmount;
  } else {
    const cents = parseMoneyToCents(amount);
    if (cents === null || cents <= 0) {
      errors.amount = planificacionContent.budgetErrors.invalidAmount;
    }
  }
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    errors.currency = planificacionContent.budgetErrors.emptyCurrency;
  }

  return errors;
}

export function hasBudgetFieldErrors(
  errors: NonNullable<BudgetFormState["fieldErrors"]>,
): boolean {
  return Boolean(errors.categoryId || errors.yearMonth || errors.amount || errors.currency);
}
