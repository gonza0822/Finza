import type { PublicCreditCard } from "@/features/cards/types";

/** Splits cards for the list: active by currency, archived last. Never a mixed total. */
export function splitCards(cards: PublicCreditCard[]) {
  const active = cards.filter((card) => !card.archived);
  return {
    ars: active.filter((card) => card.currency === "ARS"),
    usd: active.filter((card) => card.currency === "USD"),
    archived: cards.filter((card) => card.archived),
  };
}
