import type { Metadata } from "next";
import Link from "next/link";
import { CreditCard } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { cardsContent } from "@/lib/content/cards";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { CardGroup } from "@/features/cards/components/CardGroup";
import { splitCards } from "@/features/cards/splitCards";
import { listCreditCards } from "@/lib/services/creditCardService";

export const metadata: Metadata = appPageMetadata("tarjetas");

/** Lists credit cards grouped by currency, without mixing pesos and dollars. */
export default async function TarjetasPage() {
  const userId = await requireUserId();
  const cards = await listCreditCards(userId);
  const { ars, usd, archived } = splitCards(cards);

  if (cards.length === 0) {
    return (
      <EmptySection title={cardsContent.emptyTitle} body={cardsContent.emptyBody} icon={CreditCard}>
        <div className="mt-6">
          <Link
            href="/tarjetas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {cardsContent.addCard}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {cardsContent.listTitle}
        </h1>
        <Link
          href="/tarjetas/nueva"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {cardsContent.addCard}
        </Link>
      </div>

      <CardGroup title={cardsContent.groupArs} cards={ars} />
      <CardGroup title={cardsContent.groupUsd} cards={usd} />
      <CardGroup title={cardsContent.archivedHeading} cards={archived} />
    </div>
  );
}
