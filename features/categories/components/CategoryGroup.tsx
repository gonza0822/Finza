import { CategoryRow } from "@/features/categories/components/CategoryRow";
import type { PublicCategory } from "@/features/categories/types";

interface CategoryGroupProps {
  title: string;
  categories: PublicCategory[];
}

/** Kind group with optional nested subcategories. */
export function CategoryGroup({ title, categories }: CategoryGroupProps) {
  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <ul className="flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="flex flex-col gap-2">
            <CategoryRow category={category} />
            {category.children.map((child) => (
              <CategoryRow key={child.id} category={child} nested />
            ))}
          </li>
        ))}
      </ul>
    </section>
  );
}
