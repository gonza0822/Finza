import { Transaction } from "sequelize";
import { closeOnAfterMonths } from "@/lib/cards/cycleDates";
import {
  installmentStatusFromRemaining,
  remainingCentsByInstallment,
  type ImputableInstallment,
} from "@/lib/cards/imputePayments";
import { splitInstallmentCents } from "@/lib/cards/splitInstallments";
import { getModels } from "@/lib/db/models";
import type { InstallmentStatus, LedgerType, MovementStatus } from "@/lib/db/enums";
import { localTodayIso } from "@/lib/dates/isoDate";
import { centsToDecimalString, decimalToCents } from "@/lib/money/parse";
import {
  ensureCycleForCloseOn,
  ensureCycleForOccurredOn,
} from "@/lib/services/creditCardService";

interface CardForInstallments {
  id: string;
  closeDay: number;
  dueDay: number;
}

interface InstallmentPlain {
  id: string;
  creditCardId: string;
  cycleId: string;
  installmentNumber: number;
  amount: string | number;
  status: InstallmentStatus;
  createdAt: Date | string;
}

interface PaymentPlain {
  type: LedgerType;
  status: MovementStatus;
  amount: string | number;
  occurredOn: string | Date;
  createdAt: Date | string;
}

function asIsoDate(value: string | Date): string {
  if (value instanceof Date) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
  return value.slice(0, 10);
}

/** Creates N installments on successive cycles; returns the first cycle for the gasto row. */
export async function createInstallmentsForCreditGasto(
  card: CardForInstallments,
  movementId: string,
  amountDecimal: string,
  installmentCount: number,
  occurredOn: string,
  transaction: Transaction,
): Promise<{ id: string; closeOn: string; dueOn: string }> {
  const first = await ensureCycleForOccurredOn(card, occurredOn, transaction);
  const parts = splitInstallmentCents(decimalToCents(amountDecimal), installmentCount);
  const today = localTodayIso();
  const { Installment } = getModels();
  const rows = [];
  for (let index = 0; index < installmentCount; index += 1) {
    const closeOn = index === 0 ? first.closeOn : closeOnAfterMonths(first.closeOn, index);
    const cycle =
      index === 0 ? first : await ensureCycleForCloseOn(card, closeOn, transaction);
    rows.push({
      id: crypto.randomUUID(),
      movementId,
      creditCardId: card.id,
      cycleId: cycle.id,
      installmentNumber: index + 1,
      installmentCount,
      amount: centsToDecimalString(parts[index] ?? 0),
      status: cycle.closeOn < today ? "en_resumen" : "pendiente",
    });
  }
  await Installment.bulkCreate(rows, { transaction });
  return first;
}

/** Marks installments of a voided credit gasto so they stop counting as debt. */
export async function voidInstallmentsForMovement(
  movementId: string,
  transaction: Transaction,
): Promise<void> {
  const { Installment } = getModels();
  await Installment.update(
    { status: "anulada" },
    { where: { movementId }, transaction },
  );
}

/** Recomputes pendiente / en_resumen / pagada after a payment or void on the card. */
export async function syncInstallmentStatuses(
  cardId: string,
  userId: string,
  transaction: Transaction,
): Promise<void> {
  const { Installment, CreditCardCycle, Movement } = getModels();
  const installmentRows = await Installment.findAll({
    where: { creditCardId: cardId },
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  const cycleIds = [
    ...new Set(installmentRows.map((row) => row.get("cycleId") as string)),
  ];
  const [cycleRows, paymentRows] = await Promise.all([
    cycleIds.length === 0
      ? Promise.resolve([])
      : CreditCardCycle.findAll({
          where: { id: cycleIds },
          attributes: ["id", "closeOn"],
          transaction,
        }),
    Movement.findAll({
      where: { userId, creditCardId: cardId, type: "pago_tarjeta", status: "confirmado" },
      attributes: ["type", "status", "amount", "occurredOn", "createdAt"],
      transaction,
      lock: Transaction.LOCK.UPDATE,
    }),
  ]);
  const closeOnByCycleId = new Map(
    cycleRows.map((row) => [row.get("id") as string, asIsoDate(row.get("closeOn") as string | Date)]),
  );

  const installments = installmentRows.map((row) => row.get({ plain: true }) as InstallmentPlain);
  const imputable: ImputableInstallment[] = installments.map((row) => ({
    id: row.id,
    creditCardId: row.creditCardId,
    closeOn: closeOnByCycleId.get(row.cycleId) ?? "",
    createdAtMs: new Date(row.createdAt).getTime(),
    installmentNumber: row.installmentNumber,
    amountCents: decimalToCents(row.amount),
    status: row.status,
  }));
  const payments = (paymentRows.map((row) => row.get({ plain: true }) as PaymentPlain)
    .sort((left, right) => {
      const byDate = asIsoDate(left.occurredOn).localeCompare(asIsoDate(right.occurredOn));
      if (byDate !== 0) {
        return byDate;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })
    .map((row) => decimalToCents(row.amount)));

  const remaining = remainingCentsByInstallment(imputable, payments, cardId);
  const today = localTodayIso();

  for (const row of installmentRows) {
    const plain = row.get({ plain: true }) as InstallmentPlain;
    if (plain.status === "anulada") {
      continue;
    }
    const next = installmentStatusFromRemaining(
      remaining.get(plain.id) ?? decimalToCents(plain.amount),
      closeOnByCycleId.get(plain.cycleId) ?? "",
      today,
    );
    if (next !== plain.status) {
      await row.update({ status: next }, { transaction });
    }
  }
}

/** Returns installmentCount per origin movement (1 when the purchase was a single payment). */
export async function installmentCountsByMovement(
  movementIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (movementIds.length === 0) {
    return counts;
  }
  const { Installment } = getModels();
  const rows = await Installment.findAll({
    where: { movementId: movementIds },
    attributes: ["movementId", "installmentCount"],
  });
  for (const row of rows) {
    const movementId = row.get("movementId") as string;
    const count = Number(row.get("installmentCount"));
    const current = counts.get(movementId) ?? 0;
    if (count > current) {
      counts.set(movementId, count);
    }
  }
  return counts;
}
