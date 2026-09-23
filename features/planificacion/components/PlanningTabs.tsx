import Link from "next/link";
import { planificacionContent } from "@/lib/content/planificacion";
import { planningHref, type PlanningTab } from "@/features/planificacion/planningHref";

interface PlanningTabsProps {
  tab: PlanningTab;
  yearMonth: string;
}

/** Calendario (default), Recurrentes and Presupuestos. */
export function PlanningTabs({ tab, yearMonth }: PlanningTabsProps) {
  const items = [
    { id: "calendario" as const, label: planificacionContent.tabCalendario },
    { id: "recurrentes" as const, label: planificacionContent.tabRecurrentes },
    { id: "presupuestos" as const, label: planificacionContent.tabPresupuestos },
  ];

  return (
    <div
      role="tablist"
      aria-label={planificacionContent.tabListLabel}
      className="grid grid-cols-3 gap-1 rounded-2xl border border-primary/10 bg-cream p-1"
    >
      {items.map((item) => {
        const selected = tab === item.id;
        return (
          <Link
            key={item.id}
            href={planningHref(item.id, yearMonth)}
            role="tab"
            aria-selected={selected}
            id={`planificacion-tab-${item.id}`}
            aria-controls={`planificacion-panel-${item.id}`}
            className={`cursor-pointer rounded-xl px-2 py-2.5 text-center text-xs font-semibold leading-tight transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none sm:px-4 sm:text-sm ${
              selected
                ? "bg-primary text-cream"
                : "text-primary hover:bg-primary/5"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
