-- Fondeados Club — migración 004 (2026-08-16)
--
--  1. `retiros_previos`: lo que ya habías retirado de esa cuenta antes de
--     empezar a usar la app. Los retiros nuevos se guardan uno por uno en
--     la tabla `payouts`; este campo es solo el arrastre inicial.
--  2. `fee_activacion`: lo que pagaste para activar la cuenta.
--     NULL = no tuvo fee (en la app se marca con una cruz).
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.cuentas_fondeo
  add column if not exists retiros_previos numeric not null default 0,
  add column if not exists fee_activacion numeric;

notify pgrst, 'reload schema';
