# Categorías Page Overrides

> **PROJECT:** Finza
> **Page Type:** Read-only category list

> Rules in this file **override** the Master file.

---

## Layout

- Same sand + surface cards as Cuentas (`max-w-3xl`, `rounded-3xl`).
- Groups: **Gastos**, **Ingresos**, and **Ajuste** (system). Never mix kinds in one list.
- Subcategories indent under the parent. Not a table in this phase.
- Más: short hub with a link to Categorías + logout. No edit, add, or archive UI.

## Color / type

- Locked Finza tokens. Icons Lucide from an allowlist (never emoji, never arbitrary component names).
- Color dots use stored brand-adjacent hex; text stays `#143330` / muted.

## Interaction

- List is not clickable in this phase (no edición avanzada).
- Focus/hover only on the Más → Categorías link and logout.
