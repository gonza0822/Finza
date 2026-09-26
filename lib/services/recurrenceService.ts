import { Op, Transaction } from "sequelize";
import { getSequelize } from "@/lib/db/sequelize";
import { getModels } from "@/lib/db/models";
import type {
  RecurrenceClass,
  RecurrenceFrequency,
  RecurrenceKind,
  RecurrenceOccurrenceStatus,
  RecurrenceRuleStatus,
} from "@/lib/db/enums";
import { addYearMonths, localTodayIso, startOfYearMonth, yearMonthFromIso } from "@/lib/dates/isoDate";
import type { Currency } from "@/lib/db/enums";
import { usdCentsToArsCents } from "@/lib/money/fx";
import { centsToDecimalString, decimalToCents } from "@/lib/money/parse";
import { addMonthsIso, scheduledDatesInRange, startOfMonthIso } from "@/lib/recurrence/schedule";
import { persistLedgerMovement } from "@/lib/services/movementService";
import { findActiveOwnedCard, CreditCardNotFoundError } from "@/lib/services/creditCardService";
import {
  OfficialUsdRateError,
  getOfficialUsdSellRate,
  getOfficialUsdSellRateOrNull,
} from "@/lib/services/fxService";
import type { CreateRecurrenceRuleInput } from "@/lib/validators/recurrence";
import type { CreateMovementInput } from "@/lib/validators/movement";
import type {
  PublicRecurrenceOccurrence,
  PublicRecurrenceRule,
} from "@/features/planificacion/types";

const MAX_RULES_PER_USER = 100;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class RecurrenceLimitError extends Error {
  constructor() {
    super("RECURRENCE_LIMIT");
    this.name = "RecurrenceLimitError";
  }
}

export class RecurrenceNotFoundError extends Error {
  constructor() {
    super("RECURRENCE_NOT_FOUND");
    this.name = "RecurrenceNotFoundError";
  }
}

export class RecurrenceAccountUnavailableError extends Error {
  constructor() {
    super("RECURRENCE_ACCOUNT_UNAVAILABLE");
    this.name = "RecurrenceAccountUnavailableError";
  }
}

export class RecurrenceCardUnavailableError extends Error {
  constructor() {
    super("RECURRENCE_CARD_UNAVAILABLE");
    this.name = "RecurrenceCardUnavailableError";
  }
}

export class RecurrenceCategoryUnavailableError extends Error {
  constructor() {
    super("RECURRENCE_CATEGORY_UNAVAILABLE");
    this.name = "RecurrenceCategoryUnavailableError";
  }
}

export class RecurrenceEndsBeforeStartError extends Error {
  constructor() {
    super("RECURRENCE_ENDS_BEFORE_START");
    this.name = "RecurrenceEndsBeforeStartError";
  }
}

export class RecurrenceOccurrenceClosedError extends Error {
  constructor() {
    super("RECURRENCE_OCCURRENCE_CLOSED");
    this.name = "RecurrenceOccurrenceClosedError";
  }
}

export class RecurrenceQuoteCurrencyError extends Error {
  constructor() {
    super("RECURRENCE_QUOTE_CURRENCY");
    this.name = "RecurrenceQuoteCurrencyError";
  }
}

interface RuleRow {
  id: string;
  userId: string;
  name: string;
  kind: RecurrenceKind;
  ruleClass: RecurrenceClass;
  amount: string | number;
  amountCurrency: Currency;
  frequency: RecurrenceFrequency;
  dueDay: number;
  dueMonth: number | null;
  accountId: string | null;
  creditCardId: string | null;
  categoryId: string;
  startsOn: string | Date;
  endsOn: string | Date | null;
  status: RecurrenceRuleStatus;
  moneyAccount?: { name: string; currency?: "ARS" | "USD" } | null;
  creditCard?: { name: string; currency?: "ARS" | "USD" } | null;
  category?: { name: string } | null;
}

interface OccurrenceRow {
  id: string;
  recurrenceRuleId: string;
  scheduledOn: string | Date;
  amount: string | number;
  status: RecurrenceOccurrenceStatus;
  movementId: string | null;
  rule?: RuleRow;
  movement?: { amount: string | number } | null;
}

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function asIsoDate(value: string | Date): string {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayStatus(
  status: RecurrenceOccurrenceStatus,
  scheduledOn: string,
  today: string,
): RecurrenceOccurrenceStatus {
  if (status === "programada" && scheduledOn < today) {
    return "vencida";
  }
  return status;
}

function instrumentCurrency(row: RuleRow): Currency {
  return row.creditCard?.currency ?? row.moneyAccount?.currency ?? "ARS";
}

function quotedCurrency(row: RuleRow): Currency {
  return row.amountCurrency ?? "ARS";
}

function convertsUsdToArs(amountCurrency: Currency, ledgerCurrency: Currency): boolean {
  return amountCurrency === "USD" && ledgerCurrency === "ARS";
}

function ledgerCentsFromQuote(
  quotedCents: number,
  amountCurrency: Currency,
  ledgerCurrency: Currency,
  sellRate: number | null,
): { cents: number; currency: Currency } {
  if (!convertsUsdToArs(amountCurrency, ledgerCurrency)) {
    return { cents: quotedCents, currency: ledgerCurrency };
  }
  if (sellRate === null) {
    return { cents: quotedCents, currency: ledgerCurrency };
  }
  return { cents: usdCentsToArsCents(quotedCents, sellRate), currency: ledgerCurrency };
}

function toPublicRule(row: RuleRow, sellRate: number | null): PublicRecurrenceRule {
  const quotedCents = decimalToCents(row.amount);
  const amountCurrency = quotedCurrency(row);
  const currency = instrumentCurrency(row);
  const estimate = ledgerCentsFromQuote(quotedCents, amountCurrency, currency, sellRate);
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    ruleClass: row.ruleClass,
    amountCents: quotedCents,
    amountCurrency,
    currency,
    estimatedLedgerCents:
      convertsUsdToArs(amountCurrency, currency) && sellRate === null ? null : estimate.cents,
    frequency: row.frequency,
    dueDay: row.dueDay,
    dueMonth: row.dueMonth,
    accountId: row.accountId,
    accountName: row.moneyAccount?.name ?? null,
    creditCardId: row.creditCardId,
    creditCardName: row.creditCard?.name ?? null,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? "",
    startsOn: asIsoDate(row.startsOn),
    endsOn: row.endsOn ? asIsoDate(row.endsOn) : null,
    status: row.status,
  };
}

function toPublicOccurrence(
  row: OccurrenceRow,
  today: string,
  sellRate: number | null,
): PublicRecurrenceOccurrence {
  const scheduledOn = asIsoDate(row.scheduledOn);
  const status = row.status;
  const shown = displayStatus(status, scheduledOn, today);
  const rule = row.rule;
  const quotedCents = decimalToCents(row.amount);
  const amountCurrency = rule ? quotedCurrency(rule) : "ARS";
  const ledgerCurrency = rule ? instrumentCurrency(rule) : "ARS";
  const canAct = status === "programada" || shown === "vencida";
  const booked =
    status === "confirmada" && row.movement
      ? { cents: decimalToCents(row.movement.amount), currency: ledgerCurrency }
      : ledgerCentsFromQuote(quotedCents, amountCurrency, ledgerCurrency, sellRate);
  return {
    id: row.id,
    ruleId: row.recurrenceRuleId,
    ruleName: rule?.name ?? "",
    kind: rule?.kind ?? "gasto",
    scheduledOn,
    amountCents: booked.cents,
    quotedAmountCents: quotedCents,
    quotedCurrency: amountCurrency,
    convertsOnConfirm: canAct && convertsUsdToArs(amountCurrency, ledgerCurrency),
    status,
    displayStatus: shown,
    accountName: rule?.moneyAccount?.name ?? null,
    creditCardId: rule?.creditCardId ?? null,
    creditCardName: rule?.creditCard?.name ?? null,
    currency: booked.currency,
    canAct,
  };
}

async function findActiveOwnedAccount(
  userId: string,
  accountId: string,
  transaction: Transaction,
): Promise<{ currency: Currency }> {
  const { MoneyAccount } = getModels();
  const account = await MoneyAccount.findOne({
    where: { id: accountId, userId, archivedAt: null },
    transaction,
  });
  if (!account) {
    throw new RecurrenceAccountUnavailableError();
  }
  return { currency: account.get("currency") as Currency };
}

async function assertCategory(categoryId: string, kind: RecurrenceKind, transaction: Transaction) {
  const { Category } = getModels();
  const category = await Category.findOne({
    where: { id: categoryId, archivedAt: null, kind },
    transaction,
  });
  if (!category) {
    throw new RecurrenceCategoryUnavailableError();
  }
}

function payloadFromInput(userId: string, input: CreateRecurrenceRuleInput) {
  if (input.endsOn && input.endsOn < input.startsOn) {
    throw new RecurrenceEndsBeforeStartError();
  }
  const paidWithCard = input.paidWith === "tarjeta";
  return {
    userId,
    name: input.name,
    kind: input.kind,
    ruleClass: input.ruleClass,
    amount: input.amount,
    amountCurrency: input.amountCurrency,
    frequency: input.frequency,
    dueDay: input.dueDay,
    dueMonth: input.frequency === "anual" ? input.dueMonth : null,
    accountId: paidWithCard ? null : input.accountId,
    creditCardId: paidWithCard ? input.creditCardId : null,
    categoryId: input.categoryId,
    startsOn: input.startsOn,
    endsOn: input.endsOn ?? null,
  };
}

async function assertInstrument(
  userId: string,
  input: CreateRecurrenceRuleInput,
  transaction: Transaction,
) {
  await assertCategory(input.categoryId, input.kind, transaction);
  let currency: Currency;
  if (input.paidWith === "tarjeta") {
    try {
      const card = await findActiveOwnedCard(userId, input.creditCardId, transaction);
      currency = card.currency;
    } catch (error: unknown) {
      if (error instanceof CreditCardNotFoundError) {
        throw new RecurrenceCardUnavailableError();
      }
      throw error;
    }
  } else {
    const account = await findActiveOwnedAccount(userId, input.accountId, transaction);
    currency = account.currency;
  }
  if (input.amountCurrency === "ARS" && currency === "USD") {
    throw new RecurrenceQuoteCurrencyError();
  }
}

/** Materializes missing programmed occurrences from this month through 12 months. */
export async function ensureOccurrences(
  userId: string,
  transaction?: Transaction,
): Promise<void> {
  const run = async (t: Transaction) => {
    const { RecurrenceRule } = getModels();
    const rules = await RecurrenceRule.findAll({
      where: { userId, status: "activa" },
      transaction: t,
    });
    for (const rule of rules) {
      await seedRuleOccurrences(rule.get({ plain: true }) as RuleRow, t);
    }
  };
  if (transaction) {
    await run(transaction);
    return;
  }
  const sequelize = getSequelize();
  await sequelize.transaction(run);
}

async function seedRuleOccurrences(rule: RuleRow, transaction: Transaction): Promise<void> {
  if (rule.status !== "activa") {
    return;
  }
  const today = localTodayIso();
  const from = startOfMonthIso(today);
  const to = addMonthsIso(from, 12);
  const dates = scheduledDatesInRange(
    {
      frequency: rule.frequency,
      dueDay: rule.dueDay,
      dueMonth: rule.dueMonth,
      startsOn: asIsoDate(rule.startsOn),
      endsOn: rule.endsOn ? asIsoDate(rule.endsOn) : null,
    },
    from,
    to,
  );
  const { RecurrenceOccurrence } = getModels();
  const existing = await RecurrenceOccurrence.findAll({
    where: { recurrenceRuleId: rule.id, scheduledOn: { [Op.in]: dates } },
    attributes: ["scheduledOn"],
    transaction,
  });
  const have = new Set(existing.map((row) => asIsoDate(row.get("scheduledOn") as string | Date)));
  const now = new Date();
  const rows = dates
    .filter((iso) => !have.has(iso))
    .map((iso) => ({
      id: crypto.randomUUID(),
      recurrenceRuleId: rule.id,
      scheduledOn: iso,
      amount: centsToDecimalString(decimalToCents(rule.amount)),
      status: "programada" as const,
      createdAt: now,
      updatedAt: now,
    }));
  if (rows.length > 0) {
    await RecurrenceOccurrence.bulkCreate(rows, { transaction });
  }
}

function ruleIncludes() {
  const { MoneyAccount, CreditCard, Category } = getModels();
  return [
    { model: MoneyAccount, as: "moneyAccount", attributes: ["name", "currency"], required: false },
    { model: CreditCard, as: "creditCard", attributes: ["name", "currency"], required: false },
    { model: Category, attributes: ["name"], required: true },
  ];
}

/** Active and paused rules for the signed-in user (finished stay hidden). */
export async function listRecurrenceRules(userId: string): Promise<PublicRecurrenceRule[]> {
  const { RecurrenceRule } = getModels();
  const [rows, sellRate] = await Promise.all([
    RecurrenceRule.findAll({
      where: { userId, status: { [Op.ne]: "finalizada" } },
      include: ruleIncludes(),
      order: [
        ["kind", "ASC"],
        ["name", "ASC"],
      ],
    }),
    getOfficialUsdSellRateOrNull(),
  ]);
  return rows.map((row) => toPublicRule(row.get({ plain: true }) as RuleRow, sellRate));
}

/** Occurrences in a calendar month after filling any missing dates. */
export async function listMonthOccurrences(
  userId: string,
  yearMonth = yearMonthFromIso(localTodayIso()),
): Promise<PublicRecurrenceOccurrence[]> {
  await ensureOccurrences(userId);
  const today = localTodayIso();
  const from = startOfYearMonth(yearMonth);
  const to = addMonthsIso(from, 1);
  const { RecurrenceOccurrence, RecurrenceRule, Movement } = getModels();
  const [rows, sellRate] = await Promise.all([
    RecurrenceOccurrence.findAll({
      where: {
        scheduledOn: { [Op.gte]: from, [Op.lt]: to },
      },
      include: [
        {
          model: RecurrenceRule,
          as: "rule",
          required: true,
          where: { userId, status: { [Op.ne]: "finalizada" } },
          include: ruleIncludes(),
        },
        { model: Movement, attributes: ["amount"], required: false },
      ],
      order: [
        ["scheduledOn", "ASC"],
        ["createdAt", "ASC"],
      ],
    }),
    getOfficialUsdSellRateOrNull(),
  ]);
  return rows.map((row) => toPublicOccurrence(row.get({ plain: true }) as OccurrenceRow, today, sellRate));
}

/** Active-rule occurrences from fromMonth through toMonth inclusive. */
export async function listOccurrencesInRange(
  userId: string,
  fromMonth: string,
  toMonth: string,
): Promise<PublicRecurrenceOccurrence[]> {
  await ensureOccurrences(userId);
  const today = localTodayIso();
  const from = startOfYearMonth(fromMonth);
  const to = startOfYearMonth(addYearMonths(toMonth, 1));
  const { RecurrenceOccurrence, RecurrenceRule, Movement } = getModels();
  const [rows, sellRate] = await Promise.all([
    RecurrenceOccurrence.findAll({
      where: {
        scheduledOn: { [Op.gte]: from, [Op.lt]: to },
      },
      include: [
        {
          model: RecurrenceRule,
          as: "rule",
          required: true,
          where: { userId, status: "activa" },
          include: ruleIncludes(),
        },
        { model: Movement, attributes: ["amount"], required: false },
      ],
      order: [
        ["scheduledOn", "ASC"],
        ["createdAt", "ASC"],
      ],
    }),
    getOfficialUsdSellRateOrNull(),
  ]);
  return rows.map((row) => toPublicOccurrence(row.get({ plain: true }) as OccurrenceRow, today, sellRate));
}

/** One owned rule or null. */
export async function getRecurrenceRule(
  userId: string,
  id: string,
): Promise<PublicRecurrenceRule | null> {
  if (!isUuid(id)) {
    return null;
  }
  const { RecurrenceRule } = getModels();
  const found = await RecurrenceRule.findOne({
    where: { id, userId },
    include: ruleIncludes(),
  });
  if (!found) {
    return null;
  }
  const plain = found.get({ plain: true }) as RuleRow;
  if (plain.status === "finalizada") {
    return null;
  }
  return toPublicRule(plain, await getOfficialUsdSellRateOrNull());
}

/** Creates a rule and seeds its next 12 months of occurrences. */
export async function createRecurrenceRule(
  userId: string,
  input: CreateRecurrenceRuleInput,
): Promise<PublicRecurrenceRule> {
  const sequelize = getSequelize();
  const created = await sequelize.transaction(async (transaction) => {
    const { RecurrenceRule } = getModels();
    const count = await RecurrenceRule.count({ where: { userId }, transaction });
    if (count >= MAX_RULES_PER_USER) {
      throw new RecurrenceLimitError();
    }
    await assertInstrument(userId, input, transaction);
    const row = await RecurrenceRule.create(
      { id: crypto.randomUUID(), status: "activa", ...payloadFromInput(userId, input) },
      { transaction },
    );
    await seedRuleOccurrences(row.get({ plain: true }) as RuleRow, transaction);
    return row;
  });
  const loaded = await getRecurrenceRule(userId, created.get("id") as string);
  if (!loaded) {
    throw new RecurrenceNotFoundError();
  }
  return loaded;
}

/** Updates a rule; programmed occurrences pick up the new amount. */
export async function updateRecurrenceRule(
  userId: string,
  id: string,
  input: CreateRecurrenceRuleInput,
): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { RecurrenceRule, RecurrenceOccurrence } = getModels();
    const found = await RecurrenceRule.findOne({
      where: { id, userId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new RecurrenceNotFoundError();
    }
    if ((found.get("status") as RecurrenceRuleStatus) === "finalizada") {
      throw new RecurrenceNotFoundError();
    }
    await assertInstrument(userId, input, transaction);
    const previous = found.get({ plain: true }) as RuleRow;
    const next = payloadFromInput(userId, input);
    await found.update(next, { transaction });
    const scheduleChanged =
      previous.frequency !== next.frequency ||
      previous.dueDay !== next.dueDay ||
      previous.dueMonth !== next.dueMonth ||
      asIsoDate(previous.startsOn) !== next.startsOn ||
      (previous.endsOn ? asIsoDate(previous.endsOn) : null) !== next.endsOn;
    const today = localTodayIso();
    if (scheduleChanged) {
      await RecurrenceOccurrence.destroy({
        where: {
          recurrenceRuleId: id,
          status: "programada",
          scheduledOn: { [Op.gte]: today },
        },
        transaction,
      });
    } else {
      await RecurrenceOccurrence.update(
        { amount: next.amount },
        { where: { recurrenceRuleId: id, status: "programada" }, transaction },
      );
    }
    if ((found.get("status") as RecurrenceRuleStatus) === "activa") {
      await seedRuleOccurrences(found.get({ plain: true }) as RuleRow, transaction);
    }
  });
}

/** Pauses generation; existing occurrences stay. */
export async function pauseRecurrenceRule(userId: string, id: string): Promise<void> {
  await setRuleStatus(userId, id, "pausada");
}

/** Resumes generation from the next scheduled date. */
export async function resumeRecurrenceRule(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { RecurrenceRule } = getModels();
    const found = await RecurrenceRule.findOne({
      where: { id, userId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new RecurrenceNotFoundError();
    }
    if ((found.get("status") as RecurrenceRuleStatus) === "finalizada") {
      throw new RecurrenceNotFoundError();
    }
    await found.update({ status: "activa" }, { transaction });
    await seedRuleOccurrences(found.get({ plain: true }) as RuleRow, transaction);
  });
}

/** Stops the rule and drops future programmed occurrences. Confirmed movements stay. */
export async function deleteRecurrenceRule(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { RecurrenceRule, RecurrenceOccurrence } = getModels();
    const found = await RecurrenceRule.findOne({
      where: { id, userId },
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new RecurrenceNotFoundError();
    }
    const today = localTodayIso();
    await RecurrenceOccurrence.destroy({
      where: {
        recurrenceRuleId: id,
        status: "programada",
        scheduledOn: { [Op.gte]: today },
      },
      transaction,
    });
    await found.update({ status: "finalizada" }, { transaction });
  });
}

async function setRuleStatus(
  userId: string,
  id: string,
  status: RecurrenceRuleStatus,
): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const { RecurrenceRule } = getModels();
  const [count] = await RecurrenceRule.update(
    { status },
    { where: { id, userId, status: { [Op.ne]: "finalizada" } } },
  );
  if (count === 0) {
    throw new RecurrenceNotFoundError();
  }
}

/** Turns an occurrence into a ledger gasto/ingreso (USD quotes settle in ARS at oficial venta). */
export async function confirmOccurrence(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const { RecurrenceOccurrence, RecurrenceRule } = getModels();
  const preview = await RecurrenceOccurrence.findOne({
    where: { id },
    include: [
      {
        model: RecurrenceRule,
        as: "rule",
        required: true,
        where: { userId },
        include: ruleIncludes(),
      },
    ],
  });
  if (!preview) {
    throw new RecurrenceNotFoundError();
  }
  const previewPlain = preview.get({ plain: true }) as OccurrenceRow;
  const previewRule = previewPlain.rule;
  if (!previewRule) {
    throw new RecurrenceNotFoundError();
  }
  const needsFx = convertsUsdToArs(quotedCurrency(previewRule), instrumentCurrency(previewRule));
  const sellRate = needsFx ? await getOfficialUsdSellRate() : null;

  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const found = await RecurrenceOccurrence.findOne({
      where: { id },
      include: [
        {
          model: RecurrenceRule,
          as: "rule",
          required: true,
          where: { userId },
          include: ruleIncludes(),
        },
      ],
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new RecurrenceNotFoundError();
    }
    const status = found.get("status") as RecurrenceOccurrenceStatus;
    if (status !== "programada" && status !== "vencida") {
      throw new RecurrenceOccurrenceClosedError();
    }
    const plain = found.get({ plain: true }) as OccurrenceRow;
    const ruleRow = plain.rule;
    if (!ruleRow) {
      throw new RecurrenceNotFoundError();
    }
    const scheduledOn = asIsoDate(found.get("scheduledOn") as string | Date);
    const today = localTodayIso();
    const occurredOn = scheduledOn <= today ? scheduledOn : today;
    const quotedCents = decimalToCents(found.get("amount") as string | number);
    let ledgerCents = quotedCents;
    if (convertsUsdToArs(quotedCurrency(ruleRow), instrumentCurrency(ruleRow))) {
      if (sellRate === null) {
        throw new OfficialUsdRateError();
      }
      ledgerCents = usdCentsToArsCents(quotedCents, sellRate);
    }
    const amount = centsToDecimalString(ledgerCents);
    const input = movementInput(ruleRow, amount, occurredOn, ruleRow.name);
    const created = await persistLedgerMovement(userId, input, transaction);
    await found.update(
      {
        status: "confirmada",
        movementId: created.get("id") as string,
      },
      { transaction },
    );
  });
}

function movementInput(
  rule: RuleRow,
  amount: string,
  occurredOn: string,
  notes: string,
): CreateMovementInput {
  if (rule.kind === "ingreso") {
    return {
      type: "ingreso",
      accountId: rule.accountId as string,
      categoryId: rule.categoryId,
      amount,
      occurredOn,
      notes,
    };
  }
  if (rule.creditCardId) {
    return {
      type: "gasto",
      paidWith: "tarjeta",
      creditCardId: rule.creditCardId,
      categoryId: rule.categoryId,
      amount,
      occurredOn,
      notes,
      installmentCount: 1,
    };
  }
  return {
    type: "gasto",
    paidWith: "cuenta",
    accountId: rule.accountId as string,
    categoryId: rule.categoryId,
    amount,
    occurredOn,
    notes,
  };
}

/** Marks the period unpaid without creating a movement. */
export async function omitOccurrence(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new RecurrenceNotFoundError();
  }
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { RecurrenceOccurrence, RecurrenceRule } = getModels();
    const found = await RecurrenceOccurrence.findOne({
      where: { id },
      include: [{ model: RecurrenceRule, as: "rule", required: true, where: { userId } }],
      transaction,
      lock: Transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new RecurrenceNotFoundError();
    }
    const status = found.get("status") as RecurrenceOccurrenceStatus;
    if (status !== "programada" && status !== "vencida") {
      throw new RecurrenceOccurrenceClosedError();
    }
    await found.update({ status: "omitida" }, { transaction });
  });
}
