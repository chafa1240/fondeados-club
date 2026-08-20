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

## Competencia

**Research nuevo del 2026-08-20 en `docs/COMPETENCIA.md`**: PropTracker
(`proptracker.io`) y Trading Control (`tradingcontrol.app`), los dos
recorridos por dentro con cuenta propia. Ahí están los huecos concretos
(calendario mensual, retiros con estado pedido/cobrado, ROI por firm), lo
que implica para el Home y los precios del rubro. Lo de abajo queda como
antecedente.

### Research viejo (2026-08-03)
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
- Repo git local creado y pusheado a GitHub: `github.com/chafa1240/fondeados-club`
  (2026-08-16). Todavía NO hay código de la app (ni Next.js todavía).
- Decisión de negocio para el MVP: **todo lo que se construya ahora es
  gratis**. La división freemium (features pagas) se implementa recién
  después de sacar el MVP, no antes.
- Hay una carpeta `Dashboards/` en el proyecto con capturas de referencia
  de 3 productos: "Lea" (dashboard más pulido y completo), PipBack, y
  Tradesyncer ("syncer"). Se usaron para definir el diseño de las
  secciones (ver más abajo).

## Próximos pasos (cuando el usuario lo pida)
1. Terminar de definir la sección Home (resumen de Cuentas + Funding
   Manager, ver abajo).
2. ~~Definir tablas concretas en Supabase~~ — hecho. `supabase/schema.sql`
   corrido con éxito en el proyecto `fondeados-club` (tablas cuentas_fondeo,
   gastos, payouts + RLS + trigger, ya creadas).
3. ~~Crear repo (git init + GitHub)~~ — hecho. Repo `github.com/chafa1240/fondeados-club`,
   con `CLAUDE.md`, `supabase/schema.sql` y `.gitignore` ya pusheados a `main`.
4. ~~Scaffold de Next.js conectado a Supabase~~ — hecho (2026-08-16).
   Next.js 14 + TypeScript + Tailwind + App Router, clientes de Supabase
   en `src/lib/supabase/client.ts` (browser) y `server.ts` (server
   components). `npm install` corrido, `.env.local` con la anon key
   configurado, `npm run dev` probado y funcionando en
   `localhost:3000`.
5. Primera pantalla real: alta de cuentas fondeadas + gastos.

**Plan completo hasta el MVP (y fases de monetización y app móvil):
ver `ROADMAP.md`.**

Pasos 1 y 2 del roadmap ya están hechos (2026-08-16):
- **Auth funcionando** (email + contraseña con confirmación por email,
  middleware protegiendo rutas privadas).
- **App publicada en https://fondeados-club.vercel.app** (Vercel plan
  Hobby, deploy automático en cada push a `main`). Registro **cerrado**
  por ahora: se invita desde Supabase → Authentication → Users.

Pasos 3 y 4 también hechos (2026-08-16):
- **Layout general**: menú Home / Funding Manager / Cuentas, header con
  email + salir, `<AdSlot />` reservados (hoy no ocupan nada).
- **Sección Cuentas completa**: tarjetas con estado, balance, variación y
  anillo de % al payout; modal de alta/edición con drawdown que se calcula
  solo entre % y $; cambiar estado, archivar, eliminar; filtros
  Activas/Archivadas y por Firm; nombre auto-sugerido PA1/PA2.
  **El balance actual se carga a mano** (editable en línea desde la
  tarjeta), no se deduce de los payouts.
  Los cálculos viven en `src/lib/cuentas.ts`, separados de las pantallas,
  para reusarlos en la app móvil más adelante.

**Rediseño del drawdown** hecho el 2026-08-17 (Paso 4c del roadmap):
modos estático / EOD / trailing, congelamiento del piso y pico histórico.
Está en la sección **Drawdown** al final de este archivo.
`supabase/008_drawdown_trailing.sql` **ya se corrió** en Supabase
(2026-08-17) y se verificó en la app con las cuentas reales de Apex. La
**009** corrige el drawdown que la 008 asumió mal (5% en vez de 4%). El
**máximo del día** (el otro pedazo del mismo diseño) entra recién con el
Paso 5b, porque vive en la fila diaria.

**Paso 5 (gastos y movimientos) y Paso 5b (resultados diarios) hechos el
2026-08-17/18.** El Funding Manager tiene la lista de movimientos con
filtros, y el balance de cada cuenta **ya no se guarda: se calcula** con
los resultados diarios y los retiros. Detalle en `ROADMAP.md` y en la
sección **Resultados diarios** de este archivo.

**Paso 6 (Funding Manager con gráficos) hecho el 2026-08-18.** Cards de
resumen con ROI, retiro promedio y costo por fondeada; cuatro gráficos
(invertido vs. cobrado, neto acumulado, gastos por categoría, cuentas por
firm); filtros separados para el resumen y el historial; y el gráfico de
**balance vs. piso** por cuenta, que se abre desde la tarjeta. En el mismo
tramo entraron la lista de firms partida en Futuros / Forex con buscador y
la sugerencia de modo de drawdown según el mercado. Detalle en
`ROADMAP.md` (Pasos 6 y 6b).

**Próximo paso: Paso 7 — Home.** Todavía sin definir en detalle: hay que
decidir qué alertas entran antes de escribir código. Lo único que quedó
escrito sin pantalla del tramo anterior es `resumenDias()` (ratio de días
ganadores/perdedores) en `src/lib/resultados.ts`, candidato a vivir ahí
junto con `rachaActual()` y `retiroMaximoSeguro()`.

**Nota técnica**: `npm run build` no se puede correr desde el entorno de
Claude (el `node_modules` está instalado para Windows y el sandbox no
tiene red). La verificación se hace con `npx tsc --noEmit` y `eslint`, y
el build real lo hace Vercel al pushear.

## Monetización (definido 2026-08-16)
Dos fuentes de ingreso, ambas **post-MVP**:
- **Suscripción premium** (Stripe), barata.
- **Publicidad** (tipo AdSense) en la versión gratuita; el premium la saca.
Además, a futuro se quiere una **app nativa Android + iOS** (plan: PWA
primero, después React Native + Expo reusando el mismo backend de
Supabase). Detalle en `ROADMAP.md`.

## Idioma (definido 2026-08-16)
La app se escribe **en español** (es el idioma por defecto y el de todos
los textos que se ven en pantalla). Más adelante tiene que poder
**cambiarse a inglés** con un selector.

Qué implica para el código de acá en adelante: **no hardcodear textos
sueltos en las pantallas**. Cada texto visible tiene que poder salir de un
archivo de traducciones (ej. `src/i18n/es.ts` y `en.ts`) para que sumar
inglés sea agregar un archivo, no reescribir componentes. Los nombres de
variables, funciones y columnas siguen en español, eso no cambia.

No se implementa todavía (ver `ROADMAP.md`, Paso 8b): primero el MVP en
español, después el selector de idioma.

## Notas de forma de trabajar
- El usuario prefiere ir paso a paso y confirmando antes de que se arranque
  a ejecutar cosas — no asumir luz verde de una charla de idea a "empezar a
  correr comandos".

## Diseño de secciones (definido 2026-08-09)
La app tiene 3 secciones principales: **Home**, **Funding Manager**,
**Cuentas**. Se definieron primero Cuentas y Funding Manager (basado en
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

**Firms (2026-08-18)**: `FIRMS_FUTUROS` y `FIRMS_FOREX` en
`src/lib/cuentas.ts`, ~50 en total, elegibles desde un menú con submenús y
buscador. El campo **sigue siendo texto libre**: el rubro abre y cierra
firms todo el tiempo (MyForexFunds estaba en la lista vieja y ya no
opera), así que conviene revisar la lista cada tanto y la app nunca le
dice a alguien que su firm no existe. Elegir una de la lista **propone**
el modo de drawdown del mercado (futuros → `trailing`, forex → `estatico`);
escribirla a mano no toca nada, porque ahí no sabemos de qué mercado es.

### FUNDING MANAGER
Implementado en el Paso 6 (2026-08-18). La pantalla tiene dos secciones,
**Resumen** e **Historial**, cada una con su propio filtro.

Cards de resumen: Invertido, Cobrado, Neto, **ROI %**, **Retiro promedio**
y **Costo por fondeada** (todo lo invertido dividido las fondeadas
conseguidas, contando las evaluaciones quemadas en el camino). Estos dos
últimos se leen de a pares: cuando el retiro promedio supera al costo por
fondeada, el negocio se sostiene solo.

Gráficos (todos calculables solo con gastos + payouts, sin necesitar
datos de trades):
- Invertido vs. cobrado, acumulado en el tiempo
- Neto acumulado
- Gastos por categoría — un solo tono, no un color por categoría: acá se
  comparan tamaños, y pintar cada una distinta sugiere que el color
  significa algo
- Cuentas por firm (pasadas / quemadas / en juego). **No sigue los
  filtros**: mira todas las cuentas, y así lo dice en pantalla

Tabla de "Movimientos": todo (gastos + retiros) en una lista, con filtros
de cuenta, período y tipo, paginada por tandas. Los movimientos
automáticos se marcan "desde la cuenta" y al editarlos se abre el campo de
la cuenta que los generó, no una fila de gasto.

**Dos filtros, no uno** (decisión 2026-08-18): el resumen responde "cómo
vengo" y el historial "qué cargué". Con un filtro compartido, mirar una
cosa rompía la otra.

**Qué se puede cargar a mano**: solo las categorías generales
(software/suscripción y otro). Evaluación, reset y fee de activación
existen igual, pero **solo las usan los movimientos automáticos**, porque
esos números ya son campos de la cuenta — ofrecerlas también en el
formulario permitía cargar dos veces lo mismo y el ROI quedaba inflado sin
que nadie avisara. Un reset se carga como una evaluación nueva más barata,
así queda además la cuenta para seguirla. Ver `CATEGORIAS_MANUALES` en
`src/lib/movimientos.ts`.

### Explícitamente FUERA del MVP
**Logos de las prop firms** (descartado 2026-08-19). Se evaluó ponerlos al
lado del nombre. Traerlos del sitio de cada firm es frágil y le filtra la
IP del usuario a 53 dominios; los favicons son de 32px y se ven como
manchas; guardarlos nosotros es lo único que queda bien, pero son 53
archivos a mantener en un rubro donde las firms abren y cierran seguido.
Hoy no aportan: casi todas las cuentas son de la misma firm y el nombre ya
está escrito al lado. Si alguna vez hace falta, la alternativa barata es
una insignia con la inicial y un color derivado del nombre — funciona
también con las firms escritas a mano y no depende de nadie.

Métricas tipo Profit Factor, Win Rate, P&L por sesión de trading (vistas
en "Lea") — requieren datos de **cada operación de trading** (trade por
trade), que vendría de conectar un broker o cargar operación por
operación a mano. Es un feature mucho más grande (tipo "Journal" que Lea
tiene aparte en su menú) y no hace falta para validar la idea original de
gastos/cuentas. Se deja para más adelante, no para el MVP.

### HOME
Pendiente de definir en detalle. La idea es que sea un resumen/vista
rápida que combine lo más importante de Cuentas y Funding Manager
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
`profit_split` (%), `balance_actual`, `notas`. `updated_at` se actualiza
solo via trigger.

**Actualizado por `supabase/002_tipos_y_salud.sql` (2026-08-16):**
- `tipo`: `fondeada` | `challenge` (en pantalla: **Fondeada** /
  **Evaluación**). La evaluación no tiene objetivo de retiro ni profit
  split; la fondeada no tiene profit target. Al guardar se limpian los
  campos del otro tipo.
- `profit_target_pct` / `profit_target_monto` (`003_profit_target.sql`):
  solo evaluaciones, cuánto hay que ganar para pasarla. El anillo de la
  tarjeta se basa en esto para evaluaciones y en `balance_objetivo` para
  fondeadas — ver `anillo()` en `src/lib/cuentas.ts`.
- `objetivo_retiro` (ex `objetivo_payout`): cuánto querés retirar (ej. 500).
- `balance_objetivo`: qué balance tiene que marcar la cuenta para poder
  retirar eso (ej. 2600 en Apex). Cambia por firm, por eso se carga a mano.
  El anillo de la tarjeta mide balance base → balance objetivo.
- `umbral_saludable_pct/_monto` y `umbral_precaucion_pct/_monto`: defaults
  3% y 2% del tamaño de cuenta, editables por cuenta, en % o en $ (se
  calcula uno con el otro).
- `estado` guarda **solo lo que se elige a mano**: `activa`, `en_curso`,
  `passed`, `quemada`, `archivada`. **Crítico / Precaución / Saludable NO
  se guardan**: se calculan con el colchón que queda hasta el drawdown
  (`salud()` en `src/lib/cuentas.ts`).

**Actualizado por `supabase/004_retiros_y_fee.sql` (2026-08-16):**
- `retiros_previos` (default 0): lo ya retirado antes de usar la app. Los
  retiros nuevos van uno por uno a la tabla `payouts`; el total que se
  muestra es la suma de ambos (`totalRetirado()` en `src/lib/cuentas.ts`).
- `fee_activacion`: **NULL = no tuvo fee** (en el formulario se elige con
  ✓/✕; con ✕ el campo queda deshabilitado). Ojo: hoy vive en la cuenta y
  no en `gastos`. Cuando se haga el Paso 5 hay que decidir si el Funding
  Manager lo lee de acá o si se crea el gasto correspondiente.

**Retiros**: se registran desde el menú ⋯ de cada fondeada. Insertan una
fila en `payouts` y **descuentan el monto del balance** en la misma
acción; borrar un retiro se lo devuelve. Están en `registrarRetiro()` y
`eliminarRetiro()` de `src/app/(app)/cuentas/actions.ts`.

**Actualizado por `supabase/005_datos_evaluacion.sql` (2026-08-16):**
`regla_consistencia` (%), `tipo_drawdown` (`trailing` | `eod`), `precio`
(lo que costó la evaluación) y `cantidad_contratos`. Son **solo de
evaluaciones**; en fondeadas se guardan en NULL. El `fee_activacion` es al
revés: solo fondeadas.

⚠️ `tipo_drawdown` queda reemplazado por `modo_drawdown` y pasa a aplicar
a **los dos** tipos de cuenta — ver la sección **Drawdown** más abajo.

**Tarjeta de dos caras** (`src/components/cuentas/tarjeta-cuenta.tsx`):
el frente muestra lo mínimo (balance, anillo, drawdown máx. y objetivo /
profit target, más los últimos 3 retiros); el botón "+ Información…" la da
vuelta con una animación 3D y en el dorso están el resto de los datos.

### gastos
Una fila por gasto. Campos: `cuenta_id` (**nullable** — permite gastos
generales no atados a una cuenta, ej. software/suscripciones),
`categoria` (fee_challenge, reset, activacion, software_suscripcion,
otro), `monto`, `fecha`, `descripcion`.

### payouts
Una fila por cobro. Campos: `cuenta_id` (obligatorio, un payout siempre
es de una cuenta), `monto`, `fecha`, `notas`.

### resultados_diarios (Paso 5b, migración 011)
Una fila por **día y cuenta**: `fecha`, `monto` (neto del día, puede ser
negativo), `pct` (el mismo número sobre el tamaño de cuenta), `pico_dia` y
`notas`. Índice único por (`cuenta_id`, `fecha`): un día tiene un solo
resultado, así que el alta es un **upsert** — volver a cargar el mismo día
lo corrige en vez de duplicarlo.

### RLS
Las 4 tablas tienen RLS activado con policies `auth.uid() = user_id` para
select/insert/update/delete — cada usuario ve y edita solo lo suyo.
`user_id` default `auth.uid()` en las 3 tablas.

## Resultados diarios y balance calculado (2026-08-18)

Desde el Paso 5b el balance **no es un dato guardado**:

```
balance = balance_semilla + resultados − retiros
```

Por qué: antes `balance_actual` se editaba a mano y además lo tocaba
`registrarRetiro()`. Dos escritores del mismo número es donde aparecen las
cuentas que no cierran. Ahora hay una sola fuente (los movimientos) y el
balance es una vista de eso. `estadoDeCuenta()` en `src/lib/resultados.ts`
lo calcula, y `cuentas/page.tsx` completa `balance_actual` y
`pico_semilla` antes de pasarle las cuentas a las pantallas.

**Consecuencia**: los retiros ya **no** descuentan del balance a mano.
Insertan en `payouts` y listo; el descuento sale del cálculo.

### La semilla
`balance_semilla` + `fecha_semilla` son el ancla: "esta cuenta tenía tanto
tal día". No hace falta cargar la historia completa de cada cuenta.

El cálculo suma todos los eventos en orden y después corre la curva entera
para que el valor en `fecha_semilla` dé justo `balance_semilla`. Por eso:

- días **posteriores** a la semilla empujan el balance de hoy;
- días **anteriores** reconstruyen la curva hacia atrás **sin tocar el
  presente** (ya están adentro de la semilla).

El balance editable de la tarjeta sigue existiendo, pero ahora **corre la
semilla a hoy** con el número que se escriba: es la salida rápida cuando
algo no cuadra.

### Máximo del día
`pico_dia` se carga como **delta** ("llegué a estar +800 arriba") y se mide
desde el balance con el que abrió el día. Aparece solo en cuentas
`trailing` no congeladas. Mueve **solo el piso**, nunca el balance. Si el
máximo cargado es menor al neto del día se toma el neto (no se puede haber
tocado +100 como máximo si cerraste +200).

### Robustez
`estadoDeCuenta()` acepta la cuenta **sin** los campos de semilla y cae al
`balance_actual` viejo. Se agregó después de que, con la migración a medio
correr, la pantalla se llenara de `NaN`: un cálculo que depende de una
columna nueva tiene que degradar, no romper.

## Drawdown (definido e implementado 2026-08-17)

Rediseño del drawdown. Implementado en `supabase/008_drawdown_trailing.sql`
(la 006 y la 007 ya estaban usadas), `src/lib/cuentas.ts`,
`modal-cuenta.tsx`, `tarjeta-cuenta.tsx` y `cuentas/actions.ts`.
Migración 008 **ya corrida** en Supabase (2026-08-17), junto con la 009
que le corrige el drawdown asumido de más.

El **máximo del día** quedó implementado con el Paso 5b (vive en la fila
diaria). Esta tanda está cerrada.

### El problema que resuelve
Hoy `pisoDrawdown()` calcula `tamano_cuenta − drawdown_maximo_monto`: un
piso **fijo, medido desde el balance base**. Eso sirve solo para un
drawdown estático. En un trailing el piso persigue al pico del balance, y
en Apex además **se congela**: en una cuenta de 50k con 2.000 de DD, al
tocar 52.100 de balance el piso queda clavado en 50.100 y no se mueve
nunca más. Sin forma de expresar eso, la única manera de que el número dé
parecido era cargar el drawdown en **0%** — que rompe el dato real y sigue
estando mal durante toda la fase en que el trailing todavía corre.

### Los tres modos
`modo_drawdown`: `estatico` | `eod` | `trailing`, y aplica a **fondeadas y
evaluaciones** por igual (reemplaza a `tipo_drawdown`, que era solo de
evaluaciones y solo tenía dos valores).

Ojo con un malentendido fácil: **EOD también trailea**. La diferencia con
`trailing` no es que uno se mueva y el otro no, es **qué pico manda**:

| Modo | Pico que sigue | ¿Sale de los resultados diarios? |
|---|---|---|
| `estatico` | ninguno, piso = tamaño − dd | no aplica |
| `eod` | el máximo de los **cierres diarios** | **sí, exacto** |
| `trailing` | el máximo del **flotante intradía** | solo si se carga el máximo del día |

### La fórmula
Una sola para los tres; el modo solo decide qué candidatos entran al pico:

```
piso = min(pico − dd, piso_congelado ?? ∞)
```

`piso_congelado` (nullable): el piso final donde el trailing se traba. En
Apex = `tamaño + 100` (50.100 en una cuenta de 50k). `null` = el trailing
no se congela nunca. En las **evaluaciones** de Apex no frena en +100 sino
al llegar al balance del profit target. Se carga **como balance**, no como % — es el número
que el usuario conoce y se explica solo ("hasta acá puede caer, pase lo
que pase").

### Formulario
Desplegable de tres opciones + los campos de siempre (`%` y `USD`
sincronizados entre sí, como ya funciona hoy) + un tercer campo cuyo
significado depende del modo:

- `estatico` → tercer campo = **el piso** (fijo, se puede cargar a mano:
  `piso = tamaño − monto`, `monto = tamaño − piso`).
- `eod` / `trailing` → tercer campo = **el piso congelado**. El piso
  actual NO se carga a mano: se muestra calculado, en gris, no editable.
  Dejar cargar el piso en un modo que trailea es el mismo parche que el
  0%, con mejor interfaz.

### Nada de `balance_pico` guardado en la cuenta
El pico es un **máximo corriente de la serie**, y si se guarda como
columna queda envenenado el día que se edite o borre una fila vieja: al
corregir historia el máximo puede *bajar*, y una columna que solo sabe
subir nunca se entera.

Modelo correcto:
- la cuenta guarda **la semilla** (balance y pico del día que se cargó la
  cuenta en la app, para cuentas con historia previa a Fondeados Club);
- la tabla diaria guarda **los deltas**;
- pico y piso se **calculan** recorriendo la serie, en `src/lib/cuentas.ts`.

Siempre consistente y gratis al editar historia. Si algún día pesa se
cachea el derivado — pero no se guarda una verdad paralela.

### Máximo del día (solo `trailing`)
Los resultados diarios mueven el **balance**; el máximo del día mueve
**solo el piso**. Son dos cosas separadas y no se tocan: un máximo mal
cargado no puede ensuciar el balance, el P&L ni el Funding Manager.

Campo `pico_dia` (nullable) en la fila diaria, **cargado como delta**
("+800", no "51.300" — es lo que uno recuerda). Reglas:

- **Aparece solo en cuentas `trailing` y solo mientras el trailing siga
  vivo.** Una vez congelada la cuenta el flotante deja de importar para
  siempre y el campo desaparece solo. En Apex el trailing corre apenas
  desde el balance base hasta el congelamiento (2.600 USD en una de 50k):
  es un campo que acompaña una fase corta, no una feature permanente.
- **Va también en los días perdedores**, y ese es el caso que más importa:
  abriste +600 de flotante, se dio vuelta y cerraste −300. El balance baja
  300 pero el piso ya subió 600 y no vuelve. Si solo apareciera en días
  verdes, justo el caso que más te acerca a quemarte quedaría sin registrar.
- **Vacío = "se usa el cierre"**, no cero. Tiene que leerse así en pantalla
  (placeholder) o el usuario va a sentir que debe llenarlo todos los días.
- **Validación suave**: si el máximo cargado es menor al cierre del día es
  un error de tipeo. Se toma el mayor de los dos y se avisa, sin bloquear
  el guardado.
- Solo cambia algo si **supera el pico histórico**; los demás días da igual
  cargarlo o no.

### Reglas de Apex (verificadas en su documentación, 2026-08-17)
Se chequearon contra el help center de Apex porque los números que
teníamos de memoria estaban mal (se asumía 2.500 de drawdown en la 50k).

- **Drawdown por tamaño** — 25k: $1.000 · 50k: $2.000 · 100k: $3.000 ·
  150k: $4.000. **No es un % fijo** (4% / 4% / 3% / 2,67%): el dato que
  manda es el monto en dólares, el % es solo una forma de mostrarlo.
- **Intraday trailing**: sigue el *Peak Balance*, que **incluye ganancias
  no realizadas** — si un trade abierto lleva la cuenta a un máximo nuevo,
  el umbral sube en el momento aunque no cierres la posición. Nunca baja.
  Es exactamente el agujero que tapa el **máximo del día**.
- **EOD**: recalcula una vez por día a las **16:59:59 ET** sobre el balance
  de cierre; en los días perdedores no se mueve.
- **Dónde frena el trailing**: en las Performance Accounts, en
  `Starting Balance + $100`. En las evaluaciones Rithmic/Wealthcharts, al
  llegar al balance del profit target. En Tradovate **no frena nunca**
  (ahí `piso_congelado` va en NULL).
- Tocar el umbral liquida las posiciones y cierra la cuenta.

Fuentes: `apextraderfunding.com/help-center/intraday-trailing-drawdown-accounts/intraday-trailing-drawdown-explained/`
y `.../eod-trailing-drawdown-accounts/eod-drawdown-explained/`.

### Limitación aceptada
En `trailing`, si el usuario no carga el máximo del día, el piso queda
**estimado y optimista** (muestra más colchón del real). No se arregla en
el MVP: para eso haría falta conexión al broker, que ya está fuera de
alcance. El campo manual tapa el caso.

### Consecuencias que ya se verificaron contra el código actual
- **Retiros** (regla de Apex confirmada por el usuario, 2026-08-17): un
  retiro **resta del balance**, pero el drawdown **no se mueve**: una vez
  alcanzados los 52.600 el piso queda fijo en 50.100 para siempre, retires
  o no. O sea que retirar **se come colchón uno a uno**.
  `registrarRetiro()` ya descuenta del balance, y como el pico es un
  máximo monótono el piso no baja: el modelo nuevo lo representa bien sin
  código extra. Hoy, con piso fijo en `tamaño − dd`, la app te deja creer
  que tenés aire que no tenés.
  Consecuencia aprovechable: `retiroMaximoSeguro()` calcula
  `balance − piso − umbral_precaucion`. **No se muestra en la tarjeta**
  (se probó el 2026-08-17 y no gustó: ensuciaba). La función queda como
  candidata a las alertas del Paso 7, no a un texto fijo en la tarjeta.
- `colchon()`, `salud()` y el semáforo cuelgan todos de `pisoDrawdown()`,
  así que se arreglan solos al cambiar esa función.
- Del mismo recorrido de la serie salen balance, pico, piso, colchón,
  semáforo y el gráfico **balance vs. piso** día a día — que con el modelo
  viejo era una línea recta inútil.

### Migración
`supabase/008_drawdown_trailing.sql`:
- agrega `modo_drawdown` (not null, default `trailing`), `piso_congelado`
  y `pico_semilla` (not null);
- backfillea `modo_drawdown` con el viejo `tipo_drawdown` y el resto en
  `trailing`;
- arregla las fondeadas cargadas con **0%** de drawdown (el parche que
  esto viene a sacar): les pone 5% del tamaño, `trailing` y
  `piso_congelado = tamaño + 100`. ⚠️ **Revisar a mano después de
  correrla**: si alguna de esas cuentas no era de Apex, hay que
  corregirle el drawdown desde la app;
- borra `tipo_drawdown`, para no dejar dos fuentes de verdad.

**Por qué el default es `trailing` y no `estatico`**: una cuenta trailing
marcada como estática muestra **más** colchón del real y te podés quemar
creyendo que estabas bien. Al revés, el error es pesimista y se nota
enseguida. Entre los dos, se elige el que no miente para el lado peligroso.

### Cómo quedó en el código
- `picoDeCuenta()` — máximo entre el pico guardado, el balance y el tamaño.
- `pisoDrawdown()` — la fórmula de arriba.
- `estaCongelado()` / `balanceDeCongelamiento()` — para los textos de la
  tarjeta ("se congela cuando el balance toque $52.600").
- `retiroMaximoSeguro()` — `balance − piso − umbral de precaución`.
- La tarjeta muestra en el frente el **colchón** con la etiqueta
  "Drawdown: $1.500 (3,0%)" — cuánta plata queda hasta tocar el piso, que
  es lo que se mira todos los días. El **drawdown máximo** (el número que
  no cambia) se mudó al dorso el 2026-08-17.
- `pisoDesdeMonto()` / `montoDesdePiso()` — el tercer campo del modo
  estático.
- El pico solo sube: se actualiza en `actualizarBalance()`, al guardar el
  modal (tomando el máximo con lo que ya había) y al marcar una evaluación
  como pasada. Nunca baja solo — para bajarlo hay que editar el campo
  **Pico histórico** a mano, que es la salida cuando cargaste un balance
  equivocado.
