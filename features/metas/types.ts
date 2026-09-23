import type { Currency, GoalStatus } from "@/lib/db/enums";

export interface PublicSavingsGoal {
  id: string;
  name: string;
  targetCents: number;
  assignedCents: number;
  remainingCents: number;
  currency: Currency;
  targetMonth: string;
  status: GoalStatus;
  progressPercent: number;
  monthsLeft: number;
  monthlyNeededCents: number;
  hasPace: boolean;
}

export interface GoalFormState {
  error?: string;
  fieldErrors?: {
    name?: string;
    targetAmount?: string;
    assignedAmount?: string;
    currency?: string;
    targetMonth?: string;
  };
}

export interface GoalFormValues {
  name: string;
  targetAmount: string;
  assignedAmount: string;
  currency: Currency;
  targetMonth: string;
}

export interface AssignGoalFormState {
  error?: string;
  fieldErrors?: {
    amount?: string;
  };
}

export interface SoftCommittedByCurrency {
  ars: number;
  usd: number;
}
