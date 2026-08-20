-- Fondeados Club — migración 012 (2026-08-20)
--
-- Varias entradas por día.
--
-- La 011 puso un índice ÚNICO en (cuenta_id, fecha) con la idea de que un
-- día es un resultado, y el alta era un upsert. En la práctica eso rompe
-- el caso normal: dos trades en la misma jornada. El segundo pisaba al
-- primero y la app avisaba "este día ya tenía un resultado cargado: al
-- guardar se corrige" — que es justo lo contrario de lo que uno quiere.
--
-- Desde acá, cada entrada es una fila. **El día sigue siendo la unidad de
-- cálculo**: el balance, el pico, las rachas y los días ganadores salen de
-- la suma de las entradas de cada día (`agruparPorDia()` en
-- `src/lib/resultados.ts`). Lo que cambia es cómo se carga, no cómo se
-- calcula.
--
-- `pico_dia` (el máximo del día) sigue siendo un dato **del día**, no de
-- la entrada: se mide desde la apertura de la jornada. Lo lleva una sola
-- entrada del día y el resto va en NULL; de eso se encarga
-- `guardarResultado()`.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

drop index if exists public.idx_resultados_cuenta_fecha;

-- El mismo índice, sin el unique: se sigue usando para traer los días de
-- una cuenta en orden, que es la consulta de todas las pantallas.
create index if not exists idx_resultados_cuenta_fecha
  on public.resultados_diarios(cuenta_id, fecha);

comment on column public.resultados_diarios.monto is
  'Lo que dejó esta entrada. El neto del día es la suma de sus entradas.';

comment on column public.resultados_diarios.pico_dia is
  'Máximo del día como delta desde la apertura de la jornada. Es del día, no de la entrada: lo lleva una sola fila por día y el resto va en NULL.';

notify pgrst, 'reload schema';
