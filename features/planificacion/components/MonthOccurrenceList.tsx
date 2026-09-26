import { confirmOccurrenceAction, omitOccurrenceAction } from "@/lib/actions/recurrence";
import { planificacionContent } from "@/lib/content/planificacion";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import type { PublicRecurrenceOccurrence } from "@/features/planificacion/types";

interface MonthOccurrenceListProps {
  occurrences: PublicRecurrenceOccurrence[];
}

function statusLabel(status: PublicRecurrenceOccurrence["displayStatus"]): string {
  if (status === "confirmada") {
    return planificacionContent.confirmedBadge;
  }
  if (status === "omitida") {
    return planificacionContent.omittedBadge;
  }
  if (status === "vencida") {
    return planificacionContent.overdueBadge;
  }
  return planificacionContent.scheduledBadge;
}

/** This month’s programmed recurrences with confirm / omit. */
export function MonthOccurrenceList({ occurrences }: MonthOccurrenceListProps) {
  if (occurrences.length === 0) {
    return <p className="text-sm leading-6 text-muted">{planificacionContent.monthEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {occurrences.map((item) => {
        const currency = item.currency;
        return (
          <li
            key={item.id}
            className="flex flex-col gap-3 rounded-2xl border border-primary/10 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium text-foreground">{item.ruleName}</p>
              <p className="text-sm text-muted">
                {formatIsoDateEsAr(item.scheduledOn)} · {statusLabel(item.displayStatus)}
                {item.creditCardName
                  ? ` · ${item.creditCardName}`
                  : item.accountName
                    ? ` · ${item.accountName}`
                    : ""}
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:items-end">
              <p className="text-base font-semibold tabular-nums text-foreground">
                {item.kind === "gasto" ? "−" : "+"}
                {formatMoney(item.amountCents, currency)}
              </p>
              {item.convertsOnConfirm || item.quotedCurrency !== item.currency ? (
                <p className="text-xs text-muted">
                  {planificacionContent.quotedCaption(
                    formatMoney(item.quotedAmountCents, item.quotedCurrency),
                  )}
                </p>
              ) : null}
              {item.canAct ? (
                <div className="flex flex-wrap gap-2">
                  <form action={confirmOccurrenceAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-2xl bg-primary px-4 py-2 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {planificacionContent.confirm}
                    </button>
                  </form>
                  <form action={omitOccurrenceAction}>
                    <input type="hidden" name="id" value={item.id} />
                    <button
                      type="submit"
                      className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
                    >
                      {planificacionContent.omit}
                    </button>
                  </form>
                </div>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
