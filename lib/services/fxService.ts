import { oficialUsdQuoteSchema } from "@/lib/validators/fx";

const OFICIAL_USD_URL = "https://dolarapi.com/v1/dolares/oficial";
const FETCH_MS = 5000;

export class OfficialUsdRateError extends Error {
  constructor() {
    super("OFFICIAL_USD_RATE");
    this.name = "OfficialUsdRateError";
  }
}

/** Official USD sell rate (pesos per dollar) from dolarapi; cached about an hour. */
export async function getOfficialUsdSellRate(): Promise<number> {
  let response: Response;
  try {
    response = await fetch(OFICIAL_USD_URL, {
      signal: AbortSignal.timeout(FETCH_MS),
      next: { revalidate: 3600 },
    });
  } catch {
    throw new OfficialUsdRateError();
  }
  if (!response.ok) {
    throw new OfficialUsdRateError();
  }
  const body: unknown = await response.json();
  const parsed = oficialUsdQuoteSchema.safeParse(body);
  if (!parsed.success) {
    throw new OfficialUsdRateError();
  }
  return parsed.data.venta;
}

/** Sell rate or null when the quote is unavailable. */
export async function getOfficialUsdSellRateOrNull(): Promise<number | null> {
  try {
    return await getOfficialUsdSellRate();
  } catch {
    return null;
  }
}
