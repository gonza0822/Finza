import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { createCreditCardAction } from "@/lib/actions/cards";
import { cardsContent } from "@/lib/content/cards";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { CardForm } from "@/features/cards/components/CardForm";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { getDefaultCurrency } from "@/lib/services/userSettingsService";

export const metadata: Metadata = {
  title: cardsContent.newMetaTitle,
  description: cardsContent.newMetaDescription,
};

/** Create a credit card (limit, cycle days, same-currency payment account). */
export default async function NuevaTarjetaPage() {
  const userId = await requireUserId();
  const [accounts, currency] = await Promise.all([
    listActiveMoneyAccounts(userId),
    getDefaultCurrency(userId),
  ]);

  if (accounts.length === 0) {
    return (
      <EmptySection
        title={cardsContent.newTitle}
        body={cardsContent.emptyNoAccountsBody}
        icon={Wallet}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {cardsContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={cardsContent.newTitle}
        backHref="/tarjetas"
        backLabel={cardsContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <CardForm
          mode="create"
          accounts={accounts}
          defaults={{
            name: "",
            brand: "visa",
            lastFour: "",
            currency,
            creditLimit: "",
            closeDay: 15,
            dueDay: 25,
            paymentAccountId: "",
            notes: "",
          }}
          action={createCreditCardAction}
        />
      </div>
    </div>
  );
}
