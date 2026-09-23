"use client";

import { useState } from "react";
import {
  cancelSavingsGoalAction,
  pauseSavingsGoalAction,
  releaseSavingsGoalAction,
  resumeSavingsGoalAction,
} from "@/lib/actions/savingsGoals";
import { metasContent } from "@/lib/content/metas";
import type { GoalStatus } from "@/lib/db/enums";

interface GoalActionsProps {
  goalId: string;
  status: GoalStatus;
  assignedCents: number;
}

const outlineClass =
  "cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

const primaryClass =
  "cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none";

/** Pause, resume, release or cancel without touching account balances. */
export function GoalActions({ goalId, status, assignedCents }: GoalActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const canRelease = status === "alcanzado" && assignedCents > 0;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === "pausado" ? (
          <form action={resumeSavingsGoalAction}>
            <input type="hidden" name="id" value={goalId} />
            <button type="submit" className={outlineClass}>
              {metasContent.resume}
            </button>
          </form>
        ) : null}
        {status === "activo" ? (
          <form action={pauseSavingsGoalAction}>
            <input type="hidden" name="id" value={goalId} />
            <button type="submit" className={outlineClass}>
              {metasContent.pause}
            </button>
          </form>
        ) : null}
        {canRelease ? (
          <form action={releaseSavingsGoalAction}>
            <input type="hidden" name="id" value={goalId} />
            <button type="submit" className={outlineClass}>
              {metasContent.release}
            </button>
          </form>
        ) : null}
        {!confirming ? (
          <button type="button" onClick={() => setConfirming(true)} className={outlineClass}>
            {metasContent.cancel}
          </button>
        ) : null}
      </div>
      {canRelease ? <p className="text-sm leading-6 text-muted">{metasContent.releaseHint}</p> : null}
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-cream/80 p-4">
          <p className="text-sm leading-6 text-muted">{metasContent.cancelConfirm}</p>
          <div className="flex flex-wrap gap-2">
            <form action={cancelSavingsGoalAction}>
              <input type="hidden" name="id" value={goalId} />
              <button type="submit" className={primaryClass}>
                {metasContent.cancelConfirmCta}
              </button>
            </form>
            <button type="button" onClick={() => setConfirming(false)} className={outlineClass}>
              {metasContent.cancelAbort}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
