"use client";

import { signOutAction } from "@/lib/actions/auth";
import { appShellContent } from "@/lib/content/app";
import { useAppDispatch } from "@/store/hooks";
import { clearMovementDraft } from "@/store/slices/movementDraftSlice";

interface SignOutButtonProps {
  variant?: "onDark" | "onLight";
}

const variantClass = {
  onDark:
    "border-cream/40 text-cream hover:bg-cream/10 focus-visible:ring-cream",
  onLight:
    "border-primary text-primary hover:bg-cream focus-visible:ring-primary focus-visible:ring-offset-2",
} as const;

/** Ends the session via the existing server action. */
export function SignOutButton({ variant = "onDark" }: SignOutButtonProps) {
  const dispatch = useAppDispatch();

  return (
    <form
      action={signOutAction}
      onSubmit={() => {
        dispatch(clearMovementDraft());
      }}
    >
      <button
        type="submit"
        className={`cursor-pointer rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none ${variantClass[variant]}`}
      >
        {appShellContent.logout}
      </button>
    </form>
  );
}
