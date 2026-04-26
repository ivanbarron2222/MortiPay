-- Development-only bypass for shop registration.
-- Use this when testing signup locally/temporarily and Supabase email confirmation
-- or auth email claims are blocking tenant creation through RLS.
--
-- Do not use this as the final production policy. Re-run supabase/schema.sql
-- before production to restore the stricter owner_email check.

drop policy if exists "Authenticated users create owned tenant" on public.tenants;

create policy "Authenticated users create owned tenant"
  on public.tenants
  for insert
  to authenticated
  with check (
    auth.uid() is not null
  );

create or replace function public.dev_create_tenant_for_registration(
  tenant_slug text,
  tenant_name text,
  tenant_owner_email text
)
returns public.tenants
language plpgsql
security definer
set search_path = public
as $$
declare
  created_tenant public.tenants;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required.';
  end if;

  insert into public.tenants (slug, name, owner_email)
  values (
    trim(tenant_slug),
    trim(tenant_name),
    lower(trim(tenant_owner_email))
  )
  returning *
  into created_tenant;

  return created_tenant;
end;
$$;

grant execute on function public.dev_create_tenant_for_registration(text, text, text)
  to authenticated;

create or replace function public.dev_create_tenant_admin_for_registration(
  target_tenant_id uuid,
  admin_id text,
  admin_full_name text,
  admin_email text,
  admin_phone text
)
returns public.app_users
language plpgsql
security definer
set search_path = public
as $$
declare
  created_admin public.app_users;
begin
  if auth.uid() is null then
    raise exception 'Authenticated user required.';
  end if;

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
    location_tracking
  )
  values (
    target_tenant_id,
    admin_id,
    trim(admin_full_name),
    lower(trim(admin_email)),
    trim(admin_phone),
    auth.uid(),
    '',
    'tenant_admin',
    now(),
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
  into created_admin;

  return created_admin;
end;
$$;

grant execute on function public.dev_create_tenant_admin_for_registration(uuid, text, text, text, text)
  to authenticated;
