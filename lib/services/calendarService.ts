import { dueOnForClose } from "@/lib/cards/cycleDates";
import { addMonthsIso } from "@/lib/recurrence/schedule";
import { yearMonthFromIso } from "@/lib/dates/isoDate";
import type { PublicCreditCard } from "@/features/cards/types";
import type { PublicRecurrenceOccurrence } from "@/features/planificacion/types";
import type { CalendarDayEvent } from "@/features/planificacion/budgetTypes";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listMonthOccurrences } from "@/lib/services/recurrenceService";

function closeOnInMonth(yearMonth: string, closeDay: number): string {
  return `${yearMonth}-${String(closeDay).padStart(2, "0")}`;
}

/** Card due dates that fall in this calendar month (from this or the previous close). */
export function cardDueDatesInMonth(
  yearMonth: string,
  closeDay: number,
  dueDay: number,
): string[] {
  const closeThis = closeOnInMonth(yearMonth, closeDay);
  const closePrev = addMonthsIso(closeThis, -1);
  const dues = [
    dueOnForClose(closeThis, closeDay, dueDay),
    dueOnForClose(closePrev, closeDay, dueDay),
  ];
  return [...new Set(dues.filter((date) => yearMonthFromIso(date) === yearMonth))];
}

function cardDueEvents(yearMonth: string, cards: PublicCreditCard[]): CalendarDayEvent[] {
  const events: CalendarDayEvent[] = [];
  for (const card of cards) {
    for (const date of cardDueDatesInMonth(yearMonth, card.closeDay, card.dueDay)) {
      const isNextDue = date === card.nextDueOn;
      events.push({
        id: `card:${card.id}:${date}`,
        kind: "card_due",
        date,
        title: card.name,
        detail: "",
        amountCents: isNextDue ? card.dueNowCents : null,
        currency: card.currency,
        href: `/tarjetas/${card.id}`,
        occurrenceId: null,
        canAct: false,
      });
    }
  }
  events.sort((left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title));
  return events;
}

function recurrenceEvents(occurrences: PublicRecurrenceOccurrence[]): CalendarDayEvent[] {
  return occurrences.map((item) => ({
    id: `occ:${item.id}`,
    kind: "recurrence" as const,
    date: item.scheduledOn,
    title: item.ruleName,
    detail: item.creditCardName ?? item.accountName ?? "",
    amountCents: item.kind === "gasto" ? -item.amountCents : item.amountCents,
    currency: item.currency,
    href: null,
    occurrenceId: item.id,
    canAct: item.canAct,
  }));
}

/** Recurrence dates plus card dues for one calendar month. Plans de compra are later. */
export async function listCalendarEvents(
  userId: string,
  yearMonth: string,
): Promise<CalendarDayEvent[]> {
  const [occurrences, cards] = await Promise.all([
    listMonthOccurrences(userId, yearMonth),
    listActiveCreditCards(userId),
  ]);
  return [...recurrenceEvents(occurrences), ...cardDueEvents(yearMonth, cards)].sort(
    (left, right) => left.date.localeCompare(right.date) || left.title.localeCompare(right.title),
  );
}
