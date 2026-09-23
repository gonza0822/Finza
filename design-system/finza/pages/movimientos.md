# Movimientos Page Overrides

> **PROJECT:** Finza
> **Page Type:** Ledger list + create form

> Rules in this file **override** the Master file.

---

## Layout

- Same sand + surface cards (`max-w-3xl` form, list can be `max-w-4xl`).
- Book is a semantic table (date, type, category, account, amount). No charts.
- Amounts: `−` for gasto, `+` for ingreso, each in **that row’s currency**. Never a mixed total.
- Empty: short copy + “Registrar movimiento”. If there are no accounts, send the user to create one first.

## Form

- Fields depend on type: gasto/ingreso (cuenta o tarjeta, importe, categoría), pago de tarjeta (tarjeta + cuenta, sin categoría), transferencia (sale de / entra en, un importe, misma moneda), conversión (dos cuentas y **dos importes**), ajuste (saldo observado + motivo obligatorio).
- Labels on every field. Money format same as Cuentas (punto miles, coma centavos).
- Gasto con tarjeta: campo **Cuotas** (1–36, default 1) with labeled number input; preview how the total splits. Warn if the purchase would exceed the limit, still allow submit. No baja el saldo de cuentas. Pago de tarjeta: baja cuenta y deuda; no es un gasto nuevo. Besides a free amount, a select lists this statement’s unpaid installments (and the total due) to fill the amount. Payment still applies FIFO.
- Submit shows pending text.
- Anular is a two-step confirm on each confirmed row. Voided rows stay in the book, muted, and do not move saldos.
- If a row has a note/motivo, a StickyNote icon on the right opens a modal (portal, Escape / overlay to close). Do not expand the table row.

## Color

- Locked Finza tokens. Ingreso / ajuste que sube: teal-glow. Gasto / ajuste que baja: foreground. Transferencia y conversión: foreground, no mixed total.
