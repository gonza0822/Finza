import Link from "next/link";
import { formatMoney } from "@/lib/money/format";
import { inicioContent } from "@/lib/content/inicio";
import type { PublicBudget } from "@/features/planificacion/budgetTypes";

interface BudgetMonthSummaryProps {
  budgets: PublicBudget[];
}

/** Current-month caps on Inicio; hidden when there are none. */
export function BudgetMonthSummary({ budgets }: BudgetMonthSummaryProps) {
  if (budgets.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">
          {inicioContent.budgetsHeading}
        </h2>
        <Link
          href="/planificacion?tab=presupuestos"
          className="cursor-pointer text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {inicioContent.budgetsLink}
        </Link>
      </div>
      <ul className="flex flex-col gap-2 rounded-3xl border border-primary/10 bg-surface/90 p-5 shadow-md">
        {budgets.map((budget) => {
          const label =
            budget.alert === "excedido"
              ? inicioContent.alertOver
              : budget.alert === "alerta"
                ? inicioContent.alertWarn
                : null;
          const caption = budget.parentCategoryName
            ? `${budget.parentCategoryName} · ${budget.categoryName}`
            : budget.categoryName;
          return (
            <li key={budget.id} className="flex items-baseline justify-between gap-3">
              <span className="min-w-0">
                {label ? (
                  <span className="mr-2 text-xs font-medium tracking-wide text-warm uppercase">
                    {label}
                  </span>
                ) : null}
                <span className="text-sm text-foreground">{caption}</span>
              </span>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                {inicioContent.usedOf(
                  formatMoney(budget.usedCents, budget.currency),
                  formatMoney(budget.amountCents, budget.currency),
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
