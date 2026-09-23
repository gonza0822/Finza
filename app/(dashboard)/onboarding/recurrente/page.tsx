import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { onboardingCreateRecurrenceAction } from "@/lib/actions/onboarding";
import { onboardingContent } from "@/lib/content/onboarding";
import { localTodayIso } from "@/lib/dates/isoDate";
import { RecurrenceForm } from "@/features/planificacion/components/RecurrenceForm";
import { OnboardingSkip } from "@/features/onboarding/components/OnboardingSkip";
import { OnboardingStepHeader } from "@/features/onboarding/components/OnboardingStepHeader";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";

export const metadata: Metadata = {
  title: onboardingContent.recurrenceMetaTitle,
  description: onboardingContent.recurrenceMetaDescription,
};

/** Optional first recurrence during setup. */
export default async function OnboardingRecurrencePage() {
  const userId = await requireUserId();
  const [accounts, cards, categories] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listActiveCategories(),
  ]);
  if (accounts.length === 0 && cards.length === 0) {
    redirect("/onboarding");
  }

  const today = localTodayIso();
  const dueDay = Number(today.slice(8, 10));
  const dueMonth = Number(today.slice(5, 7));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <OnboardingStepHeader
        step={3}
        title={onboardingContent.recurrenceTitle}
        body={onboardingContent.recurrenceBody}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <RecurrenceForm
          mode="create"
          accounts={accounts}
          cards={cards}
          categories={categories}
          defaults={{
            name: "",
            kind: "gasto",
            ruleClass: "otro",
            amount: "",
            frequency: "mensual",
            dueDay,
            dueMonth,
            paidWith: accounts.length === 0 ? "tarjeta" : "cuenta",
            accountId: "",
            creditCardId: "",
            categoryId: "",
            startsOn: today,
            endsOn: "",
          }}
          action={onboardingCreateRecurrenceAction}
        />
      </div>
      <div className="mt-4">
        <OnboardingSkip ariaLabel={onboardingContent.skipRecurrenceAria} />
      </div>
    </div>
  );
}
