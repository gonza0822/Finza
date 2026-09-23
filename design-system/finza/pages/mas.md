# Más Page Overrides

> **PROJECT:** Finza
> **Page Type:** Settings hub + profile form

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, sand + surface cards (`rounded-3xl`, `border-primary/10`).
- Hub: stacked links (Perfil, Categorías) then logout. Each link is a full card, not a dense list.
- Profile form: one column, labels on every field. Email is read-only text, not an input.
- Radios for currency and the Libre toggle (same choice chips as accounts).
- Currency and Libre groups use the same `gap-1.5` stack as Email (label → control → hint). Radio and chip text use `gap-3`.

## Color / type

- Locked Finza tokens. Primary CTA teal, cream text.
- Success after save: teal-tinted surface, not a toast stack.

## Interaction

- Whole hub card is a link (`cursor-pointer`). Hover: border, no scale.
- Focus rings visible. `noValidate` + field errors on Perfil.
- Logout stays a secondary outline button.

## Motion

- No entrance animation on the form. Honor `prefers-reduced-motion`.
