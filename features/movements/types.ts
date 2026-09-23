import type { AjusteDirection, Currency, LedgerType, MovementStatus } from "@/lib/db/enums";

export interface PublicMovement {
  id: string;
  type: LedgerType;
  status: MovementStatus;
  occurredOn: string;
  amountCents: number;
  currency: Currency;
  accountId: string | null;
  accountName: string;
  creditCardId: string | null;
  creditCardName: string | null;
  counterAccountId: string | null;
  counterAccountName: string | null;
  counterAmountCents: number | null;
  counterCurrency: Currency | null;
  ajusteDirection: AjusteDirection | null;
  categoryId: string | null;
  categoryName: string | null;
  notes: string | null;
  installmentCount: number;
}

export interface MovementFormState {
  error?: string;
  fieldErrors?: {
    type?: string;
    accountId?: string;
    creditCardId?: string;
    counterAccountId?: string;
    categoryId?: string;
    amount?: string;
    counterAmount?: string;
    observedBalance?: string;
    occurredOn?: string;
    notes?: string;
    installmentCount?: string;
  };
}
