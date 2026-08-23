-- Fondeados Club — migración 013 (2026-08-23)
--
-- Paso 7f: el journal, una nota por día.
--
-- **Por qué una tabla nueva y no la columna `notas` de
-- `resultados_diarios`.** Desde la 012 un día puede tener varias
-- entradas, así que esa columna es la nota *de la entrada*, no del día:
-- guardar ahí la reflexión de la jornada obligaría a elegir en cuál de
-- las filas ponerla y a moverla si esa fila se borra. Además el journal
-- tiene que poder existir **sin ningún resultado cargado** — el día que
-- no operaste y querés dejar escrito por qué no operaste es justamente
-- uno de los que vale la pena escribir.
--
-- Es por día y NO por cuenta a propósito: la jornada es una sola aunque
-- hayas operado tres cuentas en paralelo, que es exactamente lo que pasa
-- con las cuentas de Apex copiadas.
--
-- Los adjuntos (capturas de los gráficos) NO entran acá: van en un paso
-- posterior, con Supabase Storage.
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

create table if not exists public.journal_dias (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  fecha date not null,
  notas text not null default '',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.journal_dias is
  'Una nota por día de trading. Del día, no de la cuenta ni de la entrada.';

-- Un día, una nota. El alta es un upsert contra este índice.
create unique index if not exists idx_journal_user_fecha
  on public.journal_dias(user_id, fecha);

alter table public.journal_dias enable row level security;

drop policy if exists "journal: select own" on public.journal_dias;
create policy "journal: select own"
  on public.journal_dias for select using (auth.uid() = user_id);

drop policy if exists "journal: insert own" on public.journal_dias;
create policy "journal: insert own"
  on public.journal_dias for insert with check (auth.uid() = user_id);

drop policy if exists "journal: update own" on public.journal_dias;
create policy "journal: update own"
  on public.journal_dias for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "journal: delete own" on public.journal_dias;
create policy "journal: delete own"
  on public.journal_dias for delete using (auth.uid() = user_id);

-- **Sin esto la tabla existe pero la API no la puede tocar.** El proyecto
-- tiene desactivado "Automatically expose new tables", así que cada tabla
-- nueva nace sin permisos para los roles de la API y toda consulta
-- devuelve "permission denied for table journal_dias". No debilita nada:
-- el permiso es "podés hablarle a la tabla", y qué filas ve cada uno lo
-- sigue decidiendo RLS. Al rol `anon` no se le da nada.
grant select, insert, update, delete
  on public.journal_dias
  to authenticated;

-- El mismo trigger de updated_at que usan las otras tablas.
drop trigger if exists set_updated_at on public.journal_dias;
create trigger set_updated_at
  before update on public.journal_dias
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
