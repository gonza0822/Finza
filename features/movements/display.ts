import { formatMoney } from "@/lib/money/format";
import type { PublicMovement } from "@/features/movements/types";

/** Account or card names for a book row, including the other leg of a transfer or conversion. */
export function accountCell(movement: PublicMovement): string {
  if (
    (movement.type === "transferencia" || movement.type === "conversion") &&
    movement.counterAccountName
  ) {
    return `${movement.accountName} → ${movement.counterAccountName}`;
  }
  if (movement.type === "pago_tarjeta" && movement.creditCardName) {
    return `${movement.accountName} → ${movement.creditCardName}`;
  }
  if (movement.type === "gasto" && movement.creditCardName && !movement.accountId) {
    return movement.creditCardName;
  }
  return movement.accountName;
}

/** Amount text and tone for a book row; ARS and USD are never mixed into one total. */
export function amountCell(movement: PublicMovement): {
  text: string;
  tone: "in" | "out" | "neutral";
} {
  if (movement.type === "conversion" && movement.counterAmountCents !== null && movement.counterCurrency) {
    return {
      text: `${formatMoney(movement.amountCents, movement.currency)} → ${formatMoney(movement.counterAmountCents, movement.counterCurrency)}`,
      tone: "neutral",
    };
  }
  if (movement.type === "transferencia") {
    return { text: formatMoney(movement.amountCents, movement.currency), tone: "neutral" };
  }
  if (movement.type === "ingreso" || movement.ajusteDirection === "sube") {
    return { text: `+ ${formatMoney(movement.amountCents, movement.currency)}`, tone: "in" };
  }
  return { text: `− ${formatMoney(movement.amountCents, movement.currency)}`, tone: "out" };
}

/** Flattened category options for selects, parents first then children. */
export function flattenCategoryOptions(
  tree: Array<{ id: string; name: string; children: Array<{ id: string; name: string }> }>,
): Array<{ id: string; name: string }> {
  const options: Array<{ id: string; name: string }> = [];
  for (const parent of tree) {
    options.push({ id: parent.id, name: parent.name });
    for (const child of parent.children) {
      options.push({ id: child.id, name: `${parent.name} · ${child.name}` });
    }
  }
  return options;
}

/** Unique accounts that appear on movements, for the account filter. */
export function accountOptionsFromMovements(
  movements: PublicMovement[],
): Array<{ id: string; name: string }> {
  const byId = new Map<string, string>();
  for (const movement of movements) {
    if (movement.accountId && movement.accountName) {
      byId.set(movement.accountId, movement.accountName);
    }
    if (movement.counterAccountId && movement.counterAccountName) {
      byId.set(movement.counterAccountId, movement.counterAccountName);
    }
    if (movement.creditCardId && movement.creditCardName) {
      byId.set(movement.creditCardId, movement.creditCardName);
    }
  }
  return [...byId.entries()]
    .map(([id, name]) => ({ id, name }))
    .sort((left, right) => left.name.localeCompare(right.name, "es"));
}
