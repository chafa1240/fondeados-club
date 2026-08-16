-- Fondeados Club — migración 006 (2026-08-16)
--
-- Fecha en la que la cuenta terminó su ciclo: el día que pasaste la
-- evaluación o el día que se quemó. Se pregunta al cambiar el estado a
-- 'passed' o 'quemada', y se limpia si la cuenta vuelve a estar en juego.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.cuentas_fondeo
  add column if not exists fecha_cierre date;

comment on column public.cuentas_fondeo.fecha_cierre is
  'Día en que la cuenta pasó o se quemó. NULL mientras sigue en juego.';

notify pgrst, 'reload schema';
