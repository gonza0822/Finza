# Fase actual

**Siguiente a hacer:** App de escritorio (Electron)

**Estado:** en curso  
**Último cierre:** Publicar — Aiven + Vercel (`https://finza-blond.vercel.app/`, confirmado)

## Hechas

- 0 Encender auth en local (`users`, `accounts`, `sessions`, `verification_tokens`, `sequelizemeta`)
- 1 Entrar y salir (email/password, Google, dashboard protegido, logout)
- 2 Cascarón de la app (sidebar/drawer, Inicio, Movimientos, Cuentas, Tarjetas, Planificación, Metas, Proyección, Más)
- 3 Cuentas (dinero): ABM, saldos en la moneda de cada cuenta, archivar (no borrar)
- 4 Categorías: tabla, seed de sistema, listado en Más (sin edición)
- 5 Libro: gasto e ingreso de cuenta (baja/sube saldo, lista en Movimientos; sin crédito)
- 6 Transferencia, conversión, ajuste, anular; buscador y filtros del libro (importe, cuenta, categoría, tipo, fechas)
- 7 Dashboard v1: T por moneda (ocultar USD si no hay cuentas USD; atajo Registrar movimiento)
- 8 Tarjetas: consumo y pago (sin cuotas)
- 9 Cuotas
- 10 Dashboard v2 (deuda y patrimonio)
- 11 Recurrentes
- 12 Libre y comprometido + onboarding corto
- 13 Presupuestos + calendario
- 14 Objetivos de ahorro
- 15 Proyección 1–6 meses
- 16 Más / config y cierre MVP
- Publicar: Aiven (`defaultdb`) + Vercel (`https://finza-blond.vercel.app/`)

## Cómo actualizar

Al cerrar una fase (código listo **y** el usuario dijo ok / la usó):

1. Mover el número a **Hechas**.
2. Poner **Siguiente a hacer** = N+1.
3. Tildar el mismo ítem en el checklist de `docs/plan-accion.md`.
4. No marcar hecha una fase solo porque el agente escribió código.
