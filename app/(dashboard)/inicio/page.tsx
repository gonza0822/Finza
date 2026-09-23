import type { Metadata } from "next";
import Link from "next/link";
import { House } from "lucide-react";
import { auth } from "@/auth";
import { requireUserId } from "@/lib/auth/requireUser";
import { appPages } from "@/lib/content/app";
import { inicioContent } from "@/lib/content/inicio";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { EmptySection } from "@/features/shell/components/EmptySection";
import {
  CurrencyTotalCard,
  NegativeTotalsAlert,
} from "@/features/inicio/components/CurrencyTotalCard";
import { getSituationTotals } from "@/lib/services/situationService";
import { listBudgetsForMonth } from "@/lib/services/budgetService";
import { localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import { BudgetMonthSummary } from "@/features/inicio/components/BudgetMonthSummary";

export const metadata: Metadata = appPageMetadata("inicio");

/** Home: T, card debt and net worth per currency, never one mixed total. */
export default async function InicioPage() {
  const userId = await requireUserId();
  const session = await auth();
  const name = session?.user?.name?.trim();
  const title = name ? `${appPages.inicio.hello}, ${name}` : appPages.inicio.hello;
  const [totals, budgets] = await Promise.all([
    getSituationTotals(userId),
    listBudgetsForMonth(userId, yearMonthFromIso(localTodayIso())),
  ]);
  const hasTotals = totals.ars !== null || totals.usd !== null;

  if (!hasTotals) {
    return (
      <EmptySection title={title} body={appPages.inicio.body} icon={House}>
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {inicioContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  const negativeCurrencies = [
    totals.ars !== null && totals.ars.cashCents < 0 ? inicioContent.totalArs.toLowerCase() : null,
    totals.usd !== null && totals.usd.cashCents < 0 ? inicioContent.totalUsd.toLowerCase() : null,
  ].filter((label): label is string => label !== null);
  const twoCurrencies = totals.ars !== null && totals.usd !== null;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <Link
          href="/movimientos/nuevo"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {inicioContent.addMovement}
        </Link>
      </div>

      {negativeCurrencies.length > 0 ? (
        <NegativeTotalsAlert currencies={negativeCurrencies} />
      ) : null}

      <div className={`grid gap-4 ${twoCurrencies ? "sm:grid-cols-2" : "grid-cols-1"}`}>
        {totals.ars ? (
          <CurrencyTotalCard title={inicioContent.totalArs} situation={totals.ars} />
        ) : null}
        {totals.usd ? (
          <CurrencyTotalCard title={inicioContent.totalUsd} situation={totals.usd} />
        ) : null}
      </div>

      <p className="text-sm leading-6 text-muted">{inicioContent.totalsHint}</p>

      <BudgetMonthSummary budgets={budgets} />
    </div>
  );
}
