# Metas Page Overrides

> **PROJECT:** Finza
> **Page Type:** Savings goals list + assign overlay

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, same sand + surface cards as Cuentas (`rounded-3xl`, `border-primary/10`).
- Hub: `h1` + primary CTA “Agregar objetivo”. Empty: `EmptySection` + the same CTA.
- Cards: name, assigned of target, due month, percent, progress bar. Whole card is a link to detail.
- Detail: one `h1` (goal name), progress card (faltante, cuota mensual, mes, Libre de esa moneda), then assign form, then edit form, then pause/release/cancel.
- Do not mix ARS and USD. Assigned is in the goal’s currency.
- Form pages: one column, labels on every field. Submit shows pending text.

## Color / type

- Locked Finza tokens. Primary CTA teal, cream text.
- Reached / paused: peach eyebrow. Always also show numbers (color is not the only signal).
- Paused cards: muted name, still readable (contrast ≥ 4.5:1).
- Progress fill: primary. Do not animate bar width.

## Interaction

- Whole goal card is a link (`cursor-pointer`). Hover: color/border, no scale.
- Assign is primary. Cancel is a two-step confirm (not `window.confirm`).
- Focus rings visible. `noValidate` + our own field errors (same as login).
- Assigning does not move accounts; do not show account pickers (V2).

## Motion

- Do not animate amounts or bar width. Honor `prefers-reduced-motion`.
