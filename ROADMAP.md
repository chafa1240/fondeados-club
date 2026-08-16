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

### Paso 3 — Layout general de la app
El "esqueleto" donde después entran las 3 secciones.

- Menú lateral con Home / Cuentas / Funding Manager.
- Header con tu usuario y botón de salir.
- Estilo visual base (tema oscuro, tipografía, colores, tarjetas).
- **Espacios de publicidad reservados desde el diseño** (ver más abajo).

**Resultado visible:** navegás entre las 3 secciones (vacías por ahora).

### Paso 4 — Sección Cuentas (el corazón del MVP)
- Listado de cuentas en tarjetas: nombre, firm, estado con color, balance
  actual, variación, anillo de "% al payout", datos del ciclo.
- Modal "Nueva cuenta" con todos los campos definidos (incluyendo el
  drawdown que se calcula solo entre % y $).
- Editar cuenta, cambiar estado, archivar, eliminar.
- Filtros: Activas/Archivadas, por Firm.
- Sugerencia automática de nombre ("PA1", "PA2", …).

**Resultado visible:** cargás tus cuentas reales y las ves en pantalla.

### Paso 5 — Gastos y payouts
- Alta de gasto (con o sin cuenta asociada) y alta de payout.
- Listado/tabla de movimientos, filtrable por tipo y por cuenta.
- Editar y borrar movimientos.

**Resultado visible:** cargás lo que gastaste y lo que cobraste.

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
