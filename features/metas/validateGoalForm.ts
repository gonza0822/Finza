import { CURRENCIES } from "@/lib/db/enums";
import { isYearMonth } from "@/lib/dates/isoDate";
import { parseMoneyToCents } from "@/lib/money/parse";
import { metasContent } from "@/lib/content/metas";
import type { GoalFormState } from "@/features/metas/types";

/** Client-side field checks; native HTML validation is off. */
export function validateGoalFields(
  formData: FormData,
  mode: "create" | "edit",
): NonNullable<GoalFormState["fieldErrors"]> {
  const errors: NonNullable<GoalFormState["fieldErrors"]> = {};
  const name = String(formData.get("name") ?? "").trim();
  const targetAmount = String(formData.get("targetAmount") ?? "").trim();
  const assignedAmount = String(formData.get("assignedAmount") ?? "").trim();
  const currency = String(formData.get("currency") ?? "");
  const targetMonth = String(formData.get("targetMonth") ?? "").trim();

  if (!name) {
    errors.name = metasContent.errors.emptyName;
  }
  if (!targetAmount) {
    errors.targetAmount = metasContent.errors.emptyTarget;
  } else {
    const cents = parseMoneyToCents(targetAmount);
    if (cents === null || cents <= 0) {
      errors.targetAmount = metasContent.errors.invalidTarget;
    }
  }
  if (mode === "create" && assignedAmount) {
    const cents = parseMoneyToCents(assignedAmount);
    if (cents === null || cents < 0) {
      errors.assignedAmount = metasContent.errors.invalidAssigned;
    }
  }
  if (!isYearMonth(targetMonth)) {
    errors.targetMonth = metasContent.errors.emptyMonth;
  }
  if (!CURRENCIES.includes(currency as (typeof CURRENCIES)[number])) {
    errors.currency = metasContent.errors.emptyCurrency;
  }

  return errors;
}

export function hasGoalFieldErrors(errors: NonNullable<GoalFormState["fieldErrors"]>): boolean {
  return Boolean(
    errors.name ||
      errors.targetAmount ||
      errors.assignedAmount ||
      errors.currency ||
      errors.targetMonth,
  );
}
