# Competidores — quiénes son, qué tienen y dónde estamos parados

Research del **2026-08-20**, hecho entrando con la cuenta del usuario a
**PropTracker** (`app.proptracker.io`) y **Trading Control**
(`tradingcontrol.app`) y recorriendo las dos apps por dentro, sección por
sección.

Capturas en `docs/referencias-diseno/` (`proptracker *.jpg`,
`tradingcontrol *.jpg`).

Reemplaza al research del 2026-08-03 (pipback / tradesyncer / tradelio),
que queda en `CLAUDE.md` como antecedente.

> **Cómo repetir el recorrido.** El usuario tiene cuenta en los dos, así
> que se entra con Claude in Chrome usando su sesión. Ojo: en ambas apps
> lo mejor está detrás del plan pago, y cuando el plan está excedido los
> modales (alta de cuenta, alta de retiro, conexiones) directamente **no
> abren**. No es un error del navegador, es el paywall.

---

## Índice

1. [PropTracker](#1-proptracker--el-competidor-directo)
2. [Trading Control](#2-trading-control--journal-primero-prop-despues)
3. [Tabla comparativa](#3-tabla-comparativa)
4. [Ventajas y desventajas](#4-ventajas-y-desventajas)
5. [Qué hacemos con esto](#5-que-hacemos-con-esto)

---

## 1. PropTracker — el competidor directo

**Qué es**: "Prop Firm Dashboard. Track Rules, Drawdowns & Payouts."
Producto en inglés, PropTracker LLC, con sitio de marketing armado,
programa de partners y disclaimers legales completos. Dicen 3.000+ cuentas
trackeadas, 18.000+ reglas monitoreadas y 9+ firms soportadas.

Es **el mismo producto que estamos haciendo**, un año más adelante.

### Secciones

| Sección | Qué hace |
|---|---|
| **Dashboard** | Portfolio value, Net PNL diario, Net payout, **Pending payouts**, performance mensual, cards de Ayer y Hoy, profit factor / expectancy / win rate / trades por día, P&L por sesión (NY / Londres / Asia) y **rachas de días** ganadores y perdedores |
| **Connections** | Sync automático con la plataforma de trading para importar operaciones |
| **Accounts** | Cuentas **agrupadas por firm**, en filas plegables |
| **Calendar** | Calendario mensual con P&L por día, **total por semana** en una columna al costado, total del mes arriba y filtro por cuenta |
| **Trade Lab** | Journal trade por trade: replay en gráfico de 1 minuto con marcas de entrada y salida, rating 1–5, tags de estrategia, error y emoción |
| **Coach Belfort** | Informe diario con IA en tono "brutalmente honesto": veredicto de la sesión, patrones detectados (FOMO, revenge trading), reglas no negociables, patrones por horario |
| **Payout Tracker** | Nuestro Funding Manager, casi calcado (detalle abajo) |
| **Reports** | Seis informes: Capital Efficiency, Performance Overview, Risk Analysis, Trading Efficiency, **Accountability** y Growth Tracker |
| **Intelligence** | Gráfico de TradingView embebido, calendario económico y watchlist de eventos macro |

### Payout Tracker vs. nuestro Funding Manager

Lo miré con la cuenta cargada. Las cards de arriba son **las mismas
cuatro** que tenemos: Total Invested, Total Received, Net Profit, ROI.
Debajo, cinco pestañas:

- **All Payouts** — `ACCOUNT · FIRM · AMOUNT · STATUS · DATE REQUESTED ·
  DATE RECEIVED`
- **Expenses** — `ACCOUNT · FIRM · TYPE · AMOUNT · DATE PAID · NOTES`
- **By Firm** — `INVESTED · RECEIVED · NET PROFIT · ROI %` por firm
- **By Account** — lo mismo por cuenta, con semáforo Profitable / no
- **Timeline** — resumen mes a mes: recibido, invertido, neto

### Rule Tracking — su bandera

Es lo que más venden y es **exactamente la decisión que nosotros
descartamos** (el catálogo de reglas por firm). Cargan solas las reglas de
la firm y del tamaño de cuenta, y las trackean en vivo:

- Daily Loss Limit
- Max Trailing Drawdown, con % usado
- Profit Target, con % de avance
- Min Trading Days (ej. "3 de 5 días")
- Consistency Score (ej. 22,5%, máximo permitido 30%)
- Realized Peak Equity, tipo de drawdown, si permite scaling, si permite
  operar noticias, máximo de contratos

El informe **Accountability** cuelga de esto: % de cumplimiento, días con
regla rota, días de trading totales y estado de la evaluación.

### Precios

| Plan | Precio | Límite |
|---|---|---|
| Free | $0 | **1 cuenta**, 30 días de historial |
| Pro | **$36/mes** | 5 cuentas, 6 meses, Coach Belfort |
| Elite | **$59/mes** | 20 cuentas, 2 años |
| Wizard | **$149/mes** | ilimitadas, historial completo |

Trial de 3 días, 15% de descuento pagando anual.

---

## 2. Trading Control — journal primero, prop después

**Qué es**: diario de trading **en español**, con analítica de disciplina.
El tracker de prop firms es un agregado, no el corazón del producto.

Secciones: Dashboard · Operar · Historial · Análisis 🔒 · PropFirm 🔒 ·
Playbook.

Detalle importante de onboarding: se puede **ver el dashboard con datos de
ejemplo** sin cargar nada, con un cartel que aclara que no se guarda.

### Lo que está abierto (gratis)

- **Dashboard**: P&L total, win rate, profit factor, expectativa, curva de
  equity, calendario mensual con P&L por día y contadores de días
  ganadores / perdedores, racha actual.
- **Resumen por disciplina** — lo más original de los dos productos. Parte
  el P&L por **comportamiento**, no por instrumento:

  | Etiqueta | P&L | Win rate |
  |---|---|---|
  | Seguí el plan | +2.098 € (28 trades) | 71% |
  | No seguí el plan | −283 € (3) | 0% |
  | Entrada impulsiva | −280 € (3) | 0% |
  | Moví el stop | −165 € (2) | 0% |
  | Sobreoperé | −208 € (2) | 0% |

- **Reglas de trading** con alerta, definidas por el usuario: máx. trades
  por día, pérdida máxima diaria, máx. pérdidas seguidas, calidad mínima
  del setup, sin entradas impulsivas, seguir siempre el plan, no mover el
  stop, sin sobreoperar.
- **Revisión de esta semana**: resultado, ejecución, foco próximo y un
  botón para escribir la reflexión. **Notas del día** aparte.
- **Objetivo mensual** de P&L, fijado a mano.
- **Modo privacidad**: un botón "Mostrar importes" que borronea toda la
  plata de la pantalla.
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

Free 0 € (hasta 100 trades) · **Pro 11,99 €/mes** · Prop/Team a medida
(en desarrollo).

---

## 3. Tabla comparativa

Estado al 2026-08-20. "Nosotros" = lo que hay hecho hasta el Paso 6.

| | Fondeados Club | PropTracker | Trading Control |
|---|---|---|---|
| Idioma | Español (inglés planeado) | Inglés | Español |
| Foco | Gestión de cuentas y plata | Reglas de la firm | Journal de operaciones |
| Precio | Gratis hoy; barato después | $36–149/mes | 11,99 €/mes |
| Límite del plan gratis | Ninguno | **1 cuenta** | 100 operaciones |
| Alta de cuentas | ✅ manual, completa | ✅ con reglas automáticas | 🔒 solo pago |
| Modos de drawdown | ✅ estático / EOD / trailing | ✅ estático y trailing | 🔒 EOD trailing |
| Congelamiento del trailing | ✅ `piso_congelado` | ⚠️ no se ve explícito | ❔ |
| Máximo del día (flotante) | ✅ campo manual | ❌ (lo saca del sync) | ❌ |
| Resultados diarios | ✅ carga manual por día | ✅ derivado de los trades | ✅ derivado de los trades |
| Calendario mensual | ❌ | ✅ | ✅ |
| Curva balance vs. piso | ✅ | ❔ | 🔒 "curva de equity" |
| Gastos y retiros | ✅ Funding Manager | ✅ Payout Tracker | ❔ |
| Estado del retiro (pedido/cobrado) | ❌ | ✅ | ❔ |
| ROI global | ✅ | ✅ | ✅ |
| ROI por firm / por cuenta | ❌ | ✅ | ❔ |
| Costo por fondeada | ✅ | ❌ | ❌ |
| Retiro promedio | ✅ | ❌ | ❌ |
| Daily loss limit | ❌ | ✅ | ✅ (regla propia) |
| Días mínimos de trading | ❌ | ✅ | ❌ |
| Regla de consistencia | ⚠️ columna sin usar | ✅ con score | 🔒 |
| Journal trade por trade | ❌ (fuera del MVP) | ✅ Trade Lab | ✅ el producto entero |
| Métricas de trading (PF, win rate) | ❌ (fuera del MVP) | ✅ | ✅ |
| Disciplina / psicología | ❌ | ✅ Coach Belfort | ✅ resumen por disciplina |
| IA | ❌ | ✅ | 🔒 |
| Sync automático con broker | ❌ | ✅ | ❌ (CSV) |
| Import CSV | ❌ | ❔ | ✅ |
| Export / backup | ❌ | ❔ | ✅ JSON |
| Home / pantalla de inicio | ❌ pendiente | ✅ | ✅ |
| Modo privacidad | ❌ | ❌ | ✅ |
| Datos de ejemplo para probar | ❌ | ❌ | ✅ |
| App móvil | ❌ (Fase 3) | ❌ | ❌ |
| Comunidad | ❌ (Fase 2) | ❌ | ❌ |

---

## 4. Ventajas y desventajas

### Nuestras ventajas

**1. El modelo de drawdown es mejor que el de los dos.**
Somos los únicos que representamos el **congelamiento del trailing**
(`piso_congelado`) y el **máximo del día** como delta cargado a mano. Los
otros dos calculan el piso desde los trades sincronizados: cuando el sync
no está, o cuando la firm mueve el umbral con ganancias no realizadas, se
quedan cortos. Nosotros nos rompimos la cabeza con esto en el Paso 4c y
resultó ser diferenciador, no sobre-ingeniería.

**2. Funcionamos sin conectar nada.**
Los dos competidores asumen sync o import de operaciones. PropTracker te
muestra "No trades yet — upload trades" en cuatro de sus seis informes. Si
no conectás la plataforma, media app queda vacía. Nosotros pedimos **un
número por día**, y con eso sale todo. Eso es una ventaja real para el
trader que no quiere dar acceso a su cuenta o que opera en una plataforma
que ninguno soporta.

**3. Contestamos la pregunta del negocio, no la del trading.**
**Costo por fondeada** y **retiro promedio** leídos de a pares no los tiene
ninguno de los dos. Ellos te dicen si tradeás bien; nosotros te decimos si
el negocio de comprar evaluaciones cierra. Es la pregunta original de la
idea y sigue sin dueño.

**4. El precio y el límite del plan gratis.**
PropTracker limita por **cantidad de cuentas**, que es justo el límite que
más duele al trader de futuros — el que por definición tiene 5, 10 o 20
PAs chicas. Nosotros no tenemos ese límite y no nos cuesta nada no
tenerlo.

**5. Español nativo.**
PropTracker es inglés puro. Trading Control es español pero es un journal.
No hay un gestor de cuentas fondeadas en español que sea gratis y sirva
con muchas cuentas.

**6. Filtros separados en el Funding Manager.**
Resumen e historial con filtros propios. Los dos competidores tienen un
solo filtro por pantalla. Es un detalle chico pero es mejor.

### Nuestras desventajas

**1. No tenemos Home.** Los dos abren en un dashboard que se lee de un
vistazo. Nosotros abrimos en un placeholder. Es lo peor que tenemos hoy.

**2. No tenemos calendario mensual.** Los dos lo tienen, y nosotros
tenemos los datos (`resultados_diarios`) sin ninguna vista. Es el hueco
más visible y el más barato de tapar.

**3. No modelamos el daily loss limit.** Es la **otra forma de quemar una
cuenta** y la app no la ve. Los dos competidores la tienen. De todos los
huecos, este es el que más puede costarle plata a un usuario.

**4. Nada de disciplina ni psicología.** El "resumen por disciplina" de
Trading Control (P&L partido por comportamiento) y Coach Belfort son las
dos cosas que hacen que un trader vuelva todos los días. Nosotros somos
puramente contables.

**5. Cero métricas de trading.** Win rate, profit factor, expectativa: los
dos las muestran arriba de todo. Nosotros las descartamos a propósito
porque necesitan datos trade por trade — pero el usuario que compara va a
notar la ausencia antes de entender la razón.

**6. Sin import ni export.** Trading Control importa CSV de tres
plataformas y exporta backup en JSON. Nosotros no tenemos ninguna de las
dos, y "cargar todo a mano" es una barrera de entrada para alguien que ya
tiene historial en una planilla.

**7. Somos los últimos en llegar.** PropTracker tiene sitio de marketing,
partners, disclaimers legales y 3.000 cuentas declaradas. Trading Control
tiene una comunidad en español andando. Nosotros tenemos registro cerrado
y cero usuarios afuera.

### Ventajas de ellos que **no** deberíamos copiar

- **El sync automático con el broker** (PropTracker). Es caro, frágil y ya
  está fuera de alcance por decisión tomada.
- **El journal trade por trade** (los dos). Es otro producto, y la razón
  por la que lo descartamos sigue siendo válida.
- **El gráfico de TradingView y el calendario económico** (Intelligence de
  PropTracker). Es relleno: esos datos el trader ya los tiene abiertos en
  su plataforma.
- **El catálogo automático de reglas por firm.** Ver abajo — hay un matiz.

### Desventajas de ellos que podemos aprovechar

- **PropTracker se rompe sin trades.** Cuatro de sus seis informes dicen
  "No trades yet". Su producto necesita el sync para tener sentido; el
  nuestro no.
- **PropTracker cobra caro y limita por cuentas.** Es su punto más
  atacable con el trader de futuros multi-cuenta.
- **Trading Control esconde el prop firm tracker detrás del pago.** Su
  usuario gratis ve un journal, no un gestor de cuentas. El nuestro ve el
  gestor completo.
- **Los dos ignoran la pregunta económica.** Ninguno te dice cuánto te
  costó conseguir cada fondeada.

---

## 5. Qué hacemos con esto

### Los tres huecos a tapar, en orden

1. **Calendario mensual.** Los datos ya están, falta la vista. Es lo que
   más se nota que no tenemos.
2. **Retiros con estado** (`pedido` / `cobrado`) y dos fechas. Hoy
   asumimos que el retiro ya entró; en Apex hay días entre pedirlo y
   cobrarlo, y esa plata **ya salió del balance pero todavía no está en el
   bolsillo**. Migración chica: `estado` + `fecha_pedido` en `payouts`.
3. **ROI por firm y por cuenta.** Cambiar el gráfico de "cuentas por firm"
   por una tabla `invertido / cobrado / neto / ROI` responde una pregunta
   que hoy no podemos contestar.

### La decisión del catálogo de reglas, revisada

En `CLAUDE.md` descartamos el catálogo de reglas por firm por
mantenimiento. PropTracker lo hizo y es toda su propuesta de valor.

**No propongo dar marcha atrás.** El argumento del mantenimiento sigue en
pie: con 53 firms escritas a mano no hay catálogo que aguante, y el rubro
abre y cierra firms todo el tiempo. Pero mezclamos dos cosas distintas:

- **El catálogo automático** (que la app sepa sola las reglas de Apex 50k):
  caro, frágil, **sigue descartado**.
- **Los campos de regla en sí** (daily loss limit, días mínimos de
  trading, consistencia): son cuatro columnas que el usuario carga a mano
  una vez, igual que ya carga el drawdown. De hecho **`regla_consistencia`
  ya existe** en la tabla desde la migración 005 y no la usamos para nada.

Con esos campos y los resultados diarios sale el "Accountability" de
PropTracker sin catálogo ninguno. El **daily loss limit** es el que más
pesa, porque es la otra forma de quemar una cuenta.

### Para el Paso 7 (Home)

Los dos dashboards arrancan igual: **una fila de números grandes arriba**
(P&L de hoy, del mes, racha) y **el calendario o la curva abajo**. Ninguno
de los dos es una lista de alertas, que era una de las opciones que
teníamos abiertas — dato a tener en cuenta al definirla.

Vale la pena copiar:

- **Ayer / Hoy** como dos cards separadas. Es la pregunta de todas las
  mañanas.
- La **racha** (`rachaActual()`) y **días ganadores vs. perdedores**
  (`resumenDias()`), que son justo las dos funciones que quedaron escritas
  sin pantalla.
- El **saludo con resumen en una frase** de Trading Control ("Este mes vas
  765,9 € · racha de 2 días en verde"). Es una línea de texto y hace que
  la pantalla se sienta viva.
- El **modo privacidad** (borronear importes). Barato, y para una app que
  se abre en el celular en cualquier lado se agradece.
- Los **datos de ejemplo** para ver la app llena antes de cargar nada.
  Resuelve el peor momento de un producto así: la pantalla vacía.

### Sobre el precio

El piso del rubro está en **11,99 €/mes** (Trading Control) y el techo en
**$36–59/mes** (PropTracker, escalando por cantidad de cuentas). Nuestra
decisión de "barato" está bien calibrada.

El posicionamiento que se dibuja solo: **el gestor de cuentas fondeadas
que no te cobra por tener muchas cuentas ni te obliga a conectar el
broker**.

---

## Fuentes

Recorrido con la sesión del usuario el 2026-08-20:
`app.proptracker.io` (dashboard, accounts, calendar, trade-journal, coach,
payout-tracking, reports, intelligence, connections), `www.proptracker.io`
y `/pricing`, y `www.tradingcontrol.app/app` (dashboard con datos de
ejemplo, operar, playbook, y las pantallas de pago de Análisis y PropFirm).
