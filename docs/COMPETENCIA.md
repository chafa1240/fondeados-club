# Competencia — research del 2026-08-20

Recorrido hecho entrando con la cuenta del usuario a **PropTracker**
(`app.proptracker.io`) y **Trading Control** (`tradingcontrol.app`).
Capturas en `docs/referencias-diseno/` (`proptracker *.jpg`,
`tradingcontrol *.jpg`).

Reemplaza al research viejo del 2026-08-03 (pipback / tradesyncer /
tradelio), que queda en `CLAUDE.md` como antecedente.

---

## 1. PropTracker (proptracker.io) — el competidor directo

**Qué es**: "Prop Firm Dashboard. Track Rules, Drawdowns & Payouts."
Producto en inglés, LLC, con sitio de marketing armado. Dicen 3.000+
cuentas trackeadas y 9+ firms soportadas.

### Secciones
| Sección | Qué hace | ¿Lo tenemos? |
|---|---|---|
| Dashboard | Portfolio value, Net PNL diario, Net payout, **Pending payouts**, performance mensual, ayer/hoy, profit factor / win rate / expectancy, P&L por sesión (NY / Londres / Asia), **rachas de días** | Parcial — nos falta el Home entero |
| Connections | Sync automático con la plataforma de trading | No, y **fuera de alcance** |
| Accounts | Cuentas **agrupadas por firm**, plegables | Nosotros listamos plano + filtro por firm |
| Calendar | Calendario mensual con P&L por día, **total por semana** y total del mes, con filtro por cuenta | **No** — tenemos los datos, no la vista |
| Trade Lab | Journal trade por trade con replay en gráfico de 1 minuto, rating 1–5, tags de estrategia/error/emoción | No, y **fuera del MVP a propósito** |
| Coach Belfort | Informe diario con IA, tono "brutalmente honesto": veredicto de la sesión, patrones detectados (FOMO, revenge trading), reglas no negociables | No |
| Payout Tracker | **Nuestro Funding Manager, casi igual** | Sí, y bastante parejo |
| Reports | 6 informes: Capital Efficiency, Performance Overview, Risk Analysis, Trading Efficiency, **Accountability**, Growth Tracker | Parcial |
| Intelligence | Gráfico de TradingView embebido + calendario económico + watchlist de eventos macro | No, y no aporta |

### Payout Tracker vs. nuestro Funding Manager
Lo miré con la cuenta cargada. Las cards de arriba son **las mismas cuatro
que tenemos**: Total Invested, Total Received, Net Profit, ROI. Debajo,
cinco pestañas:

- **All Payouts** — tabla con `ACCOUNT · FIRM · AMOUNT · STATUS · DATE
  REQUESTED · DATE RECEIVED`
- **Expenses** — `ACCOUNT · FIRM · TYPE · AMOUNT · DATE PAID · NOTES`
- **By Firm** — `INVESTED · RECEIVED · NET PROFIT · ROI %` por firm
- **By Account** — lo mismo por cuenta, con semáforo Profitable/no
- **Timeline** — resumen por mes: recibido, invertido, neto

Tres cosas que ellos tienen y nosotros no:

1. **Estado del retiro** (`Requested` / `Received`) con **dos fechas**: la
   de pedido y la de cobro. Y "Pending payouts" como número propio en el
   dashboard. Nosotros asumimos que un retiro ya entró.
2. **ROI por firm y por cuenta**, no solo global. Nuestro gráfico "cuentas
   por firm" solo cuenta pasadas/quemadas — no dice cuál te dio plata.
3. **Break-Even Point**: "el primer mes en que te volviste rentable".
   Barato de calcular con lo que ya tenemos y se lee de una.

Nosotros tenemos dos cosas que ellos no: **costo por fondeada** y **retiro
promedio** leídos de a pares, y los **filtros separados** resumen/historial.

### Rule Tracking — lo más fuerte que tienen
Es su bandera y es **exactamente la decisión que descartamos** (el catálogo
de reglas por firm). Cargan automáticamente las reglas de la firm y el
tamaño de cuenta, y trackean en vivo:

- Daily Loss Limit — **no lo modelamos** (solo tenemos drawdown máximo)
- Max Trailing Drawdown, con % usado
- Profit Target, con % de avance
- **Min Trading Days** (3 de 5 días) — no lo tenemos
- **Consistency Score** (22,5%, máx. permitido 30%) — no lo tenemos
- Realized Peak Equity, tipo de drawdown, scaling permitido, news trading
  permitido, máximo de contratos

El informe **Accountability** cuelga de esto: % de cumplimiento, días con
regla rota, días de trading totales, estado de la evaluación.

### Precios
| Plan | Precio | Límite |
|---|---|---|
| Free | $0 | **1 cuenta**, 30 días de historial |
| Pro | **$36/mes** | 5 cuentas, 6 meses de historial, Coach Belfort |
| Elite | **$59/mes** | 20 cuentas, 2 años |
| Wizard | **$149/mes** | ilimitadas |

Trial de 3 días, 15% de descuento anual.

**El dato más importante de todo el research**: el plan gratis se limita
por **cantidad de cuentas**, y con más de una la app **te desactiva el
sync** y te tapa la pantalla con un cartel rojo. Con la cuenta del usuario
(1 cuenta cargada, límite 1) los modales de "Add Account", "Add Payout" y
"Add Connection" no abrían.

Un trader de Apex tiene 5, 10, 20 PAs. Con ellos eso son $59/mes.

---

## 2. Trading Control (tradingcontrol.app) — journal primero, prop después

**Qué es**: diario de trading **en español**, con analítica de disciplina.
El tracker de prop firms es un agregado, no el corazón.

### Secciones
Dashboard · Operar · Historial · Análisis 🔒 · PropFirm 🔒 · Playbook

Se puede ver el dashboard con **datos de ejemplo** sin cargar nada — buena
idea de onboarding, la robaría.

### Lo que sí se ve (gratis)
- **Dashboard**: P&L total, win rate, profit factor, expectativa, curva de
  equity, **calendario mensual** con P&L por día y contadores de días
  ganadores / perdedores, racha.
- **Resumen por disciplina** — lo más interesante de los dos productos.
  Parte el P&L por **comportamiento**, no por instrumento:

  | Etiqueta | P&L | Win rate |
  |---|---|---|
  | Seguí el plan | +2.098 € (28 trades) | 71% |
  | No seguí el plan | −283 € (3) | 0% |
  | Entrada impulsiva | −280 € (3) | 0% |
  | Moví el stop | −165 € (2) | 0% |
  | Sobreoperé | −208 € (2) | 0% |

- **Reglas de trading** con alerta: máx. trades por día, pérdida máxima
  diaria, máx. pérdidas seguidas, calidad mínima del setup, sin entradas
  impulsivas, seguir siempre el plan, no mover el stop, sin sobreoperar.
- **Revisión de esta semana**: resultado, ejecución, foco próximo, y un
  botón para escribir la reflexión. **Notas del día** aparte.
- **Objetivo mensual** de P&L, que se fija a mano.
- **Modo privacidad**: un botón "Mostrar importes" que borronea toda la
  plata en pantalla.
- Importar CSV (Tradovate, NinjaTrader, TopstepTrader) y **backup en JSON**.

### Lo que está detrás del pago
- **PropFirm Tracker**: "drawdown EOD trailing y balance mínimo",
  "consistencia, journey bar y curva de equity", compatible con Lucid,
  Topstep, FTMO, Apex.
- **Análisis**: modo mentor con IA, distribución de P&L, comparativa de
  meses, rendimiento por instrumento y por sesión.
- **Playbook**: documentar setups y medir su rendimiento.
- **Heatmap** de P&L estilo GitHub.

### Precios
Free 0 € (100 trades) · **Pro 11,99 €/mes** · Prop/Team a medida (en
desarrollo).

---

## 3. Qué significa para Fondeados Club

### Lo que confirma que vamos bien
- El **Payout Tracker de PropTracker es nuestro Funding Manager**, con las
  mismas cuatro cards. No inventamos una sección que nadie quiere.
- Los dos modelan **EOD y trailing** como cosas distintas: nuestro Paso 4c
  no fue sobre-ingeniería, es la mesa de entrada del rubro.
- Los dos tienen **calendario mensual con P&L por día**. Nosotros tenemos
  la tabla `resultados_diarios` cargada y **ninguna vista de calendario**.
  Es el hueco más visible y el más barato de tapar.
- Ninguno de los dos calcula **costo por fondeada**. Es nuestro.

### Los tres huecos reales
1. **Calendario mensual**. Los dos lo tienen, nosotros tenemos los datos.
   Debería ser el próximo paso o entrar dentro del Home.
2. **Retiros con estado** (pedido / cobrado) y dos fechas. Hoy asumimos
   que el retiro ya entró; en Apex hay días entre pedirlo y cobrarlo, y
   ese dinero **ya salió del balance pero todavía no está en el bolsillo**.
   Es una migración chica (`estado` + `fecha_pedido` en `payouts`).
3. **ROI por firm y por cuenta**. Cambiar el gráfico de "cuentas por firm"
   por una tabla `invertido / cobrado / neto / ROI` es media hora y
   responde una pregunta que hoy no podemos contestar.

### La decisión que hay que volver a mirar: el catálogo de reglas
En `CLAUDE.md` descartamos el catálogo de reglas por firm por
mantenimiento. PropTracker lo hizo y **es toda su propuesta de valor**:
9 firms, 18.000 reglas monitoreadas.

No propongo dar marcha atrás — el argumento del mantenimiento sigue en
pie, y con 53 firms escritas a mano no hay catálogo que aguante. Pero sí
vale separar dos cosas que mezclamos:

- **El catálogo automático** (que la app sepa las reglas de Apex 50k sin
  que las cargues): caro, frágil, sigue descartado.
- **Los campos de regla en sí** (daily loss limit, días mínimos de
  trading, regla de consistencia): son cuatro columnas que el usuario
  carga a mano una vez, como ya carga el drawdown. `regla_consistencia`
  **ya existe** en la tabla desde la migración 005 y no la usamos para
  nada. Con eso y los resultados diarios sale el "Accountability" de
  PropTracker sin catálogo ninguno.

El **daily loss limit** es el que más pesa: es la otra forma de quemar una
cuenta, y hoy la app no la ve.

### Para el Paso 7 (Home)
Los dos dashboards arrancan igual: **una fila de números grandes arriba**
(P&L de hoy, del mes, racha) y **el calendario o la curva abajo**. Ninguno
de los dos es una lista de alertas, que era una de las opciones que
teníamos abiertas.

Lo que copiaría:
- Ayer / Hoy como dos cards separadas — la pregunta de todas las mañanas.
- La **racha** (ya tenemos `rachaActual()`) y **días ganadores vs.
  perdedores** (ya tenemos `resumenDias()`), que es justo lo que quedó
  escrito sin pantalla.
- El **saludo con resumen en una frase** de Trading Control ("Este mes vas
  765,9 € · racha de 2 días en verde"). Es una línea de texto y hace que
  la pantalla se sienta viva.
- El **modo privacidad** (borronear importes). Barato y para una app que
  se abre en un celular en cualquier lado, se agradece.

Lo que **no** copiaría: el gráfico de TradingView y el calendario
económico de PropTracker (Intelligence). Es relleno; esos datos ya los
tiene el trader en su plataforma.

### Sobre el precio
El piso del rubro está en **11,99 €/mes** (Trading Control) y el techo en
**$36–59/mes** (PropTracker, por cantidad de cuentas). Nuestra decisión de
"barato" está bien calibrada, y hay un hueco claro: **no limitar por
cantidad de cuentas en el plan gratis**. Es el límite que más duele al
trader de futuros — que por definición tiene muchas PAs chicas — y es
gratis para nosotros no ponerlo.

---

## Fuentes
Recorrido con la sesión del usuario el 2026-08-20:
`app.proptracker.io` (dashboard, accounts, calendar, trade-journal,
coach, payout-tracking, reports, intelligence, connections),
`www.proptracker.io` y `/pricing`, `www.tradingcontrol.app/app`
(dashboard con datos de ejemplo, operar, playbook, y las pantallas de
pago de Análisis y PropFirm).
