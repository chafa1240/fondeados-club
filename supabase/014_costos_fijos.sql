-- Fondeados Club — migración 014 (2026-08-27)
--
-- Costos fijos: un gasto que se repite (data feed mensual, plataforma
-- anual, alquiler de un servicio semanal). Se define una sola vez y la app
-- va creando el gasto de cada período.
--
-- **Por qué genera filas en `gastos` y no se deriva al vuelo** (que es lo
-- que hacen el precio de la evaluación y el fee de activación, ver
-- `movimientosDeCuentas`): un costo fijo real no es perfectamente
-- regular. Un mes no lo pagaste, otro te lo cobraron distinto, otro
-- pagaste dos meses juntos. Derivarlo obligaría a que la realidad se
-- ajuste a la fórmula. Generando filas, cada período queda como un gasto
-- normal que se puede editar o borrar de a uno, y el costo fijo es solo
-- la plantilla que los crea.
--
-- La contra de generar filas —dos fuentes para el mismo dato— se
-- resuelve con el índice único de más abajo: un costo fijo no puede
-- generar dos gastos para el mismo período, así que abrir la pantalla
-- veinte veces no duplica nada, y editar el monto del costo fijo NO
-- reescribe lo ya generado (lo viejo es historia, ya pagada).
--
-- Correr en Supabase → SQL Editor. Se puede correr más de una vez.

create table if not exists public.costos_fijos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- null = costo general, no atado a ninguna cuenta (el caso normal:
  -- data feed, plataforma). Igual que en `gastos`.
  cuenta_id uuid references public.cuentas_fondeo(id) on delete set null,

  nombre text not null,
  categoria text not null default 'software_suscripcion'
    check (categoria in ('software_suscripcion', 'otro')),
  monto numeric(12, 2) not null check (monto > 0),

  periodicidad text not null
    check (periodicidad in ('semanal', 'mensual', 'anual')),

  -- Desde cuándo lo pagás: la primera fecha que se genera.
  fecha_inicio date not null,
  -- Hasta cuándo. null = sigue vigente.
  fecha_fin date,

  -- Pausar sin borrar: deja de generar períodos nuevos y conserva los ya
  -- generados. Dar de baja un servicio es lo más común que va a pasar.
  activo boolean not null default true,

  -- Hasta qué período se generó. Es lo que hace que borrar un gasto
  -- generado sea definitivo: la generación arranca *después* de esta
  -- fecha, no desde `fecha_inicio`, así que el mes que borraste a mano
  -- (no lo pagaste) no vuelve a aparecer en la próxima carga.
  -- null = nunca se generó nada todavía.
  ultimo_periodo date,

  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.costos_fijos is
  'Plantilla de un gasto que se repite. Genera una fila en gastos por período.';

alter table public.costos_fijos
  add column if not exists notas text;

-- De qué costo fijo salió cada gasto generado, y de qué período.
-- `periodo` es la fecha teórica del vencimiento; `fecha` en `gastos`
-- arranca igual pero se puede corregir a mano (te lo cobraron el 3 y no
-- el 1) sin que se vuelva a generar.
alter table public.gastos
  add column if not exists costo_fijo_id uuid
    references public.costos_fijos(id) on delete set null;

alter table public.gastos
  add column if not exists periodo date;

-- La red de seguridad de la generación: un costo fijo, un período, un
-- gasto. Aunque dos pestañas abran la pantalla al mismo tiempo, el
-- segundo insert del mismo período choca contra el índice en vez de
-- duplicar el gasto. (Que un período borrado a mano no reviva lo resuelve
-- `ultimo_periodo`, no este índice.)
create unique index if not exists idx_gastos_costo_fijo_periodo
  on public.gastos(costo_fijo_id, periodo)
  where costo_fijo_id is not null;

create index if not exists idx_costos_fijos_user
  on public.costos_fijos(user_id);

alter table public.costos_fijos enable row level security;

drop policy if exists "costos_fijos: select own" on public.costos_fijos;
create policy "costos_fijos: select own"
  on public.costos_fijos for select using (auth.uid() = user_id);

drop policy if exists "costos_fijos: insert own" on public.costos_fijos;
create policy "costos_fijos: insert own"
  on public.costos_fijos for insert with check (auth.uid() = user_id);

drop policy if exists "costos_fijos: update own" on public.costos_fijos;
create policy "costos_fijos: update own"
  on public.costos_fijos for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "costos_fijos: delete own" on public.costos_fijos;
create policy "costos_fijos: delete own"
  on public.costos_fijos for delete using (auth.uid() = user_id);

-- ⚠️ Sin esto la tabla existe, las políticas están bien, y la API igual
-- devuelve "permission denied for table costos_fijos". El proyecto tiene
-- desactivado "Automatically expose new tables". Al rol `anon` nada.
grant select, insert, update, delete
  on public.costos_fijos
  to authenticated;

drop trigger if exists set_updated_at on public.costos_fijos;
create trigger set_updated_at
  before update on public.costos_fijos
  for each row execute function public.set_updated_at();

notify pgrst, 'reload schema';
