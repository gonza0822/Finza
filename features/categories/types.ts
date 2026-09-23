import type { CategoryKind } from "@/lib/db/enums";

export interface PublicCategory {
  id: string;
  slug: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  children: PublicCategory[];
}
