import type { Currency } from "@/lib/db/enums";

export interface CurrencySituation {
  currency: Currency;
  cashCents: number;
  debtCents: number;
  netWorthCents: number;
  committedCents: number;
  freeCents: number;
  accountCount: number;
}

export interface SituationTotals {
  ars: CurrencySituation | null;
  usd: CurrencySituation | null;
}
