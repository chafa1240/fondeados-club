# Lucid Trading: reglas

Fuente oficial: https://support.lucidtrading.com/en/ (colecciones LucidFlex, LucidDaily, LucidPro, LucidDirect, LucidMaxx, Live Trading, Rules and Guidelines, Fees Payments and Payouts)
Foto tomada: 03/10/2026
Última revisión: 03/10/2026
Estado: operativa

Cada dato sale del help center oficial. Al lado de cada artículo va su fecha de "last updated". Lo que no encontré dice "sin dato". Lo que viene de terceros lo digo expresamente. Micros: cada mini equivale a 10 micros en todos los límites de contratos.

## Cómo es el programa
- Pago único: sin mensualidad ni rebilling. Sin tarifa de activación al pasar a fondeada (Fees, 26/08/2026)
- Los resets existen pero no son automáticos ni gratis. Precio del reset: sin dato
- Planes actuales: LucidFlex, LucidDaily, LucidPro, LucidDirect (sin evaluación) y LucidMaxx (por invitación). LucidBlack es legacy
- Tamaños: 25K, 50K, 100K y 150K
- Todos los planes tienen los mismos tamaños de profit target y de drawdown máximo (MLL), salvo LucidDirect en 100K y 150K
- Precios por plan: el help center no los publica (sin dato oficial, salvo LucidMaxx). Para LucidDaily hay una nota de terceros más abajo

## Tabla base de evaluación (Flex, Daily y Pro)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Profit target | $1.250 | $3.000 | $6.000 | $9.000 |
| MLL (drawdown máximo) | $1.000 | $2.000 | $3.000 | $4.500 |
| Contratos máximos | 2 minis / 20 micros | 4 / 40 | 6 / 60 | 10 / 100 |
- Se puede pasar en un día (Flex y Pro lo dicen explícito). Sin límite de tiempo para pasar
- La cuenta fondeada se activa entre 5 y 30 minutos después de llegar al objetivo
- Los objetivos del dashboard se actualizan en tiempo real, dentro de 5 a 30 minutos desde el último trade cerrado

## LucidFlex
Artículos: Evaluation (31/08/2026), Funded (15/08/2026), Payouts (28/07/2026), Consistency (26/08/2026), Scaling (06/05/2026), Drawdown (26/08/2026), Customization (06/08/2026)
- Evaluación: consistencia 50% (mejor día ÷ ganancia total; con un colchón que permite pasar en dos días). Solo rige en la evaluación y desaparece en la fondeada
- Drawdown EOD: el MLL sube con el balance hasta el balance de "trail inicial" y ahí se traba. Tabla (MLL / balance de trail inicial / MLL trabado): 25K $1.000 / $26.100 / $25.100 · 50K $2.000 / $52.100 / $50.100 · 100K $3.000 / $103.100 / $100.100 · 150K $4.500 / $154.600 / $150.100. Al pedir un payout el MLL pasa al balance trabado. Romperlo cierra la cuenta
- Daily Loss Limit: opcional al comprar, y no se puede cambiar después. Con DLL el precio es menor; sin DLL, mayor. Monto del DLL en Flex: sin dato
- Fondeada: 90/10, drawdown EOD, sin consistencia, sin buffer de balance
- Scaling por ganancia (solo fondeada, se actualiza al cierre de la sesión): 25K $0-999 1 mini, $1.000-1.999 2 minis · 50K 2 / 3 / 4 minis en $0-999 / $1.000-1.999 / $2.000-2.999 · 100K 3 / 4 / 5 / 6 minis en $0-999 / $1.000-1.999 / $2.000-2.999 / $3.000-4.499 · 150K 4 / 5 / 6 / 8 / 10 minis en $0-999 / $1.000-1.999 / $2.000-2.999 / $3.000-4.499 / $4.500+
- Payouts: mínimo $500. Máximo por pedido: 50% de la ganancia con tope 25K $1.000 · 50K $2.000 · 100K $2.500 · 150K $3.000. Hay que tener 5 días de ganancia mínima por día (25K $100 · 50K $150 · 100K $200 · 150K $250) y ganancia neta positiva en cada ciclo. Máximo 5 payouts por cuenta antes de pasar a Live. Se descuenta en minutos y llega en hasta 2 días hábiles

## LucidDaily (nuevo, julio 2026)
Artículos: Evaluation (31/07/2026), Funded (07/08/2026), Payouts (27/07/2026), Consistency (27/07/2026), Drawdown (27/07/2026), DLL (19/08/2026)
- Evaluación: drawdown a elección al comprar, intraday (evaluación más barata) o EOD (más flexible). Consistencia 50% solo en evaluación (colchón aprox. 25K $650 · 50K $1.560 · 100K $3.120 · 150K $4.680)
- Fondeada: siempre drawdown intraday. MLL con la misma tabla de trail inicial y trabado de Flex (25K $26.100 / $25.100 ... 150K $154.600 / $150.100)
- DLL opcional (blando: frena el trading hasta la sesión siguiente, no liquida): 25K $600 · 50K $1.200 · 100K $1.800 · 150K $2.700. Fijo durante la sesión. Si se elige, rige en evaluación y fondeada
- Noticias: operar noticias de alto impacto en rojo de EE. UU. (alto impacto y USD) es un "hard breach". Hay que estar flat desde 1 minuto antes hasta 1 minuto después
- Fondeada: 90/10, sin consistencia
- Payouts diarios, sin ventana fija. Mínimo $500. Máximo: toda la ganancia por encima del buffer. Buffer = MLL inicial + $100 (25K $26.100 · 50K $52.100 · 100K $103.100 · 150K $154.600). Hace falta ganancia neta de al menos $1 entre pedidos. Un pedido es definitivo: no se edita ni se cancela
- "Max Daily Profit (auto move to Live)": 25K $6.000 · 50K $8.000 · 100K $10.000 · 150K $12.000 (el artículo lo lista así, sin explicar el mecanismo con más detalle)

## LucidPro
Artículos: Evaluation (26/08/2026), Funded (26/08/2026), Payouts (06/08/2026), Consistency (26/08/2026), DLL (26/07/2026), Drawdown (26/08/2026)
- Evaluación: sin consistencia. DLL fijo de evaluación: 25K ninguno · 50K $1.200 · 100K $1.800 · 150K $2.700
- Fondeada: DLL fijo debajo del trail inicial (25K $600 · 50K $1.200 · 100K $1.800 · 150K $2.700 según la tabla de fondeada). Por encima del trail inicial pasa a "LucidScale DLL": 60% de la mayor ganancia de fin de día, que sube pero nunca baja. El DLL es opcional y se elige al comprar
- Aviso: el artículo de DLL dice que el DLL fondeada es igual al de evaluación, y la tabla de fondeada muestra $600 para 25K, que en la evaluación es "ninguno". No coinciden para 25K
- Contratos: acceso al máximo desde el inicio, sin scaling. Sin tope de payout simulado
- Drawdown EOD con la misma tabla de trail y trabado que Flex
- Payouts: 90/10. Cuentas compradas o reseteadas antes del 28/11/2025 3:00 PM EST conservan 100% de los primeros $10.000 (Legacy). Elegibilidad: ganancia mínima 25K $250 · 50K $500 · 100K $750 · 150K $1.000, consistencia: el mejor día no puede pasar el 40% de la ganancia del ciclo (las cuentas anteriores a esa fecha conservan 35%), y superar el buffer (MLL inicial + $100). Mínimo por pedido $500. Primer payout máximo entre $1.000 y $3.000; los siguientes entre $1.500 y $3.500 (el artículo da rangos, sin tabla por tamaño). Sin ventana fija. Al pasar a Live deja de aplicar la consistencia

## LucidDirect (sin evaluación)
Artículos: Funded (26/08/2026), Payout Objectives (26/08/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| MLL | $1.000 | $2.000 | $3.500 | $5.000 |
| DLL fijo | ninguno | $1.200 | $2.100 | $3.000 |
| Contratos | 2 / 20 | 4 / 40 | 6 / 60 | 10 / 100 |
- En 50K o más, además hay un DLL escalable de 60% de la ganancia pico de fin de día. Sin scaling de contratos y sin tope de payout simulado
- Payouts: 90/10. Consistencia: el mejor día no puede pasar el 20% de la ganancia del ciclo. Objetivo de ganancia por ciclo (se reinicia tras cada payout): primer pago 25K $1.500 · 50K $3.000 · 100K $6.000 · 150K $9.000; desde el segundo pago 25K $1.250 · 50K $2.500 · 100K $3.500 · 150K $4.500
- Tope por pedido: pagos 1 a 3: 25K $1.000 · 50K $2.000 · 100K $2.500 · 150K $3.000. Pagos 4 y 5: 25K $1.000 · 50K $2.500 · 100K $3.000 · 150K $3.500. Mínimo $500

## LucidMaxx (por invitación)
Artículos: Overview (29/06/2026), Eval Rules (26/08/2026), Eval Pricing (26/08/2026), Cooldown (no leído)
- Es una cuenta live con capital real, solo por invitación, que se gana por desempeño y no se compra. La decide el equipo de riesgo sin plazo fijo
- Sin DLL, payouts diarios sin tope y sin ventanas, split 90/10, hasta 5 cuentas simultáneas. No se puede comprar una nueva mientras se tenga una Live activa
- Evaluación: profit target (1.250 / 3.000 / 6.000 / 9.000), MLL igual a la tabla base, consistencia 40% y 5 días de trading. Al pasar sube directo a live con la estructura estándar
- Precio por tamaño y nivel (el nivel depende de cuántas cuentas live se quemaron sin limpiar el drawdown: nivel 1 de 0 a 4, nivel 2 de 5 a 8, nivel 3 de 9 a 12, nivel 4 de 13 o más):
| | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 |
|---|---|---|---|---|
| 25K | $110 | $130 | $155 | $175 |
| 50K | $180 | $215 | $250 | $290 |
| 100K | $270 | $325 | $380 | $430 |
| 150K | $425 | $510 | $595 | $680 |
- El precio listado es el final; evaluaciones y resets cuestan lo mismo y no hay descuentos

## Live
Artículos: New Live Structure (hace más de una semana, sin fecha exacta), New Live Scaling Plan (26/05/2026)
- Se llega al recibir el último payout (el 5) del plan, con pagos acumulados importantes, buen desempeño en sim y, según el artículo, historial live previo. Cada cuenta fondeada tiene que haber cobrado al menos un payout. Al pasar a Live se mueven todas las cuentas fondeadas elegibles
- Arranca con $0, payouts diarios, drawdown EOD y sin DLL. Drawdown inicial y contratos como la tabla base. El MLL se traba en $100 cuando las ganancias igualan al drawdown inicial
- Sin consistencia. Hedgear cuentas live está prohibido
- "Live bonus" de un solo uso hasta $4.500 para quienes generan ganancias iguales a su drawdown inicial en una sola sesión, con split 90/10
- Scaling live: sube y baja con las ganancias, evaluado a diario, por exchange (CME, CBOT, NYMEX, COMEX). Ejemplo 50K: $0-1.999 2 minis, $2.000-3.999 3 minis, $4.000+ 4 minis (COMEX es más restrictivo). El resto de los tamaños no lo leí
- Horario live: Tradovate Live hasta 4:45 PM EST, Rithmic Live hasta 4:15 PM EST. No se permite swing. Hay opción de auto-liquidación

## Cuentas Legacy y LucidBlack
- LucidBlack figura como plan legacy (7 artículos, no leídos). Los artículos "Live (Legacy)" de Flex, Pro y Direct existen para cuentas anteriores a la nueva estructura (no los leí)

## Reglas comunes
Artículos: Allowed Trading Times, Prohibited: Hedging, Microscalping, Other Trading Activities, Trade with Integrity, Inactivity Policy, Restricted Countries (todos 26/08/2026)
- Horario (Pro, Flex y Direct): posiciones cerradas a las 4:45 PM EST de lunes a viernes. Lucid las cierra solo y no falla la cuenta. Reapertura 6:00 PM EST de domingo a jueves. En feriados con cierre anticipado se cierra antes del cierre de mercado
- Hedging: prohibido entre cuentas propias, de distintas personas, de distintas firms, y también con activos correlacionados en cuentas separadas (ejemplo largo en ES y corto en NQ). Primera vez: mail y las cuentas vuelven al balance del día anterior. Reincidencia: se quebran todas las cuentas involucradas y puede haber restricción permanente
- Microscalping: si más del 50% de las ganancias vienen de trades de 5 segundos o menos se revisa. Primero advertencia, después se pierden esas ganancias y puede haber restricción permanente. El scalping genuino está permitido
- Integridad: prohibido aprovechar errores del sistema o demoras de actualización, discrepancias de precios simulados y tácticas que no reflejan condiciones reales. No dice sanciones concretas, solo que puede haber revisión
- Otras: operar noticias está permitido en Flex, Pro y Direct (no en Daily). Se puede escalar posiciones y hacer DCA (se desaconseja el martingale). Bots y copiadores de trades permitidos, con responsabilidad del trader. Flipping permitido para cumplir días mínimos
- Inactividad: hace falta al menos $1 de ganancia o pérdida neta en 30 días corridos, o la cuenta se considera abandonada y se borra. Las cuentas quebradas se borran a los 30 días si no se resetean
- Países: Argentina no figura en la lista de países restringidos (129)

## Pagos
Artículos: Payout Methods (26/08/2026), Accepted Payment Methods (no leído)
- Plaid (transferencia instantánea, EE. UU.), WorkMarket by ADP (EE. UU. e internacional, transferencia bancaria o PayPal, desde el día hábil siguiente) y cripto para traders internacionales (BTC, ETH, LTC, USDT, USDC)
- Comisiones: sin dato

## Precio de LucidDaily (NOTA DE TERCEROS)
El help center no publica precios. El sitio eltraderfinanciado.com (actualizado el 26/08/2026, dice haber verificado el 27/07/2026 contra el help center) los lista como pago único:
| | Intraday con DLL | EOD con DLL | Intraday sin DLL | EOD sin DLL |
|---|---|---|---|---|
| 25K | $95 | $117 | $115 | $137 |
| 50K | $131 | $160 | $156 | $185 |
| 100K | $219 | $269 | $264 | $314 |
| 150K | $312 | $376 | $367 | $436 |
- Son precios de lista sin descuento. Verificar en el checkout antes de decir un precio. Los precios de Flex, Pro y Direct: sin dato

## Artículos sin leer
LucidDaily Customization y Live, LucidPro Customization y Live (Legacy), Flex Live (Legacy), Direct Consistency, DLL, Drawdown y Live (Legacy), LucidMaxx Cooldown, colección LucidBlack (legacy), General Info (5 artículos), Accepted Payments Methods.

## Historial de cambios
- 28/11/2025: LucidPro pasa de 35% a 40% de consistencia en payouts y el 100% de los primeros $10.000 queda solo para cuentas anteriores (ver noticias.md)
- 07/2026: aparece LucidDaily (ver noticias.md)
- Esta es la primera foto completa. Para saber qué cambió desde ahora hay que comparar contra ella
