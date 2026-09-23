import Link from "next/link";
import { formatMoney } from "@/lib/money/format";
import { planificacionContent } from "@/lib/content/planificacion";
import type { PublicBudget } from "@/features/planificacion/budgetTypes";

interface BudgetListProps {
  budgets: PublicBudget[];
}

function alertLabel(alert: PublicBudget["alert"]): string | null {
  if (alert === "excedido") {
    return planificacionContent.alertOver;
  }
  if (alert === "alerta") {
    return planificacionContent.alertWarn;
  }
  return null;
}

function percentUsed(budget: PublicBudget): number {
  if (budget.amountCents <= 0) {
    return 0;
  }
  return Math.round((budget.usedCents / budget.amountCents) * 100);
}

/** Monthly caps with used vs tope; the card opens edit. */
export function BudgetList({ budgets }: BudgetListProps) {
  if (budgets.length === 0) {
    return <p className="text-sm leading-6 text-muted">{planificacionContent.budgetsEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {budgets.map((budget) => {
        const pct = percentUsed(budget);
        const barPct = Math.min(pct, 100);
        const label = alertLabel(budget.alert);
        const fillClass =
          budget.alert === "excedido"
            ? "bg-red-700"
            : budget.alert === "alerta"
              ? "bg-warm"
              : "bg-primary";
        const caption = budget.parentCategoryName
          ? `${budget.parentCategoryName} · ${budget.categoryName}`
          : budget.categoryName;
        return (
          <li key={budget.id}>
            <Link
              href={`/planificacion/presupuestos/${budget.id}`}
              className="flex cursor-pointer flex-col gap-3 rounded-3xl border border-primary/10 bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  {label ? (
                    <span className="mb-1 block text-xs font-medium tracking-wide text-warm uppercase">
                      {label}
                    </span>
                  ) : null}
                  <span className="block truncate font-medium text-foreground">{caption}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {planificacionContent.usedOf(
                      formatMoney(budget.usedCents, budget.currency),
                      formatMoney(budget.amountCents, budget.currency),
                    )}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {pct}%
                </span>
              </span>
              <span
                className="block h-2 overflow-hidden rounded-full bg-primary/10"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(pct, 100)}
                aria-label={`${caption}: ${pct}%`}
              >
                <span className={`block h-full rounded-full ${fillClass}`} style={{ width: `${barPct}%` }} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
