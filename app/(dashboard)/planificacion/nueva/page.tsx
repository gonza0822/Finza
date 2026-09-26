import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { createRecurrenceRuleAction } from "@/lib/actions/recurrence";
import { planificacionContent } from "@/lib/content/planificacion";
import { localTodayIso } from "@/lib/dates/isoDate";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { RecurrenceForm } from "@/features/planificacion/components/RecurrenceForm";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { getOfficialUsdSellRateOrNull } from "@/lib/services/fxService";

export const metadata: Metadata = {
  title: planificacionContent.newMetaTitle,
  description: planificacionContent.newMetaDescription,
};

/** Create a repeating gasto or ingreso; confirm/omit happens on the month list. */
export default async function NuevaRecurrenciaPage() {
  const userId = await requireUserId();
  const [accounts, cards, categories, officialUsdSell] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listActiveCategories(),
    getOfficialUsdSellRateOrNull(),
  ]);

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <EmptySection
        title={planificacionContent.newTitle}
        body={planificacionContent.emptyNoAccountsBody}
        icon={Wallet}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {planificacionContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  const today = localTodayIso();
  const dueDay = Number(today.slice(8, 10));
  const dueMonth = Number(today.slice(5, 7));

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={planificacionContent.newTitle}
        backHref="/planificacion?tab=recurrentes"
        backLabel={planificacionContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <RecurrenceForm
          mode="create"
          accounts={accounts}
          cards={cards}
          categories={categories}
          defaults={{
            name: "",
            kind: "gasto",
            ruleClass: "otro",
            amount: "",
            amountCurrency: "ARS",
            frequency: "mensual",
            dueDay,
            dueMonth,
            paidWith: accounts.length === 0 ? "tarjeta" : "cuenta",
            accountId: "",
            creditCardId: "",
            categoryId: "",
            startsOn: today,
            endsOn: "",
          }}
          officialUsdSell={officialUsdSell}
          action={createRecurrenceRuleAction}
        />
      </div>
    </div>
  );
}
