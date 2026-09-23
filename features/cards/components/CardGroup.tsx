import { CardListItem } from "@/features/cards/components/CardListItem";
import type { PublicCreditCard } from "@/features/cards/types";

interface CardGroupProps {
  title: string;
  cards: PublicCreditCard[];
}

/** Currency or archived heading plus the cards in that group. */
export function CardGroup({ title, cards }: CardGroupProps) {
  if (cards.length === 0) {
    return null;
  }
  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">{title}</h2>
      <ul className="flex flex-col gap-3">
        {cards.map((card) => (
          <li key={card.id}>
            <CardListItem card={card} />
          </li>
        ))}
      </ul>
    </section>
  );
}
