import Link from "next/link";
import { formatMoney } from "@/lib/money/format";
import { formatYearMonthEsAr } from "@/lib/dates/isoDate";
import { metasContent } from "@/lib/content/metas";
import type { PublicSavingsGoal } from "@/features/metas/types";

interface GoalListProps {
  goals: PublicSavingsGoal[];
}

function eyebrow(goal: PublicSavingsGoal): string | null {
  if (goal.status === "alcanzado") {
    return metasContent.reachedEyebrow;
  }
  if (goal.status === "pausado") {
    return metasContent.pausedEyebrow;
  }
  return null;
}

/** Goal cards with progress; the card opens assign and edit. */
export function GoalList({ goals }: GoalListProps) {
  if (goals.length === 0) {
    return null;
  }

  return (
    <ul className="flex flex-col gap-3">
      {goals.map((goal) => {
        const pct = Math.max(0, goal.progressPercent);
        const barPct = Math.min(pct, 100);
        const label = eyebrow(goal);
        const muted = goal.status === "pausado";
        return (
          <li key={goal.id}>
            <Link
              href={`/metas/${goal.id}`}
              className="flex cursor-pointer flex-col gap-3 rounded-3xl border border-primary/10 bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
            >
              <span className="flex items-start justify-between gap-4">
                <span className="min-w-0">
                  {label ? (
                    <span className="mb-1 block text-xs font-medium tracking-wide text-warm uppercase">
                      {label}
                    </span>
                  ) : null}
                  <span
                    className={`block truncate font-medium ${muted ? "text-muted" : "text-foreground"}`}
                  >
                    {goal.name}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {metasContent.assignedOf(
                      formatMoney(goal.assignedCents, goal.currency),
                      formatMoney(goal.targetCents, goal.currency),
                    )}
                  </span>
                  <span className="mt-1 block text-sm text-muted">
                    {metasContent.dueLabel} {formatYearMonthEsAr(goal.targetMonth)}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-semibold tabular-nums text-foreground">
                  {Math.min(pct, 999)}%
                </span>
              </span>
              <span
                className="block h-2 overflow-hidden rounded-full bg-primary/10"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={barPct}
                aria-label={`${goal.name}: ${pct}%`}
              >
                <span className="block h-full rounded-full bg-primary" style={{ width: `${barPct}%` }} />
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
