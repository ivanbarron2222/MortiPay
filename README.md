# Motorcycle Financing App UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy env template and configure it:
```bash
cp .env.example .env
```

Required Supabase values in `.env`:
```env
VITE_USER_APP_ONLY=false
VITE_USE_SUPABASE=true
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_TENANT_SLUG=demo-shop
```

Optional fallback (old json-server mode):
```env
VITE_USE_SUPABASE=false
VITE_API_BASE_URL=http://localhost:3001
```

## Create Supabase Database

1. Open Supabase SQL Editor.
2. Run [supabase/schema.sql](/c:/Thesis Project/Motorcycle Financing App UI/supabase/schema.sql).
3. Run [supabase/seed.sql](/c:/Thesis Project/Motorcycle Financing App UI/supabase/seed.sql) to add starter accounts.

Default seeded credentials:
- Admin: `admin@motopay.ph` / `admin123`
- User: `juan@example.com` / `juan1234`

## Multi-tenant Notes

- The app now scopes users by tenant/shop.
- `VITE_TENANT_SLUG` selects which shop data is loaded.
- Each shop has isolated user records in `app_users` via `tenant_id`.
- Under the stricter auth/RLS model, tenants are not auto-created during login. New shops must be created through the shop registration flow or inserted explicitly in Supabase.
- Tenant admins can now create pending tenant-user invites and share the `/accept-invite/:token` activation link.

## Implementation Roadmap

- SaaS migration phases and role model: [guidelines/SaaS-Implementation-Phases.md](/c:/Thesis Project/Motorcycle Financing App UI/guidelines/SaaS-Implementation-Phases.md)
  - Includes `Completed`, `In Progress`, and `Remaining` tracking per phase.
  - Includes a dedicated tenant dashboard analytics phase for KPI, collections, risk, and premium-report planning.
  - Includes the freemium feature matrix for `Free` vs `Premium` tenant-admin capabilities.
  - Includes a dedicated tenant-user UX phase for payment clarity, reminders, history, and support improvements.
- QA and verification checklist: [guidelines/QA-Checklist.md](/c:/Thesis Project/Motorcycle Financing App UI/guidelines/QA-Checklist.md)

## Run App

Start frontend:
```bash
npm run dev
```

If using old json-server mode (`VITE_USE_SUPABASE=false`):
```bash
npm run dev:all
```
