import type { RecurrenceFrequency } from "@/lib/db/enums";

interface Ymd {
  year: number;
  month: number;
  day: number;
}

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses YYYY-MM-DD into calendar parts. */
function parseIso(iso: string): Ymd {
  const match = ISO_DATE.exec(iso);
  if (!match) {
    throw new Error("INVALID_ISO_DATE");
  }
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

/** Formats calendar parts as YYYY-MM-DD. */
function toIso(year: number, month: number, day: number): string {
  const date = new Date(year, month - 1, day);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Last calendar day of a 1–12 month. */
function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** Clamps a day onto a real calendar date (31 in February → 28/29). */
function clampToMonth(year: number, month: number, day: number): string {
  return toIso(year, month, Math.min(day, lastDayOfMonth(year, month)));
}

/** First day of the calendar month that contains `iso`. */
export function startOfMonthIso(iso: string): string {
  const { year, month } = parseIso(iso);
  return toIso(year, month, 1);
}

/** Adds whole calendar months to a YYYY-MM-DD date. */
export function addMonthsIso(iso: string, months: number): string {
  const { year, month, day } = parseIso(iso);
  return clampToMonth(year, month + months, day);
}

export interface RecurrenceSchedule {
  frequency: RecurrenceFrequency;
  dueDay: number;
  dueMonth: number | null;
  startsOn: string;
  endsOn: string | null;
}

/** Dates in [fromIso, toIso] that a rule should fire, honoring start/end. */
export function scheduledDatesInRange(
  rule: RecurrenceSchedule,
  fromIso: string,
  toIso: string,
): string[] {
  const start = rule.startsOn > fromIso ? rule.startsOn : fromIso;
  const end = rule.endsOn && rule.endsOn < toIso ? rule.endsOn : toIso;
  if (start > end) {
    return [];
  }
  if (rule.frequency === "mensual") {
    return monthlyDates(rule.dueDay, start, end);
  }
  if (rule.frequency === "anual") {
    return yearlyDates(rule.dueMonth ?? 1, rule.dueDay, start, end);
  }
  return weeklyDates(rule.dueDay, start, end);
}

function monthlyDates(dueDay: number, start: string, end: string): string[] {
  const dates: string[] = [];
  const from = parseIso(start);
  const until = parseIso(end);
  let year = from.year;
  let month = from.month;
  while (year < until.year || (year === until.year && month <= until.month)) {
    const iso = clampToMonth(year, month, dueDay);
    if (iso >= start && iso <= end) {
      dates.push(iso);
    }
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
  }
  return dates;
}

function yearlyDates(dueMonth: number, dueDay: number, start: string, end: string): string[] {
  const dates: string[] = [];
  const from = parseIso(start);
  const until = parseIso(end);
  for (let year = from.year; year <= until.year; year += 1) {
    const iso = clampToMonth(year, dueMonth, dueDay);
    if (iso >= start && iso <= end) {
      dates.push(iso);
    }
  }
  return dates;
}

/** ISO weekday 1 (Mon) … 7 (Sun) matching `dueDay` for weekly rules. */
function weeklyDates(isoWeekday: number, start: string, end: string): string[] {
  const dates: string[] = [];
  const cursor = parseIso(start);
  const date = new Date(cursor.year, cursor.month - 1, cursor.day);
  const jsWanted = isoWeekday === 7 ? 0 : isoWeekday;
  while (date.getDay() !== jsWanted) {
    date.setDate(date.getDate() + 1);
  }
  while (true) {
    const iso = toIso(date.getFullYear(), date.getMonth() + 1, date.getDate());
    if (iso > end) {
      break;
    }
    if (iso >= start) {
      dates.push(iso);
    }
    date.setDate(date.getDate() + 7);
  }
  return dates;
}
