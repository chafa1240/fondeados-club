-- Fondeados Club — schema inicial (cuentas_fondeo, gastos, payouts)
-- Pensado para correr en el SQL Editor de Supabase (proyecto fondeados-club)

-- ============================================================
-- CUENTAS_FONDEO
-- ============================================================
create table public.cuentas_fondeo (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  nombre text not null,                  -- ej "PA1", auto-sugerido, editable
  firm text not null,

  tamano_cuenta numeric not null,        -- balance base / account size
  fecha_inicio date not null,

  -- drawdown máximo: se guardan ambos valores (% y $), el usuario puede
  -- editar cualquiera de los dos y la app recalcula el otro usando
  -- tamano_cuenta como referencia (100 * monto / tamano_cuenta = pct)
  drawdown_maximo_pct numeric,
  drawdown_maximo_monto numeric,

  profit_split numeric,                  -- % ej 80.00
  objetivo_payout numeric,               -- $ objetivo para el próximo payout

  estado text not null default 'activa'
    check (estado in ('activa','precaucion','passed','funded','quemada','archivada')),

  balance_actual numeric not null default 0,
  notas text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.cuentas_fondeo is 'Cuentas fondeadas / challenges de prop firms';

-- ============================================================
-- GASTOS
-- ============================================================
create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  -- nullable: permite gastos generales no atados a una cuenta puntual
  -- (ej. software/suscripciones)
  cuenta_id uuid references public.cuentas_fondeo(id) on delete set null,

  categoria text not null
    check (categoria in ('fee_challenge','reset','activacion','software_suscripcion','otro')),

  monto numeric not null,
  fecha date not null default current_date,
  descripcion text,

  created_at timestamptz not null default now()
);

comment on table public.gastos is 'Gastos asociados a cuentas fondeadas (o generales)';

-- ============================================================
-- PAYOUTS
-- ============================================================
create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,

  cuenta_id uuid not null references public.cuentas_fondeo(id) on delete cascade,

  monto numeric not null,
  fecha date not null default current_date,
  notas text,

  created_at timestamptz not null default now()
);

comment on table public.payouts is 'Cobros/payouts recibidos de cuentas funded';

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_cuentas_fondeo_user_id on public.cuentas_fondeo(user_id);
create index idx_gastos_user_id on public.gastos(user_id);
create index idx_gastos_cuenta_id on public.gastos(cuenta_id);
create index idx_payouts_user_id on public.payouts(user_id);
create index idx_payouts_cuenta_id on public.payouts(cuenta_id);

-- ============================================================
-- RLS: cada usuario ve/edita solo lo suyo
-- ============================================================
alter table public.cuentas_fondeo enable row level security;
alter table public.gastos enable row level security;
alter table public.payouts enable row level security;

create policy "cuentas_fondeo: select own"
  on public.cuentas_fondeo for select
  using (auth.uid() = user_id);
create policy "cuentas_fondeo: insert own"
  on public.cuentas_fondeo for insert
  with check (auth.uid() = user_id);
create policy "cuentas_fondeo: update own"
  on public.cuentas_fondeo for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "cuentas_fondeo: delete own"
  on public.cuentas_fondeo for delete
  using (auth.uid() = user_id);

create policy "gastos: select own"
  on public.gastos for select
  using (auth.uid() = user_id);
create policy "gastos: insert own"
  on public.gastos for insert
  with check (auth.uid() = user_id);
create policy "gastos: update own"
  on public.gastos for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "gastos: delete own"
  on public.gastos for delete
  using (auth.uid() = user_id);

create policy "payouts: select own"
  on public.payouts for select
  using (auth.uid() = user_id);
create policy "payouts: insert own"
  on public.payouts for insert
  with check (auth.uid() = user_id);
create policy "payouts: update own"
  on public.payouts for update
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "payouts: delete own"
  on public.payouts for delete
  using (auth.uid() = user_id);

-- ============================================================
-- updated_at automático en cuentas_fondeo
-- ============================================================
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_cuentas_fondeo_updated_at
  before update on public.cuentas_fondeo
  for each row execute function public.set_updated_at();
