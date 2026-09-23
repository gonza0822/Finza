import type { PublicCreditCard } from "@/features/cards/types";
import type { PublicMoneyAccount } from "@/features/accounts/types";
import type { PublicRecurrenceOccurrence } from "@/features/planificacion/types";
import type {
  CurrencyProjection,
  ProjectionHorizon,
  ProjectionMonth,
  ProjectionResult,
} from "@/features/proyeccion/types";
import { PROJECTION_HORIZONS } from "@/features/proyeccion/types";
import { closeOnForOccurredOn, dueOnForClose } from "@/lib/cards/cycleDates";
import type { Currency } from "@/lib/db/enums";
import { addYearMonths, localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { listOccurrencesInRange } from "@/lib/services/recurrenceService";

/** Reads ?meses=1..6. Default 4 matches the spec §10.1 window. */
export function parseHorizonMonths(raw: string | undefined): ProjectionHorizon {
  const value = Number(raw);
  if (PROJECTION_HORIZONS.includes(value as ProjectionHorizon)) {
    return value as ProjectionHorizon;
  }
  return 4;
}

function emptyBuckets(startMonth: string, horizon: number): Map<string, ProjectionMonth> {
  const buckets = new Map<string, ProjectionMonth>();
  for (let index = 0; index < horizon; index += 1) {
    const yearMonth = addYearMonths(startMonth, index);
    buckets.set(yearMonth, {
      yearMonth,
      incomeCents: 0,
      accountSpendCents: 0,
      cardPaymentCents: 0,
      creditPurchaseCents: 0,
      cashCents: 0,
      netWorthCents: 0,
    });
  }
  return buckets;
}

/** Overdue dates land in the current month so they still hit this horizon. */
function bucketMonth(iso: string, currentMonth: string, lastMonth: string): string | null {
  const yearMonth = yearMonthFromIso(iso);
  if (yearMonth < currentMonth) {
    return currentMonth;
  }
  if (yearMonth > lastMonth) {
    return null;
  }
  return yearMonth;
}

function addTo(
  buckets: Map<string, ProjectionMonth>,
  yearMonth: string | null,
  field: keyof Pick<
    ProjectionMonth,
    "incomeCents" | "accountSpendCents" | "cardPaymentCents" | "creditPurchaseCents"
  >,
  cents: number,
) {
  if (!yearMonth || cents === 0) {
    return;
  }
  const row = buckets.get(yearMonth);
  if (!row) {
    return;
  }
  row[field] += cents;
}

/** Existing unpaid installments become card payments on their due date. */
function applyInstallmentPayments(
  buckets: Map<string, ProjectionMonth>,
  cards: PublicCreditCard[],
  currency: Currency,
  currentMonth: string,
  lastMonth: string,
) {
  for (const card of cards) {
    if (card.currency !== currency) {
      continue;
    }
    let scheduled = 0;
    for (const purchase of card.remainingPurchases) {
      for (const installment of purchase.installments) {
        if (installment.remainingCents <= 0) {
          continue;
        }
        addTo(
          buckets,
          bucketMonth(installment.dueOn, currentMonth, lastMonth),
          "cardPaymentCents",
          installment.remainingCents,
        );
        scheduled += installment.remainingCents;
      }
    }
    if (scheduled > 0) {
      continue;
    }
    if (card.dueNowCents > 0) {
      addTo(buckets, currentMonth, "cardPaymentCents", card.dueNowCents);
    }
    if (card.openCycleConsumptionCents > 0) {
      addTo(
        buckets,
        bucketMonth(card.nextDueOn, currentMonth, lastMonth),
        "cardPaymentCents",
        card.openCycleConsumptionCents,
      );
    }
  }
}

/** Unconfirmed card gastos raise debt on the purchase date and cash on the cycle due. */
function applyCardRecurrences(
  buckets: Map<string, ProjectionMonth>,
  occurrences: PublicRecurrenceOccurrence[],
  cards: PublicCreditCard[],
  currency: Currency,
  currentMonth: string,
  lastMonth: string,
) {
  const byId = new Map(cards.map((card) => [card.id, card]));
  for (const item of occurrences) {
    if (!item.canAct || item.currency !== currency || !item.creditCardId) {
      continue;
    }
    const card = byId.get(item.creditCardId);
    if (!card) {
      continue;
    }
    if (item.kind === "ingreso") {
      addTo(buckets, bucketMonth(item.scheduledOn, currentMonth, lastMonth), "incomeCents", item.amountCents);
      continue;
    }
    addTo(
      buckets,
      bucketMonth(item.scheduledOn, currentMonth, lastMonth),
      "creditPurchaseCents",
      item.amountCents,
    );
    const dueOn = dueOnForClose(
      closeOnForOccurredOn(item.scheduledOn, card.closeDay),
      card.closeDay,
      card.dueDay,
    );
    addTo(buckets, bucketMonth(dueOn, currentMonth, lastMonth), "cardPaymentCents", item.amountCents);
  }
}

/** Account ingresos and gastos that are still programmed (not confirmed/omitted). */
function applyAccountRecurrences(
  buckets: Map<string, ProjectionMonth>,
  occurrences: PublicRecurrenceOccurrence[],
  currency: Currency,
  currentMonth: string,
  lastMonth: string,
) {
  for (const item of occurrences) {
    if (!item.canAct || item.currency !== currency || item.creditCardId) {
      continue;
    }
    const month = bucketMonth(item.scheduledOn, currentMonth, lastMonth);
    if (item.kind === "ingreso") {
      addTo(buckets, month, "incomeCents", item.amountCents);
    } else {
      addTo(buckets, month, "accountSpendCents", item.amountCents);
    }
  }
}

/** Builds end-of-month cash and net-worth from today's T/debt plus planned flows. */
export function projectCurrency(
  currency: Currency,
  cashTodayCents: number,
  debtTodayCents: number,
  occurrences: PublicRecurrenceOccurrence[],
  cards: PublicCreditCard[],
  startMonth: string,
  horizon: ProjectionHorizon,
): CurrencyProjection {
  const lastMonth = addYearMonths(startMonth, horizon - 1);
  const buckets = emptyBuckets(startMonth, horizon);
  applyAccountRecurrences(buckets, occurrences, currency, startMonth, lastMonth);
  applyInstallmentPayments(buckets, cards, currency, startMonth, lastMonth);
  applyCardRecurrences(buckets, occurrences, cards, currency, startMonth, lastMonth);

  let cash = cashTodayCents;
  let netWorth = cashTodayCents - debtTodayCents;
  const months: ProjectionMonth[] = [];
  let goesNegative = cash < 0;
  for (const row of buckets.values()) {
    cash += row.incomeCents - row.accountSpendCents - row.cardPaymentCents;
    netWorth += row.incomeCents - row.accountSpendCents - row.creditPurchaseCents;
    row.cashCents = cash;
    row.netWorthCents = netWorth;
    if (cash < 0) {
      goesNegative = true;
    }
    months.push(row);
  }
  return {
    currency,
    cashTodayCents,
    debtTodayCents,
    netWorthTodayCents: cashTodayCents - debtTodayCents,
    months,
    goesNegative,
  };
}

function totalsFor(
  accounts: PublicMoneyAccount[],
  cards: PublicCreditCard[],
  currency: Currency,
): { cash: number; debt: number } | null {
  const matching = accounts.filter((account) => account.currency === currency);
  const matchingCards = cards.filter((card) => card.currency === currency);
  if (matching.length === 0 && matchingCards.length === 0) {
    return null;
  }
  return {
    cash: matching.reduce((sum, account) => sum + account.balanceCents, 0),
    debt: matchingCards.reduce((sum, card) => sum + card.debtCents, 0),
  };
}

/** Loads 1–6 end-of-month points per currency. Plans de compra stay out (V2). */
export async function getProjection(
  userId: string,
  horizon: ProjectionHorizon,
): Promise<ProjectionResult> {
  const startMonth = yearMonthFromIso(localTodayIso());
  const lastMonth = addYearMonths(startMonth, horizon - 1);
  const [accounts, cards, occurrences] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listOccurrencesInRange(userId, startMonth, lastMonth),
  ]);

  function build(currency: Currency): CurrencyProjection | null {
    const totals = totalsFor(accounts, cards, currency);
    if (!totals) {
      return null;
    }
    return projectCurrency(
      currency,
      totals.cash,
      totals.debt,
      occurrences,
      cards,
      startMonth,
      horizon,
    );
  }

  return { horizon, ars: build("ARS"), usd: build("USD") };
}
