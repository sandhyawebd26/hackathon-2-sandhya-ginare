-- ShiftSense core schema. Tenant isolation is organization-scoped via profiles.

create extension if not exists pgcrypto;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  role text not null check (role in ('owner', 'manager', 'dept_head')),
  full_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.venues (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  venue_type text not null default 'restaurant' check (venue_type in ('restaurant', 'cafe', 'hotel')),
  timezone text not null default 'UTC',
  country_code text not null,
  city text not null default '',
  latitude double precision not null,
  longitude double precision not null,
  capacity integer not null default 40,
  currency text not null default 'USD',
  opening_hour integer not null default 11 check (opening_hour between 0 and 23),
  closing_hour integer not null default 23 check (closing_hour between 1 and 24),
  created_at timestamptz not null default now()
);

create table if not exists public.venue_role_config (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  role text not null,
  metric text not null check (metric in ('covers', 'orders')),
  covers_per_staff_hour numeric not null check (covers_per_staff_hour > 0),
  hourly_cost numeric not null default 0,
  unique (venue_id, role)
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  name text,
  role text not null,
  hourly_cost numeric not null default 0,
  max_weekly_hours numeric not null default 40,
  skills text[] not null default '{}'
);

create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  staff_id uuid references public.staff (id) on delete set null,
  staff_name text,
  role text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'swapped'))
);

create table if not exists public.sales_facts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  ts timestamptz not null,
  channel text not null default 'dine-in',
  covers integer not null default 0,
  order_count integer not null default 0,
  order_value numeric not null default 0
);

create index if not exists sales_facts_venue_ts_idx on public.sales_facts (venue_id, ts);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  slot_start timestamptz not null,
  party_size integer not null check (party_size > 0),
  status text not null default 'confirmed',
  source text,
  created_at timestamptz not null default now()
);

create index if not exists reservations_venue_slot_idx on public.reservations (venue_id, slot_start);

create table if not exists public.external_signals (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  kind text not null check (kind in ('weather', 'holiday', 'event')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  label text not null,
  impact_multiplier numeric not null default 1,
  payload jsonb not null default '{}'::jsonb
);

create index if not exists external_signals_venue_window_idx
  on public.external_signals (venue_id, kind, starts_at);

create table if not exists public.forecasts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  hour_start timestamptz not null,
  metric text not null check (metric in ('covers', 'orders')),
  predicted numeric not null,
  lower numeric not null,
  upper numeric not null,
  model_version text not null,
  drivers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (venue_id, hour_start, metric)
);

create index if not exists forecasts_venue_hour_idx on public.forecasts (venue_id, hour_start);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  hour_start timestamptz not null,
  role text not null,
  required integer not null,
  scheduled integer not null,
  delta integer not null,
  cost_impact numeric not null default 0,
  hourly_cost numeric not null default 0,
  predicted_covers numeric not null default 0,
  reasons jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'edited', 'ignored')),
  created_at timestamptz not null default now(),
  unique (venue_id, hour_start, role)
);

create index if not exists recommendations_venue_hour_idx
  on public.recommendations (venue_id, hour_start);

create table if not exists public.recommendation_actions (
  id uuid primary key default gen_random_uuid(),
  recommendation_id uuid not null references public.recommendations (id) on delete cascade,
  action text not null check (action in ('accepted', 'edited', 'ignored')),
  edited_required integer,
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  severity text not null check (severity in ('high', 'medium', 'low')),
  message text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.import_jobs (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues (id) on delete cascade,
  filename text not null,
  kind text not null check (kind in ('sales', 'reservations')),
  mapping jsonb not null default '{}'::jsonb,
  status text not null,
  row_count integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  storage_path text,
  created_at timestamptz not null default now()
);

create or replace function public.current_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid()
$$;

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.venues enable row level security;
alter table public.venue_role_config enable row level security;
alter table public.staff enable row level security;
alter table public.shifts enable row level security;
alter table public.sales_facts enable row level security;
alter table public.reservations enable row level security;
alter table public.external_signals enable row level security;
alter table public.forecasts enable row level security;
alter table public.recommendations enable row level security;
alter table public.recommendation_actions enable row level security;
alter table public.alerts enable row level security;
alter table public.import_jobs enable row level security;

create policy organizations_member on public.organizations
  for select to authenticated
  using (id = public.current_org_id());

create policy profiles_self on public.profiles
  for select to authenticated
  using (id = auth.uid() or organization_id = public.current_org_id());

create policy venues_member on public.venues
  for all to authenticated
  using (organization_id = public.current_org_id())
  with check (organization_id = public.current_org_id());

create policy role_config_member on public.venue_role_config
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy staff_member on public.staff
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy shifts_member on public.shifts
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy sales_member on public.sales_facts
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy reservations_member on public.reservations
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy signals_member on public.external_signals
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy forecasts_member on public.forecasts
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy recommendations_member on public.recommendations
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy actions_member on public.recommendation_actions
  for all to authenticated
  using (
    recommendation_id in (
      select r.id from public.recommendations r
      join public.venues v on v.id = r.venue_id
      where v.organization_id = public.current_org_id()
    )
  )
  with check (
    recommendation_id in (
      select r.id from public.recommendations r
      join public.venues v on v.id = r.venue_id
      where v.organization_id = public.current_org_id()
    )
  );

create policy alerts_member on public.alerts
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

create policy imports_member on public.import_jobs
  for all to authenticated
  using (venue_id in (select id from public.venues where organization_id = public.current_org_id()))
  with check (venue_id in (select id from public.venues where organization_id = public.current_org_id()));

insert into storage.buckets (id, name, public)
values ('imports', 'imports', false)
on conflict (id) do nothing;

create policy imports_bucket_member on storage.objects
  for all to authenticated
  using (bucket_id = 'imports')
  with check (bucket_id = 'imports');
