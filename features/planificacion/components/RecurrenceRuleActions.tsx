"use client";

import { useState } from "react";
import {
  deleteRecurrenceRuleAction,
  pauseRecurrenceRuleAction,
  resumeRecurrenceRuleAction,
} from "@/lib/actions/recurrence";
import { planificacionContent } from "@/lib/content/planificacion";

interface RecurrenceRuleActionsProps {
  ruleId: string;
  paused: boolean;
}

/** Pause, resume or delete a recurrence rule without touching confirmed movements. */
export function RecurrenceRuleActions({ ruleId, paused }: RecurrenceRuleActionsProps) {
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {paused ? (
          <form action={resumeRecurrenceRuleAction}>
            <input type="hidden" name="id" value={ruleId} />
            <button
              type="submit"
              className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {planificacionContent.resume}
            </button>
          </form>
        ) : (
          <form action={pauseRecurrenceRuleAction}>
            <input type="hidden" name="id" value={ruleId} />
            <button
              type="submit"
              className="cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {planificacionContent.pause}
            </button>
          </form>
        )}
        {!confirming ? (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="cursor-pointer rounded-2xl border-2 border-primary/20 px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {planificacionContent.deleteRule}
          </button>
        ) : null}
      </div>
      {confirming ? (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/10 bg-cream/80 p-4">
          <p className="text-sm leading-6 text-muted">{planificacionContent.deleteConfirm}</p>
          <div className="flex flex-wrap gap-2">
            <form action={deleteRecurrenceRuleAction}>
              <input type="hidden" name="id" value={ruleId} />
              <button
                type="submit"
                className="cursor-pointer rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {planificacionContent.deleteConfirmCta}
              </button>
            </form>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              {planificacionContent.deleteCancel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
