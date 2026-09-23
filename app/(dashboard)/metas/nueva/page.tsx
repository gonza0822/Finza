import type { Metadata } from "next";
import { requireUserId } from "@/lib/auth/requireUser";
import { createSavingsGoalAction } from "@/lib/actions/savingsGoals";
import { metasContent } from "@/lib/content/metas";
import { addYearMonths, localTodayIso, yearMonthFromIso } from "@/lib/dates/isoDate";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { GoalForm } from "@/features/metas/components/GoalForm";
import { getDefaultCurrency } from "@/lib/services/userSettingsService";

export const metadata: Metadata = {
  title: metasContent.newMetaTitle,
  description: metasContent.newMetaDescription,
};

/** Create a virtual savings overlay. */
export default async function NuevaMetaPage() {
  const userId = await requireUserId();
  const currency = await getDefaultCurrency(userId);
  const targetMonth = addYearMonths(yearMonthFromIso(localTodayIso()), 3);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={metasContent.newTitle}
        backHref="/metas"
        backLabel={metasContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <GoalForm
          mode="create"
          defaults={{
            name: "",
            targetAmount: "",
            assignedAmount: "",
            currency,
            targetMonth,
          }}
          action={createSavingsGoalAction}
        />
      </div>
    </div>
  );
}
