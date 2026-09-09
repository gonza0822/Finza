# Finza — Especificación funcional

**Estado:** diseño aprobado para seguir (ajustable)  
**Monedas en MVP:** ARS (default) y USD. Totales **siempre separados**; no hay un “total único” convertido.  
**Ámbito:** un usuario = un espacio financiero personal (sin hogar compartido en MVP)

Este documento cierra el modelo de producto antes de arquitectura técnica, base de datos y código.

---

## 1. Visión general

Finza no es un registro de gastos. Es un **sistema de situación financiera**: saber cuánto hay, cuánto está comprometido, cuánto se puede usar, qué va a pasar en los próximos meses y qué ocurre si se toma una decisión (comprar, financiar, ahorrar).

Cadena coherente que el producto debe respetar siempre:

```
Cuentas (dinero)
  → Medios de pago (cómo se opera)
    → Movimientos (hechos reales)
      → Tarjetas / cuotas / pagos (deuda y cancelación)
        → Compromisos (lo que no está libre)
          → Proyecciones (futuro estimado)
            → Objetivos y compras (intención)
              → Simulaciones (hipótesis, nunca datos reales)
```

Principio rector: **un hecho económico se reconoce una sola vez**. El pago de una tarjeta no es un gasto nuevo. Una transferencia entre cuentas propias no es gasto ni ingreso. Una simulación no escribe en el libro real.

---

## 2. Glosario de conceptos

### 2.1 Cuenta

**Lugar donde existe dinero del usuario.** Tiene saldo. Ejemplos: Banco Galicia, Mercado Pago, efectivo.

No es una forma de pagar: es un depósito. Una cuenta puede usarse para pagar (débito, transferencia, efectivo), pero el concepto es el saldo.

### 2.2 Medio de pago

**Forma en que se ejecuta una operación.** No guarda dinero. Ejemplos: transferencia, efectivo, débito, tarjeta de crédito.

En el modelo de datos **no es una entidad independiente**. Es un *modo* de un movimiento, apoyado en una cuenta o en una tarjeta:

| Medio | Instrumento | Efecto inmediato |
| --- | --- | --- |
| Efectivo | Cuenta tipo efectivo | Baja el saldo de esa cuenta |
| Transferencia | Cuenta origen | Baja el saldo de esa cuenta (si es pago a terceros) o mueve entre cuentas propias |
| Débito | Cuenta bancaria / billetera | Baja el saldo de esa cuenta |
| Crédito | Tarjeta | **No** baja ninguna cuenta; sube el consumo/deuda de la tarjeta |

### 2.3 Tarjeta de crédito

**Medio de pago especial que genera una deuda**, no un descuento de saldo. El dinero de Galicia no se mueve el día de la compra. Se mueve el día del **pago de tarjeta**.

La tarjeta tiene límite, disponible, ciclo (cierre/vencimiento) y una cuenta habitual de pago.

**La tarjeta no es una cuenta.** No forma parte del “dinero total”. Es un pasivo.

### 2.4 Movimiento

**Hecho financiero real que ya ocurrió** (o que el usuario confirma como ocurrido). Es la única escritura del libro. Modifica saldos de cuentas y/o deuda de tarjetas.

Tipos: ingreso, gasto, transferencia, pago de tarjeta, ajuste, devolución, conversión (ARS↔USD).

### 2.5 Gasto

**Salida de riqueza o generación de un compromiso de pago.** Es un *tipo* de movimiento, no una entidad aparte.

- Contado / débito / efectivo: el gasto y la salida de dinero coinciden.
- Crédito: el gasto se reconoce **en la compra**; la salida de dinero de la cuenta ocurre después, en el pago de tarjeta.

### 2.6 Ingreso

**Entrada de dinero a una cuenta.** Tipo de movimiento. No se usa para transferencias internas.

### 2.7 Transferencia

**Movimiento de dinero entre cuentas propias.** Patrimonio neto = 0. No es gasto ni ingreso. Sirve para “pasé $200.000 de MP a Galicia”.

### 2.8 Ajuste

**Corrección de saldo** para alinear Finza con el mundo real (el extracto, la app del banco). No es un gasto de consumo. Queda auditado, no escondido.

### 2.9 Gasto recurrente

**Regla** que describe un hecho que se repite (día 5, $200.000, Galicia). No es el gasto. El gasto nace cuando una **ocurrencia** se confirma o se registra.

Netflix, Spotify, Cursor, Amazon, alquiler y “mensualidad mamá” son la misma entidad, con una clasificación (suscripción, servicio, transferencia a tercero, etc.).

### 2.10 Gasto proyectado

**Ocurrencia futura estimada que todavía no es movimiento.** Se calcula a partir de reglas, cuotas, planes y objetivos. No modifica saldos reales.

### 2.11 Simulación

**Escenario hipotético** sobre una copia de la situación. Nunca crea movimientos reales, nunca cambia saldos, nunca paga tarjetas.

### 2.12 Escenario

Simulación **guardada** con nombre, para comparar (PC en enero vs PC en marzo).

### 2.13 Objetivo de ahorro

Quiero **acumular un monto** (“vacaciones $2.000.000”). El éxito es *tener* el dinero, no comprar un ítem concreto.

### 2.14 Plan de compra

Quiero **comprar un bien/servicio concreto** (“perfume $180.000”). El éxito es la compra (o cancelarla).

### 2.15 Proyecto de compra

Quiero **armar un conjunto de ítems** (“PC”: CPU, GPU, …). Es un contenedor de planes/ítems, no un tercer tipo de dinero.

### 2.16 Moneda

**ARS es la moneda por defecto** al crear cuentas, tarjetas, objetivos y presupuestos. El usuario puede tener **cuentas (y tarjetas) en USD**.

Finza **no convierte** dólares a pesos para mostrar un total mezclado. El dashboard muestra dos situaciones en paralelo:

- Total ARS / deuda ARS / libre ARS
- Total USD / deuda USD / libre USD

Una transferencia solo existe entre cuentas **de la misma moneda**. Pasar pesos a dólares (o al revés) es una **conversión**: dos importes que carga el usuario (cuánto salió y cuánto entró). Finza no inventa el tipo de cambio ni lo usa para consolidar patrimonio.

---

## 3. Entidades

### 3.1 Qué se elimina o se fusiona

| Idea original | Decisión | Motivo |
| --- | --- | --- |
| Gasto, Ingreso, Transferencia, Ajuste | Fusionar en **Movimiento** con `tipo` | Un solo libro; evita doble conteo |
| Suscripción | Fusionar en **Regla recurrente** (`clase = suscripcion`) | Mismo mecanismo de generación |
| Medio de pago (tabla) | No crear entidad | Duplicaría cuentas y tarjetas |
| Proyección (tabla persistida) | Calcularla | Snapshot opcional recién en V2 |
| Simulación (tabla) | Efímera; al guardar = **Escenario** | No ensucia el libro |
| Moneda | Campo `ARS` \| `USD` en cuenta, tarjeta, objetivo, presupuesto; default **ARS** | Totales separados; sin consolidar con FX |
| Cuota como entidad suelta sin compra | Hija de un movimiento de gasto (crédito) | Una cuota no existe sin consumo origen |

### 3.2 Usuario

- **Qué es:** persona dueña del espacio Finza.
- **Para qué:** autenticación, aislamiento de datos.
- **Datos:** identidad de Auth.js (email, nombre, hash opcional, cuentas OAuth).
- **Usa:** nada financiero.
- **Dependen:** todas las entidades de negocio (`userId`).
- **Estados:** activo / deshabilitado (futuro).

Configuración de usuario (puede vivir en el mismo usuario o en `UserSettings`): moneda por defecto **ARS**, si los objetivos restan de “dinero libre”, día de inicio de mes (default 1), confirmación manual vs auto-registro de recurrentes.

### 3.3 Cuenta

- **Qué es:** depósito de dinero.
- **Para qué:** saber dónde está la plata y desde dónde se paga.
- **Datos:** nombre, tipo (`banco` / `billetera` / `efectivo` / `otro`), moneda (`ARS` default o `USD`), saldo inicial **en esa moneda**, activa, notas, orden.
- **Saldo actual (calculado):** `saldoInicial + Σ impactos de movimientos confirmados` **en la moneda de la cuenta**. El saldo **no se edita a mano** salvo vía ajuste.
- **Usa:** Usuario.
- **Dependen:** Movimientos, Pago de tarjeta (cuenta origen, misma moneda), Reglas recurrentes, Tarjeta (cuenta de pago por defecto, misma moneda).
- **Estados:** `activa` / `archivada`. Archivada: no aparece en altas nuevas; conserva historial.

Tipos sugeridos: Banco Galicia = `banco`; Mercado Pago = `billetera`; Efectivo = `efectivo`.

### 3.4 Tarjeta de crédito

- **Qué es:** línea de crédito con ciclo de resumen.
- **Para qué:** registrar consumos, cuotas, límite y pagar sin duplicar gastos.
- **Datos:** nombre, marca, últimos 4, moneda (`ARS` default o `USD`), límite **en esa moneda**, día de cierre (1–28), día de vencimiento (1–28), cuenta de pago por defecto **de la misma moneda**, activa.
- **Calculados:** consumo del ciclo abierto, deuda, disponible (`límite − deuda`), próximo cierre, próximo vencimiento.
- **Usa:** Usuario, Cuenta (pago por defecto).
- **Dependen:** Movimientos de gasto (crédito), Cuotas, Ciclos, Pagos de tarjeta.
- **Estados:** `activa` / `pausada` / `cerrada`.

**Deuda (propuesta):** suma de cuotas y consumos de 1 pago **aún no cubiertos por pagos**. Al comprar en 12 cuotas, la deuda sube por el **total** (el límite se come el total); cada pago o cada cuota liquidada lo reduce.

### 3.5 Categoría y subcategoría

- **Qué es:** clasificación de gastos e ingresos.
- **Para qué:** presupuestos, reportes, no para saldos.
- **Datos:** nombre, tipo (`gasto` / `ingreso`), ícono/color, sistema vs usuario, activa.
- **Relación:** Categoría 1—N Subcategorías. El movimiento apunta a subcategoría (o categoría si no hay sub).
- **Estados:** `activa` / `archivada`.

Semilla mínima (gasto): vivienda, comida, transporte, servicios, suscripciones, salud, educación, ocio, ropa, familia, cuotas/tarjeta (solo analítica, el pago de tarjeta **no** usa esta categoría), otros. Ingreso: sueldo, freelance, otros.

### 3.6 Movimiento

- **Qué es:** asiento del libro real.
- **Para qué:** única fuente de verdad de saldos y de “qué gasté”.
- **Datos:** tipo (`ingreso` / `gasto` / `transferencia` / `pago_tarjeta` / `ajuste` / `devolucion` / `conversion`), fecha (y hora opcional), importe, moneda (heredada de la cuenta o tarjeta), cuenta origen y/o destino, tarjeta (si aplica), medio (`efectivo` / `transferencia` / `debito` / `credito`), categoría/subcategoría, nota, estado, vínculo a regla/ocurrencia/plan/cuota padre, `transferGroupId` interno para las dos puntas de una transferencia. En `conversion`: importe origen + importe destino (monedas distintas).
- **Usa:** Usuario, Cuenta, Tarjeta, Categoría, Regla, Plan, Proyecto.
- **Dependen:** Cuotas, imputaciones de pago de tarjeta.
- **Estados:** `confirmado` / `anulado`. No usamos “pendiente” en el libro: lo pendiente vive en ocurrencias, cuotas o planes.

Regla: **no hay movimiento futuro**. Lo futuro no es movimiento.

### 3.7 Cuota

- **Qué es:** fracción de un gasto en crédito.
- **Para qué:** saber qué cae en cada resumen y qué queda de deuda.
- **Datos:** movimiento origen, tarjeta, número (`3/12`), importe, mes/ciclo al que pertenece, estado.
- **Usa:** Movimiento (gasto crédito), Tarjeta, Ciclo.
- **Estados:** `pendiente` (aún no cerró en un resumen) / `en_resumen` / `pagada` / `anulada`.

Compra de 1 pago = **una cuota 1/1** (mismo modelo, menos excepciones).

### 3.8 Ciclo de tarjeta (resumen)

- **Qué es:** período entre dos cierres.
- **Para qué:** “qué pago este mes”, vencimiento, pago parcial vs total.
- **Datos:** tarjeta, fecha de cierre, fecha de vencimiento, saldo anterior, consumos del período, pagos aplicados, saldo a pagar, estado.
- **Puede generarse** al cerrar o bajo demanda a partir de día de cierre/vencimiento.
- **Estados:** `abierto` / `cerrado` / `pagado` / `parcial` / `vencido`.

MVP: generar ciclos automáticamente con día de cierre + día de vencimiento; no cargar PDFs de resumen.

### 3.9 Regla recurrente

- **Qué es:** plantilla periódica (gasto o ingreso).
- **Para qué:** no reescribir Netflix cada mes; alimentar proyección y calendario.
- **Datos:** nombre, tipo (`gasto` / `ingreso`), clase (`suscripcion` / `servicio` / `alquiler` / `envio_tercero` / `sueldo` / `otro`), importe, frecuencia (`semanal` / `mensual` / `anual`), día (p. ej. 5), cuenta o tarjeta, medio, categoría, fecha inicio, fecha fin opcional, auto-confirmar sí/no.
- **Usa:** Cuenta o Tarjeta, Categoría.
- **Dependen:** Ocurrencias, y de ellas los Movimientos.
- **Estados:** `activa` / `pausada` / `finalizada`.

Eliminar la regla **no borra** movimientos ya confirmados. Deja de generar ocurrencias futuras.

### 3.10 Ocurrencia recurrente

- **Qué es:** instancia concreta (“Netflix 5-oct-2026”).
- **Para qué:** diferenciar la regla del hecho; permitir “este mes no pagué” sin matar la regla.
- **Datos:** regla, fecha prevista, importe previsto (copia al generar; puede editarse en esa ocurrencia), movimiento vinculado si se confirmó.
- **Estados:** `programada` / `confirmada` / `omitida` / `vencida`.

`omitida` = ese período no se paga y no se proyecta como deuda. `vencida` = pasó la fecha y no se confirmó ni se omitió (alerta).

### 3.11 Presupuesto

- **Qué es:** tope de gasto para una categoría o subcategoría en un mes calendario.
- **Para qué:** control, no para mover plata.
- **Datos:** categoría o subcategoría, año-mes, monto, moneda (`ARS` default o `USD`). Un presupuesto ARS solo se compara con gastos en ARS.
- **Usa:** Categoría.
- **Dependen:** nada (se compara con movimientos).
- **Estados:** no necesita máquina de estados; existe o se elimina. Alertas: `ok` / `alerta` (≥80%) / `excedido` (>100%) son calculadas.

### 3.12 Objetivo de ahorro

- **Qué es:** meta de acumulación.
- **Para qué:** progreso, ritmo mensual, impacto en dinero libre.
- **Datos:** nombre, monto objetivo, moneda (`ARS` default o `USD`), fecha objetivo, monto asignado **en esa moneda**, cuenta asociada opcional (misma moneda; solo referencia visual en MVP), estado.
- **Modelo de dinero (propuesta):** **sobre virtual**. Asignar $700.000 no transfiere entre cuentas. Es una reserva sobre el dinero total. Evita forzar “cuenta vacaciones” el día uno.
- **Calculados:** faltante, % progreso, ahorro mensual necesario, fecha estimada si el ritmo actual se mantiene.
- **Usa:** Usuario.
- **Estados:** `activo` / `alcanzado` / `pausado` / `cancelado`.

### 3.13 Plan de compra

- **Qué es:** intención de comprar **un** ítem.
- **Para qué:** precio, fecha deseada, prioridad, impacto en proyección; aún no es gasto.
- **Datos:** nombre, precio estimado, precio real (cuando se compra), fecha deseada, prioridad, medio previsto, cuenta/tarjeta prevista, categoría, `reservado` (sí/no), proyecto opcional, estado.
- **Usa:** Proyecto (opcional), Cuenta/Tarjeta previstas.
- **Estados:** `planificado` / `reservado` / `comprado` / `cancelado`.

Al marcar comprado se crea un **Movimiento** real (contado o crédito/cuotas) y el plan deja de proyectarse.

### 3.14 Proyecto de compra

- **Qué es:** agrupador de planes/ítems (“PC”).
- **Para qué:** total estimado, avance (3/8 comprados), distribución por meses.
- **Datos:** nombre, fecha objetivo opcional, notas, estado.
- **Usa:** Usuario.
- **Dependen:** Planes de compra (ítems).
- **Estados:** `activo` / `parcial` / `completado` / `cancelado`.

No hace falta entidad `Item de proyecto` aparte: el ítem **es** un plan de compra con `proyectoId`.

### 3.15 Escenario (V2)

- **Qué es:** simulación persistida.
- **Datos:** nombre, descripción, conjunto de hipótesis (compras, cuotas, fechas), fecha de creación, anclado a un snapshot de saldos o recalculado contra el presente.
- **Estados:** `activo` / `archivado`.

**Propuesta V2:** al abrir un escenario se recalcula contra la situación **actual** (más honesto). El snapshot rígido es opcional (“así estaba el 1-sep”).

### 3.16 Entidades que no existen como tablas en MVP

| Concepto | Tratamiento |
| --- | --- |
| Proyección | Función de cálculo |
| Simulación | Sesión de trabajo; al guardar → Escenario |
| Medio de pago | Campo `medio` + cuenta o tarjeta |
| Gasto proyectado | Ocurrencia / cuota / plan futuro |
| Cotización / FX | No se persiste en MVP; la conversión usa dos importes cargados a mano |

---

## 4. Relaciones

```
Usuario
  ├─ Cuenta
  │    ├─ Movimiento (origen o destino)
  │    └─ Tarjeta.cuentaPagoPorDefecto
  ├─ Tarjeta
  │    ├─ Ciclo
  │    ├─ Movimiento (gastos crédito, pagos)
  │    └─ Cuota
  ├─ Categoría → Subcategoría → Movimiento, Presupuesto, Regla
  ├─ Regla recurrente → Ocurrencia → Movimiento (si confirmada)
  ├─ Presupuesto (por mes + categoría)
  ├─ Objetivo
  ├─ Proyecto → Plan de compra → Movimiento (si comprado)
  └─ Escenario (V2)  [hipótesis, sin FK a movimientos reales]
```

Cardinalidades clave:

- Una transferencia = **un** movimiento lógico con cuenta origen y cuenta destino (o dos líneas internas, un `transferGroupId`). UI: una sola fila “MP → Galicia $200.000”.
- Un gasto en 12 cuotas = **un** movimiento de gasto + **12** cuotas.
- Un pago de tarjeta = **un** movimiento tipo `pago_tarjeta` que imputa a uno o más ciclos/cuotas (FIFO).
- Una ocurrencia confirmada = **a lo sumo un** movimiento.

---

## 5. Reglas de negocio

Convención de importes: positivos en el movimiento; el **signo lo da el tipo** y la pata (cuenta vs tarjeta).

### 5.1 Compra normal (Mercado Pago)

Perfume $150.000 pagado con Mercado Pago.

- Medio: transferencia o débito interno de la billetera (da igual: sale de la **cuenta** Mercado Pago).
- Se crea Movimiento `gasto`, confirmado, $150.000, cuenta = MP, categoría p. ej. Cuidado personal.
- Saldo MP −150.000.
- Galicia y tarjetas: sin cambio.
- Reportes de gasto: +150.000.
- Dinero total: −150.000.

### 5.2 Compra con débito

Perfume $150.000 con débito Galicia.

- Cuenta modificada: **Banco Galicia** (−150.000).
- Medio: `debito`.
- No se toca ninguna tarjeta.
- Es indistinto de “transferencia desde Galicia” a un comercio a efectos de saldo: ambos restan Galicia. La diferencia es el campo `medio` (reportes).

### 5.3 Compra con tarjeta de crédito (1 pago)

Perfume $150.000 con Visa Galicia.

- **Saldo Galicia: no cambia.**
- Tarjeta: deuda +150.000; disponible −150.000.
- Movimiento `gasto` con medio `credito`, tarjeta = Visa, **sin** cuenta origen de salida.
- Se crea cuota 1/1 en el ciclo según fecha vs cierre (ver §6).
- Reportes de gasto: +150.000 **el día de la compra** (reconocimiento del consumo). El pago posterior no vuelve a sumar gasto.

### 5.4 Compra en cuotas

PC $2.400.000 en 12 cuotas (sin interés en MVP).

| Concepto | Valor |
| --- | --- |
| Consumo / gasto reconocido | $2.400.000 el día de la compra (un movimiento) |
| Deuda de tarjeta | +2.400.000 |
| Disponible | límite − (deuda incluyendo este total) |
| Cuotas | 12 × $200.000, asignadas a 12 ciclos sucesivos a partir del ciclo que corresponda por fecha de compra |
| Saldo de cuentas | no cambia |
| Proyección | cada mes, $200.000 en el resumen de ese ciclo |
| Pago | no hay 12 gastos; hay hasta 12 pagos de tarjeta (o menos si se adelanta) que cancelan cuotas, no que “gastan de nuevo” |

Si el banco cobra interés o CFT, V2: campo opcional `interes` por cuota. MVP: importe de cuota informado por el usuario.

### 5.5 Pago de tarjeta

Consumo Visa $500.000; pago desde Galicia.

- Movimiento tipo **`pago_tarjeta`**, no `gasto`.
- Galicia −500.000.
- Deuda Visa −500.000 (imputación FIFO: ciclos vencidos, luego cerrado, luego abierto).
- Disponible de tarjeta se recupera en la medida de la deuda cancelada.
- **No entra** en totales de gasto del mes.
- **No es** transferencia entre cuentas (la tarjeta no es cuenta).

Pago parcial $200.000: igual, imputa $200.000; el ciclo queda `parcial`; $300.000 siguen comprometidos.

### 5.6 Transferencia entre cuentas

Mercado Pago → Galicia $200.000.

- Un movimiento `transferencia`.
- MP −200.000; Galicia +200.000.
- Dinero total ARS y patrimonio ARS: **sin cambio**.
- Gastos e ingresos del período: **sin cambio**.
- UI: una fila, no dos.
- **Misma moneda obligatoria.** MP en ARS no transfiere a una cuenta USD.

### 5.7 Conversión ARS ↔ USD

Ejemplo: vendo USD 100 y recibo ARS 140.000 en Galicia (el usuario carga ambos importes).

- Movimiento tipo **`conversion`**, no transferencia y no gasto/ingreso de consumo.
- Cuenta USD −100; cuenta ARS +140.000.
- T_USD baja 100; T_ARS sube 140.000.
- Finza **no** calcula ni guarda una cotización obligatoria; si se muestra “implícita” (140.000/100) es solo informativa.
- Reportes de gasto: no suma.

### 5.8 Ajuste de saldo

Galicia en Finza $800.000; extracto $750.000.

- Usuario elige cuenta, saldo real observado, fecha, nota (“extracto 8-sep”).
- Finza crea movimiento `ajuste` por la diferencia (−50.000).
- El ajuste **no** es gasto de categoría “comida”. Categoría de sistema `Ajuste`.
- Reportes de consumo: **excluyen** ajustes. El saldo sí los incluye.
- Motivo obligatorio (texto corto) para no usar el ajuste como basurero.

---

## 6. Estados

| Entidad | Estados | Notas |
| --- | --- | --- |
| Cuenta | activa, archivada | No borrar si tiene movimientos |
| Tarjeta | activa, pausada, cerrada | Cerrada: no nuevos consumos; sí pagos |
| Movimiento | confirmado, anulado | Anulado conserva fila para auditoría; no impacta saldos |
| Cuota | pendiente, en_resumen, pagada, anulada | |
| Ciclo | abierto, cerrado, pagado, parcial, vencido | |
| Regla | activa, pausada, finalizada | |
| Ocurrencia | programada, confirmada, omitida, vencida | |
| Objetivo | activo, alcanzado, pausado, cancelado | Alcanzado cuando asignado ≥ objetivo |
| Plan de compra | planificado, reservado, comprado, cancelado | |
| Proyecto | activo, parcial, completado, cancelado | Parcial = al menos un ítem comprado y no todos |
| Escenario | activo, archivado | V2 |
| Presupuesto | (sin FSM) | Alertas calculadas |

**No** hay gasto `pendiente` en el libro. Pendiente = ocurrencia, cuota o plan.

---

## 7. Gastos recurrentes

### 7.1 Configuración

Ejemplo: Mensualidad mamá, $200.000, día 5, mensual, transferencia, Banco Galicia, categoría Familia.

El usuario crea una **regla**, no doce gastos.

### 7.2 Generación

- Finza materializa ocurrencias hacia adelante (p. ej. 12 meses) y al entrar a un mes nuevo.
- El día 5 (o el día hábil configurable; MVP: el día calendario, si no existe 31 → último día del mes):
  - si `autoConfirmar`: crea movimiento confirmado y ocurrencia `confirmada`;
  - si no: ocurrencia `programada` / `vencida`; el usuario confirma, edita importe, o omite.

**Propuesta MVP:** default **confirmar a mano** (o con un “registrar todas las de hoy”) para no inflar gastos que no se pagaron. Opción por regla: auto-confirmar (útil en Netflix si se debita solo).

### 7.3 Cambio de importe

- Cambiar la regla a $220.000 **no reescribe** movimientos ya confirmados.
- Ocurrencias futuras `programadas` actualizan el importe previsto.
- La ocurrencia de este mes, si sigue programada, toma el nuevo valor; si ya se confirmó, no se toca (se puede ajustar con un movimiento de diferencia o anulando y rehaciendo).

### 7.4 Pausa

Estado `pausada`: no genera ocurrencias nuevas; las pasadas quedan. Al reanudar, retoma desde la próxima fecha según la regla (no “recupera” meses pausados, salvo que el usuario cree un gasto puntual).

### 7.5 Eliminación / finalización

- `finalizada`: deja de generar; historial intacto.
- Borrar regla: igual, **nunca** cascada a movimientos. Ocurrencias futuras se eliminan o se marcan huérfanas canceladas.

### 7.6 Un mes no se paga

Ocurrencia → `omitida`. No hay movimiento. No queda deuda fantasma. El mes siguiente se genera normal.

### 7.7 Suscripciones (Netflix, Amazon, Cursor, Spotify)

Misma regla con `clase = suscripcion`, medio típico tarjeta o débito.

- Si se paga **con crédito**: la ocurrencia confirmada crea un **gasto en tarjeta** (como cualquier consumo), no un débito de cuenta. El dinero de la cuenta sale en el **pago de tarjeta**.
- Si se paga **con débito**: baja la cuenta el día de la ocurrencia.

Doble conteo prohibido: no sumar “suscripciones” **y** “tarjeta” para el mismo Netflix en dinero comprometido (ver §10).

---

## 8. Tarjetas de crédito

### 8.1 Definiciones

- **Límite:** techo de deuda.
- **Deuda:** consumos aún no cubiertos por pagos (incluye cuotas futuras no pagadas).
- **Disponible:** `límite − deuda`. Si deuda > límite (compra forzada o límite bajado), disponible = 0 y aviso.
- **Cierre:** día en que el ciclo abierto pasa a `cerrado` y nace el monto a pagar.
- **Vencimiento:** día límite para pagar ese ciclo.
- **Cuenta de pago:** origen por defecto al registrar un pago; se puede cambiar.

### 8.2 Compra antes del cierre

Hoy 10; cierre 15; vencimiento 25.

- El consumo entra al **ciclo abierto** (cierra el 15).
- Aparece en el resumen que vence el 25.

### 8.3 Compra después del cierre

Hoy 16; el ciclo del 15 ya cerró.

- El consumo entra al **siguiente** ciclo abierto.
- No aumenta el “a pagar ahora” del resumen ya cerrado.

### 8.4 Compra en cuotas

Ver §5.4. La cuota 1 cae en el ciclo que corresponda a la fecha de compra; la 2 al siguiente, etc.

### 8.5 Pago total

Importe = saldo a pagar del ciclo (o deuda total si el usuario elige “saldar tarjeta”). Galicia baja; deuda baja; ciclo `pagado`.

### 8.6 Pago parcial

Ciclo `parcial`. El remanente sigue comprometido. En MVP **no** capitalizamos interés; el remanente pasa al ciclo siguiente como `saldo anterior` (el usuario puede ajustar si el banco cobra interés).

### 8.7 Pago desde una cuenta

Siempre un `pago_tarjeta` desde una cuenta real **de la misma moneda** que la tarjeta. Si paga dos tarjetas, **dos** movimientos.

### 8.8 Varias tarjetas

Cada una: límite, ciclos, deuda y pagos aislados. El dashboard suma deudas **por moneda** (deuda ARS y deuda USD). No hay un total de deuda convertido.

### 8.9 Distinta moneda

- Cada tarjeta tiene **una** moneda (ARS o USD).
- La cuenta de pago por defecto debe ser **de esa misma moneda**.
- Pagar una Visa USD desde una cuenta ARS no es un `pago_tarjeta` simple: primero una **conversión** a una cuenta USD (o, en V2, un pago cruzado con dos importes). En MVP: exigir cuenta USD para pagar tarjeta USD.

### 8.10 Límite insuficiente

Al registrar consumo, si deuda + importe > límite: **advertir y permitir** (el banco a veces autoriza igual) o bloquear. **Propuesta:** advertir y permitir, con flag visual. No silenciar.

---

## 9. Dinero disponible

Todas las magnitudes de situación se calculan **por moneda**. Nunca se suman ARS y USD.

### 9.1 Dinero total

```
T_ARS = Σ saldos de cuentas activas en ARS
T_USD = Σ saldos de cuentas activas en USD
```

Las tarjetas **no** suman. Efectivo sí, en su moneda. Si no hay cuentas USD, el bloque USD no se muestra (o muestra 0).

### 9.2 Patrimonio neto (informativo, separado)

```
PN_ARS = T_ARS − Deuda_tarjetas_ARS
PN_USD = T_USD − Deuda_tarjetas_USD
```

No existe `PN` único en “pesos equivalentes”.

### 9.3 Comprometido — regla anti doble conteo

Un importe se compromete **en el punto donde va a salir de una cuenta de esa moneda**, una sola vez. Objetivos y reservas restan del libre **de su moneda**.

| Obligación | ¿Sale de una cuenta? | ¿Dónde se cuenta? |
| --- | --- | --- |
| Consumo en tarjeta aún no pagado | Cuando se pague la tarjeta | **Deuda de tarjeta** de esa moneda |
| Recurrente que se paga con débito/transferencia y aún no se confirmó este mes | Sí, en la fecha de ocurrencia | **Recurrentes de cuenta pendientes** de esa moneda |
| Recurrente que se paga con crédito | No ahora | Solo en la tarjeta (misma moneda) |
| Cuotas | Vía resumen de tarjeta | Solo deuda/ciclos de esa moneda |
| Objetivo con monto asignado | No se mueve | **Compromiso blando** de la moneda del objetivo |
| Plan/proyecto `planificado` | No | Solo proyección, **no** resta de libre hoy |
| Plan `reservado` | Reserva virtual | Compromiso blando de la moneda del plan |

**Horizonte del “libre hoy”:** obligaciones de tarjeta ya existentes + recurrentes de **cuenta** aún no pagados con fecha en el **mes en curso**, filtrados por moneda. Las cuotas futuras ya están dentro de `Deuda_tarjetas` de esa moneda.

### 9.4 Fórmulas (por moneda M = ARS o USD)

```
Deuda_tarjetas(M) = Σ deudas de tarjetas activas en M

Recurrentes_cuenta_mes(M) =
  Σ ocurrencias de gasto este mes
    aún no confirmadas ni omitidas
    cuyo medio es cuenta en M (no crédito)

Comprometido_duro(M) = Deuda_tarjetas(M) + Recurrentes_cuenta_mes(M)

Comprometido_blando(M) =
  Σ asignado a objetivos activos en M
  + Σ precio de planes/proyectos reservados en M

Libre(M) = T(M) − Comprometido_duro(M) − Comprometido_blando(M)
```

Si `Libre(M) < 0`: mostrar negativo en esa moneda, no esconderlo.

**Ingresos del mes aún no cobrados** no inflan T ni Libre hasta el movimiento. Sí aparecen en la proyección de esa moneda.

---

## 10. Proyecciones

La proyección **no es una entidad**. Es un motor **por moneda** (una curva ARS y, si hay cuentas/tarjetas USD, otra curva USD):

```
saldo_proyectado(d) =
  T_hoy
  + ingresos confirmados futuros hasta d
  + ocurrencias de ingreso programadas hasta d
  − ocurrencias de gasto por CUENTA programadas hasta d
  − pagos de tarjeta previstos hasta d
  − planes reservados o con fecha ≤ d (si el usuario incluye planes en la proyección; default: sí los `reservado` y los con fecha, no los vagos sin fecha)
```

Los gastos en **crédito** no restan el día de la compra en la proyección de **saldo de cuentas**; restan el día del **pago de tarjeta** (o el vencimiento, como pago previsto). Sí restan el día de la compra en la proyección de **patrimonio** (sube la deuda).

Pantalla de proyección: dos bloques si hay USD, **saldo en cuentas** y **patrimonio neto** por moneda, por fin de mes. No hay una sola línea “todo convertido a pesos”.

### 10.1 Ejemplo

Hoy: 8 sep 2026. T = $1.500.000. Ingreso mensual $3.500.000 el día 1. Gastos recurrentes de cuenta $1.800.000/mes. Sin tarjetas.

Supuesto: el sueldo de septiembre ya está en T; de los $1.800.000 del mes ya se pagaron $600.000; restan $1.200.000 en septiembre.

| Corte | Cálculo | Saldo proyectado |
| --- | --- | --- |
| Fin sep | 1.500.000 − 1.200.000 | **300.000** |
| Fin oct | 300.000 + 3.500.000 − 1.800.000 | **2.000.000** |
| Fin nov | 2.000.000 + 3.500.000 − 1.800.000 | **3.700.000** |
| Fin dic | 3.700.000 + 3.500.000 − 1.800.000 | **5.400.000** |

Si hay Visa con vencimiento 15-sep y a pagar $500.000:

Fin sep = 300.000 − 500.000 = **−200.000** (alerta de saldo negativo proyectado).

Los $1.800.000 **no** deben incluir cuotas de tarjeta si esas cuotas ya están en el pago de Visa.

---

## 11. Objetivos de ahorro

Ejemplo: Vacaciones, $2.000.000, diciembre, asignado $700.000.

```
Faltante = 2.000.000 − 700.000 = 1.300.000
Meses restantes = meses hasta diciembre (inclusive o no: propuesta, inclusive el mes objetivo si aún no terminó)
Ahorro mensual necesario = Faltante / Meses restantes
Progreso = 700.000 / 2.000.000 = 35%
```

Fecha estimada: si el usuario registra un ritmo (aporte promedio de los últimos 3 meses al objetivo), extrapolar; si no hay aportes, no inventar fecha: mostrar “sin ritmo suficiente”.

Impacto de otros gastos: el dashboard de objetivo muestra `Libre` y el ahorro necesario. Si `Libre` proyectado a diciembre < faltante, alerta “con el ritmo actual no llegás”.

Aportar a un objetivo: acción “asignar $X” que sube `montoAsignado` y baja Libre; **no** mueve cuentas (MVP). En V2: “aportar” puede ser transferencia a una cuenta etiquetada.

Al alcanzar: estado `alcanzado`. El dinero asignado **sigue restando de libre** hasta que el usuario “libere” o “use en un plan de compra”.

Cancelar: estado `cancelado`; el asignado se libera (vuelve a libre). No se borran aportes históricos (log simple en V2).

---

## 12. Planes vs objetivos vs proyectos

| | Objetivo | Plan de compra | Proyecto |
| --- | --- | --- | --- |
| Pregunta | ¿Cuánto quiero tener? | ¿Qué cosa quiero comprar? | ¿Qué conjunto quiero armar? |
| Éxito | Monto alcanzado | Ítem comprado | Todos los ítems comprados o el usuario cierra |
| Precio | Meta de ahorro | Precio del ítem | Suma de ítems |
| Impacto en libre hoy | Asignado = compromiso blando | Solo si `reservado` | Suma de ítems reservados |
| Ejemplo | Vacaciones $2M | Perfume $180.000 | PC (8 componentes) |

Un proyecto **puede** financiarse con un objetivo (“ahorro PC”), vínculo opcional en V2. MVP: independientes.

---

## 13. Proyectos de compra

Ítems = planes de compra con `proyectoId`.

Cada ítem: precio estimado, precio real, fecha deseada, prioridad, estado, contado o cuotas previstas.

Totales del proyecto:

```
Estimado = Σ precios estimados de ítems no cancelados
Real = Σ precios reales de ítems comprados + estimados de los que faltan
Comprado = cantidad comprados / total activos
```

Distribución por meses: cada ítem con `fechaDeseada` cae en ese mes en la proyección (contado: sale de cuenta; cuotas: deuda de tarjeta y pagos futuros).

Si no hay fecha: no impactan proyección de saldo hasta que el usuario ponga mes o reserve.

---

## 14. Simulador y escenarios

### 14.1 Simulador

Trabaja sobre un **sandbox**:

1. Copia de T, deudas, reglas, cuotas pendientes, objetivos.
2. El usuario agrega hipótesis (“perfume $180.000 este mes, débito MP”).
3. El motor de proyección corre sobre el sandbox.
4. Se comparan: saldo fin de mes, libre, patrimonio, objetivos (¿sigue alcanzable?).
5. **Descartar** tira el sandbox. **Guardar** crea un Escenario. **Aplicar** (V2, peligroso) no se ofrece en MVP: aplicar sería crear movimientos reales; mejor “ir a registrar el gasto” a mano.

Preguntas cubiertas:

- Perfume $180.000 este mes → resta T o suma deuda según medio; muestra libre resultante.
- PC $2.500.000 en enero contado vs 6 vs 12 cuotas → distinto perfil de saldo mensual y de deuda.
- PC + vacaciones → dos hipótesis; alerta si objetivos chocan.

### 14.2 Escenarios (V2)

Escenario A: PC enero. B: PC marzo. C: PC enero + vacaciones febrero.

Comparación tabular: saldo proyectado a N cortes, ahorro, libre, gasto, objetivos ok/no ok.

MVP: simulador de una corrida **sin guardar**. Guardar/comparar = V2.

---

## 15. Presupuestos

Por categoría (y opcionalmente subcategoría) y mes.

```
Usado = Σ gastos confirmados del mes
  · contado/débito: por fecha del movimiento
  · crédito 1 pago: por fecha de compra
  · crédito en cuotas: por mes de cada cuota (la cuota 3/12 cuenta en su mes, no las 12 de golpe)
```

Así el presupuesto “tecnología $200.000” no explota el mes que comprás la PC en 12 cuotas; explota $200.000/12 si esa es la cuota… **Decisión de producto:** o el presupuesto sigue el **reconocimiento total el mes de compra** (más honesto con “me endeudé en $2.4M”) o el **devengo por cuota** (más suave).

**Propuesta:** presupuesto usa **devengo por cuota** para crédito, e importe total para contado. En la ficha de la PC se muestra además el compromiso total. Evita un solo mes destruido y alinea con el resumen real.

Alertas: 80% y 100%. No bloquean cargar gastos (aviso, no candado).

Pago de tarjeta: **fuera** de presupuestos de categorías de consumo.

---

## 16. Pantallas y navegación

Principio: **pocas entradas**. No hay tres módulos “Gastos / Ingresos / Movimientos”.

```
(auth) Login / Registro
(onboarding) Cuentas → Tarjetas (opcional) → Recurrentes (opcional) → Listo
(app)
  Inicio (dashboard)
  Movimientos          ← libro único
  Cuentas
  Tarjetas
  Planificación        ← recurrentes, presupuestos, calendario
  Metas                ← objetivos; planes/proyectos en V2 o pestaña
  Proyección
  Más                  ← configuración, reportes simples
```

### 16.1 Login / Registro

Objetivo: entrar. Acciones: Google, email/password. Sin datos financieros.

### 16.2 Configuración inicial (onboarding)

Objetivo: T_ARS > 0 lo antes posible (USD opcional). Pasos: nombre de espacio, 1+ cuentas con saldo inicial y moneda (default ARS), opcional cuenta USD, opcional 1 tarjeta (límite, cierre, vencimiento, cuenta de pago misma moneda), opcional 1 recurrente. Al terminar → Dashboard.

### 16.3 Dashboard

Muestra, **en columnas o bloques separados**: T ARS, T USD (si hay), Deuda ARS/USD, PN ARS/USD, Comprometido y Libre por moneda, gastado del mes vs presupuesto (el presupuesto default es ARS), próximos vencimientos. Nunca un único “total equivalente”. Acciones: “Registrar movimiento”, atajos a tarjeta a pagar. Relación: todo el resto.

### 16.4 Cuentas

Lista con saldo **en la moneda de cada cuenta**. Alta/editar/archivar (moneda no se cambia si ya hay movimientos). Ajuste de saldo. Historial filtrado de esa cuenta. Relación: movimientos, pago de tarjeta.

### 16.5 Medios de pago

**No es pantalla propia en MVP.** El medio se elige al cargar un movimiento (cuenta o tarjeta). Evita duplicar Cuentas + Tarjetas.

### 16.6 Tarjetas

Lista: límite, deuda, disponible, próximo cierre/vencimiento. Detalle: ciclo abierto, consumos, cuotas pendientes, registrar consumo, registrar pago. Relación: movimientos, cuenta de pago.

### 16.7 Movimientos

Libro con filtros: tipo, cuenta, tarjeta, categoría, fechas, moneda. Alta unificada (wizard corto: gasto / ingreso / transferencia / conversión / pago tarjeta / ajuste). Relación: todas.

Gastos e ingresos **no** son rutas hermanas; son filtros.

### 16.8 Recurrentes

Lista de reglas + ocurrencias del mes. Pausar, omitir, confirmar, cambiar importe. Relación: movimientos, proyección, calendario.

### 16.9 Presupuestos

Mes actual, barras por categoría, crear/editar tope. Relación: movimientos.

### 16.10 Objetivos

Lista, progreso, asignar, nuevo. Relación: dashboard (Libre), proyección.

### 16.11 Planes de compra / Proyectos

V2 como sección “Compras”. MVP: se puede vivir sin ellos (anotar un gasto cuando ocurra).

### 16.12 Proyección

Selector de horizonte (fin de mes × 1–6). Tabla o gráfico (Recharts) saldo y patrimonio. Desglose del mes: ingresos, recurrentes, tarjetas, planes. Relación: recurrentes, tarjetas, objetivos.

### 16.13 Simulador / Escenarios

V2. En MVP, la proyección + “¿qué pasa si?” mínimo puede ser un **borrador no persistido** al final del MVP+ si sobra tiempo; si no, V2.

### 16.14 Reportes

MVP: gastos del mes por categoría (el mismo dashboard/movimientos). Reportes ricos: V2.

### 16.15 Calendario

Mes con ocurrencias, vencimientos de tarjeta, planes con fecha. Tocar un día → confirmar/omitir. Relación: recurrentes, tarjetas.

### 16.16 Configuración

Perfil, categorías, si objetivos restan de libre, auto-confirmar recurrentes, moneda por defecto **ARS** (las cuentas USD se marcan al crearlas), cerrar sesión.

---

## 17. Flujos de usuario

### Flujo 1 — Alta

Registro → onboarding cuentas (Galicia, MP, efectivo) → opcional Visa (límite, cierre 15, vto 25, paga Galicia) → opcional recurrentes (mamá día 5, Netflix) → dashboard con T y próximos vencimientos.

### Flujo 2 — Gasto normal

Dashboard o Movimientos → Nuevo gasto → importe, fecha, categoría, cuenta MP → guardar → T y MP bajan; aparece en el libro.

### Flujo 3 — Compra con tarjeta

Nuevo gasto → medio crédito → Visa → $150.000 → Galicia intacto; deuda Visa sube; disponible baja.

### Flujo 4 — Cuotas

Nuevo gasto crédito → “en cuotas” 12 → Finza crea 12 cuotas y un gasto de $2.400.000; proyección muestra $200.000 por ciclo.

### Flujo 5 — Pagar tarjeta

Tarjetas → Visa → Pagar → cuenta Galicia, importe (sugerido = a pagar) → movimiento `pago_tarjeta` → Galicia baja, deuda baja, **gasto del mes no sube**.

### Flujo 6 — Objetivo

Metas → Vacaciones, $2.000.000, dic → asignar $700.000 → Libre baja $700.000; T no cambia → ver faltante y cuota mensual sugerida.

### Flujo 7 — Plan de compra (V2 / MVP+ )

Compras → Perfume $180.000, fecha sep, no reservado → aparece en proyección de sep, no en Libre → al comprar, wizard de gasto y estado `comprado`.

### Flujo 8 — Proyecto PC (V2)

Proyecto PC → 8 ítems con precios → fechas repartidas → proyección por mes → marcar GPU comprada con tarjeta 6 cuotas → ítem `comprado`, nace movimiento + cuotas.

### Flujo 9 — Simulación (V2)

Simulador → agregar “PC enero 12 cuotas” → ver fin de ene–jun → no se escribe el libro.

### Flujo 10 — Comparar escenarios (V2)

Guardar A, B, C → vista comparar → elegir el que deja Libre > 0 en todos los meses.

---

## 18. Casos de uso (resumen)

| ID | Actor | Caso | Resultado |
| --- | --- | --- | --- |
| UC01 | Usuario | Registrar gasto de cuenta | Saldo y T actualizados |
| UC02 | Usuario | Registrar gasto crédito | Deuda/disponible; T igual |
| UC03 | Usuario | Registrar cuotas | Movimiento + N cuotas |
| UC04 | Usuario | Pagar tarjeta | Cuenta baja; no es gasto |
| UC05 | Usuario | Transferir entre cuentas misma moneda | T de esa moneda igual; no gasto/ingreso |
| UC05b | Usuario | Convertir ARS↔USD | T_ARS y T_USD cambian; no es gasto |
| UC06 | Usuario | Ajustar saldo | Ajuste auditado |
| UC07 | Usuario | ABM regla recurrente | Ocurrencias futuras |
| UC08 | Usuario | Confirmar/omitir ocurrencia | Movimiento o hueco |
| UC09 | Usuario | Ver dashboard | T, deuda, libre, próximos |
| UC10 | Usuario | Ver proyección a N meses | Saldos de cierre |
| UC11 | Usuario | ABM objetivo y asignar | Libre blando |
| UC12 | Usuario | ABM presupuesto | Alertas 80/100 |
| UC13 | Usuario | Archivar cuenta/tarjeta | Historial vivo |
| UC14 | Usuario | Anular movimiento | Saldos recalculados |
| UC15 | Usuario | Simular (V2) | Sandbox |
| UC16 | Usuario | Comparar escenarios (V2) | Tabla comparativa |

---

## 19. Casos límite

| Caso | Comportamiento propuesto |
| --- | --- |
| Saldo negativo | Permitido. Dashboard en alerta. No bloquear la carga (la realidad a veces es descubierto o error de carga). |
| Tarjeta sin límite suficiente | Advertir y permitir registrar. |
| Recurrente modificado | Solo futuro + ocurrencias aún programadas. |
| Recurrente eliminado | Historial intacto; no más futuras. |
| Compra/plan cancelado | Plan `cancelado`; si ya había movimiento, hay que anular el movimiento aparte (no magia). |
| Devolución | Movimiento `devolucion` vinculado al gasto: si fue cuenta, la cuenta sube; si fue crédito, baja deuda / no se cobra esa cuota. No es un “ingreso sueldo”. Reportes: resta del gasto de esa categoría. |
| Pago parcial de tarjeta | Ciclo `parcial`; deuda residual. |
| Pago adelantado (más que el ciclo) | Imputa al ciclo actual y deja saldo a favor / imputa a cuotas futuras (reduce deuda total). Propuesta: reducir deuda total FIFO incluyendo cuotas pendientes. |
| Cuotas canceladas (devolución del comercio) | Anular movimiento origen; cuotas pendientes `anuladas`; las ya pagadas generan `devolucion` a la tarjeta (baja deuda o saldo a favor). |
| Transferencia equivocada | Anular (revierte ambas puntas) o transferencia inversa. Preferir anular si fue el mismo día. |
| Cuenta eliminada | No. Solo archivar. Si insiste, bloquear si hay saldo ≠ 0 o movimientos. |
| Tarjeta eliminada | Archivar/cerrar. Bloquear si deuda ≠ 0. |
| Cambio de moneda de una cuenta | Bloqueado si hay movimientos. Crear otra cuenta. |
| Transferencia ARS→USD | No permitida. Usar `conversion` con dos importes. |
| Precio de suscripción | Ver §7.3. |
| Ingreso irregular | Movimiento de ingreso puntual, sin regla. O regla con `omitir` los meses que no cobra. |
| Meses con ingresos distintos | El sueldo recurrente se edita en la ocurrencia de ese mes ($3.5M → $2M) sin cambiar la regla, o se pausa la regla y se carga a mano. |
| Objetivo cancelado | Libera asignado. |
| Compra planificada que no se hace | `cancelado`; sale de proyección. |
| Doble confirmación de una ocurrencia | Impedir; la ocurrencia ya tiene movimientoId. |
| Cierre día 31 en febrero | Usar último día del mes. |
| Transferencia + marcarla como gasto | La UI de transferencia no ofrece categoría de consumo. |

---

## 20. MVP / V2 / Futuro

### 20.1 MVP — útil de verdad

Sin esto Finza no cumple la visión mínima (“saber dónde estoy y qué debo”).

1. Auth (Google + email/password).
2. Onboarding de cuentas con saldo inicial (ARS default; USD opcional).
3. Libro de movimientos: gasto, ingreso, transferencia (misma moneda), conversión ARS↔USD, ajuste.
4. Categorías/subcategorías.
5. Tarjetas: límite, cierre, vencimiento, consumo, disponible, pago de tarjeta (sin duplicar gasto), cuotas; moneda ARS o USD.
6. Recurrentes (gasto e ingreso) + ocurrencias confirmar/omitir.
7. Dashboard: **T ARS y T USD separados**, deuda, PN, comprometido y libre **por moneda**.
8. Objetivos de ahorro (sobre virtual, con moneda).
9. Presupuesto mensual por categoría y moneda.
10. Proyección a 1–6 meses **por moneda**.
11. Calendario de vencimientos del mes.
12. Archivar cuenta/tarjeta; anular movimiento.

**Fuera del MVP a propósito:** simulador guardable, escenarios, proyectos PC, planes de compra, cotización automática / total unificado en pesos, intereses de tarjeta, sync bancario, hogar compartido.

### 20.2 V2 — importante, puede esperar

- Planes de compra y proyectos (PC).
- Simulador + escenarios comparables.
- Presupuesto por subcategoría y copiar mes a mes.
- Reportes (tendencia 6–12 meses, top comercios si hay nota).
- Interés / pago mínimo de tarjeta.
- Objetivo vinculado a cuenta real (transferencia al aportar).
- Tipo de cambio automático y un “total equivalente” en ARS (opcional; el default sigue siendo totales separados).
- Auto-confirmar recurrentes por regla (si no entró fino en MVP).
- Exportar CSV.

### 20.3 Futuro

- Open finance / sync Galicia–MP.
- Inversiones y plazo fijo.
- Inflación y proyección en moneda constante.
- Hogar: varios usuarios, cajas compartidas.
- OCR de tickets y resúmenes de tarjeta.
- Notificaciones push de vencimiento (Capacitor).
- Impuestos / Monotributo.

Prioridad: **libro + tarjeta sin doble conteo + proyección simple + libre vs comprometido**. Eso diferencia a Finza de una planilla. El simulador brilla después, cuando el libro sea confiable.

---

## 21. Decisiones cerradas

El plan se sigue con estas decisiones. Se pueden revisar más adelante, no bloquean el siguiente paso (arquitectura técnica).

1. **Objetivos y dinero libre.** El monto asignado resta de Libre **de esa moneda** (sobre virtual).
2. **Moneda.** Default **ARS**. Cuentas y tarjetas pueden ser **USD**. Totales, deuda, patrimonio y libre se muestran **separados**; no hay un total único convertido.
3. **Saldo negativo.** Permitido, con alerta, **por moneda**.
4. **Recurrentes.** Confirmación manual por default; auto opcional por regla.
5. **Presupuesto vs cuotas.** Cuenta la cuota del mes; el total se ve en la ficha de la compra. El presupuesto tiene moneda.
6. **Devoluciones.** Tipo `devolucion` vinculado al gasto.
7. **Límite de tarjeta excedido.** Advertir y permitir.

Siguiente paso: arquitectura técnica (tablas MySQL/Sequelize, Auth.js y mapa de rutas Next.js), todavía sin UI final.
