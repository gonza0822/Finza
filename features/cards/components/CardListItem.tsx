import Link from "next/link";
import { CreditCard } from "lucide-react";
import { cardsContent } from "@/lib/content/cards";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import type { PublicCreditCard } from "@/features/cards/types";

interface CardListItemProps {
  card: PublicCreditCard;
}

/** One card: name, last four, debt and next due in that card's currency only. */
export function CardListItem({ card }: CardListItemProps) {
  return (
    <Link
      href={`/tarjetas/${card.id}`}
      className={`flex cursor-pointer flex-col gap-3 rounded-3xl border bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:flex-row sm:items-center sm:justify-between sm:gap-4 ${
        card.archived ? "border-primary/5 opacity-80" : "border-primary/10"
      }`}
    >
      <span className="flex min-w-0 items-start gap-3">
        <CreditCard className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block font-medium break-words text-foreground">{card.name}</span>
          <span className="block text-sm text-muted">
            {cardsContent.lastFourPrefix} {card.lastFour}
          </span>
        </span>
      </span>
      <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 pl-8 sm:shrink-0 sm:flex-col sm:items-end sm:pl-0 sm:text-right">
        {card.archived ? (
          <span className="order-first w-full text-xs font-medium tracking-wide text-warm uppercase sm:mb-1 sm:w-auto">
            {cardsContent.archivedBadge}
          </span>
        ) : null}
        <span className="text-base font-semibold tabular-nums text-foreground">
          {formatMoney(card.debtCents, card.currency)}
        </span>
        <span className="text-xs text-muted sm:max-w-[11.5rem] sm:text-right">
          {cardsContent.nextDueLabel} {formatIsoDateEsAr(card.nextDueOn)}
        </span>
      </span>
    </Link>
  );
}
