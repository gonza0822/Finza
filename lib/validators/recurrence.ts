import { z } from "zod";
import { isIsoCalendarDate } from "@/lib/dates/isoDate";
import {
  RECURRENCE_CLASSES,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_KINDS,
} from "@/lib/db/enums";
import { centsToDecimalString, parseMoneyToCents } from "@/lib/money/parse";

const name = z.string().trim().min(1).max(80);

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

const isoDate = z
  .string()
  .trim()
  .refine((value) => isIsoCalendarDate(value), { message: "invalid_date" });

const dueDayMonthly = z.coerce.number().int().min(1).max(31);
const dueDayWeekly = z.coerce.number().int().min(1).max(7);
const dueMonth = z.coerce.number().int().min(1).max(12);

const baseRule = {
  name,
  kind: z.enum(RECURRENCE_KINDS),
  ruleClass: z.enum(RECURRENCE_CLASSES),
  amount: positiveMoney,
  startsOn: isoDate,
  endsOn: z
    .string()
    .trim()
    .optional()
    .transform((value) => (value ? value : undefined))
    .refine((value) => value === undefined || isIsoCalendarDate(value), { message: "invalid_date" }),
  categoryId: z.string().uuid(),
};

const accountFields = {
  paidWith: z.literal("cuenta"),
  accountId: z.string().uuid(),
};

const cardFields = {
  paidWith: z.literal("tarjeta"),
  creditCardId: z.string().uuid(),
};

function withSchedule<T extends z.ZodRawShape>(fields: T) {
  return z.discriminatedUnion("frequency", [
    z
      .object({
        ...fields,
        ...baseRule,
        frequency: z.literal("mensual"),
        dueDay: dueDayMonthly,
      })
      .strict(),
    z
      .object({
        ...fields,
        ...baseRule,
        frequency: z.literal("semanal"),
        dueDay: dueDayWeekly,
      })
      .strict(),
    z
      .object({
        ...fields,
        ...baseRule,
        frequency: z.literal("anual"),
        dueDay: dueDayMonthly,
        dueMonth,
      })
      .strict(),
  ]);
}

export const createRecurrenceRuleSchema = z.union([
  withSchedule(accountFields),
  z.discriminatedUnion("frequency", [
    z
      .object({
        ...cardFields,
        ...baseRule,
        kind: z.literal("gasto"),
        frequency: z.literal("mensual"),
        dueDay: dueDayMonthly,
      })
      .strict(),
    z
      .object({
        ...cardFields,
        ...baseRule,
        kind: z.literal("gasto"),
        frequency: z.literal("semanal"),
        dueDay: dueDayWeekly,
      })
      .strict(),
    z
      .object({
        ...cardFields,
        ...baseRule,
        kind: z.literal("gasto"),
        frequency: z.literal("anual"),
        dueDay: dueDayMonthly,
        dueMonth,
      })
      .strict(),
  ]),
]);

export const recurrenceRuleIdSchema = z.object({ id: z.string().uuid() }).strict();
export const recurrenceOccurrenceIdSchema = z.object({ id: z.string().uuid() }).strict();

export type CreateRecurrenceRuleInput = z.infer<typeof createRecurrenceRuleSchema>;
