/** Splits a purchase into N installment amounts in cents; remainder goes on the last. */
export function splitInstallmentCents(totalCents: number, count: number): number[] {
  if (!Number.isInteger(count) || count < 1) {
    throw new Error("INVALID_INSTALLMENT_COUNT");
  }
  const base = Math.floor(totalCents / count);
  const remainder = totalCents - base * count;
  const parts = Array.from({ length: count }, () => base);
  parts[count - 1] += remainder;
  return parts;
}
