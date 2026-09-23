import Link from "next/link";
import { Banknote, Landmark, Smartphone, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AccountType } from "@/lib/db/enums";
import { accountsContent } from "@/lib/content/accounts";
import { formatMoney } from "@/lib/money/format";
import type { PublicMoneyAccount } from "@/features/accounts/types";

const typeIcons: Record<AccountType, LucideIcon> = {
  banco: Landmark,
  billetera: Smartphone,
  efectivo: Banknote,
  otro: Wallet,
};

interface AccountCardProps {
  account: PublicMoneyAccount;
}

/** One account: name, type and balance in that account's currency only. */
export function AccountCard({ account }: AccountCardProps) {
  const Icon = typeIcons[account.type];

  return (
    <Link
      href={`/cuentas/${account.id}`}
      className={`flex cursor-pointer items-center justify-between gap-4 rounded-3xl border bg-surface/90 px-5 py-4 shadow-md transition-colors duration-200 hover:border-primary/25 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none ${
        account.archived ? "border-primary/5 opacity-80" : "border-primary/10"
      }`}
    >
      <span className="flex min-w-0 items-center gap-3">
        <Icon className="size-5 shrink-0 text-primary" aria-hidden />
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">{account.name}</span>
          <span className="block text-sm text-muted">{accountsContent.types[account.type]}</span>
        </span>
      </span>
      <span className="shrink-0 text-right">
        {account.archived ? (
          <span className="mb-1 block text-xs font-medium tracking-wide text-warm uppercase">
            {accountsContent.archivedBadge}
          </span>
        ) : null}
        <span className="block text-base font-semibold tabular-nums text-foreground">
          {formatMoney(account.balanceCents, account.currency)}
        </span>
      </span>
    </Link>
  );
}
