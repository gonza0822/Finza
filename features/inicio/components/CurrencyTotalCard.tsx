import { AlertCircle } from "lucide-react";
import { formatMoney } from "@/lib/money/format";
import { inicioContent } from "@/lib/content/inicio";
import type { CurrencySituation } from "@/features/inicio/types";

interface CurrencySituationCardProps {
  title: string;
  situation: CurrencySituation;
}

/** One currency’s cash, debt, net worth, committed (hard + soft) and Libre. */
export function CurrencyTotalCard({ title, situation }: CurrencySituationCardProps) {
  return (
    <article className="rounded-3xl border border-primary/10 bg-surface/90 px-5 py-6 shadow-md">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground whitespace-nowrap tabular-nums sm:text-4xl">
        {formatMoney(situation.cashCents, situation.currency)}
      </p>
      <p className="mt-1 text-sm text-muted">{inicioContent.cashLabel}</p>
      <dl className="mt-5 flex flex-col gap-3 border-t border-primary/10 pt-4">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted">{inicioContent.debtLabel}</dt>
          <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(situation.debtCents, situation.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted">{inicioContent.netWorthLabel}</dt>
          <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(situation.netWorthCents, situation.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-sm text-muted">{inicioContent.committedLabel}</dt>
          <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(situation.committedCents, situation.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="min-w-0 text-sm text-muted">{inicioContent.freeLabel}</dt>
          <dd className="shrink-0 text-base font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(situation.freeCents, situation.currency)}
          </dd>
        </div>
      </dl>
      <p className="mt-3 text-sm text-muted">{inicioContent.accountsCount(situation.accountCount)}</p>
    </article>
  );
}

interface NegativeTotalsAlertProps {
  currencies: string[];
}

/** Warns when a currency’s cash total is below zero; recording is still allowed. */
export function NegativeTotalsAlert({ currencies }: NegativeTotalsAlertProps) {
  return (
    <div
      role="status"
      className="flex items-start gap-3 rounded-3xl border border-warm/30 bg-cream px-5 py-4"
    >
      <AlertCircle className="mt-0.5 size-5 shrink-0 text-warm" aria-hidden />
      <div>
        <p className="font-semibold text-foreground">{inicioContent.negativeTitle}</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          {inicioContent.negativeBody(currencies)}
        </p>
      </div>
    </div>
  );
}
