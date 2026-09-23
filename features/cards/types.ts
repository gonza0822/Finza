import type { CardBrand, Currency } from "@/lib/db/enums";

export interface PublicCreditCard {
  id: string;
  name: string;
  brand: CardBrand;
  lastFour: string;
  currency: Currency;
  creditLimitCents: number;
  closeDay: number;
  dueDay: number;
  paymentAccountId: string;
  paymentAccountName: string;
  notes: string | null;
  sortOrder: number;
  archived: boolean;
  hasLedgers: boolean;
  debtCents: number;
  availableCents: number;
  overLimit: boolean;
  openCycleConsumptionCents: number;
  dueNowCents: number;
  nextCloseOn: string;
  nextDueOn: string;
  remainingPurchases: PublicInstallmentPurchase[];
  installmentPurchases: PublicInstallmentPurchase[];
}

export interface PublicInstallmentPurchase {
  movementId: string;
  categoryName: string | null;
  notes: string | null;
  occurredOn: string;
  count: number;
  totalCents: number;
  remainingCents: number;
  nextDueOn: string;
  installments: PublicInstallment[];
}

export interface PublicInstallment {
  id: string;
  number: number;
  count: number;
  amountCents: number;
  remainingCents: number;
  closeOn: string;
  dueOn: string;
}

export interface CreditCardFormState {
  error?: string;
  fieldErrors?: {
    name?: string;
    brand?: string;
    lastFour?: string;
    currency?: string;
    creditLimit?: string;
    closeDay?: string;
    dueDay?: string;
    paymentAccountId?: string;
    notes?: string;
  };
}

export interface CreditCardFormValues {
  name: string;
  brand: CardBrand;
  lastFour: string;
  currency: Currency;
  creditLimit: string;
  closeDay: number;
  dueDay: number;
  paymentAccountId: string;
  notes: string;
}
