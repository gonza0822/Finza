export const proyeccionContent = {
  title: "Proyección",
  emptyTitle: "Proyección",
  emptyBody: "Cuando tengas cuentas, acá vas a ver cómo puede verse tu plata en los próximos meses.",
  addAccount: "Agregar cuenta",
  horizonLabel: "Hasta",
  horizonAria: "Cuántos meses proyectar",
  horizonMonths: (count: number) => (count === 1 ? "1 mes" : `${count} meses`),
  cashSeries: "Saldo en cuentas",
  netWorthSeries: "Patrimonio",
  todayLabel: "Hoy",
  monthHeading: "Por mes",
  incomeLabel: "Ingresos",
  accountSpendLabel: "Gastos de cuenta",
  cardPaymentLabel: "Pagos de tarjeta",
  cashLabel: "Saldo",
  netWorthLabel: "Patrimonio",
  hint: "Fin de cada mes, en la moneda de tus cuentas. Los gastos en crédito bajan el patrimonio cuando se cargan y el saldo cuando se paga la tarjeta. No se mezclan pesos y dólares.",
  negativeTitle: "Hay un saldo proyectado en negativo",
  negativeBody: (currencies: string[]) =>
    currencies.length === 2
      ? "En pesos y en dólares el saldo de cuentas queda en negativo en algún mes. Revisá ingresos, recurrentes o el vencimiento de las tarjetas."
      : `En ${currencies[0]} el saldo de cuentas queda en negativo en algún mes. Revisá ingresos, recurrentes o el vencimiento de las tarjetas.`,
  chartAria: (currency: string) => `Saldo y patrimonio proyectados en ${currency}`,
} as const;
