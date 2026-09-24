# Finza — Plan de acción

**Dónde estamos ahora:** `docs/fase-actual.md` (eso lee un chat nuevo; no adivinar).

**Cómo se trabaja:** una fase por vez. Cada fase termina cuando vos la usás en el browser y decís “ok, siguiente”. No se arranca la fase N+1 en el mismo mensaje salvo que lo pidas.

**Fuente de verdad del producto:** `docs/especificacion-funcional.md`. Si hay duda de regla, se consulta ahí; no se inventa.

**Regla de tablas:** se crea **solo** la migración de esa fase. Nada de schema MVP de una.

**Fuera de este plan (más adelante):** Aiven, Vercel, Electron, Capacitor, planes de compra, proyectos, simulador, escenarios, FX automático.

---

## Ya está (no repetir)

- Spec funcional aprobada (ARS/USD separados).
- Scaffold Next.js + stack (Sequelize, Auth.js stub, Redux, Tailwind).
- Repo en GitHub.
- MySQL local + schema `finza` con tablas de auth (Fase 0 hecha).1

---

## Cómo se cierra cada fase

1. Migración (si hay tablas nuevas) + modelos + service + UI mínima.
2. Probar el flujo en el browser (no solo “se ve”).
3. Listar en el chat: qué se puede hacer ahora y qué **no**.
4. **No** marcar la fase hecha hasta que el usuario confirme.
5. Al confirmar: actualizar `docs/fase-actual.md` y tildar el checklist de abajo.
6. Parar.

---

## Fase 0 — Encender auth en local

**Para qué:** poder crear las 4 tablas de login sin tocar finanzas.

| Incluye | No incluye |
| --- | --- |
| Correr `npm run db:migrate` | Google OAuth (si no hay keys) |
| Ver `users`, `accounts`, `sessions`, `verification_tokens` en Workbench | Pantallas de login |

**Listo cuando:** Workbench muestra esas 4 tablas y `SequelizeMeta`.

---

## Fase 1 — Entrar y salir

**Para qué:** un usuario real, sesión en MySQL, rutas protegidas.

| Incluye | No incluye |
| --- | --- |
| Registro y login email + password | Cuentas, dashboard con plata |
| Google si hay `AUTH_GOOGLE_*` | Onboarding financiero |
| Logout, middleware en `/dashboard` | |

**Tablas:** las de la fase 0 (ya existen).

**Listo cuando:** te registrás, recargás y seguís logueado; logout te saca.

---

## Fase 2 — Cascarón de la app

**Para qué:** navegar como en la spec §16, con pantallas vacías.

| Incluye | No incluye |
| --- | --- |
| Layout (sidebar/nav): Inicio, Movimientos, Cuentas, Tarjetas, Planificación, Metas, Proyección, Más | Datos reales |
| Textos en `lib/content/` | Gráficos |

**Tablas:** ninguna.

**Listo cuando:** logueado ves el menú y cada ruta abre un placeholder.

---

## Fase 3 — Cuentas (dinero)

**Para qué:** saber dónde está la plata. Primera entidad financiera.

| Incluye | No incluye |
| --- | --- |
| ABM cuenta (nombre, tipo, moneda ARS/USD, saldo inicial) | Movimientos, tarjetas |
| Listar saldos **en la moneda de cada cuenta** | Transferencias |
| Archivar (no borrar) | Dashboard rico |

**Tablas nuevas:** `money_accounts` (nombre de tabla: no choca con `accounts` de Auth.js).

**Listo cuando:** creás Galicia ARS y una caja USD y ves dos saldos, sin sumarlos.

---

## Fase 4 — Categorías

**Para qué:** el libro no puede nacer sin categoría.

| Incluye | No incluye |
| --- | --- |
| Tabla + seed de categorías de sistema | Presupuestos |
| Poder listarlas (UI en Más o al cargar movimiento) | Edición avanzada |

**Tablas nuevas:** `categories` (y subcategorías si van en la misma tabla).

**Listo cuando:** `npm run db:seed` deja categorías usables.

---

## Fase 5 — Libro: gasto e ingreso de cuenta

**Para qué:** el hecho económico básico. Acá nace el ledger.

| Incluye | No incluye |
| --- | --- |
| Movimiento `gasto` / `ingreso` contra una cuenta | Crédito, cuotas |
| Baja/sube saldo de esa cuenta | Transferencia, conversión |
| Lista de movimientos | Pago de tarjeta |

**Tablas nuevas:** `movements`.

**Listo cuando:** un gasto en MP baja el saldo de MP y aparece en el libro. Un ingreso lo sube. **No** se puede cargar crédito todavía.

---

## Fase 6 — Transferencia, ajuste, conversión, anular

**Para qué:** el libro cubre los tipos de cuenta del MVP, sin tarjetas.

| Incluye | No incluye |
| --- | --- |
| Transferencia **misma moneda** (T de esa moneda no cambia) | ARS→USD como transferencia |
| Conversión con **dos importes** a mano | Cotización automática |
| Ajuste auditado | Filtro por tarjeta / moneda (más adelante) |
| Anular movimiento y revertir saldos | |
| Buscador en el libro (fecha, tipo, categoría, cuenta, importe, nota, anulado) | |
| Filtros del libro: importe, cuenta, categoría, tipo, rango de fechas | |

**Tablas:** `movements` (campos extra si hace falta). Ninguna entidad nueva grande.

**Listo cuando:** Galicia→MP no es gasto; ARS↔USD cambia T_ARS y T_USD; anular deshace; el buscador y los filtros recortan el libro.

---

## Fase 7 — Dashboard v1 (solo cuentas)

**Para qué:** ver T_ARS y T_USD **separados**.

| Incluye | No incluye |
| --- | --- |
| T por moneda; ocultar bloque USD si no hay cuentas USD | Deuda, libre, gráficos pesados |
| Atajo “Registrar movimiento” | Recurrentes |

**Tablas:** ninguna.

**Listo cuando:** el inicio muestra dos totales y no un único número mezclado.

---

## Fase 8 — Tarjetas: consumo y pago (sin cuotas)

**Para qué:** el diferenciador: el pago **no** es un gasto nuevo.

| Incluye | No incluye |
| --- | --- |
| ABM tarjeta (límite, cierre, vto, moneda, cuenta de pago misma moneda) | Cuotas |
| Gasto con medio crédito → sube deuda, **T no baja** | Interés / CFT |
| Pago de tarjeta → baja cuenta y deuda, **no** suma gasto del mes | Pago cruzado ARS/USD |
| Ciclo simple (cierre/vencimiento) | PDF de resumen |

**Tablas nuevas:** `credit_cards`, ciclos si hace falta en esta misma migración.

**Listo cuando:** compra Visa $150.000 deja Galicia igual; pagar desde Galicia baja Galicia y la deuda, y el “gastado del mes” no sube por el pago.

---

## Fase 9 — Cuotas

**Para qué:** una compra en 12 cuotas no destroza un solo mes en presupuesto/proyección.

| Incluye | No incluye |
| --- | --- |
| N cuotas; deuda = pendientes | Interés por cuota (V2) |
| Advertir si se pasa el límite, permitir igual | |

**Tablas nuevas:** `installments`.

**Listo cuando:** PC $2.400.000 / 12 deja 12 cuotas y el saldo de cuentas no se mueve el día de la compra.

---

## Fase 10 — Dashboard v2 (deuda y patrimonio)

**Para qué:** T, deuda y PN **por moneda**.

| Incluye | No incluye |
| --- | --- |
| Deuda_tarjetas(M), PN(M) = T(M) − deuda(M) | Libre / comprometido (aún) |
| Alerta saldo negativo por moneda | |

**Tablas:** ninguna.

**Listo cuando:** ves T, deuda y PN en ARS y (si aplica) USD.

---

## Fase 11 — Recurrentes

**Para qué:** sueldo, alquiler, Netflix, “mamá día 5” son la misma entidad.

| Incluye | No incluye |
| --- | --- |
| ABM regla (gasto o ingreso) | Auto-confirmar fino (opcional al cierre del MVP) |
| Ocurrencias del mes: confirmar / omitir | |
| Default: confirmar a mano | |

**Tablas nuevas:** `recurrence_rules`, `recurrence_occurrences`.

**Listo cuando:** confirmás Netflix y nace un movimiento; omitir no crea gasto.

---

## Fase 12 — Libre y comprometido + onboarding corto

**Para qué:** “cuánto puedo usar” por moneda. Onboarding ahora sí tiene sentido (cuentas, opcional tarjeta, opcional 1 recurrente).

| Incluye | No incluye |
| --- | --- |
| Comprometido duro (deuda + recurrentes de **cuenta** del mes sin confirmar) | Planes de compra |
| Libre(M) = T − duro (blando entra en fase 14) | |
| Onboarding: 1+ cuentas, resto opcional | |

**Tablas:** ninguna nueva (usa lo anterior). Settings de usuario ya están en `users`.

**Listo cuando:** un recurrente de cuenta pendiente este mes baja Libre y no baja T.

---

## Fase 13 — Presupuestos + calendario (Planificación)

**Para qué:** techo del mes y vencimientos en un calendario.

| Incluye | No incluye |
| --- | --- |
| Presupuesto por categoría y moneda; usado = cuota del mes si es crédito | Reportes ricos |
| Alertas 80% / 100% (no bloquean) | Copiar mes a mes (V2) |
| Calendario: ocurrencias + vencimientos de tarjeta | |

**Tablas nuevas:** `budgets`.

**Listo cuando:** el presupuesto de tecnología cuenta la cuota, no las 12 de golpe; el pago de tarjeta **no** entra en categorías de consumo.

---

## Fase 14 — Objetivos de ahorro

**Para qué:** sobre virtual; asignar baja Libre, **no** mueve cuentas.

| Incluye | No incluye |
| --- | --- |
| ABM objetivo (moneda, meta, fecha, asignar) | Vincular a cuenta real (V2) |
| Comprometido blando en el dashboard | Planes / proyectos |

**Tablas nuevas:** `savings_goals`.

**Listo cuando:** asignás $700.000 a vacaciones: T igual, Libre ARS baja $700.000.

---

## Fase 15 — Proyección 1–6 meses

**Para qué:** curva por moneda (saldo de cuentas y patrimonio), no un total convertido.

| Incluye | No incluye |
| --- | --- |
| Horizonte 1–6; Recharts | Simulador / escenarios |
| Ingresos/recurrentes de cuenta + pagos de tarjeta previstos | Planes de compra en la curva (V2) |

**Tablas:** ninguna (motor en `lib/services/`).

**Listo cuando:** el ejemplo de la spec §10.1 (o uno equivalente con tus datos) cierra coherente por moneda.

---

## Fase 16 — Más / config y cierre MVP

**Para qué:** lo operable del día a día sin features V2.

| Incluye | No incluye |
| --- | --- |
| Perfil, moneda default ARS, si objetivos restan de libre | Aiven / Vercel |
| Categorías, cerrar sesión | Electron / Capacitor |
| Estados vacíos, anular/archivar pulidos | |
| Historial de movimientos **en el detalle de cada cuenta** (no solo filtrar el libro) | |

**Listo cuando:** la lista §20.1 de la spec se puede tildar en una pasada de uso real tuya.

---

## Después del MVP (no mezclar ahora)

| Cuando | Qué |
| --- | --- |
| Quieras publicar | Aiven + `DATABASE_URL` en Vercel + mismas migraciones (**hecho:** `https://finza-blond.vercel.app/`) |
| El libro sea confiable | Planes, proyectos, simulador (V2) |
| App nativa | Electron / Capacitor |

---

## Orden compacto (checklist)

Estado vivo: `docs/fase-actual.md`.

- [x] 0 Migrar auth en local
- [x] 1 Login / registro / logout
- [x] 2 Cascarón de navegación
- [x] 3 Cuentas
- [x] 4 Categorías
- [x] 5 Gasto e ingreso
- [x] 6 Transferencia / conversión / ajuste / anular + buscador y filtros del libro
- [x] 7 Dashboard v1 (T por moneda)
- [x] 8 Tarjeta consumo + pago
- [x] 9 Cuotas
- [x] 10 Dashboard v2 (deuda / PN)
- [x] 11 Recurrentes
- [x] 12 Libre + onboarding
- [x] 13 Presupuestos + calendario
- [x] 14 Objetivos
- [x] 15 Proyección
- [x] 16 Config y cierre MVP
