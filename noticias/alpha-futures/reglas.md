# Alpha Futures: reglas

Fuente oficial: https://help.alpha-futures.com/en/ (Trading Rules and Parameters, Payout Information, Monthly Subscription)
Foto tomada: 03/10/2026
Última revisión: 03/10/2026
Estado: operativa (vende cuentas en alpha-futures.com)

Cada dato sale del help center oficial. Entre paréntesis va la fecha de "last updated" de cada artículo. Lo que no encontré en la fuente oficial dice "sin dato".

## Planes que vende hoy
Zero, Standard, Advanced y Direct. El plan Premium ya no figura en la web (ver noticias.md).

## Zero (evaluación de un paso, mensual)
Artículos: Zero Account Overview (12/08/2026), Reset (12/08/2026)
- Tamaños y precio mensual: 25K $89 · 50K $139 · 100K $279
- Profit target: 25K $1.500 · 50K $3.000 · 100K $6.000
- Drawdown (MLL): 25K $1.000 · 50K $2.000 · 100K $3.000
- Daily Loss Guard: 25K $500 · 50K $1.000 · 100K $2.000
- Consistencia: ninguna en evaluación (se puede pasar en un día). 40% en cuenta qualified
- Límite de posiciones: 25K 1 mini / 10 micros · 50K 3 minis / 30 micros · 100K 6 minis / 60 micros
- Fee de activación: ninguno
- Reset de evaluación: 25K $79 · 50K $119 · 100K $249
- Reset de qualified: 25K $399 · 50K $499 · 100K $799
- Profit split: 90% desde el inicio

## Standard (evaluación de un paso, mensual)
Artículos: Standard Account Overview (27/07/2026), Reset (12/08/2026)
- Tamaños y precio mensual: 50K $129 · 100K $239 · 150K $349
- Profit target: 50K $3.000 · 100K $6.000 · 150K $9.000
- Drawdown (MLL): 50K $2.000 · 100K $3.000 · 150K $4.500
- Daily Loss Guard (solo qualified): 50K $1.000 · 100K $2.000 · 150K $3.000
- Consistencia: 50% en evaluación, 40% en qualified
- Límite de posiciones: 50K 5 minis / 50 micros · 100K 10 / 100 · 150K 15 / 150
- Fee de activación: ninguno
- Reset de evaluación: 50K $109 · 100K $199 · 150K $289
- Reset de qualified: 50K $599 · 100K $799 · 150K $999
- Profit split: 90% (sin escalones)

## Advanced (evaluación de un paso, mensual)
Artículos: Advanced Account Overview (22/07/2026), Reset (12/08/2026), Activation Fee (24/07/2026)
- Tamaños y precio mensual: 50K $209 · 100K $349 · 150K $489
- Profit target: 50K $4.000 · 100K $8.000 · 150K $12.000
- Drawdown (MLL): 50K $1.750 · 100K $3.500 · 150K $5.250
- Daily Loss Guard: ninguno
- Consistencia: 40% en evaluación. Ninguna en qualified
- Límite de posiciones: 50K 5 minis / 50 micros · 100K 10 / 100 · 150K 15 / 150
- Scaling plan: ninguno
- Fee de activación: $149 para cuentas compradas antes del 08/07/2026. Las compradas después no pagan
- Reset de evaluación: 50K $189 · 100K $319 · 150K $449
- Reset de qualified: no disponible (el reset de qualified aplica solo a Zero y Standard)
- Profit split: 90% desde el inicio

## Direct (sin evaluación, pago único)
Artículo: Direct Account Overview (sin fecha visible)
- Tamaños y precio único: 25K $349 · 50K $519 · 100K $689 · 150K $859
- Arranca directo como cuenta qualified (no hay evaluación)
- Drawdown (MLL): 25K $1.000 · 50K $2.000 · 100K $3.000 · 150K $4.500
- Daily Loss Guard: 25K $500 · 50K $1.000 · 100K $2.000 · 150K $3.000
- Consistencia: 20%
- Límite de posiciones: 25K 2 minis / 20 micros · 50K 4 / 40 · 100K 8 / 80 · 150K 10 / 100
- Scaling plan: no aplica
- Profit split: 90%
- Reset: sin dato

## Cómo funciona el drawdown (MLL)
Artículo: Maximum Loss Limit (15/07/2026)
- Es trailing de fin de día (EOD): se calcula con el máximo del balance al cierre de cada día, no con el flotante intradía
- Se traba: cuando el MLL llega al balance inicial deja de seguir subiendo
- Si se rompe en evaluación: la cuenta ya no puede pasar a qualified (se compra un reset o se espera el próximo cobro mensual)
- Si se rompe en qualified: se cierra la cuenta

## Daily Loss Guard
Artículo: Daily Loss Guard (15/07/2026)
- Al activarse cierra todas las posiciones, cancela órdenes pendientes y bloquea nuevas operaciones hasta el próximo día de trading
- Se calcula con P&L realizado + no realizado, con comisiones simuladas
- Nota: el artículo del Daily Loss Guard dice que aplica a Zero y que Advanced no tiene límite. Los overviews de Standard y Direct también lo listan. Revisar si hay discrepancia entre artículos

## Consistencia
Artículo: Consistency Rule (27/07/2026)
- Evaluación: Advanced 40%, Standard 50%, Zero ninguna
- Qualified: Zero y Standard 40%, Direct 20%, Advanced ninguna
- Cálculo en qualified: el mejor día no puede ser igual o mayor al porcentaje de la ganancia neta acumulada desde el último retiro
- Si se supera no se rompe la cuenta, pero no se puede pedir retiro. Se reinicia entre retiros

## Payouts (todas las cuentas qualified)
Artículo: Payout Policy (27/07/2026)
- Frecuencia: hasta 4 veces por mes
- Requisito: 5 días ganadores entre retiros (no tienen que ser seguidos). Los overviews piden que cada día ganador sea de $200 o más
- Monto: hasta el 50% de la ganancia de la cuenta por pedido
- Profit split: el trader recibe el 90% de lo retirado

| Plan | Mínimo | Máximo |
|---|---|---|
| Zero | $200 | 25K $1.000 · 50K $1.500 · 100K $2.500 |
| Standard | $500 | 50K $3.000 · 100K $4.000 · 150K $5.000 |
| Advanced | $1.000 | $15.000 |
| Direct | $500 | 25K $1.000 · 50K $2.000 · 100K $2.500 · 150K $3.000 |

Direct además exige un objetivo de ganancia para cada retiro, que se reinicia después de cada uno (la ganancia anterior no se arrastra):

| Direct | Primer retiro | Siguientes |
|---|---|---|
| 25K | $1.500 | $1.000 |
| 50K | $3.000 | $2.000 |
| 100K | $6.000 | $4.000 |
| 150K | $9.000 | $6.000 |

## Suscripción mensual (cuentas de evaluación)
Artículo: Monthly Subscription (12/08/2026)
- La evaluación se cobra todos los meses desde el día de alta hasta que se pasa o se cancela desde Billing en el dashboard
- Si se falla, la cuenta se resetea a una nueva con el balance inicial, y el cobro mensual sigue igual
- No hay límite de tiempo para pasar la evaluación
- Un reset de evaluación no cambia la fecha de cobro

## Noticias y operativa
Artículo: News Trading Policy (27/07/2026)
- Evaluaciones: sin restricciones
- Advanced qualified: sin restricciones (no se permiten enfoques de "todo o nada" en eventos volátiles)
- Direct, Standard y Zero qualified: no se pueden ejecutar órdenes 2 minutos antes ni 2 minutos después de noticias de alto impacto (carpeta roja de ForexFactory). Violación: se anulan ganancias y se niegan payouts. Primera vez advertencia, después se rompe la cuenta

## Qué y cuándo se opera
Artículo: What and When you can Trade (17/07/2026)
- Productos: CME, CBOT, NYMEX y COMEX, más cripto MBT y MET (cuentan como mini completo)
- Horario: 6PM a 5PM ET del día siguiente. Cerrado de viernes 5PM a domingo 6PM ET
- Cierre obligatorio: todas las posiciones se cierran antes de las 4:20PM ET

## Otras reglas
- Scaling plan (24/07/2026): solo Zero y Standard qualified. Los límites de posición suben en cinco escalones según la ganancia acumulada. Advanced y Direct no tienen
- Máximo de cuentas qualified (27/07/2026): Zero 5, Direct 5, Standard 5 (las compradas antes del 27/07/2026 tenían tope de 3), Advanced 3. Quien tiene una Advanced qualified activa queda limitado a 3 en total. Un usuario por persona y una persona por hogar
- Copy trading (17/07/2026): permitido si lo opera una sola persona, la titular de las cuentas. Prohibido el trading automatizado, grupal y reverso. Alpha no se hace responsable de fallas del copiador
- Inactividad (05/11/2025): hay que hacer al menos una operación cada 10 días de trading, en evaluación y qualified, o la plataforma archiva los datos de la cuenta

## Plataformas permitidas
Artículo: Trading Platforms
- AlphaTrader (plataforma propia, web y app móvil)
- TradingView (conexión vía Plus500)
- WealthCharts
- Deepchart (Volumetrica)
- Quantower (escritorio, datos dXFeed)
- La plataforma no se puede cambiar después de comprar
- NinjaTrader y Tradovate: ya no disponibles para cuentas nuevas desde el 12/07/2026 (ver noticias.md)

## Camino a Live
Artículo: Path to Live Structure (21/08/2026)
- Condiciones para que Alpha revise un pase a live: 5 performance fees en una sola cuenta qualified, muchas fees de por vida, rendimiento excepcional, o haber estado antes en Live o Alpha Prime
- Al pasar a live se cierran las cuentas qualified y se da una cuenta live por cada qualified elegible, con balance inicial $0
- Alpha Futures Live: 80% de profit split, retiros diarios sin límite
- Alpha Prime: 60% de profit split sobre lo retirado, salario mensual del 50% de las ganancias simuladas (máximo $75.000) repartido en 12 meses, más llamadas semanales con el equipo

## Historial de cambios
- 27/07/2026: Standard pasa de máximo 3 a 5 cuentas qualified (cuentas anteriores al 27/07/2026 tenían tope de 3)
- 08/07/2026: cuentas Advanced compradas desde esta fecha ya no pagan fee de activación (antes $149)
- 12/07/2026: se termina el acuerdo con NinjaTrader/Tradovate. Zero, Advanced y Direct pasan a AlphaTrader (ver noticias.md)
- 04/09/2026: TradingView vuelve como plataforma vía Plus500
