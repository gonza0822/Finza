"use client";

import { useState } from "react";
import { voidMovementAction } from "@/lib/actions/movements";
import { movementsContent } from "@/lib/content/movements";

interface VoidMovementButtonProps {
  movementId: string;
}

/** Two-step void confirm so a mis-tap does not undo a real book row. */
export function VoidMovementButton({ movementId }: VoidMovementButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer text-sm font-medium text-primary underline-offset-2 transition-colors duration-200 hover:text-primary-hover hover:underline focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
      >
        {movementsContent.void}
      </button>
    );
  }

  return (
    <div className="flex min-w-[12rem] flex-col gap-2">
      <p className="text-xs leading-5 text-muted">{movementsContent.voidConfirm}</p>
      <div className="flex flex-wrap gap-2">
        <form action={voidMovementAction}>
          <input type="hidden" name="id" value={movementId} />
          <button
            type="submit"
            className="cursor-pointer rounded-xl bg-primary px-3 py-1.5 text-xs font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {movementsContent.voidConfirmCta}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-xl border-2 border-primary px-3 py-1.5 text-xs font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {movementsContent.voidCancel}
        </button>
      </div>
    </div>
  );
}
