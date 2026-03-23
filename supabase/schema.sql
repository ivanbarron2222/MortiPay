create extension if not exists pgcrypto;

create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_email text not null default '',
  status text not null default 'active',
  plan text not null default 'free',
  requested_plan text null,
  premium_requested_at timestamptz null,
  premium_reviewed_at timestamptz null,
  premium_reviewed_by text null,
  created_at timestamptz not null default now(),
  constraint tenants_status_check check (status in ('pending', 'active', 'suspended', 'inactive')),
  constraint tenants_plan_check check (plan in ('free', 'premium')),
  constraint tenants_requested_plan_check check (
    requested_plan is null or requested_plan in ('free', 'premium')
  )
);

alter table public.tenants
  add column if not exists owner_email text not null default '',
  add column if not exists status text not null default 'active',
  add column if not exists plan text not null default 'free',
  add column if not exists requested_plan text null,
  add column if not exists premium_requested_at timestamptz null,
  add column if not exists premium_reviewed_at timestamptz null,
  add column if not exists premium_reviewed_by text null,
  add column if not exists created_at timestamptz not null default now();

update public.tenants
set
  owner_email = coalesce(owner_email, ''),
  status = coalesce(status, 'active'),
  plan = coalesce(plan, 'free')
where
  owner_email is null or
  status is null or
  plan is null;

alter table public.tenants
  drop constraint if exists tenants_status_check;
alter table public.tenants
  add constraint tenants_status_check
  check (status in ('pending', 'active', 'suspended', 'inactive'));

alter table public.tenants
  drop constraint if exists tenants_plan_check;
alter table public.tenants
  add constraint tenants_plan_check
  check (plan in ('free', 'premium'));

alter table public.tenants
  drop constraint if exists tenants_requested_plan_check;
alter table public.tenants
  add constraint tenants_requested_plan_check
  check (requested_plan is null or requested_plan in ('free', 'premium'));

create unique index if not exists tenants_owner_email_idx
  on public.tenants(owner_email)
  where owner_email <> '';

create table if not exists public.platform_admins (
  id text primary key,
  full_name text not null,
  email text not null unique,
  auth_user_id uuid unique,
  password text not null,
  created_at timestamptz not null default now()
);

alter table public.platform_admins
  add column if not exists auth_user_id uuid unique;

create table if not exists public.app_users (
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  id text not null,
  full_name text not null,
  email text not null,
  phone text not null,
  auth_user_id uuid unique,
  password text not null,
  role text not null check (role in ('tenant_admin', 'tenant_user')),
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

alter table public.app_users
  add column if not exists loan_profile jsonb null,
  add column if not exists auth_user_id uuid unique,
  add column if not exists location_tracking jsonb not null default jsonb_build_object(
    'lastHeartbeatAt', null,
    'latitude', null,
    'longitude', null,
    'accuracyMeters', null,
    'locationEnabled', false,
    'permissionState', 'unknown',
    'lastError', null
  );

alter table public.app_users
  drop constraint if exists app_users_role_check;

update public.app_users
set role = case
  when role = 'admin' then 'tenant_admin'
  when role = 'user' then 'tenant_user'
  else role
end
where role in ('admin', 'user');

alter table public.app_users
  add constraint app_users_role_check
  check (role in ('tenant_admin', 'tenant_user'));

create index if not exists app_users_tenant_role_idx
  on public.app_users(tenant_id, role);
create index if not exists app_users_tenant_created_at_idx
  on public.app_users(tenant_id, created_at desc);

create table if not exists public.plan_requests (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  requested_by_user_id text not null,
  requested_by_email text not null,
  requested_plan text not null check (requested_plan in ('premium')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  message text not null default '',
  reviewed_by text null,
  reviewed_at timestamptz null,
  created_at timestamptz not null default now()
);

create index if not exists plan_requests_tenant_created_at_idx
  on public.plan_requests(tenant_id, created_at desc);

create index if not exists plan_requests_status_created_at_idx
  on public.plan_requests(status, created_at desc);

create table if not exists public.tenant_user_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  token text not null unique,
  full_name text not null,
  email text not null,
  phone text not null,
  motorcycle text not null,
  principal_amount numeric not null default 0,
  downpayment numeric not null default 0,
  annual_interest_rate numeric not null default 0,
  term_months integer not null check (term_months in (12, 24, 36, 48)),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  accepted_at timestamptz null,
  created_by_user_id text not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, email, status)
);

create index if not exists tenant_user_invites_tenant_created_at_idx
  on public.tenant_user_invites(tenant_id, created_at desc);

create index if not exists tenant_user_invites_token_idx
  on public.tenant_user_invites(token);

alter table public.tenants enable row level security;
alter table public.platform_admins enable row level security;
alter table public.app_users enable row level security;
alter table public.plan_requests enable row level security;
alter table public.tenant_user_invites enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_admins
    where auth_user_id = auth.uid()
  );
$$;

create or replace function public.current_tenant_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select tenant_id
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role
  from public.app_users
  where auth_user_id = auth.uid()
  limit 1;
$$;

create or replace function public.current_auth_email()
returns text
language sql
stable
as $$
  select lower(coalesce(auth.jwt() ->> 'email', ''));
$$;

create or replace function public.get_public_invite_by_token(invite_token text)
returns setof public.tenant_user_invites
language sql
stable
security definer
set search_path = public
as $$
  select *
  from public.tenant_user_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now();
$$;

create or replace function public.get_legacy_account_for_activation(
  account_email text,
  shop_slug text default null
)
returns table (
  account_role text,
  tenant_slug text,
  display_name text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(trim(shop_slug), '') = '' then
    return query
    select
      'super_admin'::text,
      null::text,
      platform_admins.full_name
    from public.platform_admins
    where lower(platform_admins.email) = lower(trim(account_email))
      and platform_admins.auth_user_id is null
    limit 1;
  else
    return query
    select
      app_users.role::text,
      tenants.slug,
      app_users.full_name
    from public.app_users
    join public.tenants on tenants.id = app_users.tenant_id
    where lower(app_users.email) = lower(trim(account_email))
      and tenants.slug = trim(shop_slug)
      and app_users.auth_user_id is null
    limit 1;
  end if;
end;
$$;

create or replace function public.get_invite_tenant_slug(invite_token text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select tenants.slug
  from public.tenant_user_invites
  join public.tenants on tenants.id = tenant_user_invites.tenant_id
  where tenant_user_invites.token = invite_token
    and tenant_user_invites.status = 'pending'
    and tenant_user_invites.expires_at > now()
  limit 1;
$$;

create or replace function public.activate_legacy_account(
  shop_slug text default null
)
returns table (
  account_role text,
  tenant_slug text
)
language plpgsql
security definer
set search_path = public
as $$
declare
  linked_role text;
  linked_slug text;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required.';
  end if;

  if coalesce(trim(shop_slug), '') = '' then
    update public.platform_admins
    set auth_user_id = auth.uid()
    where lower(email) = public.current_auth_email()
      and auth_user_id is null
    returning 'super_admin'::text, null::text
    into linked_role, linked_slug;
  else
    update public.app_users
    set auth_user_id = auth.uid()
    where lower(email) = public.current_auth_email()
      and auth_user_id is null
      and tenant_id = (
        select id
        from public.tenants
        where slug = trim(shop_slug)
        limit 1
      )
    returning role::text, trim(shop_slug)
    into linked_role, linked_slug;
  end if;

  if linked_role is null then
    raise exception 'Legacy account not found or already activated.';
  end if;

  return query select linked_role, linked_slug;
end;
$$;

create or replace function public.accept_tenant_user_invite(
  invite_token text,
  invite_password text
)
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  target_invite public.tenant_user_invites;
  created_user public.app_users;
  next_suffix integer;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required.';
  end if;

  select *
  into target_invite
  from public.tenant_user_invites
  where token = invite_token
    and status = 'pending'
    and expires_at > now()
  limit 1;

  if target_invite is null then
    raise exception 'Invite not found or no longer active.';
  end if;

  if lower(target_invite.email) <> public.current_auth_email() then
    raise exception 'Authenticated email does not match invite.';
  end if;

  if exists (
    select 1
    from public.app_users
    where tenant_id = target_invite.tenant_id
      and lower(email) = lower(target_invite.email)
  ) then
    raise exception 'An account with this email already exists.';
  end if;

  select count(*) + 1
  into next_suffix
  from public.app_users
  where tenant_id = target_invite.tenant_id
    and role = 'tenant_user';

  insert into public.app_users (
    tenant_id,
    id,
    full_name,
    email,
    phone,
    auth_user_id,
    password,
    role,
    created_at,
    loan_profile,
    location_tracking
  )
  values (
    target_invite.tenant_id,
    'TU-' || lpad(next_suffix::text, 3, '0'),
    target_invite.full_name,
    target_invite.email,
    target_invite.phone,
    auth.uid(),
    invite_password,
    'tenant_user',
    now(),
    jsonb_build_object(
      'loanAccountNumber', 'LN-' || upper(replace(left(target_invite.tenant_id::text, 6), '-', '')) || '-' || lpad(next_suffix::text, 4, '0'),
      'motorcycle', target_invite.motorcycle,
      'principalAmount', target_invite.principal_amount,
      'downpayment', target_invite.downpayment,
      'annualInterestRate', target_invite.annual_interest_rate,
      'termMonths', target_invite.term_months,
      'monthlyInstallment', round(((target_invite.principal_amount + (target_invite.principal_amount * (target_invite.annual_interest_rate / 12 / 100) * target_invite.term_months)) / target_invite.term_months)::numeric, 2),
      'totalPayable', round((target_invite.principal_amount + (target_invite.principal_amount * (target_invite.annual_interest_rate / 12 / 100) * target_invite.term_months))::numeric, 2),
      'startDate', (target_invite.created_at + interval '1 month')::text,
      'paidInstallmentNumbers', jsonb_build_array()
    ),
    jsonb_build_object(
      'lastHeartbeatAt', null,
      'latitude', null,
      'longitude', null,
      'accuracyMeters', null,
      'locationEnabled', false,
      'permissionState', 'unknown',
      'lastError', null
    )
  )
  returning *
  into created_user;

  update public.tenant_user_invites
  set
    status = 'accepted',
    accepted_at = now()
  where id = target_invite.id;

  return created_user;
end;
$$;

create or replace function public.submit_premium_request(request_message text)
returns public.plan_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_record public.app_users;
  created_request public.plan_requests;
begin
  select *
  into current_user_record
  from public.app_users
  where auth_user_id = auth.uid()
    and role = 'tenant_admin'
  limit 1;

  if current_user_record is null then
    raise exception 'Only tenant admins can request premium.';
  end if;

  if exists (
    select 1
    from public.plan_requests
    where tenant_id = current_user_record.tenant_id
      and status = 'pending'
  ) then
    raise exception 'A premium request is already pending for this tenant.';
  end if;

  insert into public.plan_requests (
    tenant_id,
    requested_by_user_id,
    requested_by_email,
    requested_plan,
    status,
    message
  )
  values (
    current_user_record.tenant_id,
    current_user_record.id,
    current_user_record.email,
    'premium',
    'pending',
    coalesce(trim(request_message), '')
  )
  returning *
  into created_request;

  update public.tenants
  set
    requested_plan = 'premium',
    premium_requested_at = now()
  where id = current_user_record.tenant_id;

  return created_request;
end;
$$;

create or replace function public.review_premium_request(
  request_id uuid,
  decision text
)
returns public.plan_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  current_platform_admin public.platform_admins;
  target_request public.plan_requests;
  reviewed_request public.plan_requests;
begin
  if decision not in ('approved', 'rejected') then
    raise exception 'Invalid premium review decision.';
  end if;

  select *
  into current_platform_admin
  from public.platform_admins
  where auth_user_id = auth.uid()
  limit 1;

  if current_platform_admin is null then
    raise exception 'Only platform admins can review premium requests.';
  end if;

  select *
  into target_request
  from public.plan_requests
  where id = request_id
  limit 1;

  if target_request is null then
    raise exception 'Premium request not found.';
  end if;

  update public.plan_requests
  set
    status = decision,
    reviewed_by = current_platform_admin.email,
    reviewed_at = now()
  where id = request_id
  returning *
  into reviewed_request;

  if decision = 'approved' then
    update public.tenants
    set
      plan = 'premium',
      requested_plan = null,
      premium_reviewed_at = now(),
      premium_reviewed_by = current_platform_admin.email
    where id = target_request.tenant_id;
  else
    update public.tenants
    set
      requested_plan = null,
      premium_reviewed_at = now(),
      premium_reviewed_by = current_platform_admin.email
    where id = target_request.tenant_id;
  end if;

  return reviewed_request;
end;
$$;

create or replace function public.update_tenant_status(
  target_tenant_id uuid,
  next_status text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  current_platform_admin public.platform_admins;
  updated_tenant public.tenants;
begin
  if next_status not in ('pending', 'active', 'suspended', 'inactive') then
    raise exception 'Invalid tenant status.';
  end if;

  select *
  into current_platform_admin
  from public.platform_admins
  where auth_user_id = auth.uid()
  limit 1;

  if current_platform_admin is null then
    raise exception 'Only platform admins can update tenant status.';
  end if;

  update public.tenants
  set status = next_status
  where id = target_tenant_id
  returning *
  into updated_tenant;

  if updated_tenant is null then
    raise exception 'Tenant not found.';
  end if;

  return updated_tenant;
end;
$$;

grant execute on function public.get_public_invite_by_token(text) to anon, authenticated;
grant execute on function public.get_legacy_account_for_activation(text, text) to anon, authenticated;
grant execute on function public.get_invite_tenant_slug(text) to anon, authenticated;
grant execute on function public.activate_legacy_account(text) to authenticated;
grant execute on function public.accept_tenant_user_invite(text, text) to authenticated;
grant execute on function public.submit_premium_request(text) to authenticated;
grant execute on function public.review_premium_request(uuid, text) to authenticated;
grant execute on function public.update_tenant_status(uuid, text) to authenticated;

-- Tenants policies
drop policy if exists "Public read tenants" on public.tenants;
drop policy if exists "Public insert tenants" on public.tenants;
drop policy if exists "Public update tenants" on public.tenants;
drop policy if exists "Platform admins view all tenants" on public.tenants;
drop policy if exists "Tenant members view own tenant" on public.tenants;
drop policy if exists "Authenticated users create owned tenant" on public.tenants;
drop policy if exists "Platform admins update all tenants" on public.tenants;
drop policy if exists "Tenant admins update own tenant" on public.tenants;

create policy "Platform admins view all tenants"
  on public.tenants
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or id = public.current_tenant_id()
  );

create policy "Authenticated users create owned tenant"
  on public.tenants
  for insert
  to authenticated
  with check (
    owner_email = public.current_auth_email()
  );

create policy "Platform admins update all tenants"
  on public.tenants
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Platform admins policies
drop policy if exists "Public read platform_admins" on public.platform_admins;
drop policy if exists "Public insert platform_admins" on public.platform_admins;
drop policy if exists "Public update platform_admins" on public.platform_admins;
drop policy if exists "Platform admins view platform admins" on public.platform_admins;
drop policy if exists "Platform admins insert platform admins" on public.platform_admins;
drop policy if exists "Platform admins update platform admins" on public.platform_admins;
drop policy if exists "Users view own platform admin record" on public.platform_admins;

create policy "Platform admins view platform admins"
  on public.platform_admins
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or auth_user_id = auth.uid()
  );

create policy "Platform admins insert platform admins"
  on public.platform_admins
  for insert
  to authenticated
  with check (
    public.is_platform_admin()
    or auth_user_id = auth.uid()
  );

create policy "Platform admins update platform admins"
  on public.platform_admins
  for update
  to authenticated
  using (
    public.is_platform_admin()
    or auth_user_id = auth.uid()
  )
  with check (
    public.is_platform_admin()
    or auth_user_id = auth.uid()
  );

-- App users policies
drop policy if exists "Public read app_users" on public.app_users;
drop policy if exists "Public insert app_users" on public.app_users;
drop policy if exists "Public update app_users" on public.app_users;
drop policy if exists "Public delete app_users" on public.app_users;
drop policy if exists "Platform admins view all app users" on public.app_users;
drop policy if exists "Tenant admins view tenant users" on public.app_users;
drop policy if exists "Tenant users view own user row" on public.app_users;
drop policy if exists "Authenticated users create own app user row" on public.app_users;
drop policy if exists "Tenant admins create tenant users" on public.app_users;
drop policy if exists "Platform admins update all app users" on public.app_users;
drop policy if exists "Tenant admins update tenant users" on public.app_users;
drop policy if exists "Tenant users update own user row" on public.app_users;
drop policy if exists "Platform admins delete app users" on public.app_users;
drop policy if exists "Tenant admins delete tenant users" on public.app_users;

create policy "Platform admins view all app users"
  on public.app_users
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "Tenant admins view tenant users"
  on public.app_users
  for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  );

create policy "Tenant users view own user row"
  on public.app_users
  for select
  to authenticated
  using (
    auth_user_id = auth.uid()
  );

create policy "Authenticated users create own app user row"
  on public.app_users
  for insert
  to authenticated
  with check (
    auth_user_id = auth.uid()
    and (
      public.is_platform_admin()
      or tenant_id = public.current_tenant_id()
      or exists (
        select 1
        from public.tenants
        where id = tenant_id
          and owner_email = public.current_auth_email()
      )
    )
  );

create policy "Platform admins update all app users"
  on public.app_users
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

create policy "Tenant admins update tenant users"
  on public.app_users
  for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  );

create policy "Tenant users update own user row"
  on public.app_users
  for update
  to authenticated
  using (auth_user_id = auth.uid())
  with check (auth_user_id = auth.uid());

create policy "Platform admins delete app users"
  on public.app_users
  for delete
  to authenticated
  using (public.is_platform_admin());

create policy "Tenant admins delete tenant users"
  on public.app_users
  for delete
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
    and role = 'tenant_user'
  );

-- Plan requests policies
drop policy if exists "Public read plan_requests" on public.plan_requests;
drop policy if exists "Public insert plan_requests" on public.plan_requests;
drop policy if exists "Public update plan_requests" on public.plan_requests;
drop policy if exists "Platform admins view plan requests" on public.plan_requests;
drop policy if exists "Tenant admins view own tenant plan requests" on public.plan_requests;
drop policy if exists "Tenant admins create plan requests" on public.plan_requests;
drop policy if exists "Platform admins update plan requests" on public.plan_requests;

create policy "Platform admins view plan requests"
  on public.plan_requests
  for select
  to authenticated
  using (public.is_platform_admin());

create policy "Tenant admins view own tenant plan requests"
  on public.plan_requests
  for select
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  );

create policy "Tenant admins create plan requests"
  on public.plan_requests
  for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
    and requested_by_email = public.current_auth_email()
  );

create policy "Platform admins update plan requests"
  on public.plan_requests
  for update
  to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

-- Tenant user invites policies
drop policy if exists "Public read tenant_user_invites" on public.tenant_user_invites;
drop policy if exists "Public insert tenant_user_invites" on public.tenant_user_invites;
drop policy if exists "Public update tenant_user_invites" on public.tenant_user_invites;
drop policy if exists "Tenant admins and platform admins view invites" on public.tenant_user_invites;
drop policy if exists "Tenant admins view own tenant invites" on public.tenant_user_invites;
drop policy if exists "Tenant admins create invites" on public.tenant_user_invites;
drop policy if exists "Tenant admins update invites" on public.tenant_user_invites;
drop policy if exists "Authenticated users accept matching invite" on public.tenant_user_invites;

create policy "Tenant admins and platform admins view invites"
  on public.tenant_user_invites
  for select
  to authenticated
  using (
    public.is_platform_admin()
    or (
      tenant_id = public.current_tenant_id()
      and public.current_app_role() = 'tenant_admin'
    )
  );

create policy "Tenant admins create invites"
  on public.tenant_user_invites
  for insert
  to authenticated
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
    and created_by_user_id = (
      select id
      from public.app_users
      where auth_user_id = auth.uid()
      limit 1
    )
  );

create policy "Tenant admins update invites"
  on public.tenant_user_invites
  for update
  to authenticated
  using (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  )
  with check (
    tenant_id = public.current_tenant_id()
    and public.current_app_role() = 'tenant_admin'
  );

create policy "Authenticated users accept matching invite"
  on public.tenant_user_invites
  for update
  to authenticated
  using (
    status = 'pending'
    and expires_at > now()
    and lower(email) = public.current_auth_email()
  )
  with check (
    lower(email) = public.current_auth_email()
  );
