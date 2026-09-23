import Link from "next/link";
import { Repeat } from "lucide-react";
import { planificacionContent } from "@/lib/content/planificacion";
import { formatMoney } from "@/lib/money/format";
import type { PublicRecurrenceRule } from "@/features/planificacion/types";

interface RecurrenceRuleListProps {
  rules: PublicRecurrenceRule[];
}

/** Active and paused rules; the whole card opens the edit form. */
export function RecurrenceRuleList({ rules }: RecurrenceRuleListProps) {
  if (rules.length === 0) {
    return <p className="text-sm leading-6 text-muted">{planificacionContent.rulesEmpty}</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {rules.map((rule) => (
        <li key={rule.id}>
          <Link
            href={`/planificacion/${rule.id}`}
            className={`flex cursor-pointer items-center justify-between gap-4 rounded-3xl border bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
              rule.status === "pausada" ? "border-primary/5 opacity-80" : "border-primary/10"
            }`}
          >
            <span className="flex min-w-0 items-center gap-3">
              <Repeat className="size-5 shrink-0 text-primary" aria-hidden />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">{rule.name}</span>
                <span className="block text-sm text-muted">
                  {planificacionContent.kinds[rule.kind]} ·{" "}
                  {planificacionContent.frequencyCaption(rule.frequency, rule.dueDay, rule.dueMonth)}
                  {rule.creditCardName
                    ? ` · ${rule.creditCardName}`
                    : rule.accountName
                      ? ` · ${rule.accountName}`
                      : ""}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-right">
              {rule.status === "pausada" ? (
                <span className="mb-1 block text-xs font-medium tracking-wide text-warm uppercase">
                  {planificacionContent.pausedBadge}
                </span>
              ) : null}
              <span className="block text-base font-semibold tabular-nums text-foreground">
                {rule.kind === "gasto" ? "−" : "+"}
                {formatMoney(rule.amountCents, rule.currency)}
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
