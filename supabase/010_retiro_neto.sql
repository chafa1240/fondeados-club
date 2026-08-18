-- Fondeados Club — migración 010 (2026-08-17)
--
-- Un retiro tiene dos montos distintos y hasta ahora se guardaba uno solo:
--
--   monto       lo que SALE de la cuenta (mueve el balance)
--   monto_neto  lo que ENTRA a tu bolsillo (después del profit split)
--
-- Con un split 90/10, un retiro de $1.000 baja el balance $1.000 pero te
-- depositan $900. Guardando un solo número, el "Cobrado" y el ROI del
-- Funding Manager quedaban inflados.
--
-- NULL = cobraste el total (split 100%). Los retiros ya cargados quedan
-- así a propósito: en Apex los primeros USD 25.000 se pagan al 100%, y no
-- hay forma de saber desde acá cuáles ya pasaron ese umbral. Si alguno
-- tuvo split, se corrige a mano desde el Funding Manager.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.payouts
  add column if not exists monto_neto numeric;

comment on column public.payouts.monto_neto is
  'Lo efectivamente cobrado después del profit split. NULL = igual a monto.';

notify pgrst, 'reload schema';
