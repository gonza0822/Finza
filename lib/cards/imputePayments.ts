import type { InstallmentStatus } from "@/lib/db/enums";

export interface ImputableInstallment {
  id: string;
  creditCardId: string;
  closeOn: string;
  createdAtMs: number;
  installmentNumber: number;
  amountCents: number;
  status: InstallmentStatus;
}

/** FIFO remaining per installment after ordered card payments (skips voided rows). */
export function remainingCentsByInstallment(
  installments: ImputableInstallment[],
  paymentCentsInOrder: number[],
  cardId: string,
): Map<string, number> {
  const owned = installments
    .filter((row) => row.creditCardId === cardId && row.status !== "anulada")
    .sort((left, right) => {
      const byClose = left.closeOn.localeCompare(right.closeOn);
      if (byClose !== 0) {
        return byClose;
      }
      const byCreated = left.createdAtMs - right.createdAtMs;
      if (byCreated !== 0) {
        return byCreated;
      }
      return left.installmentNumber - right.installmentNumber;
    });

  const remaining = new Map<string, number>();
  let payIndex = 0;
  let payLeft = paymentCentsInOrder[0] ?? 0;

  for (const row of owned) {
    let left = row.amountCents;
    while (left > 0 && payIndex < paymentCentsInOrder.length) {
      const take = Math.min(left, payLeft);
      left -= take;
      payLeft -= take;
      if (payLeft === 0) {
        payIndex += 1;
        payLeft = paymentCentsInOrder[payIndex] ?? 0;
      }
    }
    remaining.set(row.id, left);
  }

  return remaining;
}

/** Due now is unpaid closed-cycle installments; open cycle is this statement only. */
export function dueNowAndOpenFromInstallments(
  installments: ImputableInstallment[],
  remaining: Map<string, number>,
  cardId: string,
  today: string,
  openCloseOn: string,
): { dueNowCents: number; openCycleConsumptionCents: number } {
  let dueNowCents = 0;
  let openCycleConsumptionCents = 0;
  for (const row of installments) {
    if (row.creditCardId !== cardId || row.status === "anulada") {
      continue;
    }
    if (row.closeOn < today) {
      dueNowCents += remaining.get(row.id) ?? row.amountCents;
    } else if (row.closeOn === openCloseOn) {
      openCycleConsumptionCents += row.amountCents;
    }
  }
  return { dueNowCents, openCycleConsumptionCents };
}

/** Display status from remaining amount and whether the cycle has already closed. */
export function installmentStatusFromRemaining(
  remainingCents: number,
  closeOn: string,
  today: string,
): Exclude<InstallmentStatus, "anulada"> {
  if (remainingCents <= 0) {
    return "pagada";
  }
  if (closeOn < today) {
    return "en_resumen";
  }
  return "pendiente";
}
