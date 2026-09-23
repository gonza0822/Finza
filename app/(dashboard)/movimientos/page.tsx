import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeftRight } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { movementsContent } from "@/lib/content/movements";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { MovementBook } from "@/features/movements/components/MovementBook";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listActiveMoneyAccounts } from "@/lib/services/moneyAccountService";
import { listMovements } from "@/lib/services/movementService";

export const metadata: Metadata = appPageMetadata("movimientos");

/** Lists confirmed gastos and ingresos, or an empty book with a next step. */
export default async function MovimientosPage() {
  const userId = await requireUserId();
  const [movements, accounts, categories] = await Promise.all([
    listMovements(userId),
    listActiveMoneyAccounts(userId),
    listActiveCategories(),
  ]);

  if (movements.length === 0) {
    const noAccounts = accounts.length === 0;
    return (
      <EmptySection
        title={movementsContent.emptyTitle}
        body={noAccounts ? movementsContent.emptyNoAccountsBody : movementsContent.emptyBody}
        icon={ArrowLeftRight}
      >
        <div className="mt-6">
          <Link
            href={noAccounts ? "/cuentas/nueva" : "/movimientos/nuevo"}
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {noAccounts ? movementsContent.addAccount : movementsContent.addMovement}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-5xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {movementsContent.listTitle}
        </h1>
        <Link
          href="/movimientos/nuevo"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {movementsContent.addMovement}
        </Link>
      </div>
      <MovementBook movements={movements} categories={categories} />
    </div>
  );
}
