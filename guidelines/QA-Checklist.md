# Morti Pay SaaS QA Checklist

## Purpose

Use this checklist to verify the multi-tenant SaaS behavior after schema or UI changes.

## Environment Preparation

1. Confirm `.env` points to the intended Supabase project.
2. Run [supabase/schema.sql](/c:/Thesis Project/Motorcycle Financing App UI/supabase/schema.sql) after schema changes.
3. Optionally run [supabase/seed.sql](/c:/Thesis Project/Motorcycle Financing App UI/supabase/seed.sql) if refreshed sample data is needed.
4. Start the app with `npm run dev`.

## Core Role Flows

### Super Admin

- If login fails for an older seeded super admin, use `/activate-account` and complete legacy activation.
- Login with a super admin account using blank shop code.
- Confirm access to `/super-admin`.
- Confirm super admin can view all tenants.
- Confirm super admin can view premium requests.
- Confirm super admin can approve a pending premium request.
- Confirm super admin can reject a pending premium request.
- Confirm super admin can set tenant status to `pending`, `active`, `suspended`, and `inactive`.

### Tenant Admin

- Register a new shop.
- If using an older seeded tenant admin, use `/activate-account` with the tenant shop code and complete legacy activation first.
- Confirm login redirects to `/admin`.
- Confirm tenant admin only sees their own tenant data.
- Confirm tenant admin can create a tenant-user invite.
- Confirm tenant admin cannot access `/super-admin`.
- Confirm tenant admin sees current plan state on the dashboard.
- Confirm a free-plan tenant sees the premium request UI.
- Confirm a premium tenant does not see the free-plan upgrade CTA.

### Tenant User

- Open an invite link from `/accept-invite/:token`.
- Set a password and activate the account.
- Confirm login redirects to `/user`.
- Confirm tenant user cannot access `/admin`.
- Confirm tenant user cannot access `/super-admin`.

## Legacy Account Activation

- Open `/activate-account`.
- Enter the seeded account email and the correct shop code, or leave shop code blank for super admin.
- Confirm the page detects the legacy account.
- Set a new password and activate the account.
- Confirm the activated account can log in through the normal login page afterward.

## Premium Workflow

1. Login as a free-plan tenant admin.
2. Submit a premium request from the tenant admin dashboard.
3. Confirm request status changes to pending.
4. Login as super admin.
5. Approve the premium request.
6. Login again as the same tenant admin.
7. Confirm the tenant plan now shows `premium`.
8. Confirm premium-only monitoring content is now visible.

## Tenant Status Hardening

### Pending Tenant

- Set tenant status to `pending`.
- Confirm `/admin` or `/user` access shows blocked tenant messaging.

### Suspended Tenant

- Set tenant status to `suspended`.
- Confirm `/admin` or `/user` access shows blocked tenant messaging.
- Confirm user cannot continue into tenant routes.

### Inactive Tenant

- Set tenant status to `inactive`.
- Confirm `/admin` or `/user` access shows blocked tenant messaging.

## Invite Flow

- Create a tenant-user invite.
- Confirm the pending invite appears in tenant admin UI.
- Open the invite link before expiration and complete signup.
- Confirm the invite becomes accepted.
- Confirm the new tenant user record exists.
- Confirm duplicate pending invites for the same email are prevented.
- Confirm expired or reused invites are rejected.

## RLS and Isolation Checks

- Confirm tenant admin from tenant A cannot view users from tenant B.
- Confirm tenant user from tenant A cannot view tenant admin data.
- Confirm super admin can view platform-level requests and tenants.
- Confirm public users cannot browse invite rows directly without a valid token path.

## Regression Checks

- Confirm loan details still load for tenant users.
- Confirm reminders still load for tenant users.
- Confirm user account settings still update.
- Confirm location heartbeat updates still work for tenant users.
- Confirm premium request review does not break tenant dashboard rendering.

## Build Verification

- Run `npm run build`.
- Confirm production build completes without TypeScript or bundling errors.

## Completion Criteria

- all three roles can authenticate correctly
- tenant isolation holds in practice
- premium request flow works end to end
- tenant status restrictions are enforced
- invite activation works end to end
