import type { Currency } from "@/lib/db/enums";

export type BudgetAlertLevel = "ok" | "alerta" | "excedido";

export interface PublicBudget {
  id: string;
  categoryId: string;
  categoryName: string;
  parentCategoryName: string | null;
  yearMonth: string;
  amountCents: number;
  usedCents: number;
  currency: Currency;
  alert: BudgetAlertLevel;
}

export interface BudgetFormState {
  error?: string;
  fieldErrors?: {
    categoryId?: string;
    yearMonth?: string;
    amount?: string;
    currency?: string;
  };
}

export interface BudgetFormValues {
  categoryId: string;
  yearMonth: string;
  amount: string;
  currency: Currency;
}

export type CalendarEventKind = "recurrence" | "card_due";

export interface CalendarDayEvent {
  id: string;
  kind: CalendarEventKind;
  date: string;
  title: string;
  detail: string;
  amountCents: number | null;
  currency: Currency;
  href: string | null;
  occurrenceId: string | null;
  canAct: boolean;
}
