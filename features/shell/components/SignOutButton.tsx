"use client";

import { signOutClient } from "@/lib/auth/signOutClient";
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

/** Ends the session; on Android also flushes this origin's WebView cookies. */
export function SignOutButton({ variant = "onDark" }: SignOutButtonProps) {
  const dispatch = useAppDispatch();

  async function onLogout() {
    dispatch(clearMovementDraft());
    await signOutClient();
  }

  return (
    <button
      type="button"
      onClick={() => {
        void onLogout();
      }}
      className={`cursor-pointer rounded-2xl border-2 px-4 py-2.5 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:outline-none ${variantClass[variant]}`}
    >
      {appShellContent.logout}
    </button>
  );
}
