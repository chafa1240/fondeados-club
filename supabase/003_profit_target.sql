-- Fondeados Club — migración 003 (2026-08-16)
--
-- Profit target: cuánto hay que ganar para pasar una evaluación.
-- Se carga en % del tamaño de cuenta o en $ (uno completa al otro, igual
-- que el drawdown). En las cuentas fondeadas queda vacío: ahí el objetivo
-- es el retiro, no pasar nada.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.cuentas_fondeo
  add column if not exists profit_target_pct numeric,
  add column if not exists profit_target_monto numeric;

notify pgrst, 'reload schema';
