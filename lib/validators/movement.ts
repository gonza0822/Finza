import { z } from "zod";
import { isIsoCalendarDate, localTodayIso } from "@/lib/dates/isoDate";
import { MAX_INSTALLMENT_COUNT } from "@/lib/db/enums";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/money/parse";

const occurredOn = z
  .string()
  .trim()
  .refine((value) => isIsoCalendarDate(value), { message: "invalid_date" })
  .refine((value) => value <= localTodayIso(), { message: "future_date" });

const notesOptional = z
  .string()
  .trim()
  .max(500)
  .optional()
  .transform((value) => (value ? value : undefined));

const notesRequired = z.string().trim().min(1).max(500);

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

const observedMoney = z
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

const installmentCount = z
  .string()
  .trim()
  .max(2)
  .transform((raw, ctx) => {
    const value = raw === "" ? 1 : Number(raw);
    if (!Number.isInteger(value) || value < 1 || value > MAX_INSTALLMENT_COUNT) {
      ctx.addIssue({ code: "custom", message: "invalid_installments" });
      return z.NEVER;
    }
    return value;
  });

const consumptionAccountFields = {
  paidWith: z.literal("cuenta"),
  accountId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: positiveMoney,
  occurredOn,
  notes: notesOptional,
};

const consumptionCardFields = {
  paidWith: z.literal("tarjeta"),
  creditCardId: z.string().uuid(),
  categoryId: z.string().uuid(),
  amount: positiveMoney,
  occurredOn,
  notes: notesOptional,
  installmentCount,
};

export const createMovementSchema = z.union([
  z.object({ type: z.literal("gasto"), ...consumptionAccountFields }).strict(),
  z.object({ type: z.literal("gasto"), ...consumptionCardFields }).strict(),
  z
    .object({
      type: z.literal("ingreso"),
      accountId: z.string().uuid(),
      categoryId: z.string().uuid(),
      amount: positiveMoney,
      occurredOn,
      notes: notesOptional,
    })
    .strict(),
  z
    .object({
      type: z.literal("transferencia"),
      accountId: z.string().uuid(),
      counterAccountId: z.string().uuid(),
      amount: positiveMoney,
      occurredOn,
      notes: notesOptional,
    })
    .strict(),
  z
    .object({
      type: z.literal("conversion"),
      accountId: z.string().uuid(),
      counterAccountId: z.string().uuid(),
      amount: positiveMoney,
      counterAmount: positiveMoney,
      occurredOn,
      notes: notesOptional,
    })
    .strict(),
  z
    .object({
      type: z.literal("ajuste"),
      accountId: z.string().uuid(),
      observedBalance: observedMoney,
      occurredOn,
      notes: notesRequired,
    })
    .strict(),
  z
    .object({
      type: z.literal("pago_tarjeta"),
      creditCardId: z.string().uuid(),
      accountId: z.string().uuid(),
      amount: positiveMoney,
      occurredOn,
      notes: notesOptional,
    })
    .strict(),
]);

export const movementIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateMovementInput = z.infer<typeof createMovementSchema>;
