"use client";

import { useState } from "react";
import { deleteBudgetAction } from "@/lib/actions/budgets";
import { planificacionContent } from "@/lib/content/planificacion";

interface DeleteBudgetButtonProps {
  budgetId: string;
  yearMonth: string;
}

/** Two-step delete so a mis-tap does not drop the cap. */
export function DeleteBudgetButton({ budgetId, yearMonth }: DeleteBudgetButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {planificacionContent.deleteBudget}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-cream/80 p-4">
      <p className="text-sm leading-6 text-muted">{planificacionContent.deleteBudgetConfirm}</p>
      <div className="flex flex-wrap gap-2">
        <form action={deleteBudgetAction}>
          <input type="hidden" name="id" value={budgetId} />
          <input type="hidden" name="yearMonth" value={yearMonth} />
          <button
            type="submit"
            className="cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {planificacionContent.deleteBudgetConfirmCta}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {planificacionContent.deleteBudgetCancel}
        </button>
      </div>
    </div>
  );
}
