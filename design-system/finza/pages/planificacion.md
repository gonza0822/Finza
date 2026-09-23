# Planificación Page Overrides

> **PROJECT:** Finza
> **Page Type:** Recurrence hub + budgets + month calendar

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, same sand + surface cards as Cuentas (`rounded-3xl`, `border-primary/10`).
- Hub: three tabs under the h1 (**Calendario** default, **Recurrentes**, **Presupuestos**). Query `?tab=recurrentes` or `?tab=presupuestos`.
- Calendario tab: month switcher + month grid (recurrences and card dues). No extra heading.
- Recurrentes tab: this month’s confirm/omit + rule list. CTA “Agregar recurrente”.
- Presupuestos tab: month switcher, category caps. CTA “Agregar presupuesto”.
- Do not mix ARS and USD in one amount. Budget bars are per category **and** currency.
- Empty without accounts or cards: short copy + primary “Agregar cuenta”.
- Form pages: one column, labels on every field. Submit shows pending text.

## Color / type

- Locked Finza tokens. Primary CTA teal, cream text.
- Alert ≥80%: peach eyebrow “Alerta”. Over 100%: “Excedido” plus red fill on the bar. Always also show the used/cap numbers (color is not the only signal).
- Paused recurrence cards: muted text, still readable (contrast ≥ 4.5:1).

## Interaction

- Whole budget / rule card is a link (`cursor-pointer`). Hover: color/border, no scale.
- Confirm is primary; omit is outline. Delete budget/rule is a two-step confirm (not `window.confirm`).
- Calendar days are buttons with visible focus; selected day uses teal fill + cream text.
- Focus rings visible. `noValidate` + our own field errors (same as login).

## Motion

- Do not animate amounts or bar width. Honor `prefers-reduced-motion`.
