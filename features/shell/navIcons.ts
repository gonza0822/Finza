import type { LucideIcon } from "lucide-react";
import {
  ArrowLeftRight,
  CalendarDays,
  CreditCard,
  Ellipsis,
  House,
  Target,
  TrendingUp,
  Wallet,
} from "lucide-react";
import type { AppNavHref } from "@/lib/content/app";

/** Lucide icons for spec §16 nav items; kept out of content so copy stays data-only. */
export const appNavIcons: Record<AppNavHref, LucideIcon> = {
  "/inicio": House,
  "/movimientos": ArrowLeftRight,
  "/cuentas": Wallet,
  "/tarjetas": CreditCard,
  "/planificacion": CalendarDays,
  "/metas": Target,
  "/proyeccion": TrendingUp,
  "/mas": Ellipsis,
};
