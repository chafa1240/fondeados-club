-- Fondeados Club — migración 002 (2026-08-16)
--
-- Cambios:
--  1. Tipo de cuenta: fondeada | challenge.
--  2. El objetivo de payout pasa a ser dos datos: cuánto querés retirar
--     (objetivo_retiro) y qué balance tiene que marcar la cuenta para
--     poder retirarlo (balance_objetivo). Cambia según la firm.
--  3. Semáforo de salud automático: umbrales editables por cuenta
--     (por defecto 3% saludable / 2% precaución del tamaño de cuenta).
--  4. `estado` guarda solo lo que se decide a mano. Crítico / Precaución /
--     Saludable NO se guardan: se calculan con el balance.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

-- ---------- 1, 2 y 3: columnas nuevas ----------
alter table public.cuentas_fondeo
  add column if not exists tipo text not null default 'fondeada',
  add column if not exists balance_objetivo numeric,
  add column if not exists umbral_saludable_pct numeric not null default 3,
  add column if not exists umbral_saludable_monto numeric,
  add column if not exists umbral_precaucion_pct numeric not null default 2,
  add column if not exists umbral_precaucion_monto numeric;

alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_tipo_check;
alter table public.cuentas_fondeo
  add constraint cuentas_fondeo_tipo_check
  check (tipo in ('fondeada', 'challenge'));

-- objetivo_payout -> objetivo_retiro (solo si todavía no se renombró)
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'cuentas_fondeo'
      and column_name = 'objetivo_payout'
  ) then
    alter table public.cuentas_fondeo
      rename column objetivo_payout to objetivo_retiro;
  end if;
end $$;

-- ---------- 4: estados ----------
-- 'precaucion' y 'funded' ya no se guardan: la salud se calcula sola.
alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_estado_check;

update public.cuentas_fondeo
  set estado = 'activa'
  where estado in ('precaucion', 'funded');

alter table public.cuentas_fondeo
  add constraint cuentas_fondeo_estado_check
  check (estado in ('activa', 'en_curso', 'passed', 'quemada', 'archivada'));

-- ---------- Backfill de los montos de umbral ----------
update public.cuentas_fondeo
  set umbral_saludable_monto = tamano_cuenta * umbral_saludable_pct / 100
  where umbral_saludable_monto is null;

update public.cuentas_fondeo
  set umbral_precaucion_monto = tamano_cuenta * umbral_precaucion_pct / 100
  where umbral_precaucion_monto is null;

notify pgrst, 'reload schema';
