import type { Metadata } from "next";
import { requireUserId } from "@/lib/auth/requireUser";
import { createMoneyAccountAction } from "@/lib/actions/accounts";
import { accountsContent } from "@/lib/content/accounts";
import { getDefaultCurrency } from "@/lib/services/userSettingsService";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { AccountPageHeader } from "@/features/accounts/components/AccountPageHeader";

export const metadata: Metadata = {
  title: accountsContent.newMetaTitle,
  description: accountsContent.newMetaDescription,
};

/** Create a money account (name, type, currency, initial balance). */
export default async function NuevaCuentaPage() {
  const userId = await requireUserId();
  const currency = await getDefaultCurrency(userId);

  return (
    <div className="mx-auto w-full max-w-3xl">
      <AccountPageHeader
        title={accountsContent.newTitle}
        backHref="/cuentas"
        backLabel={accountsContent.backToList}
      />
      <div className="rounded-3xl border border-primary/10 bg-surface/90 p-6 shadow-md sm:p-8">
        <AccountForm
          mode="create"
          defaults={{
            name: "",
            type: "banco",
            currency,
            initialBalance: "",
            notes: "",
          }}
          action={createMoneyAccountAction}
        />
      </div>
    </div>
  );
}
