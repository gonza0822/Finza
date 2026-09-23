import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { planificacionContent } from "@/lib/content/planificacion";
import { isYearMonth, localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { MonthOccurrenceList } from "@/features/planificacion/components/MonthOccurrenceList";
import { RecurrenceRuleList } from "@/features/planificacion/components/RecurrenceRuleList";
import { BudgetList } from "@/features/planificacion/components/BudgetList";
import { MonthCalendar } from "@/features/planificacion/components/MonthCalendar";
import { MonthSwitcher } from "@/features/planificacion/components/MonthSwitcher";
import { PlanningTabs } from "@/features/planificacion/components/PlanningTabs";
import { parsePlanningTab } from "@/features/planificacion/planningHref";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { listMonthOccurrences, listRecurrenceRules } from "@/lib/services/recurrenceService";
import { listBudgetsForMonth } from "@/lib/services/budgetService";
import { listCalendarEvents } from "@/lib/services/calendarService";
import type { CalendarDayEvent, PublicBudget } from "@/features/planificacion/budgetTypes";
import type {
  PublicRecurrenceOccurrence,
  PublicRecurrenceRule,
} from "@/features/planificacion/types";

export const metadata: Metadata = appPageMetadata("planificacion");

interface PlanificacionPageProps {
  searchParams: Promise<{ mes?: string; tab?: string }>;
}

function monthFromParam(raw: string | undefined): string {
  if (raw && isYearMonth(raw)) {
    return raw;
  }
  return yearMonthFromIso(localTodayIso());
}

const ctaClass =
  "inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none";

/** Hub with Calendario (default), Recurrentes and Presupuestos. */
export default async function PlanificacionPage({ searchParams }: PlanificacionPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;
  const yearMonth = monthFromParam(params.mes);
  const tab = parsePlanningTab(params.tab);
  const [accounts, cards] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
  ]);

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <EmptySection
        title={planificacionContent.emptyTitle}
        body={planificacionContent.emptyNoAccountsBody}
        icon={CalendarDays}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {planificacionContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  const [occurrences, rules, budgets, calendarEvents] = await Promise.all([
    tab === "recurrentes"
      ? listMonthOccurrences(userId, yearMonth)
      : Promise.resolve([] as PublicRecurrenceOccurrence[]),
    tab === "recurrentes"
      ? listRecurrenceRules(userId)
      : Promise.resolve([] as PublicRecurrenceRule[]),
    tab === "presupuestos"
      ? listBudgetsForMonth(userId, yearMonth)
      : Promise.resolve([] as PublicBudget[]),
    tab === "calendario"
      ? listCalendarEvents(userId, yearMonth)
      : Promise.resolve([] as CalendarDayEvent[]),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {planificacionContent.listTitle}
        </h1>
        {tab === "presupuestos" ? (
          <Link href={`/planificacion/presupuestos/nueva?mes=${yearMonth}`} className={ctaClass}>
            {planificacionContent.addBudget}
          </Link>
        ) : null}
        {tab === "recurrentes" ? (
          <Link href="/planificacion/nueva" className={ctaClass}>
            {planificacionContent.addRule}
          </Link>
        ) : null}
      </div>

      <PlanningTabs tab={tab} yearMonth={yearMonth} />
      <MonthSwitcher yearMonth={yearMonth} tab={tab} />

      {tab === "calendario" ? (
        <section
          role="tabpanel"
          id="planificacion-panel-calendario"
          aria-labelledby="planificacion-tab-calendario"
          className="rounded-3xl border border-primary/10 bg-surface/90 p-5 shadow-md sm:p-6"
        >
          {calendarEvents.length === 0 ? (
            <p className="mb-4 text-sm leading-6 text-muted">{planificacionContent.calendarEmpty}</p>
          ) : null}
          <MonthCalendar yearMonth={yearMonth} events={calendarEvents} />
        </section>
      ) : null}

      {tab === "recurrentes" ? (
        <div
          role="tabpanel"
          id="planificacion-panel-recurrentes"
          aria-labelledby="planificacion-tab-recurrentes"
          className="flex flex-col gap-8"
        >
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
              {planificacionContent.monthHeading}
            </h2>
            <div className="rounded-3xl border border-primary/10 bg-surface/90 p-5 shadow-md sm:p-6">
              <MonthOccurrenceList occurrences={occurrences} />
            </div>
          </section>
          <section className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
              {planificacionContent.rulesHeading}
            </h2>
            <RecurrenceRuleList rules={rules} />
          </section>
        </div>
      ) : null}

      {tab === "presupuestos" ? (
        <section
          role="tabpanel"
          id="planificacion-panel-presupuestos"
          aria-labelledby="planificacion-tab-presupuestos"
          className="flex flex-col gap-3"
        >
          <div className="rounded-3xl border border-primary/10 bg-surface/90 p-5 shadow-md sm:p-6">
            <BudgetList budgets={budgets} />
            <p className="mt-4 text-sm leading-6 text-muted">{planificacionContent.budgetsHint}</p>
          </div>
        </section>
      ) : null}
    </div>
  );
}
