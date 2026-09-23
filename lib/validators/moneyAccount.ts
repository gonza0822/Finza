import { z } from "zod";
import { ACCOUNT_TYPES, CURRENCIES } from "@/lib/db/enums";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/money/parse";

const moneyString = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform((raw, ctx) => {
    const cents = parseMoneyToCents(raw);
    if (cents === null) {
      ctx.addIssue({ code: "custom", message: "invalid_money" });
      return z.NEVER;
    }
    return centsToDecimalString(cents);
  });

export const createMoneyAccountSchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    type: z.enum(ACCOUNT_TYPES),
    currency: z.enum(CURRENCIES),
    initialBalance: moneyString,
    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .strict();

export const updateMoneyAccountSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().trim().min(1).max(80),
    type: z.enum(ACCOUNT_TYPES),
    currency: z.enum(CURRENCIES),
    initialBalance: moneyString,
    notes: z
      .string()
      .trim()
      .max(500)
      .optional()
      .transform((value) => (value ? value : undefined)),
  })
  .strict();

export const moneyAccountIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateMoneyAccountInput = z.infer<typeof createMoneyAccountSchema>;
export type UpdateMoneyAccountInput = z.infer<typeof updateMoneyAccountSchema>;
