import type { PublicCreditCard } from "@/features/cards/types";
import type { PublicMoneyAccount } from "@/features/accounts/types";
import type { PublicRecurrenceOccurrence } from "@/features/planificacion/types";
import type { CurrencySituation, SituationTotals } from "@/features/inicio/types";
import type { SoftCommittedByCurrency } from "@/features/metas/types";
import type { Currency } from "@/lib/db/enums";
import { getModels } from "@/lib/db/models";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { listMonthOccurrences } from "@/lib/services/recurrenceService";
import { assignedByCurrency } from "@/lib/services/savingsGoalService";

const ZERO_SOFT: SoftCommittedByCurrency = { ars: 0, usd: 0 };

/** Pending account gastos this month (not confirmed, not omitted, not card). */
function pendingAccountRecurrenceCents(
  occurrences: PublicRecurrenceOccurrence[],
  currency: Currency,
): number {
  return occurrences.reduce((sum, item) => {
    if (item.kind !== "gasto" || !item.canAct || item.creditCardName || item.currency !== currency) {
      return sum;
    }
    return sum + item.amountCents;
  }, 0);
}

function softFor(soft: SoftCommittedByCurrency, currency: Currency): number {
  return currency === "USD" ? soft.usd : soft.ars;
}

/** T, hard + soft committed and Libre for one currency. Hidden when there are no accounts. */
function sumCurrency(
  accounts: PublicMoneyAccount[],
  cards: PublicCreditCard[],
  occurrences: PublicRecurrenceOccurrence[],
  currency: Currency,
  softCommitted: SoftCommittedByCurrency,
): CurrencySituation | null {
  const matchingAccounts = accounts.filter((account) => account.currency === currency);
  if (matchingAccounts.length === 0) {
    return null;
  }
  const cashCents = matchingAccounts.reduce((sum, account) => sum + account.balanceCents, 0);
  const debtCents = cards
    .filter((card) => card.currency === currency)
    .reduce((sum, card) => sum + card.debtCents, 0);
  const committedCents =
    debtCents + pendingAccountRecurrenceCents(occurrences, currency) + softFor(softCommitted, currency);
  return {
    currency,
    cashCents,
    debtCents,
    netWorthCents: cashCents - debtCents,
    committedCents,
    freeCents: cashCents - committedCents,
    accountCount: matchingAccounts.length,
  };
}

/** T / debt / PN / committed / Libre per currency. Never mixes ARS with USD. */
export function summarizeSituation(
  accounts: PublicMoneyAccount[],
  cards: PublicCreditCard[],
  occurrences: PublicRecurrenceOccurrence[] = [],
  softCommitted: SoftCommittedByCurrency = ZERO_SOFT,
): SituationTotals {
  return {
    ars: sumCurrency(accounts, cards, occurrences, "ARS", softCommitted),
    usd: sumCurrency(accounts, cards, occurrences, "USD", softCommitted),
  };
}

/** Loads the signed-in user's situation for the home dashboard. */
export async function getSituationTotals(userId: string): Promise<SituationTotals> {
  const { User } = getModels();
  const [accounts, cards, occurrences, user, soft] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listMonthOccurrences(userId),
    User.findByPk(userId, { attributes: ["id", "goalsCountAsCommitted"] }),
    assignedByCurrency(userId),
  ]);
  const countGoals = user?.get("goalsCountAsCommitted") !== false;
  return summarizeSituation(accounts, cards, occurrences, countGoals ? soft : ZERO_SOFT);
}
