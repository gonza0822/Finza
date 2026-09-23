import { getSequelize } from "@/lib/db/sequelize";
import { getModels } from "@/lib/db/models";
import type {
  AccountType,
  AjusteDirection,
  Currency,
  LedgerType,
  MovementStatus,
  PaymentMean,
} from "@/lib/db/enums";
import { centsToDecimalString, decimalToCents } from "@/lib/money/parse";
import type { CreateMovementInput } from "@/lib/validators/movement";
import type { PublicMovement } from "@/features/movements/types";
import { getMoneyAccount } from "@/lib/services/moneyAccountService";
import {
  confirmedDebtCents,
  CreditCardNotFoundError,
  ensureCycleForOccurredOn,
  findActiveOwnedCard,
} from "@/lib/services/creditCardService";
import {
  createInstallmentsForCreditGasto,
  installmentCountsByMovement,
  syncInstallmentStatuses,
  voidInstallmentsForMovement,
} from "@/lib/services/installmentService";
import { Op, Transaction } from "sequelize";

const MAX_MOVEMENTS_PER_USER = 5000;
const AJUSTE_SLUG = "ajuste";
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MovementAccountUnavailableError extends Error {
  constructor() {
    super("MOVEMENT_ACCOUNT_UNAVAILABLE");
    this.name = "MovementAccountUnavailableError";
  }
}

export class MovementCardUnavailableError extends Error {
  constructor() {
    super("MOVEMENT_CARD_UNAVAILABLE");
    this.name = "MovementCardUnavailableError";
  }
}

export class MovementCategoryUnavailableError extends Error {
  constructor() {
    super("MOVEMENT_CATEGORY_UNAVAILABLE");
    this.name = "MovementCategoryUnavailableError";
  }
}

export class MovementLimitError extends Error {
  constructor() {
    super("MOVEMENT_LIMIT");
    this.name = "MovementLimitError";
  }
}

export class MovementSameAccountError extends Error {
  constructor() {
    super("MOVEMENT_SAME_ACCOUNT");
    this.name = "MovementSameAccountError";
  }
}

export class MovementCurrencyMismatchError extends Error {
  constructor() {
    super("MOVEMENT_CURRENCY_MISMATCH");
    this.name = "MovementCurrencyMismatchError";
  }
}

export class MovementConversionSameCurrencyError extends Error {
  constructor() {
    super("MOVEMENT_CONVERSION_SAME_CURRENCY");
    this.name = "MovementConversionSameCurrencyError";
  }
}

export class MovementNoAjusteError extends Error {
  constructor() {
    super("MOVEMENT_NO_AJUSTE");
    this.name = "MovementNoAjusteError";
  }
}

export class MovementPaymentExceedsDebtError extends Error {
  constructor() {
    super("MOVEMENT_PAYMENT_EXCEEDS_DEBT");
    this.name = "MovementPaymentExceedsDebtError";
  }
}

export class MovementNotFoundError extends Error {
  constructor() {
    super("MOVEMENT_NOT_FOUND");
    this.name = "MovementNotFoundError";
  }
}

export class MovementAlreadyVoidedError extends Error {
  constructor() {
    super("MOVEMENT_ALREADY_VOIDED");
    this.name = "MovementAlreadyVoidedError";
  }
}

interface MovementRow {
  id: string;
  type: LedgerType;
  status: MovementStatus;
  occurredOn: string;
  amount: string | number;
  currency: Currency;
  accountId: string | null;
  creditCardId: string | null;
  cycleId: string | null;
  counterAccountId: string | null;
  counterAmount: string | number | null;
  counterCurrency: Currency | null;
  ajusteDirection: AjusteDirection | null;
  categoryId: string | null;
  notes: string | null;
  moneyAccount?: { name: string } | null;
  creditCard?: { name: string } | null;
  counterAccount?: { name: string } | null;
  category?: { name: string } | null;
}

interface OwnedAccountRow {
  id: string;
  type: AccountType;
  currency: Currency;
}

interface CategoryRow {
  id: string;
  kind: string;
}

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

/** Infers the book medio from the account kind. */
function paymentMeanFromAccountType(type: AccountType): PaymentMean {
  if (type === "efectivo") {
    return "efectivo";
  }
  if (type === "banco") {
    return "debito";
  }
  return "transferencia";
}

function asIsoDate(value: string): string {
  return value.slice(0, 10);
}

function toPublic(row: MovementRow): PublicMovement {
  return {
    id: row.id,
    type: row.type,
    status: row.status,
    occurredOn: asIsoDate(row.occurredOn),
    amountCents: decimalToCents(row.amount),
    currency: row.currency,
    accountId: row.accountId,
    accountName: row.moneyAccount?.name ?? "",
    creditCardId: row.creditCardId,
    creditCardName: row.creditCard?.name ?? null,
    counterAccountId: row.counterAccountId,
    counterAccountName: row.counterAccount?.name ?? null,
    counterAmountCents:
      row.counterAmount === null || row.counterAmount === undefined
        ? null
        : decimalToCents(row.counterAmount),
    counterCurrency: row.counterCurrency,
    ajusteDirection: row.ajusteDirection,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? null,
    notes: row.notes,
    installmentCount: 1,
  };
}

function listIncludes() {
  const { MoneyAccount, Category, CreditCard } = getModels();
  return [
    { model: MoneyAccount, attributes: ["name"], required: false },
    { model: MoneyAccount, as: "counterAccount", attributes: ["name"], required: false },
    { model: CreditCard, attributes: ["name"], required: false },
    { model: Category, attributes: ["name"], required: false },
  ];
}

/** Lists the signed-in user's book rows (including anulado), newest date first. */
export async function listMovements(userId: string): Promise<PublicMovement[]> {
  const { Movement } = getModels();
  const rows = await Movement.findAll({
    where: { userId },
    include: listIncludes(),
    order: [
      ["occurredOn", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  const mapped = rows.map((row) => toPublic(row.get({ plain: true }) as MovementRow));
  const counts = await installmentCountsByMovement(mapped.map((row) => row.id));
  return mapped.map((row) => ({
    ...row,
    installmentCount: counts.get(row.id) ?? 1,
  }));
}

/** Book rows that touch an owned account as origin or destination. */
export async function listMovementsForAccount(
  userId: string,
  accountId: string,
): Promise<PublicMovement[] | null> {
  const account = await getMoneyAccount(userId, accountId);
  if (!account) {
    return null;
  }
  const { Movement } = getModels();
  const rows = await Movement.findAll({
    where: {
      userId,
      [Op.or]: [{ accountId }, { counterAccountId: accountId }],
    },
    include: listIncludes(),
    order: [
      ["occurredOn", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  const mapped = rows.map((row) => toPublic(row.get({ plain: true }) as MovementRow));
  const counts = await installmentCountsByMovement(mapped.map((row) => row.id));
  return mapped.map((row) => ({
    ...row,
    installmentCount: counts.get(row.id) ?? 1,
  }));
}

async function loadCreated(id: string): Promise<PublicMovement> {
  const { Movement } = getModels();
  const withNames = await Movement.findByPk(id, { include: listIncludes() });
  if (!withNames) {
    throw new MovementNotFoundError();
  }
  return {
    ...toPublic(withNames.get({ plain: true }) as MovementRow),
    installmentCount: (await installmentCountsByMovement([id])).get(id) ?? 1,
  };
}

async function assertUnderLimit(userId: string, transaction: Transaction): Promise<void> {
  const { Movement } = getModels();
  const count = await Movement.count({ where: { userId }, transaction });
  if (count >= MAX_MOVEMENTS_PER_USER) {
    throw new MovementLimitError();
  }
}

async function findActiveOwnedAccount(
  userId: string,
  accountId: string,
  transaction: Transaction,
): Promise<OwnedAccountRow> {
  if (!isUuid(accountId)) {
    throw new MovementAccountUnavailableError();
  }
  const { MoneyAccount } = getModels();
  const account = await MoneyAccount.findOne({
    where: { id: accountId, userId, archivedAt: null },
    transaction,
    lock: Transaction.LOCK.UPDATE,
  });
  if (!account) {
    throw new MovementAccountUnavailableError();
  }
  return account.get({ plain: true }) as OwnedAccountRow;
}

async function findActiveCategory(
  categoryId: string,
  expectedKind: "gasto" | "ingreso",
  transaction: Transaction,
): Promise<CategoryRow> {
  if (!isUuid(categoryId)) {
    throw new MovementCategoryUnavailableError();
  }
  const { Category } = getModels();
  const category = await Category.findOne({
    where: { id: categoryId, archivedAt: null },
    transaction,
  });
  if (!category) {
    throw new MovementCategoryUnavailableError();
  }
  const categoryRow = category.get({ plain: true }) as CategoryRow;
  if (categoryRow.kind !== expectedKind) {
    throw new MovementCategoryUnavailableError();
  }
  return categoryRow;
}

/** Posts a confirmed ledger row for the signed-in user. */
export async function createMovement(
  userId: string,
  input: CreateMovementInput,
): Promise<PublicMovement> {
  const sequelize = getSequelize();
  const created = await sequelize.transaction(async (transaction) => {
    return persistLedgerMovement(userId, input, transaction);
  });
  return loadCreated(created.get("id") as string);
}

/** Writes a ledger row inside an existing transaction (recurrence confirm). */
export async function persistLedgerMovement(
  userId: string,
  input: CreateMovementInput,
  transaction: Transaction,
) {
  await assertUnderLimit(userId, transaction);
  switch (input.type) {
    case "gasto":
      if (input.paidWith === "tarjeta") {
        return createCreditGasto(userId, input, transaction);
      }
      return createAccountConsumption(userId, input, transaction);
    case "ingreso":
      return createAccountConsumption(userId, input, transaction);
    case "transferencia":
      return createTransfer(userId, input, transaction);
    case "conversion":
      return createConversion(userId, input, transaction);
    case "ajuste":
      return createAjuste(userId, input, transaction);
    case "pago_tarjeta":
      return createCardPayment(userId, input, transaction);
  }
}

async function createAccountConsumption(
  userId: string,
  input: Extract<CreateMovementInput, { type: "ingreso" } | { type: "gasto"; paidWith: "cuenta" }>,
  transaction: Transaction,
) {
  const { Movement } = getModels();
  const accountRow = await findActiveOwnedAccount(userId, input.accountId, transaction);
  const categoryRow = await findActiveCategory(input.categoryId, input.type, transaction);
  return Movement.create(
    {
      id: crypto.randomUUID(),
      userId,
      type: input.type,
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: input.amount,
      currency: accountRow.currency,
      accountId: accountRow.id,
      creditCardId: null,
      cycleId: null,
      counterAccountId: null,
      counterAmount: null,
      counterCurrency: null,
      ajusteDirection: null,
      categoryId: categoryRow.id,
      paymentMean: paymentMeanFromAccountType(accountRow.type),
      notes: input.notes ?? null,
    },
    { transaction },
  );
}

async function createCreditGasto(
  userId: string,
  input: Extract<CreateMovementInput, { type: "gasto"; paidWith: "tarjeta" }>,
  transaction: Transaction,
) {
  let card;
  try {
    card = await findActiveOwnedCard(userId, input.creditCardId, transaction);
  } catch (error: unknown) {
    if (error instanceof CreditCardNotFoundError) {
      throw new MovementCardUnavailableError();
    }
    throw error;
  }
  const categoryRow = await findActiveCategory(input.categoryId, "gasto", transaction);
  const firstCycle = await ensureCycleForOccurredOn(card, input.occurredOn, transaction);
  const movementId = crypto.randomUUID();
  const { Movement } = getModels();
  const created = await Movement.create(
    {
      id: movementId,
      userId,
      type: "gasto",
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: input.amount,
      currency: card.currency,
      accountId: null,
      creditCardId: card.id,
      cycleId: firstCycle.id,
      counterAccountId: null,
      counterAmount: null,
      counterCurrency: null,
      ajusteDirection: null,
      categoryId: categoryRow.id,
      paymentMean: "credito",
      notes: input.notes ?? null,
    },
    { transaction },
  );
  await createInstallmentsForCreditGasto(
    card,
    movementId,
    input.amount,
    input.installmentCount,
    input.occurredOn,
    transaction,
  );
  return created;
}

async function createCardPayment(
  userId: string,
  input: Extract<CreateMovementInput, { type: "pago_tarjeta" }>,
  transaction: Transaction,
) {
  let card;
  try {
    card = await findActiveOwnedCard(userId, input.creditCardId, transaction);
  } catch (error: unknown) {
    if (error instanceof CreditCardNotFoundError) {
      throw new MovementCardUnavailableError();
    }
    throw error;
  }
  const accountRow = await findActiveOwnedAccount(userId, input.accountId, transaction);
  if (accountRow.currency !== card.currency) {
    throw new MovementCurrencyMismatchError();
  }
  const debtCents = await confirmedDebtCents(userId, card.id, transaction);
  if (decimalToCents(input.amount) > debtCents) {
    throw new MovementPaymentExceedsDebtError();
  }
  const { Movement } = getModels();
  const created = await Movement.create(
    {
      id: crypto.randomUUID(),
      userId,
      type: "pago_tarjeta",
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: input.amount,
      currency: card.currency,
      accountId: accountRow.id,
      creditCardId: card.id,
      cycleId: null,
      counterAccountId: null,
      counterAmount: null,
      counterCurrency: null,
      ajusteDirection: null,
      categoryId: null,
      paymentMean: paymentMeanFromAccountType(accountRow.type),
      notes: input.notes ?? null,
    },
    { transaction },
  );
  await syncInstallmentStatuses(card.id, userId, transaction);
  return created;
}

async function createTransfer(
  userId: string,
  input: Extract<CreateMovementInput, { type: "transferencia" }>,
  transaction: Transaction,
) {
  if (input.accountId === input.counterAccountId) {
    throw new MovementSameAccountError();
  }
  const origin = await findActiveOwnedAccount(userId, input.accountId, transaction);
  const dest = await findActiveOwnedAccount(userId, input.counterAccountId, transaction);
  if (origin.currency !== dest.currency) {
    throw new MovementCurrencyMismatchError();
  }
  const { Movement } = getModels();
  return Movement.create(
    {
      id: crypto.randomUUID(),
      userId,
      type: "transferencia",
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: input.amount,
      currency: origin.currency,
      accountId: origin.id,
      creditCardId: null,
      cycleId: null,
      counterAccountId: dest.id,
      counterAmount: input.amount,
      counterCurrency: dest.currency,
      ajusteDirection: null,
      categoryId: null,
      paymentMean: "transferencia",
      notes: input.notes ?? null,
    },
    { transaction },
  );
}

async function createConversion(
  userId: string,
  input: Extract<CreateMovementInput, { type: "conversion" }>,
  transaction: Transaction,
) {
  if (input.accountId === input.counterAccountId) {
    throw new MovementSameAccountError();
  }
  const origin = await findActiveOwnedAccount(userId, input.accountId, transaction);
  const dest = await findActiveOwnedAccount(userId, input.counterAccountId, transaction);
  if (origin.currency === dest.currency) {
    throw new MovementConversionSameCurrencyError();
  }
  const { Movement } = getModels();
  return Movement.create(
    {
      id: crypto.randomUUID(),
      userId,
      type: "conversion",
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: input.amount,
      currency: origin.currency,
      accountId: origin.id,
      creditCardId: null,
      cycleId: null,
      counterAccountId: dest.id,
      counterAmount: input.counterAmount,
      counterCurrency: dest.currency,
      ajusteDirection: null,
      categoryId: null,
      paymentMean: "transferencia",
      notes: input.notes ?? null,
    },
    { transaction },
  );
}

async function createAjuste(
  userId: string,
  input: Extract<CreateMovementInput, { type: "ajuste" }>,
  transaction: Transaction,
) {
  const origin = await findActiveOwnedAccount(userId, input.accountId, transaction);
  const current = await getMoneyAccount(userId, origin.id);
  if (!current) {
    throw new MovementAccountUnavailableError();
  }
  const observedCents = decimalToCents(input.observedBalance);
  const delta = observedCents - current.balanceCents;
  if (delta === 0) {
    throw new MovementNoAjusteError();
  }
  const { Movement, Category } = getModels();
  const category = await Category.findOne({
    where: { slug: AJUSTE_SLUG, kind: "ajuste", archivedAt: null },
    transaction,
  });
  if (!category) {
    throw new MovementCategoryUnavailableError();
  }
  return Movement.create(
    {
      id: crypto.randomUUID(),
      userId,
      type: "ajuste",
      status: "confirmado",
      occurredOn: input.occurredOn,
      amount: centsToDecimalString(Math.abs(delta)),
      currency: origin.currency,
      accountId: origin.id,
      creditCardId: null,
      cycleId: null,
      counterAccountId: null,
      counterAmount: null,
      counterCurrency: null,
      ajusteDirection: delta > 0 ? "sube" : "baja",
      categoryId: category.get("id") as string,
      paymentMean: paymentMeanFromAccountType(origin.type),
      notes: input.notes,
    },
    { transaction },
  );
}

/** Marks an owned confirmed movement as anulado so it stops moving saldos. */
export async function voidMovement(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new MovementNotFoundError();
  }
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { Movement } = getModels();
    const found = await Movement.findOne({
      where: { id, userId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new MovementNotFoundError();
    }
    const status = found.get("status") as MovementStatus;
    if (status === "anulado") {
      throw new MovementAlreadyVoidedError();
    }
    await found.update({ status: "anulado" }, { transaction });
    const { RecurrenceOccurrence } = getModels();
    await RecurrenceOccurrence.update(
      { status: "programada", movementId: null },
      { where: { movementId: id }, transaction },
    );
    const type = found.get("type") as LedgerType;
    const cardId = found.get("creditCardId") as string | null;
    if (!cardId) {
      return;
    }
    if (type === "gasto") {
      await voidInstallmentsForMovement(id, transaction);
    }
    await syncInstallmentStatuses(cardId, userId, transaction);
  });
}
