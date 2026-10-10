# Fondeados Club: estado del trabajo (noticias de firms y habilidades)

Guardado: 03/10/2026
Para retomar: leer este archivo primero. Todo lo de abajo es lo que quedó hecho y lo que falta.

## 1. Dónde está todo
- En tu compu: `FONDEADOS CLUB\noticias\<firm>\` con `firm.md`, `reglas.md` y `noticias.md` por firm
- En tu Drive privado, carpeta "Fondeados Club - Noticias" (id `10x5JnNzykEMby1neBuXnL8bO8WCWRbD8`), con una subcarpeta por firm y el archivo `fuentes-oficiales.md` en la raíz
- `noticias\fuentes-oficiales.md`: tabla de help center, blog, X y Discord de cada firm (también en el Drive)
- Limitación: en el Drive no puedo pisar el contenido de un archivo. Cada revisión es un archivo nuevo y el viejo va a `_versiones-anteriores` dentro de la carpeta de la firm. La copia local es la que se edita en el lugar y hay que mantener las dos iguales a mano
- La carpeta de Drive que figuraba en las instrucciones del proyecto (f2) es de otra persona. No la toqué

## 2. Firms hechas (con reglas, noticias y firm)
| Firm | Fecha de foto | Pendientes que quedaron |
|---|---|---|
| Alpha Futures | 03/10/2026 | Anuncio oficial del cierre del plan Premium (hoy sin confirmar); total que se paga de Premium después del primer lote; contradicción del Daily Loss Guard en Standard/Direct/Zero |
| Topstep | 03/10/2026 (segunda pasada) | Artículos sin leer (Professional Behavior, horarios de feriados, CME Velocity Logic, órdenes, datos L1/L2, Practice Account, límites de resets, impuestos, verificación de identidad, TopstepX); precios y reglas de los Labs nuevos; split de la cuenta Live; anuncio oficial de abril 2026 (topes de payout) y de enero 2026 (90/10) |
| Apex Trader Funding | 03/10/2026 | Prohibited Activities (dio error 503); precios y activación oficiales (hoy de un tercero); anuncio oficial del 01/03/2026; tabla de payouts Intraday; artículos Legacy y otros sin leer |
| Lucid Trading | 03/10/2026 | Precios oficiales de Flex, Pro y Direct y del reset; fecha oficial de LucidDaily y LucidMaxx; si la restricción de cripto del 26/08/2026 es real; DLL de Flex; artículos Legacy y LucidBlack |
| Tradeify | 03/10/2026 | Drawdown vigente de Lightning 150K ($5.250 o $6.100, los artículos no coinciden); anuncio oficial del 29/07/2026 (microscalping); qué precios cambiaron el 01/09/2026; artículos sin leer (Plane Payouts, KYC, Elite en detalle, etc.) |

## 3. Firms que faltan (en el orden de la lista de la app)
Take Profit Trader, My Funded Futures, FundedNext Futures, TradeDay, Bulenox, The Futures Desk, Day Traders, BluSky, Phidias, Legends, Blue Guardian, Earn2Trade, Elite Trader Funding, Leeloo.
Los links de ayuda, blog, X y Discord de estas ya están en `fuentes-oficiales.md`.

Firms sin fuentes relevadas (la lectura de la web falló, hay que revisarlas a mano): TickTick Trader, Purdia Capital, Funded Futures Network, FundingTicks.

Notas de la lista: Blue Guardian ofrece futuros dentro de su sitio general (no hay sitio aparte); Elite Trader Funding cambió de dominio a elitetraderfunding.app; Earn2Trade sigue ofreciendo futuros.

## 4. Cómo se releva cada firm (el método que veníamos usando)
1. Abrir help center, blog y home de la firm. Fuente oficial primero
2. Leer los artículos de reglas, payouts, precios, drawdown, conducta y países. Anotar la fecha de "última actualización" de cada uno
3. Buscar notas de terceros solo como radar y siempre rotuladas ("nota de terceros")
4. Escribir `firm.md` (datos y links), `reglas.md` (foto de reglas por plan, con lista de artículos sin leer) y `noticias.md` (de más nueva a más vieja, con tipo de fuente)
5. Guardar en la compu, subir al Drive y comparar tamaños
6. Reglas fijas: no inventar el "antes" (decir "sin dato del valor anterior"), no guardar promos ni banners, marcar contradicciones entre artículos, marcar lo que no pude leer (X y Discord no se pueden leer)

## 5. Habilidad de noticias de firms: lo definido y lo que falta
Definido:
- Estructura de la noticia: (1) etiqueta y firm, (2) titular, (3) un solo párrafo que explique qué cambió, cómo era antes y desde cuándo o a quién aplica, (6) fuente y fecha. Sin campo de confianza: la fuente oficial la pasás vos
- Fuente oficial primero. Terceros solo como aviso. Nunca se publica solo
- La "foto" de reglas de cada firm sirve de línea base para saber qué cambió
- Si faltan las carpetas de la firm, la habilidad las crea. Si hay varias carpetas conectadas, pregunta cuál
- Ubicación decidida: `noticias\<firm>\` en la compu y la misma estructura en el Drive

Falta decidir:
- Lista de etiquetas (por ejemplo reglas, precio, payout, plataforma, promo, cierre) y largo del párrafo
- Idioma y tono del texto de la noticia (español neutro o argentino)
- Dónde se publica la noticia (canal de la comunidad, formato final) y quién la aprueba
- Si se arma una tarea programada que revise las firms (y con qué frecuencia) o si se hace a pedido. Hoy no hay scraper; solo puedo leer web, no X ni Discord
- Dónde vive la línea base a largo plazo (Git o Drive) y si se commitea `noticias\` o va en `.gitignore`. Las tareas programadas corren en una sesión nueva y solo leen archivos locales si la compu está prendida
- Qué hacer con las notas que dependen de X o Discord: vos pasás el link o el texto

## 6. Habilidad de guiones de Reels: lo definido y lo que falta
Definido:
- Formato de tus videos: 9:16, de 9 a 14 segundos, figura con capucha, ambiente oscuro de setup, una frase corta en serif por pantalla
- Estructura: gancho (hook), tensión, prueba (certificado)
- Método: mismo cuerpo y mismo cierre con distintos hooks. Se suben como reels de prueba y el que tenga más visualizaciones e interacción pasa al feed real
- El audio tiene que ser el mismo en todas las variantes. No puedo ver la biblioteca de audios de Instagram
- Videos de referencia que mandaste: Video FAIL.mp4, WhatsApp Video 2026-10-03 at 00.14.48.mp4 y Video 2.mp4

Falta decidir:
- Tono del texto: español neutro (como tus videos) o argentino. No respondiste
- Si querés que analice el BPM y los picos de los 3 videos para sugerir un audio que encaje
- Cómo querés recibir el guion (formato por pantalla, cantidad de hooks por tanda) y confirmar el método que te expliqué
- Cómo se guarda cada tanda y qué se mide en cada reel de prueba
- Crear la habilidad con `propose_skills` una vez resuelto lo de arriba (una habilidad no crea carpetas sola)

## 7. Siguiente paso sugerido
Cuando retomemos: confirmar cuál seguís primero (la siguiente firm, Take Profit Trader, o cerrar las decisiones de la sección 5 para crear la habilidad de noticias), y después la de guiones.
