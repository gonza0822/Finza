import type { Currency } from "@/lib/db/enums";

export interface ProfileFormState {
  error?: string;
  success?: string;
  fieldErrors?: {
    name?: string;
    defaultCurrency?: string;
    goalsCountAsCommitted?: string;
  };
}

export interface ProfileFormValues {
  name: string;
  email: string;
  defaultCurrency: Currency;
  goalsCountAsCommitted: boolean;
}
