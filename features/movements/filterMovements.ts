import { LEDGER_TYPES, type LedgerType } from "@/lib/db/enums";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { parseMoneyToCents } from "@/lib/money/parse";
import { movementsContent } from "@/lib/content/movements";
import type { PublicMovement } from "@/features/movements/types";
import { accountCell, amountCell } from "@/features/movements/display";

export const NONE_CATEGORY = "none";

export interface MovementFilters {
  amountMin: string;
  amountMax: string;
  accountId: string;
  categoryId: string;
  type: "" | LedgerType;
  dateFrom: string;
  dateTo: string;
}

export const emptyMovementFilters: MovementFilters = {
  amountMin: "",
  amountMax: "",
  accountId: "",
  categoryId: "",
  type: "",
  dateFrom: "",
  dateTo: "",
};

/** Folds accents and extra spaces so “jose” matches “José”. */
function foldSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

/** Digits only, so “1500000” matches “1.500.000,00”. */
function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

/** Search haystack for one movement: visible cells plus note and ISO date. */
function searchBlob(movement: PublicMovement): { text: string; digits: string } {
  const amount = amountCell(movement);
  const parts = [
    formatIsoDateEsAr(movement.occurredOn),
    movement.occurredOn,
    movementsContent.types[movement.type],
    movement.status === "anulado" ? movementsContent.voidedBadge : "",
    movement.categoryName ?? "",
    accountCell(movement),
    amount.text,
    String(Math.abs(movement.amountCents) / 100),
    movement.installmentCount > 1 ? movementsContent.installmentsSuffix(movement.installmentCount) : "",
    movement.counterAmountCents !== null ? String(Math.abs(movement.counterAmountCents) / 100) : "",
    movement.notes ?? "",
  ];
  const joined = parts.join(" ");
  return { text: foldSearch(joined), digits: digitsOnly(joined) };
}

/** How many structured filters are set (search is separate). */
export function countActiveFilters(filters: MovementFilters): number {
  let count = 0;
  if (filters.amountMin.trim()) count += 1;
  if (filters.amountMax.trim()) count += 1;
  if (filters.accountId) count += 1;
  if (filters.categoryId) count += 1;
  if (filters.type) count += 1;
  if (filters.dateFrom) count += 1;
  if (filters.dateTo) count += 1;
  return count;
}

function amountInRange(cents: number, minCents: number | null, maxCents: number | null): boolean {
  const abs = Math.abs(cents);
  if (minCents !== null && abs < minCents) {
    return false;
  }
  if (maxCents !== null && abs > maxCents) {
    return false;
  }
  return true;
}

/** Applies search plus structured filters to the loaded book. */
export function filterMovements(
  movements: PublicMovement[],
  query: string,
  filters: MovementFilters,
): PublicMovement[] {
  const needle = foldSearch(query);
  const needleDigits = digitsOnly(query);
  const minCents = parseMoneyToCents(filters.amountMin);
  const maxCents = parseMoneyToCents(filters.amountMax);
  const typeFilter = LEDGER_TYPES.includes(filters.type as LedgerType)
    ? (filters.type as LedgerType)
    : "";

  return movements.filter((movement) => {
    if (needle) {
      const blob = searchBlob(movement);
      const textHit = blob.text.includes(needle);
      const digitHit = needleDigits.length >= 3 && blob.digits.includes(needleDigits);
      if (!textHit && !digitHit) {
        return false;
      }
    }
    if (typeFilter && movement.type !== typeFilter) {
      return false;
    }
    if (filters.accountId) {
      const onOrigin = movement.accountId === filters.accountId;
      const onCounter = movement.counterAccountId === filters.accountId;
      const onCard = movement.creditCardId === filters.accountId;
      if (!onOrigin && !onCounter && !onCard) {
        return false;
      }
    }
    if (filters.categoryId === NONE_CATEGORY) {
      if (movement.categoryId) {
        return false;
      }
    } else if (filters.categoryId && movement.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.dateFrom && movement.occurredOn < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && movement.occurredOn > filters.dateTo) {
      return false;
    }
    if (minCents !== null || maxCents !== null) {
      const primary = amountInRange(movement.amountCents, minCents, maxCents);
      const counter =
        movement.counterAmountCents !== null &&
        amountInRange(movement.counterAmountCents, minCents, maxCents);
      if (!primary && !counter) {
        return false;
      }
    }
    return true;
  });
}
