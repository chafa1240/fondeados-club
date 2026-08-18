-- Fondeados Club — migración 011 (2026-08-18)
--
-- Paso 5b: resultados diarios. Una fila por día y cuenta con el neto del
-- día, y a partir de acá el balance **deja de cargarse a mano**: pasa a
-- ser balance_semilla + resultados − retiros.
--
--   monto     el neto del día en USD (puede ser negativo)
--   pct       el mismo número en % del tamaño de cuenta (se completa solo)
--   pico_dia  SOLO cuentas trailing: cuánto llegaste a tener arriba dentro
--             del día, como delta desde el balance con el que abriste.
--             NULL = se usa el cierre. Existe porque el trailing intradía
--             de Apex sigue el flotante, no el cierre: sin este dato el
--             colchón queda optimista (ver CLAUDE.md, sección Drawdown).
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

create table if not exists public.resultados_diarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  cuenta_id uuid not null references public.cuentas_fondeo(id) on delete cascade,

  fecha date not null,
  monto numeric not null,
  pct numeric,
  pico_dia numeric,
  notas text,

  created_at timestamptz not null default now()
);

comment on table public.resultados_diarios is
  'Neto de trading por día y cuenta. El balance de la cuenta se deriva de acá.';

-- Un día, una fila por cuenta: si cargás dos veces el mismo día es un
-- error, no dos resultados.
create unique index if not exists idx_resultados_cuenta_fecha
  on public.resultados_diarios(cuenta_id, fecha);

create index if not exists idx_resultados_user_id
  on public.resultados_diarios(user_id);

alter table public.resultados_diarios enable row level security;

drop policy if exists "resultados: select own" on public.resultados_diarios;
create policy "resultados: select own"
  on public.resultados_diarios for select using (auth.uid() = user_id);

drop policy if exists "resultados: insert own" on public.resultados_diarios;
create policy "resultados: insert own"
  on public.resultados_diarios for insert with check (auth.uid() = user_id);

drop policy if exists "resultados: update own" on public.resultados_diarios;
create policy "resultados: update own"
  on public.resultados_diarios for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "resultados: delete own" on public.resultados_diarios;
create policy "resultados: delete own"
  on public.resultados_diarios for delete using (auth.uid() = user_id);

grant select, insert, update, delete
  on public.resultados_diarios to authenticated;

-- ============================================================
-- La semilla: desde dónde arranca a contar el balance
-- ============================================================
--
-- No hace falta cargar la historia completa de cada cuenta. Cada una
-- guarda el balance que tenía en una fecha (la semilla), y de ahí en
-- adelante se suma lo que se vaya cargando.
--
-- Si más adelante cargás días ANTERIORES a esa fecha, no cambian el
-- balance de hoy (ya están dentro de la semilla): sirven para reconstruir
-- la curva hacia atrás.

alter table public.cuentas_fondeo
  add column if not exists balance_semilla numeric,
  add column if not exists fecha_semilla date;

update public.cuentas_fondeo
  set balance_semilla = balance_actual
  where balance_semilla is null;

-- La fecha de hoy para las cuentas que ya existían: el balance que tienen
-- cargado es el de hoy.
update public.cuentas_fondeo
  set fecha_semilla = current_date
  where fecha_semilla is null;

alter table public.cuentas_fondeo
  alter column balance_semilla set not null;
alter table public.cuentas_fondeo
  alter column fecha_semilla set not null;

notify pgrst, 'reload schema';
