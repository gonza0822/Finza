import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { updateSavingsGoalAction } from "@/lib/actions/savingsGoals";
import { metasContent } from "@/lib/content/metas";
import { formatYearMonthEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import { centsToInputValue } from "@/lib/money/parse";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { AssignGoalForm } from "@/features/metas/components/AssignGoalForm";
import { GoalActions } from "@/features/metas/components/GoalActions";
import { GoalForm } from "@/features/metas/components/GoalForm";
import { getSavingsGoal } from "@/lib/services/savingsGoalService";
import { getSituationTotals } from "@/lib/services/situationService";

export const metadata: Metadata = {
  title: metasContent.editMetaTitle,
  description: metasContent.editMetaDescription,
};

interface EditMetaPageProps {
  params: Promise<{ id: string }>;
}

/** Progress, assign and edit an owned savings overlay. */
export default async function EditMetaPage({ params }: EditMetaPageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const [goal, totals] = await Promise.all([getSavingsGoal(userId, id), getSituationTotals(userId)]);
  if (!goal) {
    notFound();
  }

  const situation = goal.currency === "USD" ? totals.usd : totals.ars;
  const barPct = Math.min(Math.max(0, goal.progressPercent), 100);
  const canAssign = goal.status !== "pausado";

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AccountPageHeader
        title={goal.name}
        backHref="/metas"
        backLabel={metasContent.backToList}
      />

      <section className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        {goal.status === "alcanzado" ? (
          <p className="mb-3 text-xs font-medium tracking-wide text-warm uppercase">
            {metasContent.reachedEyebrow}
          </p>
        ) : null}
        {goal.status === "pausado" ? (
          <p className="mb-3 text-xs font-medium tracking-wide text-warm uppercase">
            {metasContent.pausedEyebrow}
          </p>
        ) : null}
        <p className="text-sm text-muted">
          {metasContent.assignedOf(
            formatMoney(goal.assignedCents, goal.currency),
            formatMoney(goal.targetCents, goal.currency),
          )}
        </p>
        <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
          {Math.min(goal.progressPercent, 999)}%
        </p>
        <div
          className="mt-3 h-2 overflow-hidden rounded-full bg-primary/10"
          role="meter"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={barPct}
          aria-label={`${goal.name}: ${goal.progressPercent}%`}
        >
          <div className="h-full rounded-full bg-primary" style={{ width: `${barPct}%` }} />
        </div>
        <dl className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-4">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted">{metasContent.remainingLabel}</dt>
            <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
              {formatMoney(goal.remainingCents, goal.currency)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted">{metasContent.monthlyNeededLabel}</dt>
            <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
              {formatMoney(goal.monthlyNeededCents, goal.currency)}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-sm text-muted">{metasContent.dueLabel}</dt>
            <dd className="shrink-0 text-base font-semibold text-foreground">
              {formatYearMonthEsAr(goal.targetMonth)}
            </dd>
          </div>
          {situation ? (
            <div className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-muted">{metasContent.freeLabel}</dt>
              <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
                {formatMoney(situation.freeCents, situation.currency)}
              </dd>
            </div>
          ) : null}
        </dl>
        <p className="mt-4 text-sm leading-6 text-muted">{metasContent.noPace}</p>
      </section>

      {canAssign ? (
        <section className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
          <AssignGoalForm goalId={goal.id} />
        </section>
      ) : null}

      <section className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <GoalForm
          mode="edit"
          goalId={goal.id}
          defaults={{
            name: goal.name,
            targetAmount: centsToInputValue(goal.targetCents),
            assignedAmount: "",
            currency: goal.currency,
            targetMonth: goal.targetMonth,
          }}
          action={updateSavingsGoalAction}
        />
      </section>

      <GoalActions goalId={goal.id} status={goal.status} assignedCents={goal.assignedCents} />
    </div>
  );
}
