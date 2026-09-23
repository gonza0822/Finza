import type { PublicMoneyAccount } from "@/features/accounts/types";

/** Splits accounts for the list: active by currency, archived last. Never a mixed total. */
export function splitAccounts(accounts: PublicMoneyAccount[]) {
  const active = accounts.filter((account) => !account.archived);
  return {
    ars: active.filter((account) => account.currency === "ARS"),
    usd: active.filter((account) => account.currency === "USD"),
    archived: accounts.filter((account) => account.archived),
  };
}
