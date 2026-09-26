/** Converts USD cents to ARS cents using the official sell rate (pesos per dollar). */
export function usdCentsToArsCents(usdCents: number, sellPesosPerDollar: number): number {
  return Math.round(usdCents * sellPesosPerDollar);
}
