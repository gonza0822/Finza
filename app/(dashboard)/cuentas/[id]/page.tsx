import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireUserId } from "@/lib/auth/requireUser";
import { updateMoneyAccountAction } from "@/lib/actions/accounts";
import { accountsContent } from "@/lib/content/accounts";
import { centsToInputValue } from "@/lib/money/parse";
import { getMoneyAccount } from "@/lib/services/moneyAccountService";
import { listActiveCategories } from "@/lib/services/categoryService";
import { listMovementsForAccount } from "@/lib/services/movementService";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";
import { ArchiveAccountButton } from "@/features/accounts/components/ArchiveAccountButton";
import { RestoreAccountButton } from "@/features/accounts/components/RestoreAccountButton";
import { MovementBook } from "@/features/movements/components/MovementBook";

export const metadata: Metadata = {
  title: accountsContent.editMetaTitle,
  description: accountsContent.editMetaDescription,
};

interface EditCuentaPageProps {
  params: Promise<{ id: string }>;
}

/** Edit or archive an owned money account, with that account's book. */
export default async function EditCuentaPage({ params }: EditCuentaPageProps) {
  const { id } = await params;
  const userId = await requireUserId();
  const [account, movements, categories] = await Promise.all([
    getMoneyAccount(userId, id),
    listMovementsForAccount(userId, id),
    listActiveCategories(),
  ]);
  if (!account || !movements) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="mx-auto w-full max-w-3xl">
        <AccountPageHeader
          title={accountsContent.editTitle}
          backHref="/cuentas"
          backLabel={accountsContent.backToList}
        />
        <div className="flex flex-col gap-6">
          <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
            <AccountForm
              mode="edit"
              accountId={account.id}
              defaults={{
                name: account.name,
                type: account.type,
                currency: account.currency,
                initialBalance: centsToInputValue(account.initialBalanceCents),
                notes: account.notes ?? "",
              }}
              ledgerLocked={account.hasLedgers}
              action={updateMoneyAccountAction}
            />
          </div>
          {account.archived ? (
            <RestoreAccountButton accountId={account.id} />
          ) : (
            <ArchiveAccountButton accountId={account.id} />
          )}
        </div>
      </div>

      <section className="flex flex-col gap-4" aria-labelledby="account-history-title">
        <h2
          id="account-history-title"
          className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl"
        >
          {accountsContent.historyTitle}
        </h2>
        {movements.length === 0 ? (
          <p className="rounded-3xl border border-primary/10 bg-surface/90 px-5 py-8 text-center text-sm leading-6 text-muted shadow-md">
            {accountsContent.historyEmpty}
          </p>
        ) : (
          <MovementBook
            movements={movements}
            categories={categories}
            hideAccountFilter
            tableCaption={accountsContent.historyCaption}
          />
        )}
      </section>
    </div>
  );
}
