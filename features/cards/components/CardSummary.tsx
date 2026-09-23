import Link from "next/link";
import { cardsContent } from "@/lib/content/cards";
import { formatIsoDateEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import { DebtCompositionButton } from "@/features/cards/components/DebtCompositionButton";
import type { PublicCreditCard } from "@/features/cards/types";

interface CardSummaryProps {
  card: PublicCreditCard;
}

/** Debt, available, cycle dates and shortcuts to post consumption or a payment. */
export function CardSummary({ card }: CardSummaryProps) {
  return (
    <section className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted">{cardsContent.debtLabel}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(card.debtCents, card.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.availableLabel}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(card.availableCents, card.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.limitStatLabel}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(card.creditLimitCents, card.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.dueNowLabel}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(card.dueNowCents, card.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.openCycleLabel}</dt>
          <dd className="text-lg font-semibold tabular-nums text-foreground">
            {formatMoney(card.openCycleConsumptionCents, card.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.nextCloseLabel}</dt>
          <dd className="text-lg font-semibold text-foreground">
            {formatIsoDateEsAr(card.nextCloseOn)}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-muted">{cardsContent.nextDueLabel}</dt>
          <dd className="text-lg font-semibold text-foreground">
            {formatIsoDateEsAr(card.nextDueOn)}
          </dd>
        </div>
      </dl>
      {card.overLimit ? (
        <p role="status" className="mt-4 text-sm text-warm">
          {cardsContent.overLimitHint}
        </p>
      ) : null}
      {!card.archived ? (
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Link
            href={`/movimientos/nuevo?tipo=gasto&tarjeta=${card.id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {cardsContent.registerSpend}
          </Link>
          <Link
            href={`/movimientos/nuevo?tipo=pago_tarjeta&tarjeta=${card.id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-2xl border-2 border-primary px-5 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
          >
            {cardsContent.payCard}
          </Link>
          <DebtCompositionButton card={card} />
        </div>
      ) : null}
    </section>
  );
}
