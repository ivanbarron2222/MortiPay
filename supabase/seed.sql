-- ============================================================
-- Platform super admin
-- ============================================================
insert into public.platform_admins (id, full_name, email, password)
values ('SA-001', 'Platform Super Admin', 'superadmin@mortipay.ph', 'super123')
on conflict (id) do update
set
  full_name = excluded.full_name,
  email = excluded.email,
  password = excluded.password;

-- ============================================================
-- Tenant: demo-shop (free plan)
-- ============================================================
insert into public.tenants (
  slug,
  name,
  owner_email,
  status,
  plan,
  requested_plan,
  premium_requested_at
)
values (
  'demo-shop',
  'Demo Shop',
  'admin@motopay.ph',
  'active',
  'free',
  'premium',
  now()
)
on conflict (slug) do update
set
  owner_email = excluded.owner_email,
  status = excluded.status,
  plan = excluded.plan,
  requested_plan = excluded.requested_plan,
  premium_requested_at = excluded.premium_requested_at;

with tenant as (
  select id
  from public.tenants
  where slug = 'demo-shop'
)
insert into public.app_users (
  tenant_id,
  id,
  full_name,
  email,
  phone,
  password,
  role,
  created_at,
  loan_profile
)
select
  tenant.id,
  seeded.id,
  seeded.full_name,
  seeded.email,
  seeded.phone,
  seeded.password,
  seeded.role,
  now(),
  seeded.loan_profile
from tenant
cross join (
  values
    (
      'TA-001',
      'Demo Shop Owner',
      'admin@motopay.ph',
      '+63 900 000 0000',
      'admin123',
      'tenant_admin',
      null::jsonb
    ),
    (
      'TU-001',
      'Juan Dela Cruz',
      'juan@example.com',
      '+63 912 345 6789',
      'juan1234',
      'tenant_user',
      jsonb_build_object(
        'motorcycle', 'Yamaha Mio 125',
        'principalAmount', 65000,
        'downpayment', 15000,
        'annualInterestRate', 12,
        'termMonths', 24,
        'monthlyInstallment', 3520.83,
        'totalPayable', 84500,
        'startDate', now()::text,
        'paidInstallmentNumbers', jsonb_build_array()
      )
    )
) as seeded(id, full_name, email, phone, password, role, loan_profile)
on conflict (tenant_id, email) do update
set
  id = excluded.id,
  full_name = excluded.full_name,
  phone = excluded.phone,
  password = excluded.password,
  role = excluded.role,
  loan_profile = excluded.loan_profile;

with tenant as (
  select id
  from public.tenants
  where slug = 'demo-shop'
)
insert into public.plan_requests (
  tenant_id,
  requested_by_user_id,
  requested_by_email,
  requested_plan,
  status,
  message
)
select
  tenant.id,
  'TA-001',
  'admin@motopay.ph',
  'premium',
  'pending',
  'Requesting premium access for advanced monitoring features.'
from tenant
on conflict do nothing;

-- ============================================================
-- Tenant: wheeltek-sample (premium plan)
-- ============================================================
insert into public.tenants (
  slug,
  name,
  owner_email,
  status,
  plan,
  requested_plan,
  premium_requested_at,
  premium_reviewed_at,
  premium_reviewed_by
)
values (
  'wheeltek-sample',
  'Wheeltek Sample',
  'owner@wheeltek-sample.ph',
  'active',
  'premium',
  null,
  null,
  now(),
  'superadmin@mortipay.ph'
)
on conflict (slug) do update
set
  owner_email = excluded.owner_email,
  status = excluded.status,
  plan = excluded.plan,
  requested_plan = excluded.requested_plan,
  premium_requested_at = excluded.premium_requested_at,
  premium_reviewed_at = excluded.premium_reviewed_at,
  premium_reviewed_by = excluded.premium_reviewed_by;

with tenant as (
  select id
  from public.tenants
  where slug = 'wheeltek-sample'
)
insert into public.app_users (
  tenant_id,
  id,
  full_name,
  email,
  phone,
  password,
  role,
  created_at,
  loan_profile
)
select
  tenant.id,
  seeded.id,
  seeded.full_name,
  seeded.email,
  seeded.phone,
  seeded.password,
  seeded.role,
  now(),
  seeded.loan_profile
from tenant
cross join (
  values
    (
      'TA-001',
      'Wheeltek Owner',
      'owner@wheeltek-sample.ph',
      '+63 917 000 1111',
      'wheeltek123',
      'tenant_admin',
      null::jsonb
    ),
    (
      'TU-001',
      'Maria Santos',
      'maria@example.com',
      '+63 915 111 2222',
      'maria1234',
      'tenant_user',
      jsonb_build_object(
        'motorcycle', 'Honda Beat 110',
        'principalAmount', 72000,
        'downpayment', 12000,
        'annualInterestRate', 12,
        'termMonths', 36,
        'monthlyInstallment', 2333.33,
        'totalPayable', 84000,
        'startDate', now()::text,
        'paidInstallmentNumbers', jsonb_build_array(1, 2, 3)
      )
    )
) as seeded(id, full_name, email, phone, password, role, loan_profile)
on conflict (tenant_id, email) do update
set
  id = excluded.id,
  full_name = excluded.full_name,
  phone = excluded.phone,
  password = excluded.password,
  role = excluded.role,
  loan_profile = excluded.loan_profile;
