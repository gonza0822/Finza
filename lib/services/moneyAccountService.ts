import { getModels } from "@/lib/db/models";
import type { AccountType, Currency } from "@/lib/db/enums";
import {
  applyConfirmedLedgerImpact,
  markAccountsWithLedgers,
  type LedgerMovementImpact,
} from "@/lib/ledger/impact";
import { decimalToCents } from "@/lib/money/parse";
import type {
  CreateMoneyAccountInput,
  UpdateMoneyAccountInput,
} from "@/lib/validators/moneyAccount";
import type { PublicMoneyAccount } from "@/features/accounts/types";

const MAX_ACCOUNTS_PER_USER = 50;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class MoneyAccountNotFoundError extends Error {
  constructor() {
    super("MONEY_ACCOUNT_NOT_FOUND");
    this.name = "MoneyAccountNotFoundError";
  }
}

export class MoneyAccountLimitError extends Error {
  constructor() {
    super("MONEY_ACCOUNT_LIMIT");
    this.name = "MoneyAccountLimitError";
  }
}

interface MoneyAccountRow {
  id: string;
  userId: string;
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: string | number;
  notes: string | null;
  sortOrder: number;
  archivedAt: Date | null;
}

interface LedgerImpact {
  deltaCents: Map<string, number>;
  accountsWithLedgers: Set<string>;
}

function isUuid(id: string): boolean {
  return UUID_RE.test(id);
}

function toPublic(
  row: MoneyAccountRow,
  extras: { ledgerCents?: number; hasLedgers?: boolean } = {},
): PublicMoneyAccount {
  const initialBalanceCents = decimalToCents(row.initialBalance);
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    currency: row.currency,
    initialBalanceCents,
    balanceCents: initialBalanceCents + (extras.ledgerCents ?? 0),
    notes: row.notes,
    sortOrder: row.sortOrder,
    archived: Boolean(row.archivedAt),
    hasLedgers: extras.hasLedgers ?? false,
  };
}

/** Confirmed book rows move saldos; any row (including anulado) locks currency and initial. */
async function ledgerImpactForUser(userId: string): Promise<LedgerImpact> {
  const { Movement } = getModels();
  const rows = await Movement.findAll({
    where: { userId },
    attributes: [
      "accountId",
      "counterAccountId",
      "type",
      "amount",
      "counterAmount",
      "status",
      "ajusteDirection",
    ],
  });
  const deltaCents = new Map<string, number>();
  const accountsWithLedgers = new Set<string>();

  for (const row of rows) {
    const plain = row.get({ plain: true }) as LedgerMovementImpact;
    markAccountsWithLedgers(accountsWithLedgers, plain);
    applyConfirmedLedgerImpact(deltaCents, plain);
  }

  return { deltaCents, accountsWithLedgers };
}

/** True once the account has any book row, so currency and initial balance stay fixed. */
async function accountHasLedgers(accountId: string, userId: string): Promise<boolean> {
  const impact = await ledgerImpactForUser(userId);
  return impact.accountsWithLedgers.has(accountId);
}

async function findOwned(userId: string, id: string) {
  if (!isUuid(id)) {
    return null;
  }
  const { MoneyAccount } = getModels();
  return MoneyAccount.findOne({ where: { id, userId } });
}

/** Lists the signed-in user's accounts with current = initial + confirmed ledger. */
export async function listMoneyAccounts(userId: string): Promise<PublicMoneyAccount[]> {
  const { MoneyAccount } = getModels();
  const [rows, impact] = await Promise.all([
    MoneyAccount.findAll({
      where: { userId },
      order: [
        ["archivedAt", "ASC"],
        ["sortOrder", "ASC"],
        ["createdAt", "ASC"],
      ],
    }),
    ledgerImpactForUser(userId),
  ]);
  return rows.map((row) => {
    const plain = row.get({ plain: true }) as MoneyAccountRow;
    return toPublic(plain, {
      ledgerCents: impact.deltaCents.get(plain.id) ?? 0,
      hasLedgers: impact.accountsWithLedgers.has(plain.id),
    });
  });
}

/** Active (not archived) accounts the user can post a movement against. */
export async function listActiveMoneyAccounts(userId: string): Promise<PublicMoneyAccount[]> {
  const accounts = await listMoneyAccounts(userId);
  return accounts.filter((account) => !account.archived);
}

/** Returns one owned account or null (invalid id and missing look the same). */
export async function getMoneyAccount(
  userId: string,
  id: string,
): Promise<PublicMoneyAccount | null> {
  const found = await findOwned(userId, id);
  if (!found) {
    return null;
  }
  const plain = found.get({ plain: true }) as MoneyAccountRow;
  const impact = await ledgerImpactForUser(userId);
  return toPublic(plain, {
    ledgerCents: impact.deltaCents.get(id) ?? 0,
    hasLedgers: impact.accountsWithLedgers.has(id),
  });
}

/** Creates a money account for the signed-in user. */
export async function createMoneyAccount(
  userId: string,
  input: CreateMoneyAccountInput,
): Promise<PublicMoneyAccount> {
  const { MoneyAccount } = getModels();
  const count = await MoneyAccount.count({ where: { userId } });
  if (count >= MAX_ACCOUNTS_PER_USER) {
    throw new MoneyAccountLimitError();
  }

  const maxOrder = await MoneyAccount.max("sortOrder", { where: { userId } });
  const sortOrder = (typeof maxOrder === "number" ? maxOrder : 0) + 1;

  const created = await MoneyAccount.create({
    id: crypto.randomUUID(),
    userId,
    name: input.name,
    type: input.type,
    currency: input.currency,
    initialBalance: input.initialBalance,
    notes: input.notes ?? null,
    sortOrder,
    archivedAt: null,
  });

  return toPublic(created.get({ plain: true }) as MoneyAccountRow);
}

/** Updates an owned account. Currency and initial balance lock once the ledger exists. */
export async function updateMoneyAccount(
  userId: string,
  input: UpdateMoneyAccountInput,
): Promise<PublicMoneyAccount> {
  const found = await findOwned(userId, input.id);
  if (!found) {
    throw new MoneyAccountNotFoundError();
  }

  const locked = await accountHasLedgers(input.id, userId);
  await found.update({
    name: input.name,
    type: input.type,
    notes: input.notes ?? null,
    ...(locked ? {} : { currency: input.currency, initialBalance: input.initialBalance }),
  });

  const plain = found.get({ plain: true }) as MoneyAccountRow;
  const impact = await ledgerImpactForUser(userId);
  return toPublic(plain, {
    ledgerCents: impact.deltaCents.get(input.id) ?? 0,
    hasLedgers: locked,
  });
}

/** Archives an owned account. Does not delete the row. */
export async function archiveMoneyAccount(
  userId: string,
  id: string,
): Promise<PublicMoneyAccount> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new MoneyAccountNotFoundError();
  }
  const row = found.get({ plain: true }) as MoneyAccountRow;
  if (!row.archivedAt) {
    await found.update({ archivedAt: new Date() });
  }
  const impact = await ledgerImpactForUser(userId);
  return toPublic(found.get({ plain: true }) as MoneyAccountRow, {
    ledgerCents: impact.deltaCents.get(id) ?? 0,
    hasLedgers: impact.accountsWithLedgers.has(id),
  });
}

/** Restores an archived owned account. */
export async function restoreMoneyAccount(
  userId: string,
  id: string,
): Promise<PublicMoneyAccount> {
  const found = await findOwned(userId, id);
  if (!found) {
    throw new MoneyAccountNotFoundError();
  }
  await found.update({ archivedAt: null });
  const impact = await ledgerImpactForUser(userId);
  return toPublic(found.get({ plain: true }) as MoneyAccountRow, {
    ledgerCents: impact.deltaCents.get(id) ?? 0,
    hasLedgers: impact.accountsWithLedgers.has(id),
  });
}
