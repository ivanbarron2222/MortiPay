create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_email text not null default '',
  created_at timestamptz not null default now()
);

create unique index if not exists tenants_owner_email_idx
  on public.tenants(owner_email)
  where owner_email <> '';

create table if not exists public.app_users (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  id text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  password text not null,
  role text not null check (role in ('admin', 'user')),
  created_at timestamptz not null default now(),
  loan_profile jsonb null,
  location_tracking jsonb not null default jsonb_build_object(
    'lastHeartbeatAt', null,
    'latitude', null,
    'longitude', null,
    'accuracyMeters', null,
    'locationEnabled', false,
    'permissionState', 'unknown',
    'lastError', null
  ),
  primary key (tenant_id, id),
  unique (tenant_id, email),
  unique (tenant_id, phone)
);

create index if not exists app_users_tenant_role_idx
  on public.app_users(tenant_id, role);
create index if not exists app_users_tenant_created_at_idx
  on public.app_users(tenant_id, created_at desc);

alter table public.tenants enable row level security;
alter table public.app_users enable row level security;

-- Tenants policies
drop policy if exists "Public read tenants" on public.tenants;
create policy "Public read tenants"
  on public.tenants
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert tenants" on public.tenants;
create policy "Public insert tenants"
  on public.tenants
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public update tenants" on public.tenants;
create policy "Public update tenants"
  on public.tenants
  for update
  to anon, authenticated
  using (true)
  with check (true);

-- App users policies
drop policy if exists "Public read app_users" on public.app_users;
create policy "Public read app_users"
  on public.app_users
  for select
  to anon, authenticated
  using (true);

drop policy if exists "Public insert app_users" on public.app_users;
create policy "Public insert app_users"
  on public.app_users
  for insert
  to anon, authenticated
  with check (true);

drop policy if exists "Public update app_users" on public.app_users;
create policy "Public update app_users"
  on public.app_users
  for update
  to anon, authenticated
  using (true)
  with check (true);

drop policy if exists "Public delete app_users" on public.app_users;
create policy "Public delete app_users"
  on public.app_users
  for delete
  to anon, authenticated
  using (true);
