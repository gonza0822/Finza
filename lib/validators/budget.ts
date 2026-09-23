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

const yearMonth = z
  .string()
  .trim()
  .refine((value) => isYearMonth(value), { message: "invalid_month" });

export const createBudgetSchema = z
  .object({
    categoryId: z.string().uuid(),
    yearMonth,
    amount: positiveMoney,
    currency: z.enum(CURRENCIES),
  })
  .strict();

export const updateBudgetSchema = z
  .object({
    id: z.string().uuid(),
    categoryId: z.string().uuid(),
    yearMonth,
    amount: positiveMoney,
    currency: z.enum(CURRENCIES),
  })
  .strict();

export const budgetIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
