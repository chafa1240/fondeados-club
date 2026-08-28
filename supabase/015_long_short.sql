-- Fondeados Club — migración 015 (2026-08-27)
--
-- Long o short en cada entrada de `resultados_diarios`.
--
-- Es de la **entrada**, no del día: desde la 012 un día puede tener varias
-- entradas, y un día con una compra y una venta no tiene un solo sentido.
-- Es el primer dato que tenemos sobre *cómo* operás y no solo cuánto —
-- con esto se puede decir cuánto dejó cada lado.
--
-- **Nullable a propósito.** Todo lo cargado hasta hoy no lo tiene, y una
-- entrada puede ser el neto de una jornada mixta, que no es ni long ni
-- short. Las estadísticas cuentan solo las marcadas y dicen cuántas
-- quedaron sin marcar: es preferible a inventarle un lado a un número.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.resultados_diarios
  add column if not exists sentido text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'resultados_diarios_sentido_check'
  ) then
    alter table public.resultados_diarios
      add constraint resultados_diarios_sentido_check
      check (sentido is null or sentido in ('long', 'short'));
  end if;
end $$;

comment on column public.resultados_diarios.sentido is
  'long | short. Null = sin marcar (histórico) o neto de una jornada mixta.';

-- Las estadísticas filtran por sentido dentro de lo que ya se trae por
-- usuario, así que no hace falta índice propio: son decenas de filas por
-- usuario, no millones.

notify pgrst, 'reload schema';
