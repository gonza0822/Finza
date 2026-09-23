import { categoryIcon } from "@/features/categories/categoryIcons";
import { categoryKindPinClass } from "@/features/categories/kindPinClass";
import type { PublicCategory } from "@/features/categories/types";

interface CategoryRowProps {
  category: PublicCategory;
  nested?: boolean;
}

/** Read-only category row. Not a link: no edit in this phase. */
export function CategoryRow({ category, nested = false }: CategoryRowProps) {
  const Icon = categoryIcon(category.icon);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border border-primary/10 bg-surface/90 px-4 py-3 ${
        nested ? "ml-6 sm:ml-8" : ""
      }`}
    >
      <span
        className={`size-2.5 shrink-0 rounded-full ${categoryKindPinClass(category.kind)}`}
        aria-hidden
      />
      <Icon className="size-5 shrink-0 text-primary" aria-hidden />
      <span className="font-medium text-foreground">{category.name}</span>
    </div>
  );
}
