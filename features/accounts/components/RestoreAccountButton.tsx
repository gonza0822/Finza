import { restoreMoneyAccountAction } from "@/lib/actions/accounts";
import { accountsContent } from "@/lib/content/accounts";

interface RestoreAccountButtonProps {
  accountId: string;
}

/** Restores an archived account via the existing server action. */
export function RestoreAccountButton({ accountId }: RestoreAccountButtonProps) {
  return (
    <form action={restoreMoneyAccountAction}>
      <input type="hidden" name="id" value={accountId} />
      <button
        type="submit"
        className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {accountsContent.restore}
      </button>
    </form>
  );
}
