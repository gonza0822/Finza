import type { Currency } from "@/lib/db/enums";
import type {
  RecurrenceClass,
  RecurrenceFrequency,
  RecurrenceKind,
  RecurrenceOccurrenceStatus,
  RecurrenceRuleStatus,
} from "@/lib/db/enums";

export interface PublicRecurrenceRule {
  id: string;
  name: string;
  kind: RecurrenceKind;
  ruleClass: RecurrenceClass;
  amountCents: number;
  amountCurrency: Currency;
  currency: Currency;
  estimatedLedgerCents: number | null;
  frequency: RecurrenceFrequency;
  dueDay: number;
  dueMonth: number | null;
  accountId: string | null;
  accountName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  categoryId: string;
  categoryName: string;
  startsOn: string;
  endsOn: string | null;
  status: RecurrenceRuleStatus;
}

export interface PublicRecurrenceOccurrence {
  id: string;
  ruleId: string;
  ruleName: string;
  kind: RecurrenceKind;
  scheduledOn: string;
  amountCents: number;
  quotedAmountCents: number;
  quotedCurrency: Currency;
  convertsOnConfirm: boolean;
  status: RecurrenceOccurrenceStatus;
  displayStatus: RecurrenceOccurrenceStatus;
  accountName: string | null;
  creditCardId: string | null;
  creditCardName: string | null;
  currency: Currency;
  canAct: boolean;
}

export interface RecurrenceFormState {
  error?: string;
  fieldErrors?: {
    name?: string;
    kind?: string;
    ruleClass?: string;
    amount?: string;
    amountCurrency?: string;
    frequency?: string;
    dueDay?: string;
    dueMonth?: string;
    accountId?: string;
    creditCardId?: string;
    categoryId?: string;
    startsOn?: string;
    endsOn?: string;
  };
}

export interface RecurrenceFormValues {
  name: string;
  kind: RecurrenceKind;
  ruleClass: RecurrenceClass;
  amount: string;
  amountCurrency: Currency;
  frequency: RecurrenceFrequency;
  dueDay: number;
  dueMonth: number;
  paidWith: "cuenta" | "tarjeta";
  accountId: string;
  creditCardId: string;
  categoryId: string;
  startsOn: string;
  endsOn: string;
}
