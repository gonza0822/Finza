import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { onboardingCreateCardAction } from "@/lib/actions/onboarding";
import { onboardingContent } from "@/lib/content/onboarding";
import { CardForm } from "@/features/cards/components/CardForm";
import { OnboardingSkip } from "@/features/onboarding/components/OnboardingSkip";
import { OnboardingStepHeader } from "@/features/onboarding/components/OnboardingStepHeader";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";

export const metadata: Metadata = {
  title: onboardingContent.cardMetaTitle,
  description: onboardingContent.cardMetaDescription,
};

/** Optional first credit card during setup. */
export default async function OnboardingCardPage() {
  const userId = await requireUserId();
  const accounts = await listActiveMoneyAccounts(userId);
  if (accounts.length === 0) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <OnboardingStepHeader
        step={2}
        title={onboardingContent.cardTitle}
        body={onboardingContent.cardBody}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <CardForm
          mode="create"
          accounts={accounts}
          defaults={{
            name: "",
            brand: "visa",
            lastFour: "",
            currency: "ARS",
            creditLimit: "",
            closeDay: 15,
            dueDay: 25,
            paymentAccountId: "",
            notes: "",
          }}
          action={onboardingCreateCardAction}
        />
      </div>
      <div className="mt-4">
        <OnboardingSkip href="/onboarding/recurrente" ariaLabel={onboardingContent.skipCardAria} />
      </div>
    </div>
  );
}
