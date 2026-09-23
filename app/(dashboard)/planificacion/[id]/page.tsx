import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { updateRecurrenceRuleAction } from "@/lib/actions/recurrence";
import { planificacionContent } from "@/lib/content/planificacion";
import { centsToInputValue } from "@/lib/money/parse";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { RecurrenceForm } from "@/features/planificacion/components/RecurrenceForm";
import { RecurrenceRuleActions } from "@/features/planificacion/components/RecurrenceRuleActions";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { getRecurrenceRule } from "@/lib/services/recurrenceService";

export const metadata: Metadata = {
  title: planificacionContent.editMetaTitle,
  description: planificacionContent.editMetaDescription,
};

interface EditRecurrenciaPageProps {
  params: Promise<{ id: string }>;
}

/** Edit, pause or finish an owned recurrence rule. */
export default async function EditRecurrenciaPage({ params }: EditRecurrenciaPageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const [rule, accounts, cards, categories] = await Promise.all([
    getRecurrenceRule(userId, id),
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listActiveCategories(),
  ]);
  if (!rule) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AccountPageHeader
        title={planificacionContent.editTitle}
        backHref="/planificacion?tab=recurrentes"
        backLabel={planificacionContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <RecurrenceForm
          mode="edit"
          ruleId={rule.id}
          accounts={accounts}
          cards={cards}
          categories={categories}
          defaults={{
            name: rule.name,
            kind: rule.kind,
            ruleClass: rule.ruleClass,
            amount: centsToInputValue(rule.amountCents),
            frequency: rule.frequency,
            dueDay: rule.dueDay,
            dueMonth: rule.dueMonth ?? 1,
            paidWith: rule.creditCardId ? "tarjeta" : "cuenta",
            accountId: rule.accountId ?? "",
            creditCardId: rule.creditCardId ?? "",
            categoryId: rule.categoryId,
            startsOn: rule.startsOn,
            endsOn: rule.endsOn ?? "",
          }}
          action={updateRecurrenceRuleAction}
        />
      </div>
      <RecurrenceRuleActions ruleId={rule.id} paused={rule.status === "pausada"} />
    </div>
  );
}
