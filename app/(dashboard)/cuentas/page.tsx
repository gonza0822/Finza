import type { Metadata } from "next";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { requireUserId } from "@/lib/auth/requireUser";
import { accountsContent } from "@/lib/content/accounts";
import { appPageMetadata } from "@/features/shell/pageMetadata";
import { EmptySection } from "@/features/shell/components/EmptySection";
import { AccountGroup } from "@/features/accounts/components/AccountGroup";
import { splitAccounts } from "@/features/accounts/splitAccounts";
import { listMoneyAccounts } from "@/lib/services/moneyAccountService";

export const metadata: Metadata = appPageMetadata("cuentas");

/** Lists money accounts grouped by currency, without a mixed total. */
export default async function CuentasPage() {
  const userId = await requireUserId();
  const accounts = await listMoneyAccounts(userId);
  const { ars, usd, archived } = splitAccounts(accounts);

  if (accounts.length === 0) {
    return (
      <EmptySection
        title={accountsContent.emptyTitle}
        body={accountsContent.emptyBody}
        icon={Wallet}
      >
        <div className="mt-6">
          <Link
            href="/cuentas/nueva"
            className="inline-flex cursor-pointer rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
          >
            {accountsContent.addAccount}
          </Link>
        </div>
      </EmptySection>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {accountsContent.listTitle}
        </h1>
        <Link
          href="/cuentas/nueva"
          className="inline-flex cursor-pointer items-center justify-center rounded-2xl bg-primary px-5 py-2.5 text-sm font-semibold text-cream transition-colors duration-200 hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
        >
          {accountsContent.addAccount}
        </Link>
      </div>

      <AccountGroup title={accountsContent.groupArs} accounts={ars} />
      <AccountGroup title={accountsContent.groupUsd} accounts={usd} />
      <AccountGroup title={accountsContent.archivedHeading} accounts={archived} />
    </div>
  );
}
