import type { Metadata } from "next";
import { onboardingCreateAccountAction } from "@/lib/actions/onboarding";
import { onboardingContent } from "@/lib/content/onboarding";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { OnboardingStepHeader } from "@/features/onboarding/components/OnboardingStepHeader";

export const metadata: Metadata = {
  title: onboardingContent.accountMetaTitle,
  description: onboardingContent.accountMetaDescription,
};

/** Required first money account before optional card and recurrence. */
export default function OnboardingAccountPage() {
  return (
    <div className="mx-auto w-full max-w-3xl">
      <OnboardingStepHeader
        step={1}
        title={onboardingContent.accountTitle}
        body={onboardingContent.accountBody}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <AccountForm
          mode="create"
          defaults={{
            name: "",
            type: "banco",
            currency: "ARS",
            initialBalance: "",
            notes: "",
          }}
          action={onboardingCreateAccountAction}
        />
      </div>
    </div>
  );
}
