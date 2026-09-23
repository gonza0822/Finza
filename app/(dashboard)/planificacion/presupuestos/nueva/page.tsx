import type { Metadata } from "next";
import { requireUserId } from "@/lib/auth/requireUser";
import { createBudgetAction } from "@/lib/actions/budgets";
import { planificacionContent } from "@/lib/content/planificacion";
import { isYearMonth, localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { BudgetForm } from "@/features/planificacion/components/BudgetForm";
import { listActiveCategories } from "@/lib/services/categoryService";
import { getDefaultCurrency } from "@/lib/services/userSettingsService";

export const metadata: Metadata = {
  title: planificacionContent.newBudgetMetaTitle,
  description: planificacionContent.newBudgetMetaDescription,
};

interface NuevaPresupuestoPageProps {
  searchParams: Promise<{ mes?: string }>;
}

/** Create a category spending cap for one month and currency. */
export default async function NuevaPresupuestoPage({ searchParams }: NuevaPresupuestoPageProps) {
  const userId = await requireUserId();
  const mes = (await searchParams).mes;
  const yearMonth = mes && isYearMonth(mes) ? mes : yearMonthFromIso(localTodayIso());
  const [categories, currency] = await Promise.all([
    listActiveCategories(),
    getDefaultCurrency(userId),
  ]);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={planificacionContent.newBudgetTitle}
        backHref={`/planificacion?tab=presupuestos&mes=${yearMonth}`}
        backLabel={planificacionContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <BudgetForm
          mode="create"
          categories={categories}
          defaults={{
            categoryId: "",
            yearMonth,
            amount: "",
            currency,
          }}
          action={createBudgetAction}
        />
      </div>
    </div>
  );
}
