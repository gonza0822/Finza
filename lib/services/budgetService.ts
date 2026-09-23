import { Op, UniqueConstraintError } from "sequelize";
import { getSequelize } from "@/lib/db/sequelize";
import { getModels } from "@/lib/db/models";
import type { Currency } from "@/lib/db/enums";
import { addMonthsIso } from "@/lib/recurrence/schedule";
import { startOfYearMonth } from "@/lib/dates/isoDate";
import { decimalToCents } from "@/lib/money/parse";
import type { CreateBudgetInput, UpdateBudgetInput } from "@/lib/validators/budget";
import type { PublicCategory } from "@/features/categories/types";
import type { BudgetAlertLevel, PublicBudget } from "@/features/planificacion/budgetTypes";
import { listActiveCategories } from "@/lib/services/categoryService";

const MAX_BUDGETS_PER_USER = 200;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class BudgetLimitError extends Error {
  constructor() {
    super("BUDGET_LIMIT");
    this.name = "BudgetLimitError";
  }
}

export class BudgetNotFoundError extends Error {
  constructor() {
    super("BUDGET_NOT_FOUND");
    this.name = "BudgetNotFoundError";
  }
}

export class BudgetDuplicateError extends Error {
  constructor() {
    super("BUDGET_DUPLICATE");
    this.name = "BudgetDuplicateError";
  }
}

export class BudgetCategoryUnavailableError extends Error {
  constructor() {
    super("BUDGET_CATEGORY_UNAVAILABLE");
    this.name = "BudgetCategoryUnavailableError";
  }
}

interface BudgetRow {
  id: string;
  userId: string;
  categoryId: string;
  yearMonth: string;
  amount: string | number;
  currency: Currency;
  category?: { id: string; name: string; parentId: string | null };
}

interface SpendHit {
  categoryId: string;
  currency: Currency;
  cents: number;
}

interface CreditInstallmentRow {
  amount: string | number;
  installmentCount: number;
  status: string;
  movement?: {
    categoryId: string | null;
    currency: Currency;
    occurredOn: string | Date;
  };
  cycle?: { closeOn: string | Date };
}

/** Alert from used / cap: 80% warning, over 100% exceeded. Never blocks recording. */
export function alertLevel(usedCents: number, amountCents: number): BudgetAlertLevel {
  if (amountCents <= 0) {
    return "ok";
  }
  if (usedCents > amountCents) {
    return "excedido";
  }
  if (usedCents * 100 >= amountCents * 80) {
    return "alerta";
  }
  return "ok";
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

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

function spendKey(categoryId: string, currency: Currency): string {
  return `${categoryId}:${currency}`;
}

/** Parent plus nested children so a “Comida” cap also counts supermercado. */
function matchingCategoryIds(tree: PublicCategory[], categoryId: string): Set<string> | null {
  function walk(nodes: PublicCategory[]): Set<string> | null {
    for (const node of nodes) {
      if (node.id === categoryId) {
        const ids = new Set<string>([node.id]);
        for (const child of node.children) {
          ids.add(child.id);
          for (const nested of child.children) {
            ids.add(nested.id);
          }
        }
        return ids;
      }
      const nested = walk(node.children);
      if (nested) {
        return nested;
      }
    }
    return null;
  }
  return walk(tree);
}

function parentNameFor(tree: PublicCategory[], categoryId: string): string | null {
  for (const node of tree) {
    if (node.children.some((child) => child.id === categoryId)) {
      return node.name;
    }
  }
  return null;
}

function toPublic(
  row: BudgetRow,
  usedCents: number,
  tree: PublicCategory[],
): PublicBudget {
  const amountCents = decimalToCents(row.amount);
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? "",
    parentCategoryName: parentNameFor(tree, row.categoryId),
    yearMonth: row.yearMonth,
    amountCents,
    usedCents,
    currency: row.currency,
    alert: alertLevel(usedCents, amountCents),
  };
}

function addHit(hits: Map<string, number>, hit: SpendHit) {
  const key = spendKey(hit.categoryId, hit.currency);
  hits.set(key, (hits.get(key) ?? 0) + hit.cents);
}

/** Cash/debit gastos in the month, by movement date. Card payments never appear. */
async function cashSpendHits(userId: string, yearMonth: string): Promise<SpendHit[]> {
  const from = startOfYearMonth(yearMonth);
  const to = addMonthsIso(from, 1);
  const { Movement } = getModels();
  const rows = await Movement.findAll({
    where: {
      userId,
      type: "gasto",
      status: "confirmado",
      paymentMean: { [Op.ne]: "credito" },
      occurredOn: { [Op.gte]: from, [Op.lt]: to },
      categoryId: { [Op.ne]: null },
    },
    attributes: ["categoryId", "currency", "amount"],
  });
  return rows.flatMap((row) => {
    const categoryId = row.get("categoryId") as string | null;
    if (!categoryId) {
      return [];
    }
    return [
      {
        categoryId,
        currency: row.get("currency") as Currency,
        cents: decimalToCents(row.get("amount")),
      },
    ];
  });
}

/**
 * Credit spend: one-shot by purchase date; installments by the cycle’s close month.
 * Card payments (pago_tarjeta) are not gastos and never enter this query.
 */
async function creditSpendHits(userId: string, yearMonth: string): Promise<SpendHit[]> {
  const from = startOfYearMonth(yearMonth);
  const to = addMonthsIso(from, 1);
  const { Installment, Movement, CreditCardCycle } = getModels();
  const rows = await Installment.findAll({
    where: { status: { [Op.ne]: "anulada" } },
    include: [
      {
        model: Movement,
        required: true,
        where: {
          userId,
          type: "gasto",
          status: "confirmado",
          paymentMean: "credito",
          categoryId: { [Op.ne]: null },
        },
        attributes: ["categoryId", "currency", "occurredOn"],
      },
      {
        model: CreditCardCycle,
        as: "cycle",
        required: true,
        attributes: ["closeOn"],
      },
    ],
  });

  const hits: SpendHit[] = [];
  for (const row of rows) {
    const plain = row.get({ plain: true }) as CreditInstallmentRow;
    const movement = plain.movement;
    const categoryId = movement?.categoryId;
    if (!movement || !categoryId) {
      continue;
    }
    const inPurchaseMonth =
      asIsoDate(movement.occurredOn) >= from && asIsoDate(movement.occurredOn) < to;
    const closeOn = asIsoDate(plain.cycle?.closeOn ?? "");
    const inCycleMonth = closeOn >= from && closeOn < to;
    const isInstallmentPlan = plain.installmentCount > 1;
    if (isInstallmentPlan ? inCycleMonth : inPurchaseMonth) {
      hits.push({
        categoryId,
        currency: movement.currency,
        cents: decimalToCents(plain.amount),
      });
    }
  }
  return hits;
}

/** Used cents keyed by category+currency for one calendar month. */
async function spendMap(userId: string, yearMonth: string): Promise<Map<string, number>> {
  const [cash, credit] = await Promise.all([
    cashSpendHits(userId, yearMonth),
    creditSpendHits(userId, yearMonth),
  ]);
  const hits = new Map<string, number>();
  for (const hit of [...cash, ...credit]) {
    addHit(hits, hit);
  }
  return hits;
}

function usedForBudget(
  row: BudgetRow,
  spend: Map<string, number>,
  tree: PublicCategory[],
): number {
  const ids = matchingCategoryIds(tree, row.categoryId);
  if (!ids) {
    return spend.get(spendKey(row.categoryId, row.currency)) ?? 0;
  }
  let total = 0;
  for (const categoryId of ids) {
    total += spend.get(spendKey(categoryId, row.currency)) ?? 0;
  }
  return total;
}

async function assertGastoCategory(categoryId: string): Promise<void> {
  const { Category } = getModels();
  const found = await Category.findOne({
    where: { id: categoryId, archivedAt: null, kind: "gasto" },
  });
  if (!found) {
    throw new BudgetCategoryUnavailableError();
  }
}

/** Lists the signed-in user’s caps for one month, with used computed per spec §15. */
export async function listBudgetsForMonth(
  userId: string,
  yearMonth: string,
): Promise<PublicBudget[]> {
  const { Budget, Category } = getModels();
  const [rows, spend, tree] = await Promise.all([
    Budget.findAll({
      where: { userId, yearMonth },
      include: [{ model: Category, attributes: ["id", "name", "parentId"], required: true }],
      order: [
        ["currency", "ASC"],
        ["createdAt", "ASC"],
      ],
    }),
    spendMap(userId, yearMonth),
    listActiveCategories(),
  ]);
  return rows
    .map((row) => {
      const plain = row.get({ plain: true }) as BudgetRow;
      return toPublic(plain, usedForBudget(plain, spend, tree), tree);
    })
    .sort(
      (left, right) =>
        left.currency.localeCompare(right.currency) ||
        left.categoryName.localeCompare(right.categoryName, "es"),
    );
}

/** One owned budget or null. */
export async function getBudget(userId: string, id: string): Promise<PublicBudget | null> {
  if (!isUuid(id)) {
    return null;
  }
  const { Budget, Category } = getModels();
  const found = await Budget.findOne({
    where: { id, userId },
    include: [{ model: Category, attributes: ["id", "name", "parentId"], required: true }],
  });
  if (!found) {
    return null;
  }
  const row = found.get({ plain: true }) as BudgetRow;
  const [spend, tree] = await Promise.all([spendMap(userId, row.yearMonth), listActiveCategories()]);
  return toPublic(row, usedForBudget(row, spend, tree), tree);
}

/** Creates a monthly category cap for the signed-in user. */
export async function createBudget(userId: string, input: CreateBudgetInput): Promise<PublicBudget> {
  await assertGastoCategory(input.categoryId);
  const sequelize = getSequelize();
  const created = await sequelize.transaction(async (transaction) => {
    const { Budget } = getModels();
    const count = await Budget.count({ where: { userId }, transaction });
    if (count >= MAX_BUDGETS_PER_USER) {
      throw new BudgetLimitError();
    }
    const duplicate = await Budget.findOne({
      where: {
        userId,
        categoryId: input.categoryId,
        yearMonth: input.yearMonth,
        currency: input.currency,
      },
      transaction,
    });
    if (duplicate) {
      throw new BudgetDuplicateError();
    }
    try {
      return await Budget.create(
        {
          id: crypto.randomUUID(),
          userId,
          categoryId: input.categoryId,
          yearMonth: input.yearMonth,
          amount: input.amount,
          currency: input.currency,
        },
        { transaction },
      );
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        throw new BudgetDuplicateError();
      }
      throw error;
    }
  });
  const publicRow = await getBudget(userId, created.get("id") as string);
  if (!publicRow) {
    throw new BudgetNotFoundError();
  }
  return publicRow;
}

/** Updates an owned budget. */
export async function updateBudget(userId: string, input: UpdateBudgetInput): Promise<PublicBudget> {
  await assertGastoCategory(input.categoryId);
  const sequelize = getSequelize();
  await sequelize.transaction(async (transaction) => {
    const { Budget } = getModels();
    const found = await Budget.findOne({
      where: { id: input.id, userId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!found) {
      throw new BudgetNotFoundError();
    }
    const duplicate = await Budget.findOne({
      where: {
        userId,
        categoryId: input.categoryId,
        yearMonth: input.yearMonth,
        currency: input.currency,
        id: { [Op.ne]: input.id },
      },
      transaction,
    });
    if (duplicate) {
      throw new BudgetDuplicateError();
    }
    try {
      await found.update(
        {
          categoryId: input.categoryId,
          yearMonth: input.yearMonth,
          amount: input.amount,
          currency: input.currency,
        },
        { transaction },
      );
    } catch (error: unknown) {
      if (error instanceof UniqueConstraintError) {
        throw new BudgetDuplicateError();
      }
      throw error;
    }
  });
  const publicRow = await getBudget(userId, input.id);
  if (!publicRow) {
    throw new BudgetNotFoundError();
  }
  return publicRow;
}

/** Deletes an owned budget. History of gastos is untouched. */
export async function deleteBudget(userId: string, id: string): Promise<void> {
  if (!isUuid(id)) {
    throw new BudgetNotFoundError();
  }
  const { Budget } = getModels();
  const found = await Budget.findOne({ where: { id, userId } });
  if (!found) {
    throw new BudgetNotFoundError();
  }
  await found.destroy();
}
