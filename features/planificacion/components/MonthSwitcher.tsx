import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addYearMonths, formatYearMonthEsAr } from "@/lib/dates/isoDate";
import { planificacionContent } from "@/lib/content/planificacion";
import { planningHref, type PlanningTab } from "@/features/planificacion/planningHref";

interface MonthSwitcherProps {
  yearMonth: string;
  tab: PlanningTab;
}

/** Previous / next calendar month, keeping the active tab. */
export function MonthSwitcher({ yearMonth, tab }: MonthSwitcherProps) {
  const prev = addYearMonths(yearMonth, -1);
  const next = addYearMonths(yearMonth, 1);
  const label = formatYearMonthEsAr(yearMonth);

  return (
    <nav aria-label={label} className="flex items-center justify-between gap-3">
      <Link
        href={planningHref(tab, prev)}
        className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-primary/15 p-2 text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label={planificacionContent.prevMonth}
      >
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <p className="text-center text-sm font-semibold capitalize text-foreground">{label}</p>
      <Link
        href={planningHref(tab, next)}
        className="inline-flex cursor-pointer items-center justify-center rounded-2xl border border-primary/15 p-2 text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        aria-label={planificacionContent.nextMonth}
      >
        <ChevronRight className="size-5" aria-hidden />
      </Link>
    </nav>
  );
}
