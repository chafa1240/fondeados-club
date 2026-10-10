# Apex Trader Funding: reglas

Fuente oficial: https://apextraderfunding.com/help-center/ (categorías EOD Trailing Drawdown, Intraday Trailing Drawdown, Getting Started, Billing, Legacy Products)
Foto tomada: 03/10/2026
Última revisión: 03/10/2026
Estado: operativa

Cada dato sale del help center oficial. Al lado de cada artículo va la fecha de última modificación que muestra su metadato (no siempre coincide con la fecha del cambio de la regla). Lo que no encontré dice "sin dato". Lo que viene de una nota de terceros lo digo expresamente.

## Cómo es el programa
- Evaluación de pago único → Performance Account (PA) simulada, previo pago de la tarifa de activación
- Dos caminos: EOD Trailing Drawdown e Intraday Trailing Drawdown. Los dos con tamaños 25K, 50K, 100K y 150K
- Todas las cuentas son simuladas ("Simulated Funded")
- Productos Legacy: se retiraron el 01/03/2026 (ver más abajo)

## Evaluación EOD
Artículo: EOD Evaluations (05/06/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Profit target | $1.500 | $3.000 | $6.000 | $9.000 |
| Drawdown EOD (máx.) | $1.000 | $2.000 | $3.000 | $4.000 |
| Daily Loss Limit | $500 | $1.000 | $1.500 | $2.000 |
| Contratos máximos | 4 | 6 | 8 | 12 |

- Acceso: 30 días corridos, incluidos fines de semana y feriados. Vence a las 6:00 PM ET del día 30, sin extensiones
- Mínimo de días de trading: ninguno (se puede pasar en un día)
- Consistencia y scaling: no se aplican en la evaluación
- El Daily Loss Limit pausa el trading pero no hace fallar la evaluación
- Falla la evaluación si el balance toca o cae por debajo del umbral EOD: se liquidan las posiciones
- Hedgear entre evaluaciones está prohibido; hay que operar de forma independiente y direccional
- Día de trading: se reinicia a las 6:00 PM ET

## Evaluación Intraday
Artículo: Intraday Trailing Drawdown Evaluations (28/04/2026)
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Profit target | $1.500 | $3.000 | $6.000 | $9.000 |
| Drawdown intraday (máx.) | $1.000 | $2.000 | $3.000 | $4.000 |
| Contratos máximos | 4 | 6 | 8 | 12 |

- Acceso: 30 días corridos
- Mínimo de días de trading: ninguno
- No tiene Daily Loss Limit
- Contratos fijos (sin scaling en la evaluación). Consistencia: no se aplica

## Cómo funciona el drawdown
### EOD (artículo EOD Drawdown Explained, 28/04/2026)
- El umbral se recalcula una vez por día a las 4:59:59 PM ET según el balance de cierre: balance de cierre más alto menos el drawdown máximo
- Solo sube, nunca baja. Se aplica en tiempo real durante la sesión siguiente
- Si el balance toca o cae por debajo del umbral, se liquidan todas las posiciones. La evaluación falla y la PA se cierra
- Dónde deja de subir: en la PA, en balance inicial + $100 (50K: $50.100). En evaluaciones con Rithmic o WealthCharts, al llegar al objetivo de ganancia (50K: $53.000). En evaluaciones con Tradovate sigue subiendo sin tope con el balance máximo de cierre

### Intraday (artículo Intraday Trailing Drawdown Explained, 28/04/2026)
- Fija el balance más bajo que se puede tocar en cualquier momento de la sesión
- El pico incluye ganancias realizadas y no realizadas. El umbral sube de inmediato, sin necesidad de cerrar el trade. Solo sube y no se reinicia por día
- Si se toca, se liquidan las posiciones: la evaluación falla y la PA se cierra
- Dónde deja de subir: en la PA, en balance inicial + $100. En evaluaciones con Rithmic o WealthCharts, el artículo dice "Profit Target Balance + $2,000". En evaluaciones con Tradovate sigue sin tope con el pico de balance

## Performance Account (PA)
Pasar la evaluación no activa la PA sola:
- Hay 7 días corridos desde que la evaluación figura como "Passed" (después de las 6 PM ET) para pagar la tarifa de activación. No se extiende bajo ninguna circunstancia. Si vence, se pierde para siempre
- La tarifa de activación es un pago único por cuenta, no se reembolsa ni se transfiere. La PA se crea hasta 6 horas después del pago. Si se paga después del cierre del viernes, se crea el domingo 6 PM ET
- Monto de la tarifa de activación: el help center no lo publica. Ver "Precios" más abajo (nota de terceros)

Parámetros (artículos EOD Performance Accounts, 28/04/2026, e Intraday PA, 21/05/2026):
| | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| Drawdown (EOD o intraday) | $1.000 | $2.000 | $3.000 | $4.000 |
| Contratos máximos | 2 | 4 | 6 | 10 |

- Scaling por niveles: la cantidad de contratos sube según el balance de fin de día. Los escalones exactos no los leí
- Daily Loss Limit: por niveles (tier based). Al tocarlo se pausa el trading el resto de la sesión. Montos por nivel: sin dato
- Hasta 20 PAs activas al mismo tiempo, sumando todos los tipos
- Consistencia para mantener activa la cuenta (Intraday PA): al menos dos días de $50 de ganancia neta en 30 días corridos consecutivos. Ver inactividad más abajo
- El artículo de la PA EOD no menciona activación ni consistencia: se aclaran en los artículos de payouts y de billing

## Payouts
Artículos: EOD Payouts (28/04/2026), Intraday Trailing Drawdown Payouts (28/04/2026)
- Profit split: 100%
- Mínimo por pedido: $500
- Frecuencia: hasta un pago por semana
- Máximo 6 payouts aprobados por PA
- Mínimo 5 días de trading calificados (no hace falta que sean seguidos). Cada día tiene que cumplir una ganancia mínima:
| Ganancia mínima por día | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| EOD | $100 | $250 | $300 | $350 |
| Intraday | $100 | $200 | $250 | $300 |
- Consistencia 50%: ningún día ganador puede ser el 50% o más de la ganancia total desde el último payout aprobado
- Safety Net: el límite de drawdown más $100. Hay que mantenerlo toda la vida de la cuenta
- Balance mínimo para pedir (Intraday): balance inicial + safety net + $500 (25K $26.600 · 50K $52.600 · 100K $103.600 · 150K $154.600)
- Máximo por pedido en EOD, según el número de payout:
| Payout | 25K | 50K | 100K | 150K |
|---|---|---|---|---|
| 1 | $1.000 | $1.500 | $2.000 | $2.500 |
| 2 | $1.000 | $1.500 | $2.500 | $3.000 |
| 3 | $1.000 | $2.000 | $2.500 | $3.000 |
| 4 | $1.000 | $2.500 | $3.000 | $3.000 |
| 5 | $1.000 | $2.500 | $4.000 | $4.000 |
| 6 | $1.000 | $3.000 | $4.000 | $5.000 |
- Máximo por pedido en Intraday: el artículo solo da rangos para los 6 payouts: 25K $1.000 · 50K $1.500 a $3.000 · 100K $2.000 a $4.000 · 150K $2.500 a $5.000. No vi la tabla payout por payout de este camino
- Métodos de retiro: no los especifican en estos artículos (sin dato)

## Violaciones y payouts (Early Account Update Notifications, 31/07/2026)
- Cuando hay una violación de reglas, el trader recibe una alerta informativa
- Los pedidos de payout se suspenden 8 días de trading después de la violación
- Se eliminan las ganancias del día de la violación
- La elegibilidad de payout queda limitada a las ganancias posteriores a la violación, hasta cumplir las condiciones de payout máximo
- El trading sigue normal: solo se restringe el payout
- El artículo no dice desde cuándo rige

## Inactividad en PA
Artículo: Inactivity Policy on Performance Accounts (11/09/2026)
- Hay que lograr al menos 2 días de trading con $50 o más de ganancia neta en cada ventana móvil de 30 días (cuenta fines de semana y feriados)
- Día 15 sin cumplir: la cuenta pasa a fase dormida y empiezan los avisos. Día 20: aviso final. Día 30: se cierra para siempre
- Al cerrarse se pierde cualquier recompensa acumulada y la elegibilidad de payout
- Los días en equilibrio no cuentan. Operar sin llegar a $50 no evita el cierre
- Aplica a todas las PA Intraday y EOD, y a las cuentas Legacy promocionales compradas después del 01/03/2026

## Precios (NOTA DE TERCEROS)
El help center oficial dice que la evaluación es de pago único y que existe un código con descuento, pero no publica los montos. La nota de ProPTradingVibes del 10/08/2026 (dice haberlo cotejado con el sitio) los lista así:
| | Eval EOD | Eval Intraday | Activación EOD | Activación Intraday |
|---|---|---|---|---|
| 25K | $390 | $167 | $99 | $69 |
| 50K | $490 | $249 | $129 | $79 |
| 100K | $790 | $399 | $139 | $99 |
| 150K | $1.490 | $599 | $159 | $129 |
- Según la misma nota, hay también una opción "No Activation Fee" con otro precio de compra. No tengo esos montos
- Sin descuentos: son los precios de lista que reporta la nota. Verificar en el checkout antes de decirle un precio a alguien

## Reembolsos y billing
Artículos: Refund Policy (15/04/2026), Evaluation Plan Fees and Access Explained (25/06/2026)
- Sin reembolsos, totales ni parciales, de ninguna compra de la web. Tampoco de la activación de PA, datos, market depth ni sesiones extra
- Sin resets: si falla la evaluación hay que comprar otra
- Pago único, sin renovación automática. La evaluación simplemente vence sin recobro
- Si alguien eligió mal el plan, puede mantener el actual hasta que venza o comprar otro
- Hay un artículo de Evaluation Bundle (5 Pack) y otro de Coupon Codes que no leí

## Qué y cuándo se opera
Artículo: Futures Trading Times (20/04/2026)
- Todas las posiciones tienen que estar cerradas antes de las 4:59 PM ET
- Reapertura: 6:00 PM ET
- Día de trading: de 6 PM ET a 4:59 PM ET del día siguiente
- Agrícolas cierran antes: entre 2:05 PM ET (ganado y cerdos) y 2:20 PM ET (granos). Resto (índices, divisas, energía, metales, micros y cripto micro) cierra a las 5 PM ET

## Plataformas
Artículo: Choosing the Right Platform (16/04/2026)
- Rithmic (en Mac requiere máquina virtual de Windows), Tradovate y WealthCharts
- Data feeds: sin dato

## Países
Artículo: Restricted Countries (10/09/2026)
- Argentina no figura en la lista de países restringidos (unos 130 países)
- Los restringidos incluyen, entre otros, Afganistán, Argelia, China, Cuba, Irán, Irak, Corea del Norte, Rusia, Siria y Yemen

## Conducta
Artículo: Code of Conduct (15/04/2026)
- Evalúa profesionalismo, cumplimiento, resolución de problemas y manejo del riesgo, con foco en que sea una "asociación"
- No define sanciones concretas
- Prohibited Activities (https://apextraderfunding.com/help-center/getting-started/prohibited-activities/): no pude abrirlo (error 503 del sitio en cada intento). Pendiente

## Productos Legacy
Artículo: Legacy Products Overview (21/07/2026)
- Son las versiones anteriores de Evaluation y Performance Accounts, retiradas el 01/03/2026
- No se pueden comprar. Las cuentas compradas antes de esa fecha siguen con sus reglas originales, sin cambios retroactivos
- No pasan a las cuentas Intraday ni EOD nuevas. Una evaluación Legacy sí puede pasar a una PA Legacy
- Los resets existen solo para evaluaciones Legacy
- Las PA Legacy siguen el esquema anterior de payout, llamado "Legacy Payouts". No leí esos artículos

## Artículos sin leer
Prohibited Activities (error 503), User Summary and Trade Violations, Apex Live Prop Trading Program FAQ, Evaluation Bundle (5 Pack), Coupon Codes, Payment Methods, Accessing Invoices, Legacy Evaluation Accounts, Legacy Payouts, Legacy Trailing Drawdown, Legacy PA Trading Rules.

## Historial de cambios
- 01/03/2026: sale la nueva estructura (EOD e Intraday, pago único, sin resets) y se retiran los productos Legacy (ver noticias.md)
- Esta es la primera foto completa. Para saber qué cambió desde ahora hay que comparar contra ella
