# Proyección Page Overrides

> **PROJECT:** Finza
> **Page Type:** Multi-month cash and net-worth forecast

> Rules in this file **override** the Master file.

---

## Layout

- Content `max-w-3xl`. One `h1`. Horizon chips under the title (`?meses=1`…`6`).
- One surface card per currency that exists (accounts or cards). Never a mixed ARS+USD total.
- Card: today’s cash, deuda and patrimonio, then the Recharts line (saldo + patrimonio), then the month table.
- Empty without accounts or cards: `EmptySection` + “Agregar cuenta”.
- Negative projected cash: AlertCircle + warm border, plus the numbers in the table (color is not the only signal).

## Color / chart

- Locked Finza tokens. Saldo line: primary `#174643`. Patrimonio: teal `#2A9D8F`, dashed so the two series stay distinct without color alone.
- No default Recharts demo palette. Do not animate the lines (`isAnimationActive={false}`).
- Table amounts `tabular-nums` and `whitespace-nowrap`.
- Chart X ticks are short (`sep 26`). Leave right margin/padding so the last month is not clipped. Tooltip keeps the full month. Do not angle ticks.

## Interaction

- Horizon chips: `cursor-pointer`, hover, visible focus. Active chip `aria-current="page"`.
- Chart tooltip on hover. The table is the accessible equivalent.
- Honor `prefers-reduced-motion` (already no chart animation).
