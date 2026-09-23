# Cuentas Page Overrides

> **PROJECT:** Finza
> **Page Type:** Account list + form

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, same sand + surface cards as the shell placeholders (`rounded-3xl`, `border-primary/10`).
- List: group by currency (**Pesos** / **Dólares**). Never a single combined total.
- Each card shows **that account’s** balance in its currency. No group sum in this phase.
- Empty state: short copy + primary “Agregar cuenta”.
- Form pages: one column, labels on every field (no placeholder-only). Submit shows pending text.

## Color / type

- Locked Finza tokens. Primary CTA teal, cream text.
- Archived cards: muted text, still readable (contrast ≥ 4.5:1). Peach only as a small “Archivada” eyebrow if needed.

## Interaction

- Whole active card is a link to edit (`cursor-pointer`). Hover: color/border, no scale.
- Archive is a two-step confirm in the UI (not `window.confirm`).
- Account detail: form + archive stay `max-w-3xl`; movement history below can use `max-w-5xl`.
- Focus rings visible. `noValidate` + our own field errors (same as login).

## Motion

- Optional opacity fade on the form card. Do not animate amounts (they are the content).
- Honor `prefers-reduced-motion`.
