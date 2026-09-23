import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { LEDGER_TYPES, type LedgerType } from "@/lib/db/enums";
import { localTodayIso } from "@/lib/dates/isoDate";
import { movementsContent } from "@/lib/content/movements";
import { createMovementAction } from "@/lib/actions/movements";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { MovementForm } from "@/features/movements/components/MovementForm";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listActiveCreditCards } from "@/lib/services/creditCardService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";

export const metadata: Metadata = {
  title: movementsContent.newMetaTitle,
  description: movementsContent.newMetaDescription,
};

interface NuevoMovimientoPageProps {
  searchParams: Promise<{ tipo?: string; tarjeta?: string }>;
}

function presetType(value: string | undefined): LedgerType | undefined {
  if (value && LEDGER_TYPES.includes(value as LedgerType)) {
    return value as LedgerType;
  }
  return undefined;
}

/** Create a ledger row, including credit spend and card payment. */
export default async function NuevoMovimientoPage({ searchParams }: NuevoMovimientoPageProps) {
  const userId = await requireUserId();
  const params = await searchParams;
  const [accounts, cards, categories] = await Promise.all([
    listActiveMoneyAccounts(userId),
    listActiveCreditCards(userId),
    listActiveCategories(),
  ]);

  if (accounts.length === 0 && cards.length === 0) {
    return (
      <EmptySection
        title={movementsContent.newTitle}
        body={movementsContent.emptyNoAccountsBody}
        icon={Wallet}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {movementsContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={movementsContent.newTitle}
        backHref="/movimientos"
        backLabel={movementsContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <MovementForm
          today={localTodayIso()}
          accounts={accounts}
          cards={cards}
          categories={categories}
          presetType={presetType(params.tipo)}
          presetCardId={params.tarjeta}
          action={createMovementAction}
        />
      </div>
    </div>
  );
}
