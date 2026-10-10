# Tradeify: reglas

Fuente oficial: https://help.tradeify.co/en/ (colecciones Accounts & Rules, Payouts & Billing, Live Accounts, Getting Started, Trading Platforms & Products, Business & Compliance, Forge)
Foto tomada: 03/10/2026
Última revisión: 03/10/2026
Estado: operativa

Cada dato sale del help center oficial. Al lado de cada artículo va la fecha de "last updated" cuando la muestra; muchos solo dicen "hace X" y en esos casos no tengo la fecha exacta. Lo que no encontré dice "sin dato". Lo que viene de terceros lo digo expresamente. En todos los límites, 10 micros equivalen a 1 mini.

## Cómo es el programa
- Pago único en todos los planes, sin mensualidad ni renovación (Tradeify 3.0, 07/04/2026; Reset Rules, 02/04/2026)
- Tres planes: Growth (evaluación), Select (evaluación) y Lightning (fondeada directa). Después, cuenta live Elite
- Sin tarifa de activación en Growth, Select ni Lightning. La activación de la fondeada es manual desde el dashboard e instantánea al cumplir los objetivos. El plan antiguo Advanced cobraba $125 (Funded Activation, 05/06/2026; Activation Fees, 05/06/2026)
- Al activarse, la cuenta fondeada arranca en su tamaño base. Las ganancias de la evaluación no pasan a la fondeada
- Hasta 5 cuentas Sim Funded activas por trader, y el mismo límite de 5 rige por hogar (Account Limits, 22/07/2026). Evaluaciones: hasta 15 Select por cada 30 días; Growth sin límite. Máximo 5 activaciones de fondeadas por día (artículo de Growth)
- Reembolsos: todas las ventas son finales (Pricing Reference, 01/09/2026)

## Growth (evaluación)
Artículos: Growth Evaluation Accounts (esta semana), Select vs Growth (26/08/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Profit target | $1.500 | $3.000 | $6.000 | $9.000 |
| Drawdown máx. (EOD trailing) | $1.000 | $2.000 | $3.500 | $5.000 |
| Daily Loss Limit (blando) | $600 | $1.250 | $2.500 | $3.750 |
| Contratos | 1 (10 micros) | 4 (40) | 8 (80) | 12 (120) |
- Mínimo de días: 1 (se puede pasar de inmediato). Sin consistencia en la evaluación. Sin límite de tiempo
- Los contratos son los vigentes desde el 12/09/2025. Antes, la 50K, 100K y 150K tenían 5, 10 y 15 contratos (según el artículo de Lightning)

## Select (evaluación)
Artículos: Select Evaluation Accounts (hace más de 3 semanas), Select vs Growth (26/08/2026), Pricing Reference (01/09/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Profit target | $1.500 | $3.000 | $6.000 | $9.000 |
| Drawdown máx. (EOD) | $1.000 | $2.000 | $3.000 | $4.500 |
| Daily Loss Limit | ninguno | ninguno | ninguno | ninguno |
- Mínimo de días: 3 (2 con el add-on de consistencia 50%, que tiene precio mayor)
- Consistencia: ningún día puede ser más del 40% de la ganancia total. Solo en la evaluación; en la fondeada no hay consistencia
- Límites: hasta 15 evaluaciones por 30 días, 10 resets por evaluación en 30 días y hasta 5 fondeadas
- Existe una versión de 300K (ver Forge)
- Al pasar se elige entre dos políticas de payout (Flex o Daily, más abajo)

## Lightning (fondeada directa, sin evaluación)
Artículo: Lightning Funded Accounts (26/08/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Drawdown máx. | $1.000 | $2.000 | $4.000 | $5.250 |
| Daily Loss Limit | ninguno | $1.250 | $2.500 | $3.000 |
| Contratos | 1 (10 micros) | 4 (40) | 8 (80) | 12 (120) |
- Sin resets: si falla hay que comprar otra
- Sin mínimo de días de trading para pedir payout
- El DLL de 150K era $3.750 para compras anteriores al 31/03/2026. Las cuentas 150K anteriores al dashboard nuevo conservan $3.750 de DLL y $6.000 de drawdown

## Drawdown (cómo funciona)
Artículo: Rules: Trailing Max Drawdowns (26/08/2026)
- Sigue el balance de cierre más alto de cada día, pero se controla en tiempo real sobre el valor de liquidación neto. Si lo toca un instante, la cuenta falla de inmediato y no se recupera aunque suba antes del cierre
- Se traba cuando el balance de cierre llega a $100 por encima del monto del drawdown. Después el piso queda fijo en $100 sobre el balance inicial. Solo aplica a cuentas Sim Funded; las evaluaciones no se traban
- Montos que muestra el artículo para cuentas fondeadas (incluye ese margen de $100 en los chicos): 25K $1.100 en todos los planes · 50K $2.000 · 100K Growth $3.500, Lightning $4.000, Select Flex $3.100, Select Daily $2.600 · 150K Growth $5.100, Lightning $6.100, Select Flex $4.600, Select Daily $3.600
- Aviso: ese artículo muestra $6.100 para Lightning 150K, y los artículos de Lightning y "Tradeify 3.0" dicen $5.250. No coinciden. Hay que confirmar antes de decirle un número a alguien

## Daily Loss Limit
Artículo: Rules: Daily Loss Limit (25/08/2026)
- Pausa el trading del día, no hace fallar la cuenta
- Montos iniciales: Lightning 50K $1.250 · 100K $2.500 · 150K $3.000 (25K no tiene). Growth 25K $600 · 50K $1.250 · 100K $2.500 · 150K $3.750. Select Daily 25K $500 · 50K $1.000 · 100K $1.250 · 150K $1.750
- Aumenta cuando la cuenta llega a un 6% de ganancia (balance requerido 25K $26.500 · 50K $53.000 · 100K $106.000 · 150K $159.000): Lightning pasa a 50K $2.000 · 100K $4.000 · 150K $5.250; Growth pasa a 25K $1.000 · 50K $2.000 · 100K $3.500 · 150K $5.000
- Las cuentas anteriores al 12/09/2025 pierden el DLL por completo al llegar al 6% de ganancia

## Consistencia
Artículo: Rules: Consistency Rule (19/08/2026)
- Growth fondeada: 35% (el mejor día no puede pasar del 35% de la ganancia total)
- Select: 40% solo en evaluación, nada en fondeada
- Lightning comprada después del 12/09/2025 8:00 AM EST: 20% en el primer payout, 25% en el segundo y 30% del tercero en adelante. Comprada antes: 20% en todos los payouts
- Fórmula: mejor día de PnL de cierre ÷ porcentaje = balance total necesario

## Payouts
Artículos: Select Flex and Select Daily Payout Policies (hace más de 3 semanas), Growth Funded Account Payout Policy (hace más de 3 semanas), Lightning Funded Account Payout Policy (hace más de 3 semanas)
Todos con split 90/10. Hay que tener ganancia neta positiva en cada ciclo de payout.

### Select Flex (cada 5 días ganadores)
- Día ganador: ganancia mínima por día 25K $100 · 50K $150 · 100K $200 · 150K $250
- Mínimo por pedido $250. Sin balance mínimo. Sin consistencia
- Máximo por pedido: hasta el 50% de la ganancia total, con tope. Compras desde el 01/09/2026: 25K $1.250 · 50K $2.500 · 100K $3.500 · 150K $4.500. Compras anteriores al 01/09/2026: 25K $1.250 · 50K $3.000 · 100K $4.000 · 150K $5.000

### Select Daily (payouts diarios)
- Elegible a diario después del buffer fijo: 25K $1.100 · 50K $2.100 · 100K $2.600 · 150K $3.600
- DLL: 25K $500 · 50K $1.000 · 100K $1.250 · 150K $1.750
- Regla de continuidad diaria: "hasta 2×" la ganancia obtenida entre pedidos
- Mínimo por pedido $250. Sin consistencia
- Máximo por pedido. Compras desde el 01/09/2026: 25K $600 · 50K $1.250 · 100K $1.750 · 150K $2.500. Anteriores: 25K $600 · 50K $1.000 · 100K $1.500 · 150K $2.500

### Growth fondeada
- Mínimo por pedido: 25K $250 · 50K $500 · 100K $1.000 · 150K $1.500
- 5 días de trading con ganancia por encima de 25K $100 · 50K $150 · 100K $200 · 150K $250. Balance mínimo para pedir: 25K $26.500 · 50K $53.000 · 100K $104.500 · 150K $156.500. Consistencia 35%
- Máximo por pedido: payout 1: 25K $1.000 · 50K $1.500 · 100K $2.000 · 150K $2.500 · payout 2: $1.000 / $2.000 / $2.500 / $3.000 · payout 3: $1.000 / $2.500 / $3.000 / $4.000 · payout 4 en adelante: $1.000 / $3.000 / $4.000 / $5.000

### Lightning
- Mínimo por pedido $1.000. Se piden al instante al cumplir consistencia y objetivo de ganancia
- Máximo por pedido: payouts 1 a 3: 25K $1.000 · 50K $2.000 · 100K $2.500 · 150K $3.000. Payout 4 en adelante: $1.000 / $2.500 / $3.000 / $3.500
- Objetivo de ganancia (compras después del 12/09/2025): payout 1: 25K $1.500 · 50K $3.000 · 100K $6.000 · 150K $9.000. Payout 2 en adelante: $1.000 / $2.000 / $3.500 / $4.500

### Cómo se cobra
Artículo: Rise Payouts (11/05/2026)
- Método principal: Rise. Transferencia ACH en 1 a 3 días hábiles, cripto en horas a 1 día, y monedas locales según región. Sin costo por recibir pagos. Una vez aprobado el payout, los fondos aparecen en la wallet de Rise en 24 a 48 horas
- Hay una opción alternativa, Plane Payouts, que no leí

## Live: Tradeify Elite
Artículos: Tradeify Elite Program (esta semana), Legacy Live Program (02/04/2026)
- Se llega con 3 payouts en una misma cuenta, o 10 payouts en total desde la última transición a live. Cumplirlo no garantiza el pase: Tradeify evalúa consistencia, manejo del riesgo y comportamiento
- Split 80/20. Payouts diarios. Se puede retirar lo que supere el capital de trading. Si un payout deja la cuenta en $0, la cuenta se cierra
- Arranca en $0 sin ganancias de la sim. Hasta 5 cuentas live. Drawdown fijo y sin DLL. Drawdown EOD: 25K $1.500 · 50K $2.000 · 100K $3.000 · 150K $4.500 · 300K $6.000. Se traba a $100 por encima del límite y se recalcula a diario, no en tiempo real
- Si falla, hay hasta 4 semanas de espera para volver a comprar
- Legacy Live (cuentas compradas antes del 03/12/2025 a las 00:00 EST, que pasan a Live tras 4 payouts): el saldo inicial es el menor entre el balance restante y el 10% del tamaño sim, con tope 25K $2.500 · 50K $5.000 · 100K $10.000 · 150K $15.000. Tope de por vida de $100.000 entre payouts sim y transición. Del saldo inicial se retira tras 20 días con $200 de ganancia mínima por día, split 90/10. Sobre el saldo inicial, split 80/20 con mínimo $250. DLL dinámico de $2.000 a $100.000 según el balance. Hay bonos SPIFF semanales, mensuales y trimestrales (máximos $1.000, $4.500 y $15.000)
- Hay un artículo de Accelerator Reward Pools (premios por rendimiento para live) que no leí

## Forge (lanzamientos limitados)
- 300K Select (28/08/2026): cantidad limitada, sin resets, hasta 3 cuentas por usuario, KYC obligatorio antes de comprar, no cuenta para el tope de 15 evaluaciones. V2 (actual): evaluación $349, objetivo $14.000, pérdida máxima EOD $8.000, DLL $4.000, consistencia 40%. V1: $449, pérdida máxima $6.000, sin DLL. Payouts 90/10
- Level Up (a la venta, actualizado el mismo día de la lectura): $80 por intento, 5 intentos de por vida, 10 niveles con $50.000 simulados por nivel, drawdown estático, pagos hasta $35.000 en total, solo Tradovate, KYC obligatorio, un trade por semana como mínimo, sin cupones. Los resets en checkpoint cuestan $150 (nivel 3) y $299 (nivel 5)

## Precios
Artículo: Tradeify Pricing Reference (01/09/2026)
| | Growth | Reset Growth | Select 40% | Reset Select | Select 50% | Reset Select 50% | Lightning |
|---|---|---|---|---|---|---|---|
| 25K | $99 | $60 | $109 | $75 | $135 | $90 | $345 |
| 50K | $145 | $95 | $165 | $109 | $205 | $135 | $492 |
| 100K | $255 | $155 | $265 | $169 | $329 | $209 | $660 |
| 150K | $369 | $215 | $369 | $239 | $459 | $299 | $796 |
- Select 300K: $449 (tabla oficial; el artículo de Forge dice $349 para V2)
- Hay un 5% de descuento por bundle comprando exactamente 5 cuentas del mismo tipo y tamaño. Los resets no admiten cupones
- Los resets no se pueden pedir como gesto comercial; hay resets gratis solo por sorteos de TradeifyTV. Los créditos de reset no vencen y son transferibles
- El artículo "Which Plan is Right for You?" (hace más de un mes) muestra rangos distintos (Select $95 a $215, Growth $99 a $349, Lightning $349 a $729). Parece desactualizado

## Qué y cuándo se opera
Artículos: Permitted Times to Trade (14/07/2026), Supported Trading Products (20/05/2026), Trading Commission Fees (28/04/2026)
- Apertura 6:00 PM ET de domingo a jueves, cierre 5:00 PM ET de lunes a viernes. Todas las posiciones tienen que estar cerradas a las 4:45 PM ET (12:59 PM ET en días de cierre anticipado)
- Productos: futuros de CME, COMEX, NYMEX y CBOT (índices, divisas, agrícolas, energía y metales, micros). Futuros EUREX con suscripción adicional. No hay cripto (ni bitcoin). El micro de plata SIL no está soportado, solo el SI
- Comisión round turn (ejemplos): E-minis de índice $5,76 · micros de índice $1,82 · crudo $6,00 · gas natural $6,20 · oro y plata $6,20 · micros de divisas $1,60

## Plataformas y datos
Artículo: Supported Platforms (05/08/2026)
- Tradovate: Tradovate, NinjaTrader y TradingView. Rithmic: Tradesea, Quantower, Sierra Chart y R|Trader. WealthCharts
- Datos: Level 1 de CME incluido. Level 2 y EUREX solo en Tradovate, pago aparte. En Rithmic y WealthCharts todavía no están disponibles
- Los futuros sobre acciones solo en Tradovate

## Conducta y riesgo
Artículos: Rules: Hedging (19/08/2026), Rules: News Trading (12/08/2026), Risk & Compliance Guidelines FAQ (15/09/2026), Know Your Trader Policy (esta semana)
- Hedging: prohibido tener posiciones opuestas en el mismo instrumento o en productos del mismo grupo (índices, energía, metales, divisas, tasas, granos, ganado y volatilidad), en una cuenta o entre cuentas bajo tu control. Se detecta cuando hay posiciones opuestas, la cobertura dura más de 10 segundos y las ganancias pasan de $150. Sanciones: descalificación en evaluación, rechazo de payout, pérdida de las ganancias del período y ban permanente si es deliberado o repetido
- Noticias: permitido sin restricciones en todos los planes, bajo tu riesgo
- Microscalping (solo cuentas fondeadas): más del 50% de los trades y más del 50% de las ganancias tienen que venir de operaciones de más de 10 segundos, o no se puede pedir payout
- Cada trader tiene que ser dueño y operar su cuenta. Prohibido compartir credenciales y pagar con medios de terceros. Los bots solo están permitidos donde se autorice expresamente. El copy trading está prohibido salvo permiso expreso
- Todo payout está sujeto a revisión de cumplimiento, y pedirlo no garantiza aprobación
- KYT (Know Your Trader): entrevista corta conducida por IA donde se explica la propia operativa. Puede exigirse antes de fondear, antes de un payout o tras una revisión. Si no se completa a tiempo, Tradeify puede pausar actividad, payouts o acceso
- KYC de identidad vía Sumsub (artículo KYC and AML, no leído)

## Países
Artículo: Rules: Restricted Countries (hace más de un mes)
- 58 países restringidos por residencia permanente (incluye Afganistán, Corea del Norte, Rusia, Siria, Irán, Irak y Cuba). Argentina no figura

## Artículos sin leer
Plane Payouts, Chargeback Policy, Trade as a Company / LLC, KYC and AML, Affiliates, Rewards Center, Accelerator Reward Pools, competencias (Grand Cup 2, World Cup Prediction Tournament, Premier Trading League), Common FAQs, Essential Trading Rules Overview, guías de plataformas y troubleshooting, Level 2 y EUREX por bróker, Elite en detalle de contratos.

## Historial de cambios
- 03/12/2025: cambios en Live y en Growth y Lightning fondeada (ver noticias.md)
- 31/03/2026: DLL de Lightning 150K baja de $3.750 a $3.000 para compras nuevas (ver noticias.md)
- 07/04/2026: Tradeify 3.0 (ver noticias.md)
- 01/09/2026: cambian los topes de payout de Select Flex y Daily para compras nuevas (ver noticias.md)
- Esta es la primera foto completa. Para saber qué cambió desde ahora hay que comparar contra ella
