# Fondeados Club — Plan hasta el MVP (y más allá)

Definido 2026-08-16, reordenado el mismo día para publicar temprano. Se
sigue **paso a paso**, confirmando antes de ejecutar cada uno. Cada paso
termina en algo que se pueda ver funcionando.

---

## FASE 0 — Dónde estamos (hecho)

- Supabase con las 3 tablas (`cuentas_fondeo`, `gastos`, `payouts`) + RLS.
- Repo en GitHub (`chafa1240/fondeados-club`).
- Next.js 14 + TypeScript + Tailwind corriendo en `localhost:3000`,
  conectado a Supabase.

---

## FASE 1 — MVP (el objetivo actual)

Todo lo de esta fase es **gratis y sin publicidad activa**. El objetivo es
tener algo usable por vos y por un puñado de traders para validar la idea.

### Paso 1 — Login y registro ✅ HECHO (2026-08-16)
Sin esto no funciona nada más: las reglas de RLS de Supabase dependen de
que haya un usuario logueado (`auth.uid()`).

- ✅ Pantallas de login, registro, recuperar contraseña y nueva contraseña.
- ✅ Login con **email + contraseña**, con confirmación de email activada.
  (Google se puede agregar más adelante si baja la conversión).
- ✅ Middleware que protege las páginas privadas: sin sesión, al login.
- ✅ Probado de punta a punta: registro → email de confirmación → dentro.

Archivos: `src/middleware.ts`, `src/lib/supabase/middleware.ts`,
`src/app/login/`, `src/app/registro/`, `src/app/recuperar/`,
`src/app/nueva-password/`, `src/app/auth/confirmar/`,
`src/components/auth-ui.tsx`.

**Pendiente menor:** al publicar (Paso 2) hay que agregar la URL de
producción en Supabase → Authentication → URL Configuration, si no los
links de los emails siguen apuntando a `localhost`.

### Paso 2 — Publicar en internet (deploy en Vercel) ✅ HECHO (2026-08-16)

- ✅ Repo de GitHub conectado a Vercel (plan Hobby / gratis). Cada push a
  `main` se publica solo en 1-2 minutos.
- ✅ Variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  cargadas en Vercel.
- ✅ **URL de producción: https://fondeados-club.vercel.app**
- ✅ Supabase → Authentication → URL Configuration: Site URL apuntando a la
  URL de producción, y Redirect URLs con `https://fondeados-club.vercel.app/**`
  y `http://localhost:3000/**` (para seguir probando en local).
- ✅ Probado: login funciona desde el sitio publicado.
- ✅ **Registro cerrado**: "Allow new users to sign up" desactivado en
  Supabase. Para sumar gente: Authentication → Users → Invite user. Se
  reabre con un clic cuando el MVP esté listo.

De acá en adelante, cada sección se construye contra el sitio publicado.
El dominio propio se compra en el Paso 8.

### Paso 3 — Layout general de la app ✅ HECHO (2026-08-16)

- ✅ Menú lateral con **Home / Funding Manager / Cuentas** (ese orden),
  que en celular se convierte en botón hamburguesa.
- ✅ Header con el email del usuario y botón de salir.
- ✅ Estilo visual base (tema oscuro, tarjetas, verde esmeralda de acento).
- ✅ Las 3 rutas creadas y navegables, con placeholder cada una.
- ✅ **`<AdSlot />` reservado** en dos lugares (banner al pie del contenido
  y lateral en pantallas grandes). Hoy no ocupa ni un píxel.

Archivos: `src/app/(app)/layout.tsx`, `src/app/(app)/page.tsx`,
`src/app/(app)/cuentas/`, `src/app/(app)/funding-manager/`,
`src/components/nav.tsx`, `ad-slot.tsx`, `seccion.tsx`.

Interruptores de publicidad (variables de entorno, hoy sin definir):
`NEXT_PUBLIC_ADS_ENABLED=true` enciende avisos reales,
`NEXT_PUBLIC_ADS_DEBUG=true` muestra los huecos marcados para revisar
que no molesten.

### Paso 4 — Sección Cuentas (el corazón del MVP) ✅ HECHO (2026-08-16)

- ✅ Listado de cuentas en tarjetas: nombre, firm, estado con color, balance
  actual, variación desde el balance base, anillo de "% al payout" y datos
  del ciclo (balance base, drawdown máx., profit split, objetivo, "no bajar
  de", fecha de inicio).
- ✅ Modal "Nueva cuenta" con todos los campos, incluido el **drawdown que
  se calcula solo** entre % y $ usando el tamaño de cuenta.
- ✅ Editar cuenta, cambiar estado (menú ⋯), archivar (estado `archivada`)
  y eliminar con confirmación.
- ✅ Filtros: Activas/Archivadas y por Firm (el selector de firm aparece
  recién cuando hay más de una).
- ✅ Sugerencia automática de nombre ("PA1", "PA2", …).
- ✅ **Balance actual editable en línea** desde la propia tarjeta: se carga
  a mano, no se deduce de los payouts (decisión 2026-08-16).
- ✅ Estados vacíos ("todavía no cargaste ninguna cuenta") y mensajes de
  error en castellano.

Archivos: `src/lib/cuentas.ts` (tipos y todos los cálculos, separados de
las pantallas para poder reusarlos en la app móvil),
`src/app/(app)/cuentas/page.tsx` y `actions.ts`,
`src/components/cuentas/cuentas-vista.tsx`, `tarjeta-cuenta.tsx`,
`modal-cuenta.tsx`.

**Resultado visible:** cargás tus cuentas reales y las ves en pantalla.

#### Paso 4b — Ajustes pedidos después de probarlo (2026-08-16)
Migración `supabase/002_tipos_y_salud.sql`.

- **Tipo de cuenta**: `fondeada` | `challenge`. En pantalla se llaman
  **Fondeada** y **Evaluación** (el valor `challenge` queda en la base para
  no migrar datos). La evaluación **no tiene** objetivo de retiro ni profit
  split: son cosas de una cuenta que ya cobra. Si una cuenta pasa de
  fondeada a evaluación, esos campos se limpian solos al guardar.
- **Profit target** (`supabase/003_profit_target.sql`): solo en
  evaluaciones. Cuánto hay que ganar para pasarla, en % del tamaño de
  cuenta o en $ (uno completa al otro). El anillo de la tarjeta mide el
  camino hasta ahí; en las fondeadas sigue midiendo hasta el balance que
  habilita el retiro. La función `anillo()` de `src/lib/cuentas.ts` decide
  cuál de los dos usar.
- **Objetivo de retiro partido en dos**: `objetivo_retiro` (cuánto querés
  sacar, ej. $500) y `balance_objetivo` (qué balance tiene que marcar la
  cuenta para poder sacarlo, ej. $2.600 en Apex). El anillo mide el camino
  desde el balance base hasta ese balance objetivo, y la tarjeta dice
  cuánto falta.
- **Semáforo automático**: Crítico / Precaución / Saludable ya no se
  eligen, se calculan con el colchón que queda hasta el drawdown máximo.
  Umbrales editables por cuenta (defaults 3% saludable, 2% precaución),
  cargables en % o en $ con cálculo automático entre ambos.
- **`estado` guarda solo lo manual**: `activa` (fondeada), `en_curso`
  (challenge), `passed`, `quemada`, `archivada`. Se fueron `precaucion` y
  `funded` de la base.
- Fix: los botones del menú ⋯ no ejecutaban la acción (cerrar el menú
  desmontaba el `<form>` antes del submit; ahora se llaman directo).

### Paso 4c — Drawdown: modos, congelamiento y pico ✅ HECHO (2026-08-17)
Insertado antes del Paso 5. Sale de cargar las cuentas reales de Apex y
descubrir que el modelo actual no sabe representar un trailing: el piso se
calcula fijo desde el balance base, así que la única forma de que el
número diera parecido en una fondeada congelada era cargar el drawdown en
**0%**. Spec completa en `CLAUDE.md`, sección **Drawdown**.

Qué entra:
- `modo_drawdown` (`estatico` | `eod` | `trailing`) en **los dos** tipos de
  cuenta, reemplazando a `tipo_drawdown` (que era solo de evaluaciones).
  EOD y trailing **los dos trailean**; cambia qué pico siguen (cierre
  diario vs. flotante intradía).
- `piso_congelado` (nullable): dónde se traba el trailing. En Apex,
  `tamaño + 100`. Se carga como balance.
- `pisoDrawdown()` pasa a `min(pico − dd, piso_congelado ?? ∞)`. Como
  `colchon()`, `salud()` y el semáforo cuelgan de ahí, se arreglan solos.
- El pico **no se guarda** como columna: la cuenta guarda la semilla
  (balance y pico al darla de alta en la app) y el pico se deriva de la
  serie. Guardarlo se rompe al editar historia.
- Formulario: desplegable de 3 + `%`/`USD` sincronizados + un tercer campo
  que es **el piso** en estático y **el piso congelado** en EOD/trailing.
  En los modos que trailean el piso actual se muestra calculado, no
  editable.
- Migración `008_drawdown_trailing.sql` (la 006 y la 007 ya estaban
  usadas), incluyendo arreglar las cuentas cargadas con 0% y borrar
  `tipo_drawdown`.
- La tarjeta dice hasta dónde puede caer la cuenta, si el drawdown ya se
  congeló o con qué balance se va a congelar, y **cuánto se puede retirar
  sin quedar en crítico**.

**Resultado visible:** el colchón y el semáforo dicen la verdad en cuentas
trailing, sin parches.

Migración corrida y verificada en la app el 2026-08-17.

Se probó mostrar en la tarjeta **cuánto se puede retirar sin quedar en
crítico** y se sacó: ensuciaba. `retiroMaximoSeguro()` queda en
`cuentas.ts` para las alertas del Paso 7.

### Paso 5 — Gastos y payouts
- Alta de gasto (con o sin cuenta asociada) y alta de payout.
- Listado/tabla de movimientos, filtrable por tipo y por cuenta.
- Editar y borrar movimientos.

**Dónde vive cada cosa (definido 2026-08-17).** El **Funding Manager es el
dueño de los datos**: ahí está la tabla completa, los filtros y (Paso 6)
los gráficos. Pero **cargar** también se puede desde la tarjeta de la
cuenta, porque ir a otra sección y elegir la cuenta de un desplegable es
incómodo cuando ya estás parado en ella:

- **Cuentas** (menú ⋯) → lo que pertenece a *esa* cuenta: reset,
  activación, precio de la evaluación, y el retiro que ya existe.
- **Funding Manager** → lo general (Rithmic, TradingView, lo que no es de
  ninguna cuenta), más ver todo junto, filtrar, editar y borrar.

**Dos puertas, una sola cocina.** Los dos caminos llaman a la **misma
server action**. Nada de un alta paralela: `registrarRetiro()` ya inserta
en `payouts` **y** descuenta del balance en la misma acción, y si se
escribiera una segunda versión, tarde o temprano una de las dos se olvida
de descontar y las cuentas dejan de cuadrar. El alta general es la misma
función con un selector de cuenta arriba.

**Movimientos automáticos** (resuelto 2026-08-17). Tres números viven en
`cuentas_fondeo` y no en `gastos`/`payouts`, pero son plata que se movió:
`precio` (lo que costó la evaluación), `fee_activacion` y
`retiros_previos`. Se decidió **derivarlos, no copiarlos**: no se crean
filas en `gastos` al guardar la cuenta, sino que `movimientosDeCuentas()`
los arma al vuelo y entran en la lista y en los totales.

Por qué así y no creando filas: copiarlos deja dos fuentes para el mismo
dato y hay que mantenerlas sincronizadas en el alta, la edición y el
borrado — el clásico lugar donde aparecen duplicados. Derivados, el número
vive en un solo lado (la cuenta) y esto es una vista.

En la tabla se marcan con "desde la cuenta" y no tienen editar ni borrar:
se cambian en el formulario de la cuenta. Se les pone la `fecha_inicio` de
la cuenta, que es cuando efectivamente se pagó.

No hace falta migración: `gastos` y `payouts` ya existen desde
`schema.sql`, con RLS y expuestas en la API.

**Resultado visible:** cargás lo que gastaste y lo que cobraste.

### Paso 5b — Resultados diarios ✅ HECHO (2026-08-18)
Agregado al MVP a pedido del usuario, después del Paso 5.

Tabla nueva `resultados_diarios`: una fila por **día y cuenta**, con
`fecha`, `cuenta_id`, `resultado_monto` (el neto del día en $, puede ser
negativo), `resultado_pct` y `notas`. Se carga **uno de los dos** (monto o
%) y el otro se completa solo, igual que el drawdown (2026-08-16: se
descartó contar cantidad de TP y SL por día, es más simple así).
Índice único por (`cuenta_id`, `fecha`) para no cargar el mismo día dos veces.

**El balance pasa a calcularse solo**: `balance_actual` = balance base +
suma de los resultados diarios de esa cuenta. Esto reemplaza la carga
manual del Paso 4:
- Se saca la edición en línea del balance de la tarjeta (o se convierte en
  "ajuste manual" con su propia fila de resultado, para que los números
  nunca se contradigan).
- Hay que decidir si `cuentas_fondeo.balance_actual` se mantiene como
  columna actualizada por trigger, o se calcula al vuelo con una vista.
  Con trigger es más simple de leer desde la app móvil.

**Máximo del día** (agregado 2026-08-17): campo `pico_dia` nullable en la
fila diaria, cargado como **delta** ("+800"). Los resultados diarios mueven
el **balance**; el máximo del día mueve **solo el piso del drawdown**, no
se tocan entre sí. Aparece únicamente en cuentas `trailing` y solo
mientras el trailing siga vivo (una vez congelada la cuenta desaparece
solo). Va también en días perdedores — el caso de +600 flotante que cierra
en −300 es justo el que más te acerca a quemarte. Vacío = se usa el
cierre, no cero. Reglas completas en `CLAUDE.md`, sección **Drawdown**.

Depende del Paso 4c: sin `modo_drawdown` y sin el pico, este campo no
tiene dónde apoyarse.

**Decisiones al implementarlo (2026-08-18):**
- **Una fila por día**, con el neto. Se descartó contar TP y SL por día y
  también el journal operación por operación.
- Monto y % **sincronizados**, como el drawdown.
- El balance **se calcula** (ver `CLAUDE.md`, sección *Resultados diarios*).
  Los retiros dejaron de descontar del balance a mano.
- **Semilla por cuenta**: se arranca desde el balance de hoy y se puede
  agregar historia después; los días viejos reconstruyen la curva hacia
  atrás sin mover el presente.
- Se carga desde el botón **`+ Día`** de la tarjeta (y de cada fila en la
  vista lista) o desde el ⋯. En las fondeadas hay además un botón
  **`Retiro`**; en las evaluaciones no, porque ahí no se puede retirar.

**Queda para el Paso 6** (las funciones ya están en `src/lib/resultados.ts`,
falta la pantalla): gráfico de balance vs. piso, rachas y ratio de días
ganadores/perdedores.

Lo que habilita: rachas, días ganadores vs perdedores, ratio TP/SL,
alertas de "estás cerca del drawdown" con datos reales, y el gráfico
**balance vs. piso** día a día (con el modelo viejo era una recta inútil).

**Sigue fuera del MVP** el journal trade por trade (instrumento, entrada,
salida): esto es un resumen del día, no un registro de cada operación.

### Paso 6 — Funding Manager
- Cards de resumen: Total Invertido, Total Cobrado, P&L Neto, ROI %,
  Cuentas activas.
- Gráficos: Invertido vs Payouts en el tiempo, P&L neto acumulado,
  gastos por categoría, resultados por firm.
- Tabla de movimientos completa.

**Resultado visible:** ves de un vistazo si estás ganando o perdiendo plata.

### Paso 7 — Home
Recién ahora tiene sentido definirla en detalle, porque ya sabemos qué
datos existen. Idea: resumen de lo más importante + alertas (drawdown
cerca del límite, cuenta lista para payout) + accesos rápidos.

**Resultado visible:** la pantalla que ves al entrar.

### Paso 8 — Pulido, dominio y primeros usuarios
- Comprar el dominio (ej. `fondeadosclub.com`, ~10-15 USD/año) y apuntarlo
  a Vercel.
- Que se vea bien en el celular (responsive).
- Estados vacíos ("todavía no cargaste ninguna cuenta"), mensajes de error
  claros, pantallas de carga.
- Textos legales mínimos (términos y privacidad) — hacen falta después
  para cobrar y para publicidad.
- Invitar 5-10 traders a usarla y escuchar qué les falta.

### Paso 8b — Inglés (definido 2026-08-16)
La app se hace **en español**; el inglés se agrega con un selector de
idioma. Se deja para el final del MVP porque los textos todavía cambian
mucho y traducir dos veces es trabajo perdido.

- Todos los textos visibles salen de un archivo de traducciones
  (`src/i18n/es.ts` y `en.ts`) en vez de estar escritos dentro de cada
  pantalla. **Esto se respeta desde ahora**, aunque el selector no exista:
  si no, después hay que reescribir todos los componentes.
- Selector de idioma en el header, con la elección guardada por usuario.
- Ojo con los formatos: fechas y montos también cambian según el idioma
  (ya está centralizado en `plata()`, `porcentaje()` y `fechaCorta()` de
  `src/lib/cuentas.ts`).

**FIN DEL MVP.** A partir de acá se decide en base a lo que digan los usuarios.

---

## Publicidad: se prepara en el MVP, se enciende después

Decisión importante para no tener que rehacer el diseño más adelante: los
espacios de publicidad se **dejan reservados desde el Paso 3**, aunque no
muestren nada todavía.

Cómo se hace:
- Se crea un componente `<AdSlot />` que se coloca en los lugares
  previstos (banner lateral, entre secciones) — **nunca tapando datos ni
  encima de botones**.
- Ese componente se controla con un interruptor global: hoy no muestra
  nada, el día que se active empieza a mostrar avisos.
- Más adelante, ese mismo componente devuelve vacío para usuarios premium.
  Así "sacar la publicidad al premium" es un cambio de una línea, no un
  rediseño.

Por qué no encenderla ya: AdSense pide un sitio con contenido y tráfico
real para aprobarte, y con pocos usuarios genera centavos mientras empeora
la experiencia justo cuando más necesitás que la gente se quede. Se
enciende en la Fase 2, pero el lugar ya va a estar listo.

---

## FASE 2 — Monetización (después del MVP)

No se arranca hasta que haya usuarios usando la app de verdad.

### Paso 9 — Encender la publicidad
- Dar de alta Google AdSense y conectar los `<AdSlot />` ya existentes.
- Ajustar cuántos avisos y dónde, mirando que no molesten.

### Paso 10 — Suscripción premium (Stripe)
- Tabla `suscripciones` en Supabase y campo de plan por usuario.
- Stripe Checkout + webhook que actualiza el plan cuando alguien paga o
  cancela.
- Página de precios y portal para gestionar/cancelar la suscripción.

### Paso 11 — Separar gratis vs premium
Lo definido hasta hoy como premium:
- **Sin publicidad** (los `<AdSlot />` devuelven vacío).
- Analytics avanzado (ROI neto de fees, comparativa entre firms,
  consistencia, tasa de aprobación histórica).
- Alertas (drawdown cerca del límite, vencimiento de challenge, día de pago).
- Export / reportes.
- Multi-moneda avanzada.
- Acceso a la comunidad privada (Discord).

Punto importante: **lo que ya era gratis se queda gratis**. Lo premium se
construye como features nuevas encima, para no enojar a los primeros
usuarios.

### Paso 12 — Comunidad
- Servidor de Discord con canal privado para suscriptores.
- Verificación automática: quien paga, entra.

---

## FASE 3 — App móvil (Android + iOS)

### Paso 13 — PWA primero (barato y rápido)
Antes de encarar una app nativa: convertir la web en PWA para que se
pueda "instalar" desde el navegador y se vea como una app. Cubre gran
parte de la necesidad con muy poco trabajo, y sirve para medir cuánta
gente la usa desde el celular.

### Paso 14 — App nativa (React Native + Expo)
Si la demanda lo justifica. La gran ventaja de cómo está armado esto: la
app móvil usa **la misma base de datos de Supabase**, el mismo login y
las mismas reglas de seguridad. No hay que rehacer el backend, solo las
pantallas.

- Publicación en Google Play (~25 USD pago único) y App Store
  (~99 USD/año).
- Ojo con los pagos: Apple y Google cobran comisión sobre suscripciones
  compradas dentro de la app. Estrategia habitual: que la suscripción se
  compre en la web.

**Decisiones que se toman durante el MVP para que esto sea fácil después:**
mantener la lógica de cálculos separada de las pantallas, y que todo lo
que la app necesita salga de Supabase (no de código que solo corre en el
servidor web).

---

## Costos estimados

| Momento | Concepto | Costo |
|---|---|---|
| MVP | Supabase, Vercel, GitHub | Gratis |
| MVP | Dominio (Paso 8) | ~10-15 USD/año |
| Fase 2 | Stripe | Comisión por venta (~3%) |
| Fase 2 | Supabase Pro (si crece) | ~25 USD/mes |
| Fase 3 | Google Play | ~25 USD (una vez) |
| Fase 3 | App Store | ~99 USD/año |

---

## Decisiones pendientes (a resolver cuando lleguemos)

1. **Login con Google además de email** — recomendado, pero requiere
   configurar credenciales en Google Cloud (10 min extra).
2. **Registro abierto o por invitación** al publicar en el Paso 2.
3. **Precio de la suscripción** — se define recién cuando haya usuarios.
4. **Cuándo encender la publicidad** — el lugar queda listo desde el MVP,
   pero conviene esperar a tener tráfico real.
