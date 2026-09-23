# Inicio Page Overrides

> **PROJECT:** Finza
> **Page Type:** Situation dashboard (cash, card debt, net worth)

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`. Greeting is the only `h1`. Totals are `h2` cards.
- Two surface cards when both currencies exist (`sm:grid-cols-2`). One card if only ARS or only USD.
- Hide the USD block when there are no active USD accounts. Hide ARS if there are none. Never a mixed total.
- Each card: large `tabular-nums` cash total (T), then **Deuda de tarjetas**, **Patrimonio** (T − deuda), **Comprometido** (deuda + recurrentes de cuenta del mes sin confirmar + asignado a objetivos activos/alcanzados) and **Libre** (T − comprometido) in that currency. Amounts `whitespace-nowrap`. Do not animate amounts.
- Empty (no accounts): the signed-in layout sends the user to onboarding (1+ accounts).
- With accounts: primary CTA “Registrar movimiento”.
- No charts. Comprometido incluye el blando de objetivos. Presupuesto del mes is a separate block.

## Color

- Locked Finza tokens. Negative **cash** total: AlertCircle + warm eyebrow copy naming the currency, still readable contrast. Do not use color alone. Negative patrimonio or Libre is shown as a number, not hidden.

## Interaction

- CTA `cursor-pointer`, hover color, visible focus ring.
- Totals are not clickable.
- Honor `prefers-reduced-motion`. Do not animate the amounts (they are the content).
