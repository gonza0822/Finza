"use client";

import dynamic from "next/dynamic";
import { formatMoney } from "@/lib/money/format";
import { inicioContent } from "@/lib/content/inicio";
import { proyeccionContent } from "@/lib/content/proyeccion";
import { ProjectionTable } from "@/features/proyeccion/components/ProjectionTable";
import type { CurrencyProjection } from "@/features/proyeccion/types";

const ProjectionChart = dynamic(
  () =>
    import("@/features/proyeccion/components/ProjectionChart").then((mod) => mod.ProjectionChart),
  { ssr: false },
);

interface ProjectionCurrencyBlockProps {
  title: string;
  projection: CurrencyProjection;
}

/** One currency: today, chart, then the month table. */
export function ProjectionCurrencyBlock({ title, projection }: ProjectionCurrencyBlockProps) {
  return (
    <section className="rounded-3xl border border-primary/10 bg-surface/90 p-5 shadow-md sm:p-6">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <p className="mt-3 text-2xl font-semibold tracking-tight text-foreground whitespace-nowrap tabular-nums sm:text-3xl">
        {formatMoney(projection.cashTodayCents, projection.currency)}
      </p>
      <p className="mt-1 text-sm text-muted">{proyeccionContent.todayLabel}</p>
      <dl className="mt-4 flex flex-col gap-2 sm:flex-row sm:gap-6">
        <div className="flex items-baseline justify-between gap-3 sm:justify-start">
          <dt className="text-sm text-muted">{inicioContent.debtLabel}</dt>
          <dd className="text-sm font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(projection.debtTodayCents, projection.currency)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-3 sm:justify-start">
          <dt className="text-sm text-muted">{inicioContent.netWorthLabel}</dt>
          <dd className="text-sm font-semibold whitespace-nowrap tabular-nums text-foreground">
            {formatMoney(projection.netWorthTodayCents, projection.currency)}
          </dd>
        </div>
      </dl>
      <div
        className="mt-5"
        role="img"
        aria-label={proyeccionContent.chartAria(title)}
      >
        <ProjectionChart currency={projection.currency} months={projection.months} />
      </div>
      <div className="mt-6">
        <ProjectionTable currency={projection.currency} months={projection.months} />
      </div>
    </section>
  );
}
