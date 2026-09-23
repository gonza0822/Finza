import { onboardingContent } from "@/lib/content/onboarding";

interface OnboardingStepHeaderProps {
  step: number;
  title: string;
  body: string;
}

/** One h1 per onboarding step plus the step index. */
export function OnboardingStepHeader({ step, title, body }: OnboardingStepHeaderProps) {
  return (
    <header className="mb-6 flex flex-col gap-2">
      <p className="text-sm font-medium text-muted">{onboardingContent.stepOf(step, 3)}</p>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{title}</h1>
      <p className="text-sm leading-6 text-muted">{body}</p>
    </header>
  );
}
