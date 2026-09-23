import type { PublicCreditCard } from "@/features/cards/types";

export interface CardPaymentChoice {
  id: string;
  cents: number;
  kind: "dueNow" | "statement" | "installment";
  title?: string;
  number?: number;
  count?: number;
}

/** Next unpaid cuota per purchase that belongs to this bill, plus rollup choices. */
export function cardPaymentChoices(card: PublicCreditCard): CardPaymentChoice[] {
  const installments: CardPaymentChoice[] = [];

  for (const purchase of card.installmentPurchases) {
    if (purchase.count <= 1) {
      continue;
    }
    const next = purchase.installments.find((item) => item.remainingCents > 0);
    if (!next) {
      continue;
    }
    if (next.dueOn > card.nextDueOn) {
      continue;
    }
    installments.push({
      id: next.id,
      cents: next.remainingCents,
      kind: "installment",
      title: purchase.categoryName ?? undefined,
      number: next.number,
      count: next.count,
    });
  }

  const statementCents = installments.reduce((sum, item) => sum + item.cents, 0);
  const choices: CardPaymentChoice[] = [];
  if (card.dueNowCents > 0 && card.dueNowCents !== statementCents) {
    choices.push({ id: "due-now", cents: card.dueNowCents, kind: "dueNow" });
  }
  if (installments.length > 1) {
    choices.push({ id: "statement", cents: statementCents, kind: "statement" });
  }
  choices.push(...installments);
  return choices;
}
