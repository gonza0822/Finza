import type { AccountType, Currency } from "@/lib/db/enums";

export interface PublicMoneyAccount {
  id: string;
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalanceCents: number;
  balanceCents: number;
  notes: string | null;
  sortOrder: number;
  archived: boolean;
  hasLedgers: boolean;
}

export interface MoneyAccountFormState {
  error?: string;
  fieldErrors?: {
    name?: string;
    type?: string;
    currency?: string;
    initialBalance?: string;
    notes?: string;
  };
}

export interface MoneyAccountFormValues {
  name: string;
  type: AccountType;
  currency: Currency;
  initialBalance: string;
  notes: string;
}
