export const appNavItems = [
  { href: "/inicio", label: "Inicio" },
  { href: "/movimientos", label: "Movimientos" },
  { href: "/cuentas", label: "Cuentas" },
  { href: "/tarjetas", label: "Tarjetas" },
  { href: "/planificacion", label: "Planificación" },
  { href: "/metas", label: "Metas" },
  { href: "/proyeccion", label: "Proyección" },
  { href: "/mas", label: "Más" },
] as const;

export type AppNavHref = (typeof appNavItems)[number]["href"];

export const appShellContent = {
  skipToContent: "Ir al contenido",
  mainNav: "Menú principal",
  openMenu: "Abrir menú",
  closeMenu: "Cerrar menú",
  menuDialog: "Menú",
  logout: "Cerrar sesión",
  signedInAs: "Sesión de",
  downloadApp: "Descargar app",
} as const;

export const appPages = {
  inicio: {
    metaTitle: "Inicio — Finza",
    metaDescription:
      "Tu plata, lo comprometido y lo libre, en pesos y en dólares por separado.",
    hello: "Hola",
    body: "Cuando cargues tus cuentas, acá vas a ver tu situación.",
  },
  movimientos: {
    metaTitle: "Movimientos — Finza",
    metaDescription:
      "El libro de tus gastos, ingresos, pagos de tarjeta y demás movimientos en Finza.",
    title: "Movimientos",
    body: "Todavía no hay movimientos. Cuando registres un gasto o un ingreso, van a aparecer acá.",
  },
  cuentas: {
    metaTitle: "Cuentas — Finza",
    metaDescription:
      "Tus cuentas en pesos y en dólares, con el saldo en la moneda de cada una.",
    title: "Cuentas",
    body: "Todavía no tenés cuentas. Cuando agregues una, vas a ver el saldo en su moneda.",
  },
  tarjetas: {
    metaTitle: "Tarjetas — Finza",
    metaDescription:
      "Tus tarjetas: límite, deuda y próximos vencimientos en Finza.",
    title: "Tarjetas",
    body: "Todavía no tenés tarjetas. Cuando agregues una, vas a ver el límite, la deuda y los vencimientos.",
  },
  planificacion: {
    metaTitle: "Planificación — Finza",
    metaDescription:
      "Presupuestos del mes, calendario de vencimientos y recurrentes para confirmar u omitir.",
    title: "Planificación",
    body: "Confirmá u omití lo del mes, armá un tope por categoría o mirá el calendario.",
  },
  metas: {
    metaTitle: "Metas — Finza",
    metaDescription: "Tus objetivos de ahorro y el progreso de cada uno en Finza.",
    title: "Metas",
    body: "Todavía no tenés objetivos de ahorro. Cuando armes uno, vas a ver el progreso acá.",
  },
  proyeccion: {
    metaTitle: "Proyección — Finza",
    metaDescription:
      "Cómo puede verse tu plata en los próximos meses, en pesos y en dólares por separado.",
    title: "Proyección",
    body: "Cuando tengas cuentas, acá vas a ver cómo puede verse tu plata en los próximos meses.",
  },
  mas: {
    metaTitle: "Más — Finza",
    metaDescription: "Ajustes de tu cuenta y otras opciones en Finza.",
    title: "Más",
    body: "Ajustes y listados de tu cuenta.",
  },
} as const;
