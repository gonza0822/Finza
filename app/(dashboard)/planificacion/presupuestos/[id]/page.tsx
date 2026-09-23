import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { updateBudgetAction } from "@/lib/actions/budgets";
import { planificacionContent } from "@/lib/content/planificacion";
import { centsToInputValue } from "@/lib/money/parse";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { BudgetForm } from "@/features/planificacion/components/BudgetForm";
import { DeleteBudgetButton } from "@/features/planificacion/components/DeleteBudgetButton";
import { listActiveCategories } from "@/lib/services/categoryService";
import { getBudget } from "@/lib/services/budgetService";

export const metadata: Metadata = {
  title: planificacionContent.editBudgetMetaTitle,
  description: planificacionContent.editBudgetMetaDescription,
};

interface EditPresupuestoPageProps {
  params: Promise<{ id: string }>;
}

/** Edit or delete an owned monthly category cap. */
export default async function EditPresupuestoPage({ params }: EditPresupuestoPageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const [budget, categories] = await Promise.all([
    getBudget(userId, id),
    listActiveCategories(),
  ]);
  if (!budget) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AccountPageHeader
        title={planificacionContent.editBudgetTitle}
        backHref={`/planificacion?tab=presupuestos&mes=${budget.yearMonth}`}
        backLabel={planificacionContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <BudgetForm
          mode="edit"
          budgetId={budget.id}
          categories={categories}
          defaults={{
            categoryId: budget.categoryId,
            yearMonth: budget.yearMonth,
            amount: centsToInputValue(budget.amountCents),
            currency: budget.currency,
          }}
          action={updateBudgetAction}
        />
      </div>
      <DeleteBudgetButton budgetId={budget.id} yearMonth={budget.yearMonth} />
    </div>
  );
}
