const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

interface Ymd {
  year: number;
  month: number;
  day: number;
}

/** Parses YYYY-MM-DD into calendar parts. */
function parseIso(iso: string): Ymd {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    throw new Error("INVALID_ISO_DATE");
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Formats calendar parts as YYYY-MM-DD (days 1–28 never overflow a month). */
function toIso(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Close date that owns a purchase: same month if the day is on or before close day. */
export function closeOnForOccurredOn(occurredOn: string, closeDay: number): string {
  const { year, month, day } = parseIso(occurredOn);
  if (day <= closeDay) {
    return toIso(year, month, closeDay);
  }
  return toIso(year, month + 1, closeDay);
}

/** Due date for a cycle: later due day stays in the close month; earlier due day rolls to the next. */
export function dueOnForClose(closeOn: string, closeDay: number, dueDay: number): string {
  const { year, month } = parseIso(closeOn);
  if (dueDay > closeDay) {
    return toIso(year, month, dueDay);
  }
  return toIso(year, month + 1, dueDay);
}

/** Next close from today, including today when it is the close day. */
export function nextCloseOn(today: string, closeDay: number): string {
  return closeOnForOccurredOn(today, closeDay);
}

/** Next due date that belongs to the next close. */
export function nextDueOn(today: string, closeDay: number, dueDay: number): string {
  return dueOnForClose(nextCloseOn(today, closeDay), closeDay, dueDay);
}

/** Close date N calendar months after a cycle close (close day is 1–28, so no overflow). */
export function closeOnAfterMonths(closeOn: string, monthsAhead: number): string {
  const { year, month, day } = parseIso(closeOn);
  return toIso(year, month + monthsAhead, day);
}
