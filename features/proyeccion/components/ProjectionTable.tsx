import { formatYearMonthEsAr } from "@/lib/dates/isoDate";
import { formatMoney } from "@/lib/money/format";
import { proyeccionContent } from "@/lib/content/proyeccion";
import type { Currency } from "@/lib/db/enums";
import type { ProjectionMonth } from "@/features/proyeccion/types";

interface ProjectionTableProps {
  currency: Currency;
  months: ProjectionMonth[];
}

/** Accessible month breakdown; the chart is the visual twin. */
export function ProjectionTable({ currency, months }: ProjectionTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-sm">
        <caption className="sr-only">{proyeccionContent.monthHeading}</caption>
        <thead>
          <tr className="border-b border-primary/10 text-left text-muted">
            <th scope="col" className="py-2 pr-3 font-medium">
              {proyeccionContent.monthHeading}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {proyeccionContent.incomeLabel}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {proyeccionContent.accountSpendLabel}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {proyeccionContent.cardPaymentLabel}
            </th>
            <th scope="col" className="py-2 pr-3 text-right font-medium">
              {proyeccionContent.cashLabel}
            </th>
            <th scope="col" className="py-2 text-right font-medium">
              {proyeccionContent.netWorthLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {months.map((month) => (
            <tr key={month.yearMonth} className="border-b border-primary/10 last:border-0">
              <th scope="row" className="py-3 pr-3 text-left font-medium capitalize text-foreground">
                {formatYearMonthEsAr(month.yearMonth)}
              </th>
              <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums text-foreground">
                {formatMoney(month.incomeCents, currency)}
              </td>
              <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums text-foreground">
                {formatMoney(month.accountSpendCents, currency)}
              </td>
              <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums text-foreground">
                {formatMoney(month.cardPaymentCents, currency)}
              </td>
              <td className="py-3 pr-3 text-right whitespace-nowrap tabular-nums font-semibold text-foreground">
                {formatMoney(month.cashCents, currency)}
              </td>
              <td className="py-3 text-right whitespace-nowrap tabular-nums font-semibold text-foreground">
                {formatMoney(month.netWorthCents, currency)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
