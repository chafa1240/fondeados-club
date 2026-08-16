-- Fondeados Club — migración 007 (2026-08-16)
--
-- Una cuenta no puede cerrarse antes de haber empezado: la fecha en que
-- pasó o se quemó tiene que ser igual o posterior a la de inicio.
-- La app ya lo valida, pero la regla vive también en la base para que no
-- entren datos imposibles por ningún otro camino.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

-- Por las dudas de que ya haya quedado alguna fila mal cargada.
update public.cuentas_fondeo
  set fecha_cierre = null
  where fecha_cierre is not null
    and fecha_cierre < fecha_inicio;

alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_fecha_cierre_check;
alter table public.cuentas_fondeo
  add constraint cuentas_fondeo_fecha_cierre_check
  check (fecha_cierre is null or fecha_cierre >= fecha_inicio);

notify pgrst, 'reload schema';
