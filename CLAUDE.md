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

**Research nuevo del 2026-08-20 en `docs/COMPETIDORES.md`**: PropTracker
(`proptracker.io`) y Trading Control (`tradingcontrol.app`), los dos
recorridos por dentro con cuenta propia. Ahí están la tabla comparativa,
**nuestras ventajas y desventajas** contra cada uno, los huecos concretos
(calendario mensual, retiros con estado pedido/cobrado, ROI por firm,
daily loss limit) y lo que implica para el Home y el precio. Lo de abajo
queda como antecedente.

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

## Estado actual (2026-08-23)

**La app está publicada y en uso** en https://fondeados-club.vercel.app
(Vercel Hobby, deploy automático en cada push a `main`). Registro
**cerrado**: se invita desde Supabase → Authentication → Users.

Repo: `github.com/chafa1240/fondeados-club`. Proyecto de Supabase:
`fondeados-club`, región West US (Oregon), Postgres estándar (NO
OrioleDB). **"Automatically expose new tables" está DESACTIVADO** y
"Enable automatic RLS" ACTIVADO, los dos a propósito: cada tabla nueva
nace bloqueada y hay que exponerla a mano (ver *Migraciones* más abajo —
es el error que más veces nos hizo perder tiempo).

Las cuatro secciones están hechas y funcionando:

- **Cuentas** — tarjetas con estado, balance, variación y anillo de % al
  payout; alta/edición con drawdown en tres modos; resultados diarios;
  retiros; curva de balance vs. piso.
- **Funding Manager** — invertido, cobrado, neto, ROI, retiro promedio y
  costo por fondeada; cuatro gráficos; lista de movimientos con filtros.
- **Home** — números del día, calendario mensual, avisos y cuentas en
  juego, con los modos Trading / Flujo de caja.
- **Journal** — una nota por día, calendario, estadísticas y carga de
  resultados desde el propio día.

Más el **tono claro y oscuro** (2026-08-22).

**Las migraciones `supabase/001` a `013` están corridas** en el proyecto
de Supabase. La **`014`** (costos fijos) se corrió el 2026-08-27. ⚠️ **La
`015` (long/short) está escrita y falta correrla**: hasta que se corra,
cargar un resultado va a fallar con "falta correr
supabase/015_long_short.sql".

El paso a paso completo, con qué entró en cada tramo y qué falta, está en
**`docs/ROADMAP.md`**.

**Decisión de negocio que sigue vigente**: todo lo que se construya ahora
es **gratis**. La división freemium se implementa después del MVP.

## Región de Vercel y latencia (2026-08-27)

`vercel.json` fija las funciones en **`pdx1` (Oregon)** a propósito: la base
de Supabase está en West US (Oregon) y la región por defecto de Vercel es
`iad1` (Washington DC). Sin eso, cada navegación cruzaba Estados Unidos
varias veces — `getUser()` del middleware, `getUser()` del layout y las 4
queries del Home — y con el cold start del plan Hobby el primer login
después de un rato tardaba tanto que **parecía colgado**: pasó el 2026-08-27
al dar de alta el primer usuario nuevo, y se perdió un buen rato buscando un
bug de auth que no existía.

Si algún día se muda el proyecto de Supabase de región, hay que mover esta
también; quedan al lado o vuelve la demora.

## Cómo trabajar en este proyecto

Escrito el 2026-08-23, cuando el trabajo pasó a hacerse desde **Claude
Code** corriendo en la máquina del usuario (antes se hacía desde Cowork,
con un puente que tenía sus propias limitaciones — ya no aplican).

**Verificar antes de dar algo por hecho.** `npx tsc --noEmit` para los
tipos y `npm run build` para el build real, que es el que corre Vercel.
Si el build pasa local, el deploy pasa.

**El dev server**: `npm run dev` en `localhost:3000`. Si el puerto está
tomado Next se va al 3001 **y sigue corriendo el proceso viejo con el
código viejo** — mirar siempre en qué puerto está la ventana que se está
probando.

**Tailwind se lee una sola vez, al arrancar.** Tocar
`tailwind.config.ts` obliga a reiniciar `npm run dev`; los cambios de
`globals.css` y de clases se toman en caliente. Perdimos un rato largo
con esto.

**Migraciones**: los archivos viven en `supabase/`, numerados. **Los
corre el usuario a mano** en el SQL Editor de Supabase — no hay CLI ni
migración automática. Cada archivo tiene que poder correrse dos veces sin
romper (`if not exists`, `drop policy if exists`).

⚠️ **Toda tabla nueva necesita su `grant` a `authenticated`**, además de
RLS y las políticas. Sin eso la tabla existe, las reglas están bien, y la
API igual devuelve `permission denied for table X`. Pasó con la 013. Ver
`supabase/exponer_tablas.sql`.

**Los cálculos van en `src/lib/`, nunca dentro de las pantallas** —
`cuentas.ts`, `resultados.ts`, `movimientos.ts`, `home.ts`, `journal.ts`,
`estadisticas.ts`, `tema.ts`. Se reusan entre secciones y más adelante en
la app móvil, y son lo que se puede leer para entender el negocio sin
leer JSX.

**Los gráficos**: colores validados, no elegidos a ojo (ver *Las
estadísticas del journal*). Los grises van por variables CSS para que
funcionen en los dos tonos.

**Antes de tocar cálculos**, leer las dos secciones largas de este
archivo: **Drawdown** y **Resultados diarios**. Son las invariantes que
es fácil romper sin darse cuenta.

## Próximo paso

**Paso 7b — reglas de la cuenta**: pérdida máxima diaria, días mínimos de
trading y regla de consistencia (la columna `regla_consistencia` existe
desde la migración 005 y no se usa). De todos los huecos detectados es el
único que **le puede costar plata a un usuario**: hoy la app modela una
sola forma de quemar una cuenta —tocar el piso del drawdown— y no ve la
otra, que es pasarse de la pérdida diaria.

Después vienen el 7c (retiros con estado pedido/cobrado y ROI por firm),
el 7d (import CSV y export), el 7e (los baratos: modo privacidad, datos
de ejemplo, objetivo mensual) y los **adjuntos del journal**, que
necesitan Supabase Storage.

La lista completa de huecos, priorizada y con esfuerzo estimado, está en
`docs/LO-QUE-NOS-FALTA.md`.

## Dónde está cada documento

- **`CLAUDE.md`** (este archivo) — qué es el proyecto, decisiones tomadas,
  modelo de datos y las dos secciones largas que hay que leer antes de
  tocar cálculos: **Drawdown** y **Resultados diarios**.
- **`docs/PENDIENTES.md`** — la lista viva de lo que falta, sin orden de
  prioridad. Es donde se anota lo nuevo apenas aparece; el detalle largo
  vive en el ROADMAP o en LO-QUE-NOS-FALTA y desde ahí se linkea.
- **`docs/ROADMAP.md`** — el plan paso a paso, qué está hecho y qué falta.
- **`docs/COMPETIDORES.md`** — PropTracker y Trading Control por dentro,
  tabla comparativa y nuestras ventajas y desventajas.
- **`docs/LO-QUE-NOS-FALTA.md`** — los huecos priorizados con esfuerzo
  estimado, y el análisis del **sync con Tradovate** (resumen: por API no
  se puede con cuentas de prop firm; por CSV sí).
- **`docs/referencias-diseno/`** — capturas de Lea, PipBack, Tradesyncer,
  PropTracker y Trading Control.

**Notas de código** (dónde vive cada cosa):

- `src/app/(app)/` — las cuatro páginas: `page.tsx` (Home),
  `cuentas/`, `funding-manager/`, `journal/`. Todas son **server
  components** que traen los datos y se los pasan a una "vista" cliente.
  Van con `export const dynamic = "force-dynamic"`: cada usuario ve solo
  lo suyo por RLS, así que no hay nada que cachear.
- `src/app/(app)/*/actions.ts` — las server actions. Las de resultados
  diarios (`cuentas/resultados-actions.ts`) las usan **dos pantallas**,
  Cuentas y Journal: el alta corre la semilla y deja un solo máximo por
  día, y tener dos caminos para escribir lo mismo es la forma más rápida
  de que empiecen a diferir.
- `src/lib/` — los cálculos, sin JSX. Ver *Cómo trabajar en este
  proyecto*.
- `src/components/` — una carpeta por sección, más `nav.tsx`,
  `seccion.tsx`, `selector-tema.tsx` y `ad-slot.tsx`. El calendario vive
  en `components/home/calendario.tsx` y lo usan el Home y el Journal.
- `supabase/` — las migraciones numeradas y `exponer_tablas.sql`.

**Historial**: el detalle de qué entró en cada tramo y en qué orden está
en `docs/ROADMAP.md`, no acá.

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
- **Cuando una decisión tiene más de un camino razonable, preguntar antes
  de codear**, con las opciones y el costo de cada una. Varias de las
  decisiones mejores del proyecto (que el Home abra en fondeadas, que el
  journal sea sección aparte, que no exista un "Todas" en trading) salieron
  de esa conversación y no del primer impulso.
- **Decir cuando algo está mal, aunque lo haya pedido el usuario.** El
  ejemplo canónico: sumar fondeadas y evaluaciones en un solo número de
  trading se pidió, se hizo, y al ver los datos reales quedó claro que el
  número no significaba nada. Mejor que aparezca en la charla que tres
  semanas después.
- **Escribir en el código el porqué, no el qué.** Los comentarios de este
  proyecto explican qué error evita cada decisión; por eso se puede volver
  meses después y no deshacerlas sin querer.

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

Cards de resumen: Invertido, Cobrado, Neto, **ROI %**, **Retiro promedio**,
**Tasa de aprobación** y **Costo por fondeada** (todo lo invertido dividido las fondeadas
conseguidas, contando las evaluaciones quemadas en el camino). Estos dos
últimos se leen de a pares: cuando el retiro promedio supera al costo por
fondeada, el negocio se sostiene solo.

**Tasa de aprobación** (2026-08-28, el "pass rate" del rubro — la app se
escribe en español, ver *Idioma*): cuántas evaluaciones pasás **de las que
terminan**. El denominador son las resueltas (pasadas + quemadas), no
todas: una evaluación en curso no es ni éxito ni fracaso, y meterla abajo
hunde el número justo cuando más evaluaciones abiertas tenés, que es
cuando mejor te está yendo. Las en curso se dicen en la ayuda para que se
entienda que el número puede moverse. Sigue el período del resumen por la
**fecha de inicio** de la evaluación, igual que el costo por fondeada —
son los dos números que se leen juntos. Pasar una evaluación deja
`estado = "passed"` y **no** cambia el `tipo`, por eso las pasadas se
siguen contando.

Gráficos, en un **carrusel de a dos con flechas** (2026-08-28) y no en una
grilla de cuatro: apilados ocupaban una pantalla entera y obligaban a
scrollear para llegar al historial, que es a lo que la mayoría entra. El
orden es el de la pregunta más frecuente — primero cuánto manejás, después
cuánto pusiste y recuperaste. El scroll y las flechas son el mismo
`Carrusel` que usan las tarjetas del journal (`src/components/carrusel.tsx`).
- Invertido vs. cobrado, acumulado en el tiempo
- Neto acumulado
- **Gastos por categoría** y **cuentas por firm** comparten una sola
  tarjeta: cada uno solo no llenaba el panel. Los gastos van en un solo
  tono, no un color por categoría — acá se comparan tamaños, y pintar cada
  una distinta sugiere que el color significa algo
- **Capital que manejás** (2026-08-28) — cuánta plata ajena manejás: la
  suma del **balance** de las fondeadas vivas cada día, el mismo número que
  muestra cada tarjeta en Cuentas. ⚠️ La primera versión sumaba
  `tamano_cuenta` (el tamaño del plan) y daba un total redondo y
  equivocado: una PA de 50k con la que perdiste 2.000 son 48.000
  manejados. Por eso el Funding Manager ahora también trae
  `resultados_diarios` y reconstruye la curva de cada cuenta con
  `estadoDeCuenta()`, igual que el Home — que los dos lugares digan lo
  mismo es la mitad del punto. Como consecuencia, la curva se mueve
  también cuando ganás, perdés o retirás, no solo cuando una cuenta nace o
  muere. Sube al
  pasar una evaluación y baja al quemar una fondeada. **Ningún competidor
  lo muestra**, y es el número que mejor cuenta el progreso de un
  fondeado: el P&L sube y baja con el mercado, pero pasar de manejar 50k a
  250k es una sola dirección. Arriba va **el número de hoy**, grande, con un
  "ver cuáles" que lo desarma cuenta por cuenta: la primera reacción al
  total fue "yo no manejo tanto", y sin poder abrirlo no hay forma de
  saber si el error es del cálculo o de una cuenta quemada que quedó
  marcada como activa. Un número que no se puede desarmar no se puede
  corregir. La línea va **de punto a punto**; se probó escalonada —que es
  lo fiel al dato— y se ve dura y un salto tapa la forma general de la
  serie, que es lo que uno viene a mirar. Los puntos siguen estando en los
  días exactos en que algo cambió. El área arranca siempre en 0, si no los
  escalones se ven el doble de grandes. **Solo fondeadas**: en una
  evaluación los dólares son simulados. Los puntos van en los días en que
  algo cambió, no uno por día.
  ⚠️ **Las cuentas viejas no tienen `fecha_cierre`** (se agregó en la 006 y
  solo se completa al cambiar el estado desde la app), así que en la
  primera versión todas las quemadas seguían sumando y el gráfico decía 24
  fondeadas donde había 8. Cuando la cuenta ya no está en juego y no tiene
  fecha de cierre se usa `updated_at`, y si tampoco, la de inicio: ver
  `finDeGestion()`. Es una aproximación a propósito — equivocarle unos días
  a un escalón viejo es mucho menos grave que decirle a alguien que maneja
  el triple del capital que maneja. Una cuenta **sin tamaño cargado suma
  0** y no rompe la serie: con `undefined` la suma daba `NaN` y el gráfico
  quedaba en blanco sin decir por qué. **No sigue los filtros**: mira todas las fondeadas, y así lo dice en pantalla.
  `curvaCapital()` en `src/lib/movimientos.ts`
- Cuentas por firm (pasadas / quemadas / en juego). **No sigue los
  filtros**: mira todas las cuentas, y así lo dice en pantalla

Tabla de "Movimientos": todo (gastos + retiros) en una lista, con filtros
de cuenta, período y tipo, paginada por tandas. Los movimientos
automáticos se marcan "desde la cuenta" y al editarlos se abre el campo de
la cuenta que los generó, no una fila de gasto.

**Costos fijos** (2026-08-27): lo que se paga sí o sí todos los meses,
opere o no — data feed, plataforma, indicadores.

**No tienen alta propia**: se cargan desde **+ Gasto**, marcando *"se
repite"*. Se probó al revés —dos botones, "+ Gasto" y "+ Costo fijo"— y
obliga a decidir qué clase de cosa estás cargando antes de saber qué
campos hay. Es el mismo gesto (anotar plata que sale) y que se repita es
un dato más de ese pago. El panel de arriba del historial es solo para
**verlos y editarlos**. Con el switch puesto se guarda la **plantilla** y
no una fila de `gastos`: si guardara las dos, el primer período quedaría
cargado dos veces. Destildarlo en un costo fijo existente borra la
plantilla y deja los períodos ya generados como gastos comunes.

Un gasto ya generado no vuelve a ofrecer "se repite" (crearía una segunda
plantilla del mismo costo): se edita como el gasto puntual que es.

Se carga una vez, con
periodicidad **semanal / mensual / anual**, fecha de inicio y fecha de fin
opcional, y la app **genera un gasto por cada período vencido**. La tarjeta
de arriba del historial muestra el total **por mes** (un anual se divide
por 12, un semanal se multiplica por 52/12 — no por 4, que dejaría el
total 8% corto).

Genera filas de verdad en `gastos` en vez de derivarse al vuelo como el
precio de la evaluación, y es a propósito: un costo fijo real no es
regular. Un mes no lo pagaste, otro te lo cobraron distinto. Con filas,
cada período es un gasto normal que se edita o se borra de a uno, y borrar
uno es definitivo (`ultimo_periodo` marca hasta dónde se generó, así que
el mes borrado no revive en la próxima carga). Los gastos generados se
marcan **"recurrente"** en la lista.

Pausar ≠ borrar: pausar deja de generar y **conserva** lo ya generado
(diste de baja el servicio); borrar la plantilla también conserva los
gastos —son plata que saliste, borrarla cambiaría el ROI de meses
cerrados— y solo corta lo que viene.

La generación corre al abrir el **Home** y el **Funding Manager**
(`generarCostosFijos()` en `src/lib/costos-fijos-server.ts`). No hay cron:
la app solo existe cuando alguien la abre. Corre en las dos pantallas
porque el flujo de caja del Home tiene que dar el mismo número que el
Funding Manager.

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

### HOME (definido e implementado 2026-08-22)
La pantalla que ves al entrar: **una fila de números grandes y el
calendario abajo**, que es como abren los dos competidores. No es una
lista de alertas — abrir la app con una pared de advertencias es la forma
más rápida de que dejes de mirarlas.

De arriba a abajo: switch Trading / Flujo de caja + filtro de cuenta →
cuatro números → calendario mensual con el total de cada semana → hasta
cuatro avisos → las cuentas en juego.

**Los cuatro números** son: *Hoy*, *Este mes*, el **acumulado del período**
y un cuarto que cambia según el modo.

- El **acumulado** es el único con ventana elegible (7 días, 30 días, 3, 6
  o 12 meses, o desde siempre), y **el selector es el título de la
  tarjeta**: la pregunta cambia según el momento —a veces es "¿cómo vengo
  esta semana?" y a veces "¿cuánto llevo desde que empecé?"— y no tenía
  sentido gastar una tarjeta más en eso. "Últimos 7 días" **incluye hoy**.
- El cuarto es **Racha** en trading y **ROI** en flujo de caja. La racha en
  flujo de caja no dice nada: ahí un día en rojo es el día que compraste
  una evaluación, y comprar no es perder. El ROI se calcula sobre los
  movimientos del período y no sobre los días, porque necesita separar lo
  invertido de lo cobrado y un día ya viene con los dos sumados.

**Los dos modos, que es la decisión de fondo:**

- `trading` — lo que ganaste o perdiste **operando** (`resultados_diarios`).
- `flujo` — el **flujo de caja**: lo que entró y salió de tu bolsillo,
  retiros cobrados netos del profit split menos gastos. El mismo neto del
  Funding Manager cuando no hay ningún filtro de movimiento puesto.

**El flujo de caja se puede filtrar** por tipo de movimiento, en cuatro
cajones: Evaluaciones, Fee de activación, Retiros y Otros gastos. Son
menos que las categorías de `movimientos.ts` a propósito — el Home
responde "¿en qué se me va y de dónde me viene?" y para eso alcanzan
cuatro; el detalle categoría por categoría sigue siendo del Funding
Manager, que es el dueño de los movimientos. **El reset va con las
evaluaciones**: pagarle a la firm para reiniciar una cuenta es el mismo
gasto que comprarla de nuevo. **Ningún chip marcado significa todos**, no
ninguno: es lo que espera cualquiera que despinte el último filtro, y
evita una pantalla en cero que no explica por qué está en cero.

**Nunca se suman.** Un día verde de trading y el retiro que después hacés
de esa misma ganancia son la misma plata contada dos veces. Por eso es un
switch y no dos series del mismo gráfico. Si alguna vez aparece un número
que mezcle los dos, está mal.

**En los dos modos entran SIEMPRE todas las cuentas**, quemadas y
archivadas incluidas. Cada modo tiene su razón y las dos apuntan al mismo
lado:

- En **trading**, una cuenta se quema porque perdiste, y esa pérdida es
  parte de cómo venís operando. Dejarla afuera sería quedarse solo con la
  parte linda del historial.
- En **flujo de caja**, la plata que pusiste en una cuenta que después se
  quemó salió de tu bolsillo igual. Un flujo de caja que la esconde no es
  un flujo de caja. Por eso ahí el acumulado "desde siempre" y el ROI dan
  exactamente los mismos números que el Funding Manager (verificado:
  $1.040 y +26,6%).

Lo único que se elige en trading es **el tipo de cuenta**: o Fondeadas o
Evaluaciones, **nunca las dos juntas**, y abre en Fondeadas. No hay
selector de cuenta individual — para mirar una sola está su tarjeta en la
sección Cuentas, con su curva.

**Por qué no existe un "Todas"** (decidido 2026-08-22, mirando los datos
reales): un dólar de fondeada y uno de evaluación no son la misma unidad.
En una fondeada el balance decide cuánto podés retirar, así que un mal día
te saca plata real del bolsillo futuro. En una evaluación son **dólares
simulados**: lo que perdés de verdad al quemarla es su precio, y ese
número ya lo cuenta el flujo de caja. Sumarlos daba un total que no
significa nada —y contaba el mismo fracaso dos veces—, y encima el día que
una evaluación se quema descarga todo el drawdown de una: en los datos
reales, un −$2.000 que se comía visualmente el resto del mes. Con el total
mezclado el Home abría en −$3.447 cuando la operativa real en fondeadas
era −$901.

Dentro de cada tipo **entran todas las cuentas**, quemadas y archivadas
incluidas: una cuenta se quema porque perdiste, y esa pérdida es parte de
cómo venís operando. En evaluaciones la pantalla agrega una línea que
avisa que son dólares simulados.

**"Hoy" lo decide el navegador**, no el servidor: Vercel corre en UTC y
entre las 21 y las 24 de Buenos Aires eso ya es mañana. Los cálculos de
`src/lib/home.ts` reciben `hoy` por parámetro y no leen `Date` adentro; la
pantalla lo completa al montar, para que el HTML del servidor y el del
cliente coincidan. Lo mismo con la grilla del calendario: todas las
cuentas de fechas van por `Date.UTC`, porque en UTC−3 el día 1 se dibujaría
en la casilla del 31 del mes anterior.

**Un día vacío y un día en cero no son lo mismo**: el que no operaste queda
apagado, el que cerraste plano se pinta como día trabajado con su $0.

Archivos: `src/lib/home.ts`, `src/components/home/home-vista.tsx`,
`src/components/home/calendario.tsx`, `src/app/(app)/page.tsx`.

## Tono claro y oscuro (definido 2026-08-22)

La app abre con **el tono que tenga el sistema del usuario** y hay un
botón en el header que cicla Sistema → Claro → Oscuro. La elección se
guarda en `localStorage` y se aplica escribiendo `data-tema` en el
`<html>`.

**No se usan las variantes `dark:` de Tailwind.** La app tiene unas 600
clases de color repartidas en 25 archivos: cada una habría necesitado su
par `dark:`, y cada componente nuevo arrastraría el doble de clases para
siempre. En vez de eso se **redefinió la paleta** en
`tailwind.config.ts`: `neutral` y los tonos 300/400 de los colores apuntan
a variables CSS. `bg-neutral-900` se sigue escribiendo igual en todos
lados y es la variable la que decide si eso es casi negro o blanco. **Los
componentes no se tocaron.**

Cuatro cosas que hay que respetar al agregar pantallas:

1. **Escribir las clases de siempre** (`bg-neutral-900`, `text-neutral-400`).
   Ya son sensibles al tono. Un color nuevo fuera de la paleta —un hex
   suelto, un `bg-white`— queda fijo en los dos tonos y rompe uno.
2. **El `<alpha-value>` de la config es lo que mantiene vivos los
   modificadores de opacidad**: sin él `bg-emerald-500/10` dejaría de
   funcionar.
3. **`data-tema` solo vale `claro` u `oscuro`.** "Sistema" lo resuelve
   `SCRIPT_TEMA` (`src/lib/tema.ts`) antes de pintar; si lo resolviera el
   CSS habría que repetir la paleta entera dentro de un `@media`, y una
   paleta duplicada es una paleta que tarde o temprano queda a medio
   actualizar.
4. **El claro no es el oscuro aclarado, es la escala dada vuelta**: el
   fondo pasa a casi blanco y los paneles a blanco puro, así se siguen
   despegando del fondo. Los tonos 300/400 de los colores se oscurecen
   (un `emerald-400` se lee bien sobre negro y se pierde sobre blanco);
   los 500/600, que son fondos de botón y bordes con opacidad, quedan
   iguales en los dos.

Los grises de los gráficos también son variables (`--grafico-grilla`,
`--grafico-eje`, `--grafico-texto`, `--grafico-barra`): iban como hex
fijos en atributos del SVG y en claro quedaban negros sobre blanco.

El script del `layout` pinta el tono **antes del primer frame**. Sin eso
la app arranca en oscuro y pega un flash blanco al hidratarse, que es
justo lo que hace que un modo claro se sienta roto. Por eso el `<html>`
lleva `suppressHydrationWarning`: el atributo lo escribe el script antes
de que React mire, y es a propósito.

⚠️ **Tocar `tailwind.config.ts` obliga a reiniciar `npm run dev`**:
Tailwind lee la config una sola vez, al arrancar. Los cambios de
`globals.css` sí se toman en caliente.

Archivos: `tailwind.config.ts`, `src/app/globals.css`, `src/lib/tema.ts`,
`src/components/selector-tema.tsx`, `src/app/layout.tsx`.

## Journal (definido e implementado 2026-08-23)

Una **nota por día**, en su propia sección del menú. Sale de mirar el
journaling de Tradesyncer en vivo (2026-08-23) con el usuario.

**Qué copiamos y qué no.** Casi todo lo lindo de ellos —win rate, profit
factor, curva intradía, tabla de operaciones— sale del **sync de trades**
con el broker. Nosotros tenemos un número por día tipeado a mano, así que
copiamos **la forma, no el contenido**. Y la forma que importa no son las
métricas: es **el estado escrito / sin escribir**. Ver de un vistazo qué
días escribiste es lo que hace que vuelvas a escribir; eso es gratis y es
el corazón de la pantalla.

**La puerta desde Cuentas.** El modal de "Resultados del día" tiene abajo
a la izquierda un botón **"Escribir el día"** que lleva a
`/journal?dia=<fecha>` con ese día ya abierto. Es el momento exacto en que
uno se acuerda de lo que pasó: acabás de cargar el número, o lo estás
cargando.

**Y al guardar aparece la invitación**: un panel verde que dice "Guardado.
¿Escribís qué pasó ese día, mientras te acordás?" con el botón y un "Ahora
no". No es un cartel de éxito —que el día se guardó ya se ve, la entrada
aparece en la lista de arriba—: lo que agrega es ofrecerte escribir **en
el único momento en que te acordás de todo**, que es el segundo después de
cargar el número. Si no, la nota se escribe tres días más tarde o no se
escribe nunca. Mientras la invitación está, el botón del pie se esconde:
dos botones iguales a la vez no dan el doble de ganas de escribir, dan la
mitad.

**El tipo viaja con el día**: `?dia=<fecha>&tipo=<fondeada|challenge>`. Si
venís de una fondeada, el journal abre filtrado en fondeadas; si venís de
una evaluación, en evaluaciones. Llegar a una pantalla filtrada por otra
cosa te hace dudar de si el número que estás viendo es el de tu cuenta.

**Y desde el journal se puede cargar el resultado del día**, eligiendo las
cuentas ahí mismo: el modal tiene arriba un alta con **chips de cuenta
(varias a la vez)**, monto y —solo si alguna de las elegidas tiene
drawdown que trailea— el máximo del día. Cada entrada del día tiene su
**Corregir** y su **Borrar**: si se puede cargar desde acá, se tiene que
poder arreglar y deshacer desde acá.

El **Corregir** del journal toca **el monto y el lado, nada más**
(`corregirEntrada()` en `resultados-actions.ts`, agregado el 2026-08-27
para poder marcar long/short sin ir hasta Cuentas). No pasa por
`guardarResultado()` a propósito: el journal no conoce el tamaño de la
cuenta ni el máximo del día, así que mandar el formulario grande con esos
campos vacíos los habría puesto en null — borrar el máximo del día al
corregir un monto es justo el error que **infla el colchón del drawdown**.
El `pct` lo recalcula la action leyendo el tamaño de la cuenta, para que
monto y % no digan cosas distintas de la misma entrada.

**Por qué varias cuentas y no un desplegable simple**: replicar es la
forma normal de operar con prop firms —la misma orden se copia a varias
cuentas y el día queda con el mismo número en todas—, y cargarlo cuenta
por cuenta es justo donde uno se saltea una o tipea otro monto. La action
`guardarEnVariasCuentas()` recorre las elegidas llamando a
`guardarResultado()` una vez por cada una, en vez de escribir su propio
insert: el alta corre la semilla y deja un solo máximo por día, y duplicar
esa lógica es la forma más rápida de que las dos empiecen a diferir. **Si
una falla, las otras igual se guardan** y el mensaje dice cuántas
entraron: cancelar las cinco porque una falló te deja sin saber cuáles
quedaron. Después de guardar se limpia el monto pero **no** las cuentas
elegidas: el segundo trade del día va casi siempre en las mismas.
Usa **la misma action** que la sección Cuentas (`guardarResultado`), no
una copia: el alta toca la semilla, el máximo del día y el balance
calculado, y dos caminos distintos para escribir lo mismo terminan
divergiendo. El desplegable ofrece **solo las cuentas en juego** — con el
historial completo traía 128, casi todas quemadas, y elegir ahí es peor
que no tener el atajo; para cargarle un día a una cuenta cerrada está su
tarjeta en Cuentas. Por eso `guardarResultado` y `eliminarResultado`
revalidan también `/journal` y `/`.

**Está siempre, también en un día sin entradas.** Es un botón y no un
link porque antes de irse tiene que avisar si dejás un resultado a medio
escribir: irte a escribir la nota y volver para descubrir que el número se
perdió es la peor forma de aprender cómo funciona la pantalla. Al cerrar
el modal del journal, el `?dia=` se saca de la URL con `router.replace`:
si quedara, recargar te reabriría un día que ya cerraste.

**Sección aparte, con la puerta en el Home.** El Home es para mirar y se
abre diez veces por día; el journal es para sentarse a escribir, una vez
al cierre. Son dos gestos con ritmos distintos y juntarlos empeora los
dos: el Home se alarga y el journal queda apretado. Tradesyncer hace lo
mismo. Lo que sí va en el Home es **el gesto de entrada**: clic en un día
del calendario abre ese día del journal (el modal se comparte).

**Esto NO contradice "journal trade por trade: no, decidido"**
(`docs/LO-QUE-NOS-FALTA.md`). Aquello es otro producto y necesita cargar
operación por operación. Un journal por día encaja con los datos que ya
existen.

**Por qué una tabla nueva** (`journal_dias`, migración 013) y no la
columna `notas` de `resultados_diarios`: desde la 012 un día puede tener
varias entradas, así que esa columna es la nota *de la entrada*; guardar
ahí la reflexión de la jornada obligaría a elegir en cuál fila ponerla y a
moverla si esa fila se borra. Y el journal tiene que poder existir **sin
ningún resultado cargado** — el día que no operaste y querés dejar escrito
por qué, es de los que más vale la pena escribir.

Detalles que parecen menores y no lo son:

- **Una nota vacía borra la fila**, no guarda un texto en blanco. Si no,
  abrir el modal una vez dejaría el día marcado como escrito y el
  indicador dejaría de decir la verdad.
- **Las flechas ‹ › pasan de día sin cerrar el modal**, y avisan si hay
  algo sin guardar. Perder un párrafo por apretar una flecha es la forma
  más rápida de que alguien no vuelva a escribir nunca más.
- Las flechas navegan **la lista completa**, no la filtrada: si estás en
  "Sin escribir" y guardás, el día no tiene que desaparecerte de abajo de
  las flechas.

### Las estadísticas del journal (2026-08-23)

Todas se calculan **sobre días, nunca sobre operaciones**. Profit factor y
win rate por trade —que es lo que llena el tablero de Tradesyncer— salen
de operaciones importadas del broker; sin eso, mostrarlos sería inventar.
Lo que sí se puede decir con un número por día es más de lo que parece:

- **Días ganadores**, **día promedio** (la expectativa por jornada),
  **mejor día** y **peor día**.
- **P&L, win rate y profit factor** (2026-08-28), calculados **por
  operación**. Durante todo el MVP no existieron a propósito: sin el
  sentido de cada trade lo único que había era un número por jornada, y
  llamarle "win rate por trade" habría sido inventar. Con las operaciones
  cargadas de a una el número se puede dar sin mentir, con la salvedad que
  la pantalla dice una sola vez: **una orden replicada en cinco cuentas son
  cinco entradas**. El profit factor es `ganado / perdido` en bruto y da
  `—` cuando todavía no hay ninguna perdedora (dividir por cero da
  infinito, que no es una respuesta); el color se corta en 1 y no en 0,
  porque debajo de 1 estás perdiendo.
- **Long vs. short** (2026-08-27): cuánto dejó cada lado, con la cantidad
  de operaciones, el % en verde y el promedio por operación, más una barra
  que reparte el peso de los dos. Es lo que muestra Tradesyncer y es la
  primera estadística que dice algo sobre **cómo** operás y no solo cuánto.
  Cuenta **entradas, no jornadas**: el mismo trade replicado en cinco
  cuentas suma cinco veces, que es lo correcto para la plata. Las entradas
  sin lado cargado se cuentan aparte y no ensucian la comparación.
- **Por día de la semana**: barras con el total de cada día, que ningún
  competidor tiene y suele destapar patrones.

**Las tarjetas van en una sola fila que se corre al costado**
(`FilaTarjetas` en `components/journal/estadisticas.tsx`, 2026-08-28).
Estuvieron un rato partidas en dos grillas —"por operación" y "por día"—
y esa división era del cálculo, no de la pregunta: uno mira los números
seguidos. Se arrastra con el dedo **y** tiene flechas, porque en
escritorio una fila que se corre sin ningún control visible parece
cortada, no desplazable; las flechas se apagan en cada punta.

**Los colores del gráfico se validaron, no se eligieron a ojo.** El
verde/rosa que usa el resto de la app separa ΔE 4.6 para daltonismo
deutan, muy abajo del piso de 8. Los del gráfico son
`--grafico-positivo` / `--grafico-negativo`: en oscuro separan 13.8 y en
claro pasan las seis pruebas. Además el signo no depende del color — la
barra está arriba o abajo del cero y tiene el número escrito al lado.

**Lo que se sacó** (2026-08-27, al entrar long/short): la **racha de
escritura** y el **"¿escribir te sirve?"**. Los dos hablaban del hábito de
escribir y no de cómo operás — uno premiaba la constancia, el otro
comparaba el día después de escribir contra el día después de no escribir,
que además era correlación y no causa. Con el sentido cargado se puede
responder algo que sí cambia lo que hacés mañana. Si alguna vez se quieren
de vuelta, están en el historial de git (`estadisticas.ts`,
`rachaDeEscritura()` y `efectoDeEscribir()`).

**Lo que se descartó a propósito**: un "score" compuesto tipo el de
Tradesyncer (mezcla métricas con una fórmula que no explican y saber que
tenés 50/100 no te dice qué hacer mañana), y repetir la misma serie de
P&L en tres gráficos distintos, que es lo que hacen ellos.

**Los adjuntos (capturas de los gráficos) quedaron para un paso
posterior**: necesitan Supabase Storage —bucket, políticas, límites de
tamaño y cuánto ocupa cada usuario— y es la única parte que puede costar
plata si crece. Tradesyncer los tiene y son la mitad de la gracia, así que
es el próximo paso natural del journal.

**El journal se separa en Fondeadas / Evaluaciones**, igual que el Home y
por la misma razón: un dólar de fondeada y uno de evaluación no son la
misma unidad. Ojo con qué separa ese filtro y qué no: **cambia los días
que ves y el número de cada día, pero no la nota**. La nota es del día, y
la jornada es una sola aunque hayas operado los dos tipos en paralelo —
escribís una vez y la ves con cualquiera de los dos filtros puestos.

**El calendario del mes también está en el journal**, arriba de la lista,
con un **punto verde** en los días que tienen nota. Es el mismo componente
que el del Home (`src/components/home/calendario.tsx`), con dos props
nuevas: `abrirVacios` —en el journal se puede abrir cualquier día, también
uno que no operaste— y `resumen`, para cambiar el texto de la derecha.

⚠️ **Toda tabla nueva necesita su `grant` a `authenticated`.** Este
proyecto tiene desactivado "Automatically expose new tables", así que una
tabla creada con RLS y políticas correctas **igual devuelve "permission
denied for table X"** hasta que se le da el permiso (ver
`supabase/exponer_tablas.sql`). Pasó con la 013: la primera versión creaba
la tabla sin el grant y la app decía "falta correr la migración" cuando en
realidad ya se había corrido. Por eso el cartel de error ahora **muestra
el mensaje crudo de Postgres**: distinguir "no existe la tabla" de
"permission denied" a ojo cuesta más que mostrarlo.

Archivos: `supabase/013_journal.sql`, `src/lib/journal.ts`,
`src/app/(app)/journal/`, `src/components/journal/`.

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

### costos_fijos (migración 014)
La **plantilla** de un gasto que se repite, no el gasto. Campos: `nombre`,
`cuenta_id` (nullable, igual que en `gastos`), `categoria`
(software_suscripcion | otro), `monto`, `periodicidad` (semanal | mensual
| anual), `fecha_inicio`, `fecha_fin` (null = vigente), `activo` (pausado
sin borrar) y `ultimo_periodo`.

`ultimo_periodo` es el que hace que la generación sea idempotente **y**
que borrar un gasto generado sea definitivo: se genera *después* de esa
fecha, nunca desde `fecha_inicio`. El índice único parcial
`(costo_fijo_id, periodo)` en `gastos` es la red por si dos pestañas
generan a la vez.

`gastos` suma dos columnas: `costo_fijo_id` (qué plantilla lo creó,
`on delete set null`) y `periodo` (el vencimiento teórico; `fecha` arranca
igual pero se puede corregir a mano sin que se regenere).

Los períodos se calculan **anclados a `fecha_inicio`**, no sumando de a
uno: un costo que arranca un 31 daría 28 para siempre desde el primer
febrero si se fuera acumulando. Ver `periodoN()` en
`src/lib/costos-fijos.ts`.

### payouts
Una fila por cobro. Campos: `cuenta_id` (obligatorio, un payout siempre
es de una cuenta), `monto`, `fecha`, `notas`.

### resultados_diarios (Paso 5b, migración 011 + 012 + 015)
Una fila por **entrada**: `fecha`, `monto`, `pct` (el mismo número sobre el
tamaño de cuenta), `pico_dia`, `sentido` y `notas`.

`sentido` (`long` | `short`, migración 015) es de la **entrada**, no del
día: un día con una compra y una venta no tiene un solo lado. Es
**nullable a propósito** — todo lo cargado antes no lo tiene, y una
entrada puede ser el neto de una jornada mixta. Las estadísticas cuentan
solo las marcadas y dicen cuántas quedaron afuera; inventarle un lado a un
número sería peor que no mostrarlo. Al replicar en varias cuentas el lado
viaja a todas: una orden replicada es long en las cinco o short en las
cinco.

⚠️ **Una fila NO es un día.** La 011 puso un índice único en
(`cuenta_id`, `fecha`) con el alta como upsert, y eso rompía el caso más
común: dos trades en la misma jornada, donde el segundo pisaba al primero.
La **012 (2026-08-20)** saca el índice único y deja **varias entradas por
día**.

**El día sigue siendo la unidad de cálculo**: balance, pico, rachas y días
ganadores salen de la suma de las entradas de cada día. Todo eso pasa por
`agruparPorDia()` en `src/lib/resultados.ts` — sumar filas sueltas como si
fueran días infla el conteo y rompe las rachas.

`pico_dia` es un dato **del día**, no de la entrada (se mide desde la
apertura de la jornada). Lo lleva **una sola** entrada del día y el resto
va en NULL: de eso se encarga `dejarUnSoloMaximo()` en
`resultados-actions.ts`. Si quedara repetido, al corregirlo hacia abajo el
cálculo seguiría tomando el mayor y el piso del drawdown mostraría más
colchón del real.

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
desde el balance con el que abrió el día — **no** desde cada operación, así
que es uno solo por jornada aunque el día tenga varias entradas. Aparece solo en cuentas
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
