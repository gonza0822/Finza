import { getModels } from "@/lib/db/models";
import type { CategoryKind } from "@/lib/db/enums";
import type { PublicCategory } from "@/features/categories/types";

interface CategoryRow {
  id: string;
  parentId: string | null;
  slug: string;
  name: string;
  kind: CategoryKind;
  icon: string;
  color: string;
  sortOrder: number;
}

/** Maps a row plus its children into the public tree node. */
function toPublic(row: CategoryRow, children: PublicCategory[]): PublicCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind,
    icon: row.icon,
    color: row.color,
    children,
  };
}

/** Lists active system categories as a tree. Shared catalog, not per-user. */
export async function listActiveCategories(): Promise<PublicCategory[]> {
  const { Category } = getModels();
  const rows = await Category.findAll({
    where: { archivedAt: null },
    order: [
      ["kind", "ASC"],
      ["sortOrder", "ASC"],
      ["name", "ASC"],
    ],
  });

  const plain = rows.map((row) => row.get({ plain: true }) as CategoryRow);
  const childrenByParent = new Map<string, PublicCategory[]>();

  for (const row of plain) {
    if (!row.parentId) {
      continue;
    }
    const siblings = childrenByParent.get(row.parentId) ?? [];
    siblings.push(toPublic(row, []));
    childrenByParent.set(row.parentId, siblings);
  }

  return plain
    .filter((row) => !row.parentId)
    .map((row) => toPublic(row, childrenByParent.get(row.id) ?? []));
}
