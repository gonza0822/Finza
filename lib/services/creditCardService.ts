import { Op, Transaction } from "sequelize";
import { getSequelize } from "@/lib/db/sequelize";
import { getModels } from "@/lib/db/models";
import type { CardBrand, Currency, InstallmentStatus, LedgerType, MovementStatus } from "@/lib/db/enums";
import { closeOnForOccurredOn, dueOnForClose, nextCloseOn, nextDueOn } from "@/lib/cards/cycleDates";
import {
  dueNowAndOpenFromInstallments,
  remainingCentsByInstallment,
  type ImputableInstallment,
} from "@/lib/cards/imputePayments";
import { localTodayIso } from "@/lib/dates/isoDate";
import { decimalToCents } from "@/lib/money/parse";
import type { CreateCreditCardInput, UpdateCreditCardInput } from "@/lib/validators/creditCard";
import type { PublicCreditCard, PublicInstallmentPurchase } from "@/features/cards/types";

const MAX_CARDS_PER_USER = 20;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class CreditCardNotFoundError extends Error {
  constructor() {
    super("CREDIT_CARD_NOT_FOUND");
    this.name = "CreditCardNotFoundError";
  }
}

export class CreditCardLimitError extends Error {
  constructor() {
    super("CREDIT_CARD_LIMIT");
    this.name = "CreditCardLimitError";
  }
}

export class CreditCardPaymentUnavailableError extends Error {
  constructor() {
    super("CREDIT_CARD_PAYMENT_UNAVAILABLE");
    this.name = "CreditCardPaymentUnavailableError";
  }
}

export class CreditCardPaymentCurrencyError extends Error {
  constructor() {
    super("CREDIT_CARD_PAYMENT_CURRENCY");
    this.name = "CreditCardPaymentCurrencyError";
  }
}

interface CreditCardRow {
  id: string;
  userId: string;
  name: string;
  brand: CardBrand;
  lastFour: string;
  currency: Currency;
  creditLimit: string | number;
  closeDay: number;
  dueDay: number;
  paymentAccountId: string;
  notes: string | null;
  sortOrder: number;
  archivedAt: Date | null;
  paymentAccount?: { name: string } | null;
}

interface CardLedgerRow {
  creditCardId: string | null;
  type: LedgerType;
  status: MovementStatus;
  amount: string | number;
  cycleId: string | null;
  occurredOn: string | Date;
  createdAt: Date | string;
}

interface CycleRow {
  id: string;
  creditCardId: string;
  closeOn: string | Date;
  dueOn: string | Date;
}

interface InstallmentRow {
  id: string;
  movementId: string;
  creditCardId: string;
  cycleId: string;
  installmentNumber: number;
  installmentCount: number;
  amount: string | number;
  status: InstallmentStatus;
  createdAt: Date | string;
  cycle?: { closeOn: string | Date; dueOn: string | Date };
  movement?: {
    id: string;
    occurredOn: string | Date;
    status?: string;
    notes?: string | null;
    category?: { name: string } | null;
  };
}

interface PaymentAccountRow {
  id: string;
  currency: Currency;
  archivedAt: Date | null;
}

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
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

/** Confirmed credit gastos minus confirmed card payments for one card. */
export function debtCentsFromLedger(rows: CardLedgerRow[], cardId: string): number {
  let debt = 0;
  for (const row of rows) {
    if (row.creditCardId !== cardId || row.status !== "confirmado") {
      continue;
    }
    const cents = decimalToCents(row.amount);
    if (row.type === "gasto") {
      debt += cents;
    } else if (row.type === "pago_tarjeta") {
      debt -= cents;
    }
  }
  return debt;
}

/** Remaining of closed cycles after FIFO payments (what is due now). */
export function dueNowCentsFromLedger(
  rows: CardLedgerRow[],
  cycles: CycleRow[],
  cardId: string,
  today: string,
): { dueNowCents: number; openCycleConsumptionCents: number } {
  const cardCycles = cycles
    .filter((cycle) => cycle.creditCardId === cardId)
    .map((cycle) => ({
      id: cycle.id,
      closeOn: asIsoDate(cycle.closeOn),
      consumptionCents: 0,
    }))
    .sort((left, right) => left.closeOn.localeCompare(right.closeOn));

  for (const row of rows) {
    if (row.creditCardId !== cardId || row.status !== "confirmado" || row.type !== "gasto" || !row.cycleId) {
      continue;
    }
    const cycle = cardCycles.find((item) => item.id === row.cycleId);
    if (cycle) {
      cycle.consumptionCents += decimalToCents(row.amount);
    }
  }

  const orderedPayments = rows
    .filter(
      (row) =>
        row.creditCardId === cardId &&
        row.status === "confirmado" &&
        row.type === "pago_tarjeta",
    )
    .sort((left, right) => {
      const byDate = asIsoDate(left.occurredOn).localeCompare(asIsoDate(right.occurredOn));
      if (byDate !== 0) {
        return byDate;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })
    .map((row) => decimalToCents(row.amount));

  let payIndex = 0;
  let payLeft = orderedPayments[0] ?? 0;
  let dueNowCents = 0;
  let openCycleConsumptionCents = 0;

  for (const cycle of cardCycles) {
    let remaining = cycle.consumptionCents;
    while (remaining > 0 && payIndex < orderedPayments.length) {
      const take = Math.min(remaining, payLeft);
      remaining -= take;
      payLeft -= take;
      if (payLeft === 0) {
        payIndex += 1;
        payLeft = orderedPayments[payIndex] ?? 0;
      }
    }
    if (cycle.closeOn < today) {
      dueNowCents += remaining;
    } else {
      openCycleConsumptionCents += cycle.consumptionCents;
    }
  }

  return { dueNowCents, openCycleConsumptionCents };
}

function toPublic(
  row: CreditCardRow,
  extras: {
    debtCents: number;
    dueNowCents: number;
    openCycleConsumptionCents: number;
    hasLedgers: boolean;
    remainingPurchases: PublicInstallmentPurchase[];
    installmentPurchases: PublicInstallmentPurchase[];
    today: string;
  },
): PublicCreditCard {
  const creditLimitCents = decimalToCents(row.creditLimit);
  const availableCents = Math.max(0, creditLimitCents - extras.debtCents);
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    lastFour: row.lastFour,
    currency: row.currency,
    creditLimitCents,
    closeDay: row.closeDay,
    dueDay: row.dueDay,
    paymentAccountId: row.paymentAccountId,
    paymentAccountName: row.paymentAccount?.name ?? "",
    notes: row.notes,
    sortOrder: row.sortOrder,
    archived: Boolean(row.archivedAt),
    hasLedgers: extras.hasLedgers,
    debtCents: extras.debtCents,
    availableCents,
    overLimit: extras.debtCents > creditLimitCents,
    openCycleConsumptionCents: extras.openCycleConsumptionCents,
    dueNowCents: extras.dueNowCents,
    nextCloseOn: nextCloseOn(extras.today, row.closeDay),
    nextDueOn: nextDueOn(extras.today, row.closeDay, row.dueDay),
    remainingPurchases: extras.remainingPurchases,
    installmentPurchases: extras.installmentPurchases,
  };
}

async function loadLedger(userId: string): Promise<{
  movements: CardLedgerRow[];
  cycles: CycleRow[];
  installments: InstallmentRow[];
}> {
  const { Movement, CreditCard, CreditCardCycle, Installment, Category } = getModels();
  const cards = await CreditCard.findAll({
    where: { userId },
    attributes: ["id"],
  });
  const cardIds = cards.map((card) => card.get("id") as string);
  const [movements, cycles, installments] = await Promise.all([
    Movement.findAll({
      where: { userId, creditCardId: { [Op.ne]: null } },
      attributes: [
        "creditCardId",
        "type",
        "status",
        "amount",
        "cycleId",
        "occurredOn",
        "createdAt",
      ],
    }),
    cardIds.length === 0
      ? Promise.resolve([])
      : CreditCardCycle.findAll({
          where: { creditCardId: { [Op.in]: cardIds } },
        }),
    cardIds.length === 0
      ? Promise.resolve([])
      : Installment.findAll({
          where: { creditCardId: { [Op.in]: cardIds } },
          include: [
            { model: CreditCardCycle, as: "cycle", attributes: ["closeOn", "dueOn"], required: true },
            {
              model: Movement,
              attributes: ["id", "occurredOn", "status", "notes"],
              required: false,
              include: [{ model: Category, attributes: ["name"], required: false }],
            },
          ],
        }),
  ]);
  return {
    movements: movements.map((row) => row.get({ plain: true }) as CardLedgerRow),
    cycles: cycles.map((row) => {
      const plain = row.get({ plain: true }) as CycleRow;
      return { ...plain, closeOn: asIsoDate(plain.closeOn), dueOn: asIsoDate(plain.dueOn) };
    }),
    installments: installments.map((row) => row.get({ plain: true }) as InstallmentRow),
  };
}

function orderedPaymentCents(rows: CardLedgerRow[], cardId: string): number[] {
  return rows
    .filter(
      (row) =>
        row.creditCardId === cardId &&
        row.status === "confirmado" &&
        row.type === "pago_tarjeta",
    )
    .sort((left, right) => {
      const byDate = asIsoDate(left.occurredOn).localeCompare(asIsoDate(right.occurredOn));
      if (byDate !== 0) {
        return byDate;
      }
      return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    })
    .map((row) => decimalToCents(row.amount));
}

function createdAtMs(value: Date | string | undefined): number {
  if (!value) {
    return 0;
  }
  return new Date(value).getTime();
}

function toImputable(row: InstallmentRow): ImputableInstallment {
  return {
    id: row.id,
    creditCardId: row.creditCardId,
    closeOn: asIsoDate(row.cycle?.closeOn ?? ""),
    createdAtMs: createdAtMs(row.createdAt),
    installmentNumber: row.installmentNumber,
    amountCents: decimalToCents(row.amount),
    status: row.status,
  };
}

function upcomingPurchases(
  rows: InstallmentRow[],
  remaining: Map<string, number>,
  cardId: string,
): PublicInstallmentPurchase[] {
  const byMovement = new Map<string, PublicInstallmentPurchase>();
  for (const row of rows) {
    if (row.creditCardId !== cardId || row.status === "anulada") {
      continue;
    }
    if (row.movement?.status === "anulado") {
      continue;
    }
    const remainingCents = remaining.get(row.id) ?? decimalToCents(row.amount);
    const installment = {
      id: row.id,
      number: row.installmentNumber,
      count: row.installmentCount,
      amountCents: decimalToCents(row.amount),
      remainingCents,
      closeOn: asIsoDate(row.cycle?.closeOn ?? ""),
      dueOn: asIsoDate(row.cycle?.dueOn ?? ""),
    };
    const existing = byMovement.get(row.movementId);
    if (existing) {
      existing.installments.push(installment);
      existing.totalCents += installment.amountCents;
      existing.remainingCents += remainingCents;
      continue;
    }
    byMovement.set(row.movementId, {
      movementId: row.movementId,
      categoryName: row.movement?.category?.name ?? null,
      notes: row.movement?.notes?.trim() ? row.movement.notes.trim() : null,
      occurredOn: asIsoDate(row.movement?.occurredOn ?? ""),
      count: row.installmentCount,
      totalCents: installment.amountCents,
      remainingCents,
      nextDueOn: installment.dueOn,
      installments: [installment],
    });
  }

  return [...byMovement.values()]
    .filter((purchase) => purchase.remainingCents > 0)
    .map((purchase) => {
      purchase.installments.sort((left, right) => left.number - right.number);
      const nextUnpaid = purchase.installments.find((item) => item.remainingCents > 0);
      return {
        ...purchase,
        nextDueOn: nextUnpaid?.dueOn ?? purchase.installments[0]?.dueOn ?? purchase.nextDueOn,
      };
    })
    .sort((left, right) => right.occurredOn.localeCompare(left.occurredOn));
}

function decorate(
  row: CreditCardRow,
  movements: CardLedgerRow[],
  cycles: CycleRow[],
  installments: InstallmentRow[],
  today: string,
): PublicCreditCard {
  const debtCents = debtCentsFromLedger(movements, row.id);
  const imputable = installments.map(toImputable);
  const cardHasInstallments = imputable.some(
    (item) => item.creditCardId === row.id && item.status !== "anulada",
  );
  const remaining = remainingCentsByInstallment(
    imputable,
    orderedPaymentCents(movements, row.id),
    row.id,
  );
  const nextClose = nextCloseOn(today, row.closeDay);
  const fromInstallments = dueNowAndOpenFromInstallments(
    imputable,
    remaining,
    row.id,
    today,
    nextClose,
  );
  const fromLedger = dueNowCentsFromLedger(movements, cycles, row.id, today);
  const { dueNowCents, openCycleConsumptionCents } = cardHasInstallments
    ? fromInstallments
    : fromLedger;
  const hasLedgers = movements.some((item) => item.creditCardId === row.id);
  const remainingPurchases = upcomingPurchases(installments, remaining, row.id);
  return toPublic(row, {
    debtCents,
    dueNowCents,
    openCycleConsumptionCents,
    hasLedgers,
    remainingPurchases,
    installmentPurchases: remainingPurchases.filter((purchase) => purchase.count > 1),
    today,
  });
}

async function findOwned(userId: string, id: string) {
  if (!isUuid(id)) {
    return null;
  }
  const { CreditCard, MoneyAccount } = getModels();
  return CreditCard.findOne({
    where: { id, userId },
    include: [{ model: MoneyAccount, as: "paymentAccount", attributes: ["name"], required: false }],
  });
}

async function findPaymentAccount(
  userId: string,
  accountId: string,
  currency: Currency,
  transaction: Transaction,
  allowArchived: boolean,
): Promise<PaymentAccountRow> {
  if (!isUuid(accountId)) {
    throw new CreditCardPaymentUnavailableError();
  }
  const { MoneyAccount } = getModels();
  const account = await MoneyAccount.findOne({
    where: { id: accountId, userId },
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  if (!account) {
    throw new CreditCardPaymentUnavailableError();
  }
  const row = account.get({ plain: true }) as PaymentAccountRow;
  if (!allowArchived && row.archivedAt) {
    throw new CreditCardPaymentUnavailableError();
  }
  if (row.currency !== currency) {
    throw new CreditCardPaymentCurrencyError();
  }
  return row;
}

/** Lists the signed-in user's cards with computed debt and cycle figures. */
export async function listCreditCards(userId: string): Promise<PublicCreditCard[]> {
  const { CreditCard, MoneyAccount } = getModels();
  const today = localTodayIso();
  const [rows, ledger] = await Promise.all([
    CreditCard.findAll({
      where: { userId },
      include: [
        { model: MoneyAccount, as: "paymentAccount", attributes: ["name"], required: false },
      ],
      order: [
        ["archivedAt", "ASC"],
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    }),
    loadLedger(userId),
  ]);
  return rows.map((row) =>
    decorate(
      row.get({ plain: true }) as CreditCardRow,
      ledger.movements,
      ledger.cycles,
      ledger.installments,
      today,
    ),
  );
}

/** Active (not archived) cards the user can post a consumption or payment against. */
export async function listActiveCreditCards(userId: string): Promise<PublicCreditCard[]> {
  const cards = await listCreditCards(userId);
  return cards.filter((card) => !card.archived);
}

/** Returns one owned card or null (invalid id and missing look the same). */
export async function getCreditCard(userId: string, id: string): Promise<PublicCreditCard | null> {
  const found = await findOwned(userId, id);
  if (!found) {
    return null;
  }
  const today = localTodayIso();
  const ledger = await loadLedger(userId);
  return decorate(
    found.get({ plain: true }) as CreditCardRow,
    ledger.movements,
    ledger.cycles,
    ledger.installments,
    today,
  );
}

/** Active owned card locked for a posting transaction. */
export async function findActiveOwnedCard(
  userId: string,
  cardId: string,
  transaction: Transaction,
): Promise<CreditCardRow> {
  if (!isUuid(cardId)) {
    throw new CreditCardNotFoundError();
  }
  const { CreditCard } = getModels();
  const card = await CreditCard.findOne({
    where: { id: cardId, userId, archivedAt: null },
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  if (!card) {
    throw new CreditCardNotFoundError();
  }
  return card.get({ plain: true }) as CreditCardRow;
}

/** Finds or creates the billing cycle for an already computed close date. */
export async function ensureCycleForCloseOn(
  card: Pick<CreditCardRow, "id" | "closeDay" | "dueDay">,
  closeOn: string,
  transaction: Transaction,
): Promise<{ id: string; closeOn: string; dueOn: string }> {
  const { CreditCardCycle } = getModels();
  const dueOn = dueOnForClose(closeOn, card.closeDay, card.dueDay);
  const existing = await CreditCardCycle.findOne({
    where: { creditCardId: card.id, closeOn },
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  if (existing) {
    const row = existing.get({ plain: true }) as CycleRow;
    return { id: row.id, closeOn: asIsoDate(row.closeOn), dueOn: asIsoDate(row.dueOn) };
  }
  const created = await CreditCardCycle.create(
    {
      id: crypto.randomUUID(),
      creditCardId: card.id,
      closeOn,
      dueOn,
    },
    { transaction },
  );
  return { id: created.get("id") as string, closeOn, dueOn };
}

/** Finds or creates the billing cycle that owns a purchase date. */
export async function ensureCycleForOccurredOn(
  card: Pick<CreditCardRow, "id" | "closeDay" | "dueDay">,
  occurredOn: string,
  transaction: Transaction,
): Promise<{ id: string; closeOn: string; dueOn: string }> {
  return ensureCycleForCloseOn(card, closeOnForOccurredOn(occurredOn, card.closeDay), transaction);
}

/** Creates a credit card for the signed-in user. */
export async function createCreditCard(
  userId: string,
  input: CreateCreditCardInput,
): Promise<PublicCreditCard> {
  const sequelize = getSequelize();
  const createdId = await sequelize.transaction(async (transaction) => {
    const { CreditCard } = getModels();
    const count = await CreditCard.count({ where: { userId }, transaction });
    if (count >= MAX_CARDS_PER_USER) {
      throw new CreditCardLimitError();
    }
    await findPaymentAccount(userId, input.paymentAccountId, input.currency, transaction, false);
    const created = await CreditCard.create(
      {
        id: crypto.randomUUID(),
        userId,
        name: input.name,
        brand: input.brand,
        lastFour: input.lastFour,
        currency: input.currency,
        creditLimit: input.creditLimit,
        closeDay: input.closeDay,
        dueDay: input.dueDay,
        paymentAccountId: input.paymentAccountId,
        notes: input.notes ?? null,
        sortOrder: count,
        archivedAt: null,
      },
      { transaction },
    );
    return created.get("id") as string;
  });
  const card = await getCreditCard(userId, createdId);
  if (!card) {
    throw new CreditCardNotFoundError();
  }
  return card;
}

/** Updates an owned credit card. */
export async function updateCreditCard(
  userId: string,
  input: UpdateCreditCardInput,
): Promise<PublicCreditCard> {
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { CreditCard } = getModels();
    const found = await CreditCard.findOne({
      where: { id: input.id, userId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new CreditCardNotFoundError();
    }
    const current = found.get({ plain: true }) as CreditCardRow;
    const ledger = await loadLedger(userId);
    const hasLedgers = ledger.movements.some((item) => item.creditCardId === current.id);
    const currency = hasLedgers ? current.currency : input.currency;
    const allowArchived = input.paymentAccountId === current.paymentAccountId;
    await findPaymentAccount(userId, input.paymentAccountId, currency, transaction, allowArchived);
    await found.update(
      {
        name: input.name,
        brand: input.brand,
        lastFour: input.lastFour,
        currency,
        creditLimit: input.creditLimit,
        closeDay: input.closeDay,
        dueDay: input.dueDay,
        paymentAccountId: input.paymentAccountId,
        notes: input.notes ?? null,
      },
      { transaction },
    );
  });
  const card = await getCreditCard(userId, input.id);
  if (!card) {
    throw new CreditCardNotFoundError();
  }
  return card;
}

/** Confirmed debt of one card, locked inside a posting transaction. */
export async function confirmedDebtCents(
  userId: string,
  cardId: string,
  transaction: Transaction,
): Promise<number> {
  const { Movement } = getModels();
  const rows = await Movement.findAll({
    where: { userId, creditCardId: cardId, status: "confirmado" },
    attributes: ["type", "amount"],
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  let debt = 0;
  for (const row of rows) {
    const type = row.get("type") as LedgerType;
    const cents = decimalToCents(row.get("amount") as string | number);
    if (type === "gasto") {
      debt += cents;
    } else if (type === "pago_tarjeta") {
      debt -= cents;
    }
  }
  return debt;
}

/** Archives an owned card (no delete). */
export async function archiveCreditCard(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new CreditCardNotFoundError();
  }
  await found.update({ archivedAt: new Date() });
}

/** Restores an archived owned card. */
export async function restoreCreditCard(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new CreditCardNotFoundError();
  }
  await found.update({ archivedAt: null });
}
