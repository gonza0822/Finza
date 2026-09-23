import Link from "next/link";
import { PROJECTION_HORIZONS, type ProjectionHorizon } from "@/features/proyeccion/types";
import { proyeccionContent } from "@/lib/content/proyeccion";

interface HorizonSwitcherProps {
  horizon: ProjectionHorizon;
}

/** 1–6 month window; the current value is aria-current. */
export function HorizonSwitcher({ horizon }: HorizonSwitcherProps) {
  return (
    <nav aria-label={proyeccionContent.horizonAria} className="flex flex-col gap-2">
      <p className="text-sm font-medium text-foreground">{proyeccionContent.horizonLabel}</p>
      <ul className="flex flex-wrap gap-2">
        {PROJECTION_HORIZONS.map((months) => {
          const active = months === horizon;
          return (
            <li key={months}>
              <Link
                href={`/proyeccion?meses=${months}`}
                aria-current={active ? "page" : undefined}
                className={`inline-flex cursor-pointer rounded-2xl px-3 py-2 text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
                  active
                    ? "bg-primary text-cream"
                    : "border border-primary/15 text-primary hover:bg-cream"
                }`}
              >
                {proyeccionContent.horizonMonths(months)}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
