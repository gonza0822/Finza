export type PlanningTab = "calendario" | "recurrentes" | "presupuestos";

/** Calendario is the default hub; other tabs use an explicit query. */
export function parsePlanningTab(raw: string | undefined): PlanningTab {
  if (raw === "presupuestos" || raw === "recurrentes") {
    return raw;
  }
  return "calendario";
}

/** Builds /planificacion keeping the active tab and optional month. */
export function planningHref(tab: PlanningTab, yearMonth?: string): string {
  const params = new URLSearchParams();
  if (tab !== "calendario") {
    params.set("tab", tab);
  }
  if (yearMonth) {
    params.set("mes", yearMonth);
  }
  const query = params.toString();
  return query ? `/planificacion?${query}` : "/planificacion";
}
