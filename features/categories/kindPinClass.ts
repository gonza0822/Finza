import type { CategoryKind } from "@/lib/db/enums";

const kindPinClass: Record<CategoryKind, string> = {
  gasto: "bg-primary",
  ingreso: "bg-teal-glow",
  ajuste: "bg-warm",
};

/** Pin color follows kind, not the leftover seed hex. */
export function categoryKindPinClass(kind: CategoryKind): string {
  return kindPinClass[kind];
}
