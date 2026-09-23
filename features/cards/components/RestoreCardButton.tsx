import { restoreCreditCardAction } from "@/lib/actions/cards";
import { cardsContent } from "@/lib/content/cards";

interface RestoreCardButtonProps {
  cardId: string;
}

/** Restores an archived card via the existing server action. */
export function RestoreCardButton({ cardId }: RestoreCardButtonProps) {
  return (
    <form action={restoreCreditCardAction}>
      <input type="hidden" name="id" value={cardId} />
      <button
        type="submit"
        className="cursor-pointer rounded-2xl border-2 border-primary px-4 py-2.5 text-sm font-semibold text-primary transition-colors duration-200 hover:bg-cream focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:outline-none"
      >
        {cardsContent.restore}
      </button>
    </form>
  );
}
