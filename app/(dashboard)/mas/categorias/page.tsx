import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { categoriesContent } from "@/lib/content/categories";
import { listActiveCategories } from "@/lib/services/categoryService";
import { CategoryGroup } from "@/features/categories/components/CategoryGroup";

export const metadata: Metadata = {
  title: categoriesContent.metaTitle,
  description: categoriesContent.metaDescription,
};

/** Read-only catalog of system categories after seed. */
export default async function CategoriasPage() {
  await requireUserId();
  const categories = await listActiveCategories();
  const gastos = categories.filter((item) => item.kind === "gasto");
  const ingresos = categories.filter((item) => item.kind === "ingreso");
  const ajustes = categories.filter((item) => item.kind === "ajuste");

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <Link
          href="/mas"
          className="inline-flex w-fit cursor-pointer items-center gap-1.5 text-sm font-medium text-primary transition-colors duration-200 hover:text-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {categoriesContent.backToMas}
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {categoriesContent.title}
        </h1>
        <p className="text-base leading-7 text-muted">{categoriesContent.lead}</p>
        <p className="text-sm text-muted">{categoriesContent.pinLegend}</p>
      </header>

      {categories.length === 0 ? (
        <p className="rounded-3xl border border-primary/10 bg-surface/90 px-5 py-6 text-muted">
          {categoriesContent.empty}
        </p>
      ) : (
        <>
          <CategoryGroup title={categoriesContent.groupGasto} categories={gastos} />
          <CategoryGroup title={categoriesContent.groupIngreso} categories={ingresos} />
          <CategoryGroup title={categoriesContent.groupAjuste} categories={ajustes} />
        </>
      )}
    </div>
  );
}
