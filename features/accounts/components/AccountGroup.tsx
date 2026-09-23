import type { PublicMoneyAccount } from "@/features/accounts/types";
import { AccountCard } from "@/features/accounts/components/AccountCard";

interface AccountGroupProps {
  title: string;
  accounts: PublicMoneyAccount[];
}

/** Currency group without a summed total. */
export function AccountGroup({ title, accounts }: AccountGroupProps) {
  if (accounts.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <ul className="flex flex-col gap-3">
        {accounts.map((account) => (
          <li key={account.id}>
            <AccountCard account={account} />
          </li>
        ))}
      </ul>
    </section>
  );
}
