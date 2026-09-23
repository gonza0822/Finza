"use client";

import { useState } from "react";
import { archiveMoneyAccountAction } from "@/lib/actions/accounts";
import { accountsContent } from "@/lib/content/accounts";

interface ArchiveAccountButtonProps {
  accountId: string;
}

/** Two-step archive confirm so a mis-tap does not hide the account. */
export function ArchiveAccountButton({ accountId }: ArchiveAccountButtonProps) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {accountsContent.archive}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-cream/80 p-4">
      <p className="text-sm leading-6 text-muted">{accountsContent.archiveConfirm}</p>
      <div className="flex flex-wrap gap-2">
        <form action={archiveMoneyAccountAction}>
          <input type="hidden" name="id" value={accountId} />
          <button
            type="submit"
            className="cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {accountsContent.archiveConfirmCta}
          </button>
        </form>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          {accountsContent.archiveCancel}
        </button>
      </div>
    </div>
  );
}
