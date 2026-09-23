"use client";

import { useState } from "react";
import { archiveCreditCardAction } from "@/lib/actions/cards";
import { cardsContent } from "@/lib/content/cards";

interface ArchiveCardButtonProps {
  cardId: string;
}

/** Two-step archive confirm so a mis-tap does not hide the card. */
export function ArchiveCardButton({ cardId }: ArchiveCardButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {cardsContent.archive}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-cream/80 p-4">
      <p className="text-sm leading-6 text-muted">{cardsContent.archiveConfirm}</p>
      <div className="flex flex-wrap gap-2">
        <form action={archiveCreditCardAction}>
          <input type="hidden" name="id" value={cardId} />
          <button
            type="submit"
            className="cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {cardsContent.archiveConfirmCta}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {cardsContent.archiveCancel}
        </button>
      </div>
    </div>
  );
}
