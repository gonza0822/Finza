import type { Currency } from "@/lib/db/enums";

export const PROJECTION_HORIZONS = [1, 2, 3, 4, 5, 6] as const;
export type ProjectionHorizon = (typeof PROJECTION_HORIZONS)[number];

export interface ProjectionMonth {
  yearMonth: string;
  incomeCents: number;
  accountSpendCents: number;
  cardPaymentCents: number;
  creditPurchaseCents: number;
  cashCents: number;
  netWorthCents: number;
}

export interface CurrencyProjection {
  currency: Currency;
  cashTodayCents: number;
  debtTodayCents: number;
  netWorthTodayCents: number;
  months: ProjectionMonth[];
  goesNegative: boolean;
}

export interface ProjectionResult {
  horizon: ProjectionHorizon;
  ars: CurrencyProjection | null;
  usd: CurrencyProjection | null;
}
