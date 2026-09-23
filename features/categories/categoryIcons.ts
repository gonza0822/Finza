import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Briefcase,
  Car,
  Circle,
  CreditCard,
  GraduationCap,
  HeartPulse,
  House,
  Repeat,
  Scale,
  Shirt,
  Ticket,
  Users,
  Utensils,
  Zap,
} from "lucide-react";

const categoryIcons: Record<string, LucideIcon> = {
  house: House,
  utensils: Utensils,
  car: Car,
  zap: Zap,
  repeat: Repeat,
  "heart-pulse": HeartPulse,
  "graduation-cap": GraduationCap,
  ticket: Ticket,
  shirt: Shirt,
  users: Users,
  "credit-card": CreditCard,
  circle: Circle,
  banknote: Banknote,
  briefcase: Briefcase,
  scale: Scale,
};

/** Resolves a stored icon key to Lucide. Unknown keys fall back to a circle. */
export function categoryIcon(name: string): LucideIcon {
  return categoryIcons[name] ?? Circle;
}
