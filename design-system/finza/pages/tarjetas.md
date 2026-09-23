# Tarjetas Page Overrides

> **PROJECT:** Finza
> **Page Type:** Credit card list + detail + form

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, same sand + surface cards as Cuentas (`rounded-3xl`, `border-primary/10`).
- List: group by currency (**Pesos** / **Dólares**). Never a mixed debt total.
- Each card shows **that card’s** debt in its currency, last four, and next due date.
- Mobile: stack name above amount/due so the title is fully readable (do not truncate the name against “Próximo vencimiento”).
- `sm+`: name left, amount and due date right. Due date may wrap; never a mixed debt total.
- Empty: short copy + primary “Agregar tarjeta”. If there are no money accounts, send the user to create one first (needed to pay).
- Detail: stats, then remaining multi-payment **purchases** (one row per gasto: category, remaining total, N cuotas). Individual due dates open in a modal via “Ver cuotas”. Hide that section when every remaining purchase is 1/1. All remaining purchases (including 1/1) live in “Ver deuda”. The payment form’s “Cuota de este mes” lists only multi-payment cuotas due this bill, not 1/1. No charts.

## Form

- Labels on every field. Limit uses the same money format as Cuentas.
- Payment account must match the card currency. Close and due days are 1–28.
- Archive is a two-step confirm (not `window.confirm`).

## Interaction

- Whole list card is a link (`cursor-pointer`). Hover: color/border, no scale.
- Detail CTAs: “Registrar consumo” and “Pagar” go to the movement form with the card preselected. “Ver deuda” opens a modal with remaining purchases (including 1/1). Escape / overlay to close.
- “Ver cuotas” opens a modal with that purchase’s schedule. Focus rings visible. `noValidate` + custom field errors.

## Motion

- Do not animate amounts. Honor `prefers-reduced-motion`.
