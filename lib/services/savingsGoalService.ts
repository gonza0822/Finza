import { Op, type Transaction } from "sequelize";
import { getSequelize } from "@/lib/db/sequelize";
import { getModels } from "@/lib/db/models";
import { GOAL_SOFT_COMMIT_STATUSES, type Currency, type GoalStatus } from "@/lib/db/enums";
import {
  localTodayIso,
  monthsInclusive,
  startOfYearMonth,
  yearMonthFromIso,
} from "@/lib/dates/isoDate";
import { centsToDecimalString, decimalToCents } from "@/lib/money/parse";
import type {
  AssignSavingsGoalInput,
  CreateSavingsGoalInput,
  UpdateSavingsGoalInput,
} from "@/lib/validators/savingsGoal";
import type { PublicSavingsGoal, SoftCommittedByCurrency } from "@/features/metas/types";

const MAX_GOALS_PER_USER = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const STATUS_ORDER: Record<Exclude<GoalStatus, "cancelado">, number> = {
  activo: 0,
  pausado: 1,
  alcanzado: 2,
};

export class GoalLimitError extends Error {
  constructor() {
    super("GOAL_LIMIT");
    this.name = "GoalLimitError";
  }
}

export class GoalNotFoundError extends Error {
  constructor() {
    super("GOAL_NOT_FOUND");
    this.name = "GoalNotFoundError";
  }
}

interface GoalRow {
  id: string;
  userId: string;
  name: string;
  targetAmount: string | number;
  assignedAmount: string | number;
  currency: Currency;
  targetOn: string | Date;
  status: GoalStatus;
}

function isUuid(value: string): boolean {
  return UUID_RE.test(value);
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

/** Auto-reaches when assigned covers the target; paused/cancelled stay put. */
function nextStatus(current: GoalStatus, assignedCents: number, targetCents: number): GoalStatus {
  if (current === "cancelado" || current === "pausado") {
    return current;
  }
  if (targetCents > 0 && assignedCents >= targetCents) {
    return "alcanzado";
  }
  return "activo";
}

/** Remaining, monthly needed and bar percent for the goal card/detail. */
function toPublic(row: GoalRow, todayMonth = yearMonthFromIso(localTodayIso())): PublicSavingsGoal {
  const targetCents = decimalToCents(row.targetAmount);
  const assignedCents = decimalToCents(row.assignedAmount);
  const remainingCents = Math.max(0, targetCents - assignedCents);
  const targetMonth = yearMonthFromIso(asIsoDate(row.targetOn));
  const monthsLeft = Math.max(1, monthsInclusive(todayMonth, targetMonth));
  const monthlyNeededCents =
    remainingCents === 0 ? 0 : Math.ceil(remainingCents / monthsLeft);
  const rawPercent = targetCents <= 0 ? 0 : Math.round((assignedCents / targetCents) * 100);
  const progressPercent = row.status === "alcanzado" ? Math.max(100, rawPercent) : rawPercent;
  return {
    id: row.id,
    name: row.name,
    targetCents,
    assignedCents,
    remainingCents,
    currency: row.currency,
    targetMonth,
    status: row.status,
    progressPercent,
    monthsLeft,
    monthlyNeededCents,
    hasPace: false,
  };
}

async function findOwned(userId: string, id: string, transaction?: Transaction) {
  const { SavingsGoal } = getModels();
  return SavingsGoal.findOne({
    where: { id, userId, status: { [Op.ne]: "cancelado" } },
    transaction,
    lock: transaction ? transaction.LOCK.UPDATE : undefined,
  });
}

/** Lists visible goals (not cancelled), activos first. */
export async function listSavingsGoals(userId: string): Promise<PublicSavingsGoal[]> {
  const { SavingsGoal } = getModels();
  const rows = await SavingsGoal.findAll({
    where: { userId, status: { [Op.ne]: "cancelado" } },
    order: [["targetOn", "ASC"], ["createdAt", "ASC"]],
  });
  const mapped = rows.map((row) => toPublic(row.get({ plain: true }) as GoalRow));
  mapped.sort(
    (a, b) =>
      STATUS_ORDER[a.status as Exclude<GoalStatus, "cancelado">] -
        STATUS_ORDER[b.status as Exclude<GoalStatus, "cancelado">] ||
      a.targetMonth.localeCompare(b.targetMonth) ||
      a.name.localeCompare(b.name, "es"),
  );
  return mapped;
}

/** Owned visible goal, or null. */
export async function getSavingsGoal(userId: string, id: string): Promise<PublicSavingsGoal | null> {
  if (!isUuid(id)) {
    return null;
  }
  const found = await findOwned(userId, id);
  if (!found) {
    return null;
  }
  return toPublic(found.get({ plain: true }) as GoalRow);
}

/** Assigned amounts that still subtract from Libre (activo + alcanzado). */
export async function assignedByCurrency(userId: string): Promise<SoftCommittedByCurrency> {
  const { SavingsGoal } = getModels();
  const rows = await SavingsGoal.findAll({
    where: { userId, status: GOAL_SOFT_COMMIT_STATUSES },
    attributes: ["assignedAmount", "currency"],
  });
  const totals: SoftCommittedByCurrency = { ars: 0, usd: 0 };
  for (const row of rows) {
    const cents = decimalToCents(row.get("assignedAmount"));
    if (row.get("currency") === "USD") {
      totals.usd += cents;
    } else {
      totals.ars += cents;
    }
  }
  return totals;
}

/** Creates a virtual overlay; assigned may be zero. */
export async function createSavingsGoal(
  userId: string,
  input: CreateSavingsGoalInput,
): Promise<PublicSavingsGoal> {
  const sequelize = getSequelize();
  const created = await sequelize.transaction(async (transaction) => {
    const { SavingsGoal } = getModels();
    const count = await SavingsGoal.count({
      where: { userId, status: { [Op.ne]: "cancelado" } },
      transaction,
    });
    if (count >= MAX_GOALS_PER_USER) {
      throw new GoalLimitError();
    }
    const assignedCents = decimalToCents(input.assignedAmount);
    const targetCents = decimalToCents(input.targetAmount);
    return SavingsGoal.create(
      {
        id: crypto.randomUUID(),
        userId,
        name: input.name,
        targetAmount: input.targetAmount,
        assignedAmount: input.assignedAmount,
        currency: input.currency,
        targetOn: startOfYearMonth(input.targetMonth),
        status: nextStatus("activo", assignedCents, targetCents),
      },
      { transaction },
    );
  });
  return toPublic(created.get({ plain: true }) as GoalRow);
}

/** Updates name, target, currency and due month of an owned goal. */
export async function updateSavingsGoal(
  userId: string,
  input: UpdateSavingsGoalInput,
): Promise<PublicSavingsGoal> {
  const sequelize = getSequelize();
  const updated = await sequelize.transaction(async (transaction) => {
    const found = await findOwned(userId, input.id, transaction);
    if (!found) {
      throw new GoalNotFoundError();
    }
    found.set({
      name: input.name,
      targetAmount: input.targetAmount,
      currency: input.currency,
      targetOn: startOfYearMonth(input.targetMonth),
    });
    const assignedCents = decimalToCents(found.get("assignedAmount"));
    const targetCents = decimalToCents(input.targetAmount);
    const current = found.get("status") as GoalStatus;
    found.set("status", nextStatus(current, assignedCents, targetCents));
    await found.save({ transaction });
    return found;
  });
  return toPublic(updated.get({ plain: true }) as GoalRow);
}

/** Adds to assigned without moving accounts; Libre may go negative. */
export async function assignToSavingsGoal(
  userId: string,
  input: AssignSavingsGoalInput,
): Promise<PublicSavingsGoal> {
  const sequelize = getSequelize();
  const updated = await sequelize.transaction(async (transaction) => {
    const found = await findOwned(userId, input.id, transaction);
    if (!found) {
      throw new GoalNotFoundError();
    }
    if ((found.get("status") as GoalStatus) === "pausado") {
      throw new GoalNotFoundError();
    }
    const nextAssigned = decimalToCents(found.get("assignedAmount")) + decimalToCents(input.amount);
    const targetCents = decimalToCents(found.get("targetAmount"));
    found.set("assignedAmount", centsToDecimalString(nextAssigned));
    found.set("status", nextStatus(found.get("status") as GoalStatus, nextAssigned, targetCents));
    await found.save({ transaction });
    return found;
  });
  return toPublic(updated.get({ plain: true }) as GoalRow);
}

/** Pauses an active goal so assigned stops counting as soft committed. */
export async function pauseSavingsGoal(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new GoalNotFoundError();
  }
  if ((found.get("status") as GoalStatus) !== "activo") {
    return;
  }
  await found.update({ status: "pausado" });
}

/** Resumes a paused goal; may auto-reach if assigned already covers the target. */
export async function resumeSavingsGoal(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new GoalNotFoundError();
  }
  if ((found.get("status") as GoalStatus) !== "pausado") {
    return;
  }
  const assignedCents = decimalToCents(found.get("assignedAmount"));
  const targetCents = decimalToCents(found.get("targetAmount"));
  await found.update({ status: nextStatus("activo", assignedCents, targetCents) });
}

/** Zeros assigned on a reached goal so Libre recovers; status stays alcanzado. */
export async function releaseSavingsGoal(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new GoalNotFoundError();
  }
  if ((found.get("status") as GoalStatus) !== "alcanzado") {
    return;
  }
  await found.update({ assignedAmount: "0.00" });
}

/** Cancels a goal and releases assigned (soft committed); accounts stay put. */
export async function cancelSavingsGoal(userId: string, id: string): Promise<void> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new GoalNotFoundError();
  }
  await found.update({ status: "cancelado", assignedAmount: "0.00" });
}
