import { formatAmountEsAr } from "@/lib/money/format";

const MAX_ABS_CENTS = 999_999_999_999_99;

/** Parses a user amount (AR or US separators) into integer cents. */
export function parseMoneyToCents(raw: string): number | null {
  const trimmed = raw.trim().replace(/\s/g, "");
  if (!trimmed) {
    return null;
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  if (!unsigned) {
    return null;
  }

  const hasComma = unsigned.includes(",");
  const hasDot = unsigned.includes(".");
  let normalized = unsigned;

  if (hasComma && hasDot) {
    if (unsigned.lastIndexOf(",") > unsigned.lastIndexOf(".")) {
      normalized = unsigned.replace(/\./g, "").replace(",", ".");
    } else {
      normalized = unsigned.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = unsigned.replace(",", ".");
  } else if (/^\d{1,3}(\.\d{3})+$/.test(unsigned)) {
    normalized = unsigned.replace(/\./g, "");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return null;
  }

  const [wholePart, fractionPart = ""] = normalized.split(".");
  const cents = Number(wholePart) * 100 + Number(fractionPart.padEnd(2, "0"));
  if (!Number.isSafeInteger(cents) || cents > MAX_ABS_CENTS) {
    return null;
  }

  return negative ? -cents : cents;
}

/** Turns a DECIMAL string/number from MySQL into cents. */
export function decimalToCents(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.round(value * 100);
  }
  if (typeof value === "string") {
    const parsed = parseMoneyToCents(value.replace(",", "."));
    if (parsed !== null) {
      return parsed;
    }
  }
  return 0;
}

/** Formats cents as a DECIMAL string for Sequelize. */
export function centsToDecimalString(cents: number): string {
  const sign = cents < 0 ? "-" : "";
  const abs = Math.abs(cents);
  const whole = Math.floor(abs / 100);
  const frac = String(abs % 100).padStart(2, "0");
  return `${sign}${whole}.${frac}`;
}

/** Formats cents for an input field (miles with dots, decimals with comma). */
export function centsToInputValue(cents: number): string {
  return formatAmountEsAr(cents);
}
