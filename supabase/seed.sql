-- ============================================================
-- Tenant: demo-shop (platform demo)
-- ============================================================
insert into public.tenants (slug, name, owner_email)
values ('demo-shop', 'Demo Shop', 'admin@motopay.ph')
on conflict (slug) do update set owner_email = excluded.owner_email;

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
      'ADM-001',
      'System Admin',
      'admin@motopay.ph',
      '+63 900 000 0000',
      'admin123',
      'admin',
      null::jsonb
    ),
    (
      'USR-001',
      'Juan Dela Cruz',
      'juan@example.com',
      '+63 912 345 6789',
      'juan1234',
      'user',
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
on conflict (tenant_id, id) do nothing;

-- ============================================================
-- Tenant: wheeltek-sample (second demo shop — shows multi-tenancy)
-- ============================================================
insert into public.tenants (slug, name, owner_email)
values ('wheeltek-sample', 'Wheeltek Sample', 'owner@wheeltek-sample.ph')
on conflict (slug) do update set owner_email = excluded.owner_email;

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
      'ADM-001',
      'Wheeltek Owner',
      'owner@wheeltek-sample.ph',
      '+63 917 000 1111',
      'wheeltek123',
      'admin',
      null::jsonb
    ),
    (
      'USR-001',
      'Maria Santos',
      'maria@example.com',
      '+63 915 111 2222',
      'maria1234',
      'user',
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
on conflict (tenant_id, id) do nothing;
