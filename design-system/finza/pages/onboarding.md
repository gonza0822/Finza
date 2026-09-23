# Onboarding Page Overrides

> **PROJECT:** Finza
> **Page Type:** First-run setup

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`, sand + surface cards (`rounded-3xl`, `border-primary/10`).
- No app sidebar. Compact header: wordmark + logout.
- Three steps: cuenta (required), tarjeta (optional), recurrente (optional). One form per step.
- Skip is a text-style link, not a second primary CTA.

## Copy

- Product Spanish. No stack notes. Labels on every field (reuse Cuentas / Tarjetas / Planificación forms).

## Interaction

- `cursor-pointer`, hover color, visible focus. `noValidate` + field errors.
- After the first account, continue to optional steps. Finish lands on Inicio.

## Motion

- Do not animate amounts. Honor `prefers-reduced-motion`.
