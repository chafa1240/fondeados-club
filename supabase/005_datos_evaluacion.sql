-- Fondeados Club — migración 005 (2026-08-16)
--
-- Datos propios de una evaluación, para el dorso de la tarjeta:
--   regla_consistencia   % máximo que puede representar un solo día
--   tipo_drawdown        'trailing' (sigue al pico) | 'eod' (cierre del día)
--   precio               lo que costó la evaluación
--   cantidad_contratos   contratos permitidos
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.cuentas_fondeo
  add column if not exists regla_consistencia numeric,
  add column if not exists tipo_drawdown text,
  add column if not exists precio numeric,
  add column if not exists cantidad_contratos integer;

alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_tipo_drawdown_check;
alter table public.cuentas_fondeo
  add constraint cuentas_fondeo_tipo_drawdown_check
  check (tipo_drawdown is null or tipo_drawdown in ('trailing', 'eod'));

notify pgrst, 'reload schema';
