# Pendientes

**La lista viva de lo que falta.** Sin orden de prioridad: es un tablero
para ir sumando y tachando, no un plan.

Cómo se usa:

- Se **suma** acá apenas aparece algo, aunque sea una línea suelta.
- Se **tacha** cuando entra, con la fecha: `~~texto~~ ✅ 2026-08-30`.
- Lo que necesita explicación larga **no se explica acá**: va en
  `docs/ROADMAP.md` (el plan por pasos) o en `docs/LO-QUE-NOS-FALTA.md`
  (el research contra la competencia), y desde acá se linkea. Este archivo
  tiene que poder leerse de un vistazo — si crece a tres pantallas, dejó de
  servir.

Última actualización: **2026-08-30**.

---

## Producto

- [ ] **Alta de cuentas simple y avanzada, opcional.** Hoy el formulario
      pide todo junto y para cargar la primera cuenta es mucho. La idea es
      un alta corta (firm, tamaño, tipo) y un "avanzado" que despliega el
      resto — drawdown, profit target, fees, fecha de cierre. Ojo con una
      cosa: los campos que quedan sin cargar en el modo simple son los que
      alimentan el drawdown y la salud de la cuenta, así que el modo simple
      tiene que **decir qué se pierde**, no esconderlo.
- [ ] **Completar las reglas solo al elegir la firm.** Elegís Apex y se
      cargan drawdown, profit target y consistencia con los valores de esa
      firm. ⚠️ **Choca con una decisión vieja**: un catálogo de reglas por
      firm está descartado en `CLAUDE.md` por mantenimiento (las firms
      cambian las reglas y una app que te miente sobre tu drawdown es peor
      que una que no sabe). Si se hace, hay que resolver eso primero — la
      salida probable es que sean **valores sugeridos, editables y con
      fecha**, no la verdad de la cuenta.
- [ ] **Diseño de la web con Claude Design.** Pasada de diseño a la app
      entera. Hoy es funcional pero es Tailwind por defecto.
- [ ] **Reglas de la cuenta**: pérdida máxima diaria, días mínimos de
      trading y regla de consistencia (`regla_consistencia` ya existe en la
      tabla desde la 005 y no se usa). Es el único hueco que le puede
      costar una cuenta a alguien. → ROADMAP, Paso 7b.
- [ ] **Retiros con estado** (pedido / cobrado) y **ROI por firm y por
      cuenta**. Los dos son del Funding Manager y entran juntos.
      → ROADMAP, Paso 7c.
- [ ] **Import de CSV de Tradovate** (con previsualización y sin duplicar
      al reimportar) y **export / backup**. El sync por API no se puede:
      las cuentas de prop firm están excluidas del programa.
      → LO-QUE-NOS-FALTA, Parte 2.
- [ ] **Adjuntos en el journal** (capturas de los gráficos). Necesita
      Supabase Storage — bucket, políticas y límite por usuario. Es la
      única parte que puede costar plata si crece.
- [ ] **Modo privacidad**: un botón que borronea los importes. Un booleano
      y una clase de CSS; se agradece cuando abrís la app en cualquier lado.
- [ ] **Datos de ejemplo** para ver el tablero lleno sin cargar nada.
      Resuelve la pantalla vacía del primer día.
- [ ] **Objetivo mensual** de P&L, cargado a mano.
- [ ] **Etiquetas de disciplina por día** (seguí el plan / entrada
      impulsiva / moví el stop / sobreoperé) y el P&L partido por etiqueta.
      Es lo más original que vimos en la competencia y a nivel día no lo
      tiene nadie. Candidata, no decidida.

## Pulido antes de mostrarla

- [ ] Que se vea bien en el celular.
- [ ] Estados vacíos, mensajes de error claros, pantallas de carga.
- [ ] Dominio propio apuntado a Vercel.
- [ ] Términos y privacidad. Hacen falta para cobrar y para publicidad.
- [ ] Invitar 5-10 traders y escuchar qué les falta.

## Deuda técnica

- [ ] **Los textos están escritos adentro de cada componente.** El plan es
      que salgan de `src/i18n/es.ts` para poder agregar inglés, y eso
      debía respetarse desde el principio. Cuanto más se tarde, más caro.
      → ROADMAP, Paso 8b.
- [ ] Selector de idioma con la elección guardada.

## Decisiones a tomar

- [ ] Login con Google además de email.
- [ ] Registro abierto o por invitación.
- [ ] Precio de la suscripción (recién cuando haya usuarios).
- [ ] Cuándo encender la publicidad (el lugar ya está listo).

## Después del MVP

- [ ] PWA, para que se instale desde el navegador.
- [ ] Encender AdSense en los `<AdSlot />` que ya existen.
- [ ] Suscripción con Stripe y separar gratis vs. premium. Lo que ya era
      gratis se queda gratis.
- [ ] Discord con canal para suscriptores.
- [ ] App nativa (React Native + Expo), si la demanda lo justifica.

---

## Hecho

Lo que salió de esta lista, para no volver a proponerlo:

- ~~Sesión de cada operación (Asia / Londres / NY)~~ ✅ 2026-08-30
- ~~Los carruseles se corren solos~~ ✅ 2026-08-30
- ~~Long / short por entrada y estadísticas por lado~~ ✅ 2026-08-27
- ~~Costos fijos~~ ✅ 2026-08-27
- ~~Journal por día~~ ✅ 2026-08-23
- ~~Tono claro y oscuro~~ ✅ 2026-08-22
- ~~Home y calendario mensual~~ ✅ 2026-08-22
