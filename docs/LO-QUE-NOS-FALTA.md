# Lo que nos falta — huecos frente a la competencia y el sync con Tradovate

Escrito el **2026-08-20**, a partir del recorrido de PropTracker y Trading
Control documentado en `docs/COMPETIDORES.md`.

Este archivo es la lista de trabajo: qué tienen ellos que nosotros no, qué
cuesta cada cosa y en qué orden conviene hacerla. La segunda mitad es la
respuesta a "¿podemos sincronizar con Tradovate?" — con la conclusión
adelantada: **hoy no por API, sí por CSV**.

---

## Parte 1 — Lo que nos falta

### Resumen en una tabla

| Hueco | Quién lo tiene | Esfuerzo | ¿Vale la pena? |
|---|---|---|---|
| Calendario mensual de P&L | Los dos | Chico | **Sí, primero** |
| Retiros con estado pedido/cobrado | PropTracker | Chico | **Sí** |
| ROI por firm y por cuenta | PropTracker | Chico | **Sí** |
| Daily loss limit | Los dos | Medio | **Sí** |
| Home / pantalla de inicio | Los dos | Medio | Sí (ya es el Paso 7) |
| Días mínimos de trading | PropTracker | Chico | Sí, junto con el daily loss |
| Regla de consistencia | PropTracker | Chico | Sí, la columna ya existe |
| Import CSV | Trading Control | Medio | Sí, ver Parte 2 |
| Export / backup | Trading Control | Chico | Sí |
| Datos de ejemplo | Trading Control | Chico | Sí |
| Modo privacidad | Trading Control | Muy chico | Sí |
| Objetivo mensual | Trading Control | Chico | Quizás |
| Notas del día / revisión semanal | Trading Control | Chico | Quizás |
| Etiquetas de disciplina | Trading Control | Medio | Quizás, ver abajo |
| Métricas de trading (PF, win rate) | Los dos | Grande | No sin trades |
| Journal trade por trade | Los dos | Grande | **No**, decidido |
| Coach con IA | PropTracker | Grande | No por ahora |
| Sync automático con broker | PropTracker | Grande | **No se puede**, ver Parte 2 |
| Gráfico y calendario económico | PropTracker | Medio | **No**, es relleno |

---

### Los cuatro que hay que hacer

#### 1. Calendario mensual de P&L
**Lo tienen los dos, y es el hueco más visible.** Un mes en grilla, cada
día con su neto, total por semana al costado y total del mes arriba.
PropTracker le agrega un filtro por cuenta.

Nosotros tenemos los datos completos (`resultados_diarios`) y ninguna
vista de calendario. Es una pantalla nueva que no necesita ni migración ni
cálculos nuevos: `agruparPorDia()` ya devuelve exactamente lo que hace
falta.

Detalle a no perder: desde la migración 012 un día puede tener varias
entradas, así que la celda muestra **el neto del día** y, si hubo más de
una, cuántas fueron.

#### 2. Retiros con estado (pedido / cobrado)
Hoy `payouts` asume que el retiro ya entró. En Apex pasan días entre
pedirlo y cobrarlo, y en el medio esa plata **ya salió del balance de la
cuenta pero todavía no está en tu bolsillo**. Son dos situaciones
distintas y la app las muestra igual.

PropTracker guarda `STATUS` (Requested / Received) y **dos fechas**, y
pone "Pending payouts" como número propio en el dashboard.

Migración chica: `estado` (`pedido` | `cobrado`) y `fecha_pedido` en
`payouts`. El impacto en los cálculos es acotado —
`totalRetirado()` y el Funding Manager tienen que decidir si un retiro
pedido cuenta como cobrado (no) y si ya descuenta del balance (sí).

#### 3. ROI por firm y por cuenta
Nuestro gráfico "cuentas por firm" cuenta pasadas, quemadas y en juego.
Está bien, pero no contesta la pregunta que importa: **cuál te dio plata**.

PropTracker tiene dos tablas simples: `INVESTED · RECEIVED · NET PROFIT ·
ROI %` por firm, y lo mismo por cuenta. Con `movimientosDe()` y
`totales()` ya escritos, es agrupar y mostrar.

#### 4. Daily loss limit
**El más importante de los cuatro**, porque es el único que puede
costarte una cuenta. Hay dos formas de quemar una cuenta de futuros: tocar
el piso del drawdown (que sí modelamos, y bien) y pasarte de la pérdida
máxima de un día (que no vemos en absoluto).

Con `resultados_diarios` ya cargado, esto es una columna nueva en
`cuentas_fondeo` (`perdida_maxima_diaria`, en % o en $ como el drawdown) y
un aviso cuando el día que estás cargando se acerca o pasa el límite.

Junto con esto entran, casi gratis:
- **Días mínimos de trading**: contar los días cargados de la cuenta
  contra un número que se carga a mano.
- **Regla de consistencia**: `regla_consistencia` **ya existe** en la tabla
  desde la migración 005 y no la usamos para nada. El cálculo es "el mejor
  día no puede ser más del X% de la ganancia total".

Los tres juntos son el "Accountability" de PropTracker **sin catálogo de
reglas por firm** — que sigue descartado por mantenimiento (ver
`CLAUDE.md`). La diferencia es que los campos los carga el usuario una vez,
igual que ya carga el drawdown.

---

### Los baratos que suman más de lo que cuestan

- **Modo privacidad**: un botón que borronea todos los importes de la
  pantalla, como el "Mostrar importes" de Trading Control. Es un estado
  booleano y una clase de CSS. Para una app que se abre en el celular en
  cualquier lado, se agradece.
- **Datos de ejemplo**: Trading Control deja ver el dashboard lleno sin
  cargar nada, con un cartel que aclara que no se guarda. Resuelve el peor
  momento de un producto así, que es la pantalla vacía del primer día.
- **Export / backup**: bajar todo en JSON o CSV. Barato, y para el usuario
  es la diferencia entre "pruebo esto" y "meto acá mis dos años de
  historia". También es la salida honesta si algún día cerramos.
- **Objetivo mensual** de P&L, cargado a mano, y **notas del día**.

### Los que hay que pensar antes

**Etiquetas de disciplina.** Es lo más original que vimos: Trading Control
parte el P&L por comportamiento (seguí el plan / entrada impulsiva / moví
el stop / sobreoperé) y el resultado es demoledor — en su ejemplo, las
tres categorías "malas" dan 0% de win rate.

En su app eso cuelga de cada trade. Nosotros no tenemos trades, pero
**tenemos días**, y las etiquetas funcionarían igual de bien a nivel día:
"este día sobreoperé", "este día moví el stop". Es una tabla de etiquetas
y un selector en el modal de resultados. Da una métrica que ninguno de los
dos competidores tiene a nivel día y que no necesita el journal.

Queda como candidata, no como decisión.

### Los que NO vamos a hacer

- **Journal trade por trade** (instrumento, entrada, salida, replay). Es
  otro producto. Decidido desde el principio y el research no lo cambia.
- **Métricas tipo profit factor y win rate por operación**: necesitan lo
  anterior.
- **Gráfico de TradingView y calendario económico** (el "Intelligence" de
  PropTracker): relleno. Esos datos el trader ya los tiene abiertos en su
  plataforma.
- **Coach con IA**: no antes de tener usuarios.

---

## Parte 2 — Sync con Tradovate

### La conclusión, primero

**Con una cuenta de prop firm no se puede usar la API de Tradovate.** No es
un problema técnico ni de plata: está excluido por diseño. Lo que sí se
puede, y bastante bien, es **importar el CSV** que la propia Tradovate te
deja descargar.

### Por qué la API está cerrada

Para que Tradovate te dé credenciales de API hacen falta tres cosas a la
vez:

1. Una cuenta **live propia** con **USD 1.000** de equity mínimo.
2. Una suscripción de **API Access de USD 25/mes**.
3. Para datos en tiempo real, una licencia de **CME** aparte, que va de
   USD 290 a 500 por mes según cómo se cuente.

Y arriba de todo eso: **las cuentas de evaluación y fondeadas están
excluidas del programa**, sin importar el balance. Además, las prop firms
desactivan las API keys personales en sus cuentas. O sea que aunque
pagaras los USD 25 con una cuenta personal tuya, esa credencial **no sirve
para leer tu PA de Apex**, que es justamente la que querés trackear.

Existe un camino de **OAuth para terceros**, que es el que usaría una app
como la nuestra para que el usuario conecte su cuenta con un botón. Pero
las credenciales de OAuth **solo se le dan a partners aprobados del
ecosistema NinjaTrader**: hay que abrir cuenta live, pagar el API access,
postularse como desarrollador tercero y pasar una revisión. Y para
compartir ese acceso con otros usuarios hace falta una licencia de
*enterprise API vendor*.

Traducido: el sync automático es una puerta que se abre con acuerdos
comerciales, no con código. Es exactamente por eso que PropTracker lo
vende como su feature más cara.

### Lo que sí se puede: importar el CSV

Tradovate te deja bajar tu historial vos mismo, sin API ni permisos
especiales:

1. Entrar a Tradovate con la cuenta (la de la evaluación sirve).
2. Ir a **Reports**.
3. Elegir la pestaña **Orders** — no "Performance", que exporta otra
   estructura distinta.
4. Elegir el rango de fechas.
5. **Download CSV**.

Eso da las órdenes ejecutadas. Para lo que nosotros necesitamos —**el neto
por día**— alcanza y sobra: se agrupa por fecha, se suma, y sale una fila
de `resultados_diarios` por día.

Y esto encaja perfecto con el modelo que ya tenemos, incluso mejor desde
la migración 012: si un día tuvo tres operaciones, se pueden crear **tres
entradas** en vez de una sola aplastada, y el usuario ve el detalle sin
que hayamos construido un journal.

### Cómo lo haría

**Paso 1 — Importador de CSV (el que vale la pena hacer).**

- Pantalla de "Importar" con arrastrar y soltar, dentro de la cuenta.
- Detectar el formato por los encabezados, no por el nombre del archivo.
  Empezar por Tradovate y dejar la puerta abierta a Rithmic y NinjaTrader,
  que son las otras dos plataformas de Apex.
- **Previsualizar antes de guardar**: mostrar los días que se van a crear
  con su neto y cuáles ya tienen entradas cargadas. Nada se escribe hasta
  que el usuario confirma. Sin esto, un import mal detectado te duplica un
  mes de historia y no hay forma de darse cuenta.
- **Idempotencia**: guardar el identificador de la orden de Tradovate para
  no volver a importar lo mismo si se sube dos veces el archivo del mes.
  Sin ese ancla, reimportar duplica.
- Las comisiones vienen vacías en algunos exports: hay que decidir si el
  neto que cargamos es bruto o neto de comisiones, y decirlo en pantalla.

**Paso 2 — Nada más, por ahora.**

No armar un conector, ni pedirle al usuario la contraseña de Tradovate, ni
scrapear el sitio. Pedirle las credenciales del broker a alguien es
inaceptable para una app que maneja plata, y raspar la web se rompe sola y
puede ir contra los términos de la plataforma.

### Si algún día quisiéramos el sync de verdad

El camino existe, es largo y es comercial:

1. Abrir una cuenta live en Tradovate con USD 1.000.
2. Contratar API Access (USD 25/mes).
3. Postularse al ecosistema de NinjaTrader como desarrollador tercero y
   pasar la revisión.
4. Pedir credenciales de OAuth y, para que lo usen nuestros usuarios,
   averiguar la licencia de vendor.
5. Aparte, resolver el tema de los datos de mercado si alguna vez hiciera
   falta tiempo real — que **para nosotros no hace falta**: nos alcanza con
   fills y balances, no con precios.

El punto 5 es la buena noticia escondida: la parte cara de todo esto (la
licencia de CME) es para *market data*, y nuestro producto no necesita
precios en vivo. El bloqueo real es el punto 3.

**No lo haría antes de tener usuarios pagando.** Es plata y trámite a
cambio de una comodidad que el CSV cubre en un 80%.

### Y las otras plataformas de Apex

Apex opera con **Rithmic**, **Tradovate** y **WealthCharts**. Si alguna vez
hacemos el importador, conviene mirar los tres exports antes de fijar el
formato interno, para no tener que rehacerlo. Trading Control soporta
Tradovate, NinjaTrader y TopstepTrader, lo que sugiere que los CSV de
futuros se parecen bastante entre sí.

---

## Orden sugerido

1. **Calendario mensual** — tapa el hueco más visible, no necesita
   migración.
2. **Home (Paso 7)** — ya estaba en el roadmap y ahora sabemos qué poner.
3. **Retiros con estado** + **ROI por firm/cuenta** — los dos son chicos y
   los dos son del Funding Manager, entran juntos.
4. **Daily loss limit** + días mínimos + consistencia — el bloque de
   reglas, que es el que puede evitar que alguien queme una cuenta.
5. **Import CSV de Tradovate** + export/backup.
6. Los baratos (modo privacidad, datos de ejemplo, objetivo mensual).

---

## Fuentes

- Recorrido de las dos apps con la sesión del usuario, 2026-08-20 — ver
  `docs/COMPETIDORES.md`.
- [Tradovate — Third-Party OAuth Integration (foro oficial)](https://community.tradovate.com/t/third-party-oauth-integration/12456)
- [Tradovate — Uso de la API en cuentas de prop firm (foro oficial)](https://community.tradovate.com/t/how-can-i-use-tradovate-apis-for-prop-firm-eval-and-paid-accounts/7814)
- [Requisitos y costos de acceso a la API de Tradovate en 2026](https://blog.pickmytrade.trade/tradovate-api-access-without-1000-minimum-2026-options/)
- [Autenticación de la API de Tradovate](https://deepwiki.com/tradovate/example-api-js/2-authentication-and-rest-api-(access-track))
- [Cómo exportar el CSV de Tradovate](https://journalit.co/docs/broker-guides-tradovate)
- [Apex — Setting up Tradovate](https://apextraderfunding.com/help-center/tradovate/setting-up-tradovate/)
