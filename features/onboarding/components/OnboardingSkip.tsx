import Link from "next/link";
import { skipOnboardingAction } from "@/lib/actions/onboarding";
import { onboardingContent } from "@/lib/content/onboarding";

interface OnboardingSkipProps {
  href?: string;
  ariaLabel: string;
}

/** Optional-step skip: a link mid-setup, or a post that finishes onboarding. */
export function OnboardingSkip({ href, ariaLabel }: OnboardingSkipProps) {
  const className =
    "inline-flex cursor-pointer items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";
  if (href) {
    return (
      <Link href={href} aria-label={ariaLabel} className={className}>
        {onboardingContent.skip}
      </Link>
    );
  }
  return (
    <form action={skipOnboardingAction}>
      <button type="submit" aria-label={ariaLabel} className={className}>
        {onboardingContent.skip}
      </button>
    </form>
  );
}
