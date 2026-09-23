import { z } from "zod";
import { CURRENCIES } from "@/lib/db/enums";
import { isYearMonth } from "@/lib/dates/isoDate";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/money/parse";

const positiveMoney = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform((raw, ctx) => {
    const cents = parseMoneyToCents(raw);
    if (cents === null || cents <= 0) {
      ctx.addIssue({ code: "custom", message: "invalid_money" });
      return z.NEVER;
    }
    return centsToDecimalString(cents);
  });

const optionalNonNegativeMoney = z
  .string()
  .trim()
  .max(32)
  .transform((raw, ctx) => {
    if (!raw) {
      return "0.00";
    }
    const cents = parseMoneyToCents(raw);
    if (cents === null || cents < 0) {
      ctx.addIssue({ code: "custom", message: "invalid_money" });
      return z.NEVER;
    }
    return centsToDecimalString(cents);
  });

const yearMonth = z
  .string()
  .trim()
  .refine((value) => isYearMonth(value), { message: "invalid_month" });

const goalName = z.string().trim().min(1).max(80);

export const createSavingsGoalSchema = z
  .object({
    name: goalName,
    targetAmount: positiveMoney,
    assignedAmount: optionalNonNegativeMoney,
    currency: z.enum(CURRENCIES),
    targetMonth: yearMonth,
  })
  .strict();

export const updateSavingsGoalSchema = z
  .object({
    id: z.string().uuid(),
    name: goalName,
    targetAmount: positiveMoney,
    currency: z.enum(CURRENCIES),
    targetMonth: yearMonth,
  })
  .strict();

export const assignSavingsGoalSchema = z
  .object({
    id: z.string().uuid(),
    amount: positiveMoney,
  })
  .strict();

export const savingsGoalIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type AssignSavingsGoalInput = z.infer<typeof assignSavingsGoalSchema>;
