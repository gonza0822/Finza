/** Local calendar date as YYYY-MM-DD (not UTC, so “today” matches the date picker). */
export function localTodayIso(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** True when the string is a real calendar day in YYYY-MM-DD. */
export function isIsoCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

/** Formats a YYYY-MM-DD book date for es-AR without shifting a day across timezones. */
export function formatIsoDateEsAr(iso: string): string {
  const [year, month, day] = iso.split("-").map(Number);
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

const YEAR_MONTH = /^(\d{4})-(0[1-9]|1[0-2])$/;

/** True when the string is a real calendar month in YYYY-MM. */
export function isYearMonth(value: string): boolean {
  const match = YEAR_MONTH.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  return year >= 2000 && year <= 2100;
}

/** YYYY-MM of a YYYY-MM-DD date. */
export function yearMonthFromIso(iso: string): string {
  return iso.slice(0, 7);
}

/** First day of a YYYY-MM month. */
export function startOfYearMonth(yearMonth: string): string {
  return `${yearMonth}-01`;
}

/** Last calendar day of a YYYY-MM month. */
export function endOfYearMonth(yearMonth: string): string {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  const last = new Date(year, month, 0).getDate();
  return `${yearMonth}-${String(last).padStart(2, "0")}`;
}

/** Adds whole months to a YYYY-MM value. */
export function addYearMonths(yearMonth: string, delta: number): string {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  const date = new Date(year, month - 1 + delta, 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}`;
}

/** Inclusive month count between two YYYY-MM values (same month → 1). */
export function monthsInclusive(fromYearMonth: string, toYearMonth: string): number {
  const fromYear = Number(fromYearMonth.slice(0, 4));
  const fromMonth = Number(fromYearMonth.slice(5, 7));
  const toYear = Number(toYearMonth.slice(0, 4));
  const toMonth = Number(toYearMonth.slice(5, 7));
  return (toYear - fromYear) * 12 + (toMonth - fromMonth) + 1;
}

/** Month label in es-AR (“septiembre de 2026”). */
export function formatYearMonthEsAr(yearMonth: string): string {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  return new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(
    new Date(year, month - 1, 1),
  );
}

const CHART_MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** Short month for chart ticks (“sep 26”), so labels do not overlap or clip. */
export function formatYearMonthChartEsAr(yearMonth: string): string {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  return `${CHART_MONTHS[month - 1]} ${String(year).slice(-2)}`;
}
