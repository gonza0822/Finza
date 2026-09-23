import { z } from "zod";
import { CARD_BRANDS, CURRENCIES } from "@/lib/db/enums";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/money/parse";

const moneyString = z
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

const cycleDay = z.coerce.number().int().min(1).max(28);

const cardFields = {
  name: z.string().trim().min(1).max(80),
  brand: z.enum(CARD_BRANDS),
  lastFour: z
    .string()
    .trim()
    .regex(/^\d{4}$/),
  currency: z.enum(CURRENCIES),
  creditLimit: moneyString,
  closeDay: cycleDay,
  dueDay: cycleDay,
  paymentAccountId: z.string().uuid(),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((value) => (value ? value : undefined)),
};

export const createCreditCardSchema = z.object(cardFields).strict();

export const updateCreditCardSchema = z
  .object({
    id: z.string().uuid(),
    ...cardFields,
  })
  .strict();

export const creditCardIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateCreditCardInput = z.infer<typeof createCreditCardSchema>;
export type UpdateCreditCardInput = z.infer<typeof updateCreditCardSchema>;
