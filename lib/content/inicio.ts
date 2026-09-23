export const inicioContent = {
  addAccount: "Agregar cuenta",
  addMovement: "Registrar movimiento",
  totalArs: "Pesos",
  totalUsd: "Dólares",
  cashLabel: "En cuentas",
  debtLabel: "Deuda de tarjetas",
  netWorthLabel: "Patrimonio",
  committedLabel: "Comprometido",
  freeLabel: "Libre",
  totalsHint:
    "Libre es lo que hay en cuentas menos lo comprometido de esa moneda: la deuda de tarjetas, los recurrentes de cuenta de este mes que todavía no confirmaste y lo asignado a objetivos. No se mezclan pesos y dólares.",
  budgetsHeading: "Presupuestos del mes",
  budgetsLink: "Ver planificación",
  usedOf: (used: string, cap: string) => `${used} de ${cap}`,
  alertWarn: "Alerta",
  alertOver: "Excedido",
  accountsCount: (count: number) => (count === 1 ? "1 cuenta" : `${count} cuentas`),
  negativeTitle: "Hay un saldo en negativo",
  negativeBody: (currencies: string[]) =>
    currencies.length === 2
      ? "En pesos y en dólares el total de cuentas está en negativo. Podés seguir registrando. Revisá las cuentas cuando puedas."
      : `En ${currencies[0]} el total de cuentas está en negativo. Podés seguir registrando. Revisá las cuentas cuando puedas.`,
} as const;
