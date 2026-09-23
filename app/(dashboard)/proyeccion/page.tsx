import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { appPages } from "@/lib/content/app";
import { inicioContent } from "@/lib/content/inicio";
import { proyeccionContent } from "@/lib/content/proyeccion";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { HorizonSwitcher } from "@/features/proyeccion/components/HorizonSwitcher";
import { NegativeProjectionAlert } from "@/features/proyeccion/components/NegativeProjectionAlert";
import { ProjectionCurrencyBlock } from "@/features/proyeccion/components/ProjectionCurrencyBlock";
import { getProjection, parseHorizonMonths } from "@/lib/services/projectionService";

export const metadata: Metadata = appPageMetadata("proyeccion");

interface ProyeccionPageProps {
  searchParams: Promise<{ meses?: string }>;
}

/** End-of-month cash and net worth per currency, never one mixed total. */
export default async function ProyeccionPage({ searchParams }: ProyeccionPageProps) {
  const userId = await requireUserId();
  const horizon = parseHorizonMonths((await searchParams).meses);
  const projection = await getProjection(userId, horizon);
  const hasData = projection.ars !== null || projection.usd !== null;

  if (!hasData) {
    return (
      <EmptySection
        title={proyeccionContent.emptyTitle}
        body={proyeccionContent.emptyBody}
        icon={TrendingUp}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {proyeccionContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  const negative: string[] = [];
  if (projection.ars?.goesNegative) {
    negative.push(inicioContent.totalArs);
  }
  if (projection.usd?.goesNegative) {
    negative.push(inicioContent.totalUsd);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {appPages.proyeccion.title}
      </h1>
      <HorizonSwitcher horizon={horizon} />
      {negative.length > 0 ? <NegativeProjectionAlert currencies={negative} /> : null}
      {projection.ars ? (
        <ProjectionCurrencyBlock title={inicioContent.totalArs} projection={projection.ars} />
      ) : null}
      {projection.usd ? (
        <ProjectionCurrencyBlock title={inicioContent.totalUsd} projection={projection.usd} />
      ) : null}
      <p className="text-sm leading-6 text-muted">{proyeccionContent.hint}</p>
    </div>
  );
}
