# Fondeados Club

## Qué es
App web para gestionar cuentas de "funded trading" (prop firms): registrar
challenges comprados, gastos asociados (fees, resets, add-ons), estado de
cada cuenta (en evaluación, passed, funded, quemada) y balance/P&L. Piensa
en esto como un "gestor de cuentas fondeadas".

## Modelo de negocio
Freemium:
- **Gratis** (la mayoría de las funciones): alta de cuentas fondeadas/challenges,
  registro de gastos, estado de cuenta, balance/P&L simple, vista general.
- **Pago mensual** (barato, no es el objetivo generar un precio alto):
  analytics avanzado (ROI neto de fees, comparativa entre firms, consistencia,
  tasa de aprobación histórica), alertas (drawdown cerca del límite,
  vencimiento de challenge, día de pago), export/reportes, multi-moneda
  avanzada, posible multi-usuario.
- El pago mensual incluye acceso a una **comunidad privada** (tipo Discord).

## Competencia (research hecho el 2026-08-03)
- **pipback.com** — el más parecido a la idea. Trackea el journey completo
  de evaluaciones (compra → funded → payouts), ROI, comparador de firms,
  calculadora de evaluación. Freemium: herramientas de comparación gratis,
  dashboard completo de tracking parece premium. Tiene Discord.
- **tradesyncer.com** — otra cosa en el fondo (copytrading + risk management
  entre cuentas), con journaling y comunidad de 25k+ traders, por suscripción.
- **tradelio.com** — dominio caído/en venta (hugedomains), no es competencia
  activa hoy.

## Stack decidido (propuesto, no confirmado en código todavía)
- **Next.js** — frontend/app.
- **Supabase** — Postgres + auth + storage, plan gratis para el MVP.
- **Stripe** — suscripciones mensuales (se activa cuando haya usuarios).
- **Vercel** — hosting/deploy, deploy automático on push a GitHub, plan
  gratis alcanza para el MVP.
- Dominio a comprar aparte (ej. fondeadosclub.com, ~10-15 USD/año).

## Estado actual (actualizado 2026-08-09)
- Cuenta de GitHub creada.
- Cuenta de Supabase creada (login con GitHub).
- Proyecto de Supabase creado: nombre `fondeados-club`, región West US
  (Oregon), motor Postgres estándar (NO OrioleDB). Data API habilitada,
  "Automatically expose new tables" DESACTIVADO (a propósito, para exponer
  tablas de una en una cuando ya tengan RLS), "Enable automatic RLS"
  ACTIVADO (cada tabla nueva nace bloqueada hasta que le pongamos la regla
  de "cada usuario ve solo lo suyo").
- Todavía NO hay repo git, NO hay repo en GitHub, NO hay código de la app
  todavía (ni Next.js ni tablas creadas en Supabase).
- Decisión de negocio para el MVP: **todo lo que se construya ahora es
  gratis**. La división freemium (features pagas) se implementa recién
  después de sacar el MVP, no antes.
- Hay una carpeta `Dashboards/` en el proyecto con capturas de referencia
  de 3 productos: "Lea" (dashboard más pulido y completo), PipBack, y
  Tradesyncer ("syncer"). Se usaron para definir el diseño de las
  secciones (ver más abajo).

## Próximos pasos (cuando el usuario lo pida)
1. Terminar de definir la sección Home (resumen de Cuentas + Business
   Manager, ver abajo).
2. ~~Definir tablas concretas en Supabase~~ — hecho. `supabase/schema.sql`
   corrido con éxito en el proyecto `fondeados-club` (tablas cuentas_fondeo,
   gastos, payouts + RLS + trigger, ya creadas).
3. Crear repo (git init + GitHub).
4. Scaffold de Next.js conectado a Supabase.
5. Primera pantalla real: alta de cuentas fondeadas + gastos.

## Notas de forma de trabajar
- El usuario prefiere ir paso a paso y confirmando antes de que se arranque
  a ejecutar cosas — no asumir luz verde de una charla de idea a "empezar a
  correr comandos".

## Diseño de secciones (definido 2026-08-09)
La app tiene 3 secciones principales: **Home**, **Business Manager**,
**Cuentas**. Se definieron primero Cuentas y Business Manager (basado en
las capturas de `Dashboards/`), y Home se arma después como resumen de las
otras dos (todavía pendiente de definir en detalle).

### CUENTAS
Tarjetas por cuenta (estilo "Lea cuentas.jpeg"), cada una mostrando:
- Nombre (auto-sugerido tipo "PA1", editable) + Firm
- Estado con color (Activa/Precaución, Passed, Funded, Quemada, Archivada)
- Balance actual y variación desde el inicio
- Anillo de progreso "% al payout"
- Datos del ciclo: balance base, drawdown máximo, profit split, objetivo
  de payout
- Filtros arriba: Activas/Archivadas, por Firm

Modal "Nueva cuenta" (mezcla PipBack + Tradesyncer): Firm, tamaño de
cuenta, fecha de inicio, drawdown máximo, profit split, objetivo de
payout, notas. Decisión importante: **no** se arma un catálogo automático
de reglas por firm (como tienen PipBack/Lea) porque implica mucho
mantenimiento — para el MVP esos campos los completa el usuario a mano.

### BUSINESS MANAGER
Cards de resumen arriba: Total Invertido, Total Cobrado (payouts), Net
P&L, ROI %, Cuentas activas.

Gráficos (todos calculables solo con gastos + payouts, sin necesitar
datos de trades):
- Invertido vs Payouts en el tiempo
- P&L Neto acumulado
- Gastos por categoría (fee de challenge, reset, activación,
  software/suscripciones)
- Resultados por Firm (passed/failed)

Tabla de "Movimientos": todo (gastos + payouts) en una lista, filtrable
por tipo/cuenta, con fecha y monto.

### Explícitamente FUERA del MVP
Métricas tipo Profit Factor, Win Rate, P&L por sesión de trading (vistas
en "Lea") — requieren datos de **cada operación de trading** (trade por
trade), que vendría de conectar un broker o cargar operación por
operación a mano. Es un feature mucho más grande (tipo "Journal" que Lea
tiene aparte en su menú) y no hace falta para validar la idea original de
gastos/cuentas. Se deja para más adelante, no para el MVP.

### HOME
Pendiente de definir en detalle. La idea es que sea un resumen/vista
rápida que combine lo más importante de Cuentas y Business Manager
(alertas, accesos directos), una vez que esas dos secciones estén
cerradas.

## Modelo de datos (definido 2026-08-16)
SQL completo (tablas + índices + RLS + trigger) en `supabase/schema.sql`,
corrido con éxito en el SQL Editor del proyecto `fondeados-club`
(2026-08-16). Las 3 tablas ya existen en Supabase.

### cuentas_fondeo
Una fila por cuenta fondeada/challenge. Campos: `nombre` (auto-sugerido
"PA1", editable), `firm`, `tamano_cuenta` (balance base), `fecha_inicio`,
`drawdown_maximo_pct` y `drawdown_maximo_monto` (se guardan los dos; el
usuario edita cualquiera de los dos y la app recalcula el otro usando
`tamano_cuenta` como referencia — lógica en el frontend, no en la DB),
`profit_split` (%), `objetivo_payout` ($), `estado` (activa, precaucion,
passed, funded, quemada, archivada — default `activa`), `balance_actual`,
`notas`. `updated_at` se actualiza solo via trigger.

### gastos
Una fila por gasto. Campos: `cuenta_id` (**nullable** — permite gastos
generales no atados a una cuenta, ej. software/suscripciones),
`categoria` (fee_challenge, reset, activacion, software_suscripcion,
otro), `monto`, `fecha`, `descripcion`.

### payouts
Una fila por cobro. Campos: `cuenta_id` (obligatorio, un payout siempre
es de una cuenta), `monto`, `fecha`, `notas`.

### RLS
Las 3 tablas tienen RLS activado con policies `auth.uid() = user_id` para
select/insert/update/delete — cada usuario ve y edita solo lo suyo.
`user_id` default `auth.uid()` en las 3 tablas.
