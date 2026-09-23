import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { updateCreditCardAction } from "@/lib/actions/cards";
import { cardsContent } from "@/lib/content/cards";
import { centsToInputValue } from "@/lib/money/parse";
import { getCreditCard } from "@/lib/services/creditCardService";
import { listMoneyAccounts } from "@/lib/services/moneyAccountService";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { ArchiveCardButton } from "@/features/cards/components/ArchiveCardButton";
import { CardForm } from "@/features/cards/components/CardForm";
import { CardInstallmentList } from "@/features/cards/components/CardInstallmentList";
import { CardSummary } from "@/features/cards/components/CardSummary";
import { RestoreCardButton } from "@/features/cards/components/RestoreCardButton";

interface EditTarjetaPageProps {
  params: Promise<{ id: string }>;
}

/** Unique title per card so list and detail do not share the same metadata. */
export async function generateMetadata({ params }: EditTarjetaPageProps): Promise<Metadata> {
  const { id } = await params;
  const userId = await requireUserId();
  const card = await getCreditCard(userId, id);
  if (!card) {
    return {
      title: cardsContent.editMetaTitle,
      description: cardsContent.editMetaDescription,
    };
  }
  return {
    title: `${card.name} — Finza`,
    description: cardsContent.editMetaDescription,
  };
}

/** Card totals, cycle dates, then edit or archive. */
export default async function EditTarjetaPage({ params }: EditTarjetaPageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const [card, accounts] = await Promise.all([
    getCreditCard(userId, id),
    listMoneyAccounts(userId),
  ]);
  if (!card) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <AccountPageHeader
        title={card.name}
        backHref="/tarjetas"
        backLabel={cardsContent.backToList}
      />
      <CardSummary card={card} />
      <CardInstallmentList card={card} />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <CardForm
          mode="edit"
          cardId={card.id}
          ledgerLocked={card.hasLedgers}
          accounts={accounts}
          defaults={{
            name: card.name,
            brand: card.brand,
            lastFour: card.lastFour,
            currency: card.currency,
            creditLimit: centsToInputValue(card.creditLimitCents),
            closeDay: card.closeDay,
            dueDay: card.dueDay,
            paymentAccountId: card.paymentAccountId,
            notes: card.notes ?? "",
          }}
          action={updateCreditCardAction}
        />
      </div>
      {card.archived ? (
        <RestoreCardButton cardId={card.id} />
      ) : (
        <ArchiveCardButton cardId={card.id} />
      )}
    </div>
  );
}
