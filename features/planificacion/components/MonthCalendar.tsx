"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { confirmOccurrenceAction, omitOccurrenceAction } from "@/lib/actions/recurrence";
import { planificacionContent } from "@/lib/content/planificacion";
import { formatMoney } from "@/lib/money/format";
import { localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import type { CalendarDayEvent } from "@/features/planificacion/budgetTypes";

interface MonthCalendarProps {
  yearMonth: string;
  events: CalendarDayEvent[];
}

interface CalendarCell {
  day: number | null;
  iso: string | null;
}

function cellsForMonth(yearMonth: string): CalendarCell[] {
  const year = Number(yearMonth.slice(0, 4));
  const month = Number(yearMonth.slice(5, 7));
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const mondayOffset = (firstWeekday + 6) % 7;
  const lastDay = new Date(year, month, 0).getDate();
  const cells: CalendarCell[] = [];
  for (let index = 0; index < mondayOffset; index += 1) {
    cells.push({ day: null, iso: null });
  }
  for (let day = 1; day <= lastDay; day += 1) {
    cells.push({
      day,
      iso: `${yearMonth}-${String(day).padStart(2, "0")}`,
    });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: null, iso: null });
  }
  return cells;
}

/** Month grid of recurrences and card dues; a selected day lists confirm/omit. */
export function MonthCalendar({ yearMonth, events }: MonthCalendarProps) {
  const today = localTodayIso();
  const eventsByDay = useMemo(() => {
    const map = new Map<string, CalendarDayEvent[]>();
    for (const event of events) {
      const list = map.get(event.date) ?? [];
      list.push(event);
      map.set(event.date, list);
    }
    return map;
  }, [events]);

  const defaultDay = useMemo(() => {
    if (yearMonthFromIso(today) === yearMonth) {
      return today;
    }
    const firstEvent = events[0]?.date;
    return firstEvent ?? `${yearMonth}-01`;
  }, [events, today, yearMonth]);

  const [selected, setSelected] = useState(defaultDay);
  const selectedEvents = eventsByDay.get(selected) ?? [];
  const cells = cellsForMonth(yearMonth);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold tracking-wide text-muted uppercase">
        {planificacionContent.weekdayShort.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((cell, index) => {
          if (!cell.iso || cell.day === null) {
            return <div key={`empty-${index}`} className="min-h-12" />;
          }
          const dayEvents = eventsByDay.get(cell.iso) ?? [];
          const isSelected = cell.iso === selected;
          const isToday = cell.iso === today;
          const titles = dayEvents.map((item) => item.title).join(", ");
          return (
            <button
              key={cell.iso}
              type="button"
              onClick={() => setSelected(cell.iso!)}
              aria-pressed={isSelected}
              aria-label={
                titles
                  ? `${cell.day}: ${titles}`
                  : String(cell.day)
              }
              className={`flex min-h-12 cursor-pointer flex-col items-center justify-start gap-1 rounded-2xl px-1 py-1.5 text-sm transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                isSelected
                  ? "bg-primary text-cream"
                  : isToday
                    ? "bg-primary/10 text-foreground hover:bg-primary/15"
                    : "text-foreground hover:bg-cream"
              }`}
            >
              <span className="font-medium tabular-nums">{cell.day}</span>
              {dayEvents.length > 0 ? (
                <span className="flex gap-0.5">
                  {dayEvents.some((item) => item.kind === "recurrence") ? (
                    <span
                      className={`size-1.5 rounded-full ${isSelected ? "bg-cream" : "bg-primary"}`}
                      aria-hidden
                    />
                  ) : null}
                  {dayEvents.some((item) => item.kind === "card_due") ? (
                    <span
                      className={`size-1.5 rounded-full ${isSelected ? "bg-cream" : "bg-warm"}`}
                      aria-hidden
                    />
                  ) : null}
                </span>
              ) : (
                <span className="h-1.5" aria-hidden />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col gap-3 border-t border-primary/10 pt-4">
        {selectedEvents.length === 0 ? (
          <p className="text-sm leading-6 text-muted">{planificacionContent.dayEmpty}</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {selectedEvents.map((event) => (
              <li
                key={event.id}
                className="flex flex-col gap-3 rounded-2xl border border-primary/10 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-foreground">{event.title}</p>
                    <p className="text-sm text-muted">
                      {event.kind === "card_due"
                        ? planificacionContent.cardDueKind
                        : planificacionContent.recurrenceKind}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  </div>
                  {event.amountCents !== null ? (
                    <p className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                      {event.amountCents < 0 ? "−" : event.kind === "recurrence" && event.amountCents > 0 ? "+" : ""}
                      {formatMoney(Math.abs(event.amountCents), event.currency)}
                    </p>
                  ) : null}
                </div>
                {event.canAct && event.occurrenceId ? (
                  <div className="flex flex-wrap gap-2">
                    <form action={confirmOccurrenceAction}>
                      <input type="hidden" name="id" value={event.occurrenceId} />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {planificacionContent.confirm}
                      </button>
                    </form>
                    <form action={omitOccurrenceAction}>
                      <input type="hidden" name="id" value={event.occurrenceId} />
                      <button
                        type="submit"
                        className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                      >
                        {planificacionContent.omit}
                      </button>
                    </form>
                  </div>
                ) : null}
                {event.href ? (
                  <Link
                    href={event.href}
                    className="inline-flex w-fit cursor-pointer text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                  >
                    {planificacionContent.viewCard}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
