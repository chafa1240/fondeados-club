-- Fondeados Club — migración 008 (2026-08-17)
--
-- Rediseño del drawdown. Antes el piso se calculaba siempre como
-- `tamano_cuenta - drawdown_maximo_monto`: un piso fijo medido desde el
-- balance base. Eso solo sirve para un drawdown estático. En un trailing
-- el piso persigue al pico del balance, y en Apex además se congela (en
-- una cuenta de 50k con 2.500 de DD, al tocar 52.600 el piso queda clavado
-- en 50.100 para siempre). Sin forma de expresarlo, la única manera de que
-- el número diera parecido era cargar el drawdown en 0%.
--
--   modo_drawdown   'estatico' | 'eod' | 'trailing'
--                   Reemplaza a `tipo_drawdown`, que era solo de
--                   evaluaciones. Ojo: EOD **también** trailea; lo que
--                   cambia es qué pico sigue (cierre diario vs. flotante).
--   piso_congelado  Piso final donde el trailing se traba. En Apex,
--                   tamaño + 100. NULL = no se congela nunca.
--   pico_semilla    Balance más alto alcanzado. Con el Paso 5b pasa a ser
--                   solo la semilla (el pico previo a usar la app) y el
--                   resto se deriva de los resultados diarios.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

alter table public.cuentas_fondeo
  add column if not exists modo_drawdown text,
  add column if not exists piso_congelado numeric,
  add column if not exists pico_semilla numeric;

-- Backfill del modo: lo que ya estaba cargado en las evaluaciones se
-- respeta; el resto arranca en trailing, que es lo más común en las firms
-- de futuros (Apex, Topstep). Se elige trailing y no estatico a propósito:
-- una cuenta trailing marcada como estática muestra MÁS colchón del real
-- (te podés quemar creyendo que estabas bien), mientras que al revés el
-- error es pesimista y se nota enseguida.
update public.cuentas_fondeo
  set modo_drawdown = coalesce(tipo_drawdown, 'trailing')
  where modo_drawdown is null;

alter table public.cuentas_fondeo
  alter column modo_drawdown set default 'trailing';
alter table public.cuentas_fondeo
  alter column modo_drawdown set not null;

alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_modo_drawdown_check;
alter table public.cuentas_fondeo
  add constraint cuentas_fondeo_modo_drawdown_check
  check (modo_drawdown in ('estatico', 'eod', 'trailing'));

-- El pico nunca puede ser menor al balance ni al tamaño de cuenta.
update public.cuentas_fondeo
  set pico_semilla = greatest(balance_actual, tamano_cuenta)
  where pico_semilla is null
     or pico_semilla < greatest(balance_actual, tamano_cuenta);

alter table public.cuentas_fondeo
  alter column pico_semilla set not null;

-- Las cuentas cargadas con drawdown en 0% son el parche que esta
-- migración viene a sacar: son fondeadas de Apex ya congeladas, donde el
-- 0% era la única forma de que el piso diera ~el tamaño de cuenta.
-- Se les devuelve el drawdown real (5% del tamaño, el de Apex) y se les
-- pone el piso congelado en tamaño + 100.
--
-- ⚠️ El 5% de acá está MAL: el drawdown de una Apex de 50k es 4% ($2.000).
-- Lo corrige la migración 009. Esta se deja como está porque ya se corrió.
-- Y revisar a mano: si alguna de esas cuentas no era de Apex, hay que
-- corregirle el drawdown desde la app.
update public.cuentas_fondeo
  set drawdown_maximo_pct = 5,
      drawdown_maximo_monto = tamano_cuenta * 0.05,
      modo_drawdown = 'trailing',
      piso_congelado = tamano_cuenta + 100
  where coalesce(drawdown_maximo_monto, 0) = 0
    and tipo = 'fondeada';

-- Ya no hay dos fuentes de verdad para lo mismo.
alter table public.cuentas_fondeo
  drop constraint if exists cuentas_fondeo_tipo_drawdown_check;
alter table public.cuentas_fondeo
  drop column if exists tipo_drawdown;

notify pgrst, 'reload schema';
