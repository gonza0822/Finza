import type { AjusteDirection, LedgerType, MovementStatus } from "@/lib/db/enums";
import { decimalToCents } from "@/lib/money/parse";

export interface LedgerMovementImpact {
  type: LedgerType;
  status: MovementStatus;
  accountId: string | null;
  amount: string | number;
  counterAccountId: string | null;
  counterAmount: string | number | null;
  ajusteDirection: AjusteDirection | null;
}

function addCents(delta: Map<string, number>, accountId: string, cents: number) {
  delta.set(accountId, (delta.get(accountId) ?? 0) + cents);
}

/** Applies a confirmed row to running account deltas. Amounts stay positive; sign comes from type. */
export function applyConfirmedLedgerImpact(
  delta: Map<string, number>,
  row: LedgerMovementImpact,
): void {
  if (row.status !== "confirmado") {
    return;
  }
  const cents = decimalToCents(row.amount);
  switch (row.type) {
    case "ingreso":
      if (row.accountId) {
        addCents(delta, row.accountId, cents);
      }
      return;
    case "gasto":
      if (row.accountId) {
        addCents(delta, row.accountId, -cents);
      }
      return;
    case "ajuste":
      if (row.accountId) {
        addCents(delta, row.accountId, row.ajusteDirection === "sube" ? cents : -cents);
      }
      return;
    case "transferencia":
      if (row.accountId) {
        addCents(delta, row.accountId, -cents);
      }
      if (row.counterAccountId) {
        addCents(delta, row.counterAccountId, cents);
      }
      return;
    case "conversion":
      if (row.accountId) {
        addCents(delta, row.accountId, -cents);
      }
      if (row.counterAccountId) {
        addCents(delta, row.counterAccountId, decimalToCents(row.counterAmount));
      }
      return;
    case "pago_tarjeta":
      if (row.accountId) {
        addCents(delta, row.accountId, -cents);
      }
      return;
    default: {
      const _never: never = row.type;
      return _never;
    }
  }
}

/** Marks every account touched by a book row, including voided ones (locks currency). */
export function markAccountsWithLedgers(
  accounts: Set<string>,
  row: Pick<LedgerMovementImpact, "accountId" | "counterAccountId">,
): void {
  if (row.accountId) {
    accounts.add(row.accountId);
  }
  if (row.counterAccountId) {
    accounts.add(row.counterAccountId);
  }
}
