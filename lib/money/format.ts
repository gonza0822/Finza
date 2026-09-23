import type { Currency } from "@/lib/db/enums";

/** Formats cents with Argentine separators: 3.016.407,99 */
export function formatAmountEsAr(cents: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Formats an amount in the account currency. Never mixes ARS and USD. */
export function formatMoney(cents: number, currency: Currency): string {
  const formatted = formatAmountEsAr(cents);
  if (currency === "USD") {
    return `US$\u00A0${formatted}`;
  }
  return `$\u00A0${formatted}`;
}
