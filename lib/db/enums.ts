export const CURRENCIES = ["ARS", "USD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const ACCOUNT_TYPES = ["banco", "billetera", "efectivo", "otro"] as const;
export type AccountType = (typeof ACCOUNT_TYPES)[number];

export const CATEGORY_KINDS = ["gasto", "ingreso", "ajuste"] as const;
export type CategoryKind = (typeof CATEGORY_KINDS)[number];

export const LEDGER_TYPES = [
  "gasto",
  "ingreso",
  "transferencia",
  "conversion",
  "ajuste",
  "pago_tarjeta",
] as const;
export type LedgerType = (typeof LEDGER_TYPES)[number];

export const CONSUMPTION_TYPES = ["gasto", "ingreso"] as const;
export type ConsumptionType = (typeof CONSUMPTION_TYPES)[number];

export const AJUSTE_DIRECTIONS = ["sube", "baja"] as const;
export type AjusteDirection = (typeof AJUSTE_DIRECTIONS)[number];

export const MOVEMENT_STATUSES = ["confirmado", "anulado"] as const;
export type MovementStatus = (typeof MOVEMENT_STATUSES)[number];

export const PAYMENT_MEANS = ["efectivo", "transferencia", "debito", "credito"] as const;
export type PaymentMean = (typeof PAYMENT_MEANS)[number];

export const CARD_BRANDS = ["visa", "mastercard", "amex", "naranja", "otra"] as const;
export type CardBrand = (typeof CARD_BRANDS)[number];

export const PAID_WITH = ["cuenta", "tarjeta"] as const;
export type PaidWith = (typeof PAID_WITH)[number];

export const INSTALLMENT_STATUSES = ["pendiente", "en_resumen", "pagada", "anulada"] as const;
export type InstallmentStatus = (typeof INSTALLMENT_STATUSES)[number];

export const MAX_INSTALLMENT_COUNT = 36;

export const RECURRENCE_KINDS = ["gasto", "ingreso"] as const;
export type RecurrenceKind = (typeof RECURRENCE_KINDS)[number];

export const RECURRENCE_CLASSES = [
  "suscripcion",
  "servicio",
  "alquiler",
  "envio_tercero",
  "sueldo",
  "otro",
] as const;
export type RecurrenceClass = (typeof RECURRENCE_CLASSES)[number];

export const RECURRENCE_FREQUENCIES = ["semanal", "mensual", "anual"] as const;
export type RecurrenceFrequency = (typeof RECURRENCE_FREQUENCIES)[number];

export const RECURRENCE_RULE_STATUSES = ["activa", "pausada", "finalizada"] as const;
export type RecurrenceRuleStatus = (typeof RECURRENCE_RULE_STATUSES)[number];

export const RECURRENCE_OCCURRENCE_STATUSES = [
  "programada",
  "confirmada",
  "omitida",
  "vencida",
] as const;
export type RecurrenceOccurrenceStatus = (typeof RECURRENCE_OCCURRENCE_STATUSES)[number];

export const GOAL_STATUSES = ["activo", "alcanzado", "pausado", "cancelado"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

export const GOAL_SOFT_COMMIT_STATUSES = ["activo", "alcanzado"] as const;
export type GoalSoftCommitStatus = (typeof GOAL_SOFT_COMMIT_STATUSES)[number];
