import { z } from "zod";

/** Oficial USD quote from dolarapi.com (venta is pesos per dollar). */
export const oficialUsdQuoteSchema = z
  .object({
    venta: z.number().positive().max(1_000_000),
  })
  .passthrough();

export type OficialUsdQuote = z.infer<typeof oficialUsdQuoteSchema>;
