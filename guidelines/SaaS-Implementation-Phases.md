# Morti Pay SaaS Implementation Phases

## Objective

Transform the current motorcycle financing app into a B2B SaaS platform with:

- `super admin`
- `tenant admin`
- `tenant users`
- multi-tenant isolation
- free vs premium feature gating
- premium request workflow

## Role Model

### Super Admin

- manages all tenants
- reviews and approves premium requests
- activates, suspends, or updates tenant accounts
- monitors platform-level tenant status

### Tenant Admin

- belongs to one tenant only
- manages that tenant's users
- manages tenant-level settings
- submits premium access requests

### Tenant User

- belongs to one tenant only
- uses tenant-approved app features
- cannot manage tenant settings or tenant accounts

## Core Rules

- `super_admin` is platform-wide and is not restricted to one tenant
- `tenant_admin` and `tenant_user` must always belong to a `tenant_id`
- tenant admins can only view and manage records within their own tenant
- tenant users can only access their own tenant-scoped data
- premium access is request-based, not self-service billing

## Current Status

### Completed

- base SaaS role model is defined
- tenant-aware schema foundation is implemented
- super admin route and dashboard exist
- tenant admin route and tenant-user invite flow exist
- premium request submission and review flow exist
- tenant status blocking exists for tenant routes
- QA checklist documentation exists

### In Progress

- live validation of strict RLS with real accounts
- cleanup of legacy seeded accounts that do not yet have linked auth identities
- broader premium-only feature expansion beyond the first gated module
- dashboard analytics planning and prioritization for tenant admins

### Remaining

- finish real-project QA execution using the checklist
- resolve any account/bootstrap issues found in Supabase
- implement the analytics module in phased increments
- optionally improve production polish such as bundle splitting and UX refinements

## Phase Overview

| Phase | Name | Goal | Status |
|---|---|---|---|
| 0 | Discovery and Baseline | Confirm current architecture and gaps | Completed |
| 1 | SaaS Data Model | Add proper tenant, role, and plan structure | Completed |
| 2 | Authentication and Access Control | Replace demo-style auth with secure role-aware access | In Progress |
| 3 | Tenant Admin Refactor | Reframe current admin as tenant admin | Completed |
| 4 | Super Admin Module | Add super admin dashboard and tenant management | In Progress |
| 5 | Plan Requests and Feature Gating | Add free/premium request flow and access control | In Progress |
| 6 | UX, QA, and Hardening | Validate flows, edge cases, and production readiness | In Progress |
| 7 | Tenant Dashboard Analytics | Add financing, collection, and risk analytics for tenant admins | Planned |
| 8 | Tenant User Experience | Improve payment clarity, reminders, and self-service confidence for tenant users | Planned |

## Phase 0: Discovery and Baseline

### Goal

Document what already exists and what must change.

### Current State Summary

- app already has tenant-aware login input via shop code
- app already has tenant registration flow
- app already has a tenant-scoped `tenants` table
- app already has a tenant-scoped `app_users` table
- current `/admin` module is tenant admin behavior, not super admin behavior
- current auth/session logic is still demo-style and not production-safe
- current row-level security policies are too open for SaaS

### Outcome

- use existing multi-tenant groundwork
- avoid rewriting tenant admin features from scratch
- build super admin as a new layer above current admin behavior

## Phase 1: SaaS Data Model

### Goal

Restructure the database so the role hierarchy and subscription workflow are explicit.

### Deliverables

- extend `tenants` with:
  - `status`
  - `plan`
  - `requested_plan`
  - `premium_requested_at`
  - `premium_reviewed_at`
  - `premium_reviewed_by`
- extend or redesign user records to support:
  - `super_admin`
  - `tenant_admin`
  - `tenant_user`
- add `plan_requests` table
- add `plan_features` or `feature_flags` table
- add audit-friendly timestamps and status fields

### Progress

- added tenant plan and status fields to the schema
- added `platform_admins` table for super admins
- added `plan_requests` table for premium request workflow
- updated seed data for super admin, free tenant, premium tenant, and pending request examples

### Status Breakdown

#### Completed

- tenant subscription fields exist
- super admin table exists
- premium request table exists
- invite table exists

#### In Progress

- optional schema cleanup and future extensibility for more premium features

#### Remaining

- add a dedicated `plan_features` table if feature gating needs to become fully data-driven

### Suggested Tables

- `tenants`
- `users`
- `plan_requests`
- `plan_features`

### Notes

- current `app_users` can be kept, but roles must expand
- `super_admin` records should not be forced into one tenant
- if using one `users` table, `tenant_id` should be nullable only for `super_admin`

### Exit Criteria

- schema supports all three roles
- schema supports premium request flow
- schema supports tenant-level feature access

## Phase 2: Authentication and Access Control

### Goal

Move from demo credentials and broad access to secure role-based auth.

### Deliverables

- replace plain password storage approach
- connect user identity to secure auth flow
- implement role-aware session handling
- enforce tenant isolation through RLS
- restrict super admin access to platform-only routes
- restrict tenant admin and tenant user access by `tenant_id`

### Progress

- added explicit frontend session roles: `super_admin`, `tenant_admin`, `tenant_user`
- added route guards for `/user`, `/admin`, and `/super-admin`
- added super-admin login path by allowing blank shop code for platform access
- added `auth_user_id` support in the schema for `platform_admins` and `app_users`
- active session hydration now resolves from `supabase.auth` during app startup
- shop registration and self-registration now create Supabase auth accounts before saving app records
- added invite-based provisioning for tenant-admin-created tenant users
- tenant invite acceptance now creates the auth account and then creates the tenant-scoped app record
- replaced temporary public RLS with role-aware policy functions tied to `auth.uid()` and tenant membership
- moved public invite lookup to a token-based SQL function instead of broad anonymous table reads
- added legacy account activation flow so older seeded accounts can self-link to Supabase Auth
- strict tenant-isolated RLS is now implemented in schema design; remaining work is validating all live accounts against the new auth-linked model

### Status Breakdown

#### Completed

- authenticated session hydration exists
- role-aware routes exist
- invite acceptance creates auth-backed tenant users
- strict policy structure exists in `schema.sql`

#### In Progress

- validation of all real login cases in the live Supabase project

#### Remaining

- remove any leftover legacy/demo-only account assumptions after QA confirms replacements
- confirm legacy activation works for all seeded account variants in the live project

### Key Risks to Eliminate

- public read/write policies on tenant data
- users being able to switch tenant context manually
- tenant admins seeing data from other tenants

### Exit Criteria

- each role can only access allowed records and routes
- tenant data is isolated in database and UI
- no demo-style direct password matching remains

## Phase 3: Tenant Admin Refactor

### Goal

Convert the current admin module into a proper tenant admin workspace.

### Deliverables

- rename current admin concepts to `tenant admin`
- update route guards for tenant admin only
- keep existing user/loan management under tenant scope
- add tenant profile/settings page
- display current plan and feature access state

### Progress

- current admin data views now target `tenant_user` records instead of generic `user` role names
- route protection now treats `/admin` as tenant-admin-only
- tenant admin now issues pending invites instead of directly assigning passwords to created tenant users

### Status Breakdown

#### Completed

- admin area is functionally a tenant admin workspace
- tenant user provisioning uses invite activation
- tenant plan state is visible in the dashboard

#### In Progress

- additional tenant profile/settings polish

#### Remaining

- expand tenant settings if needed for final thesis/demo scope

### Scope Notes

- current `/admin` area is the base for this phase
- existing user management and loan management can be reused

### Exit Criteria

- tenant admin can manage only their own tenant users
- tenant admin sees current subscription/plan state

## Phase 4: Super Admin Module

### Goal

Create a new platform-level dashboard for managing tenants and tenant admins.

### Deliverables

- new `/super-admin` route group
- super admin dashboard summary cards
- tenant list view
- tenant detail view
- tenant status actions:
  - approve
  - suspend
  - deactivate
  - upgrade to premium
- tenant admin account management

### Progress

- added `/super-admin` route group
- added initial super admin dashboard scaffold
- added tenant and premium-request visibility in the UI
- super admin can now approve or reject premium requests
- super admin can now change tenant status between `pending`, `active`, `suspended`, and `inactive`

### Status Breakdown

#### Completed

- super admin can monitor tenants
- super admin can review premium requests
- super admin can change tenant status

#### In Progress

- deeper tenant detail/management polish

#### Remaining

- add extra tenant management tools only if the final scope needs them

### Main Functions

- view all tenants
- review premium requests
- change tenant plan/status
- monitor active vs suspended tenants

### Exit Criteria

- super admin can manage tenants without entering tenant-only flows
- tenant admins are no longer treated as platform admins

## Phase 5: Plan Requests and Feature Gating

### Goal

Support freemium access with admin-reviewed premium upgrades.

### Deliverables

- feature comparison modal or page
- free vs premium feature matrix
- request premium action for tenant admins
- request review flow for super admin
- per-tenant feature gating in UI and data access layer

### Example Plan Logic

#### Free

- tenant dashboard summary
- create and manage tenant users
- basic loan account management
- installment tracking
- due this week summary
- basic borrower watchlist
- limited reports view
- no exports
- no advanced GPS monitoring
- no aging or forecast analytics

#### Premium

- PDF and Excel report exports
- portfolio aging buckets
- 30/60 day collection forecast
- risk segmentation
- advanced location monitoring
- stale/offline GPS alerts
- premium reports page with full metrics
- advanced borrower analytics
- priority support
- larger reporting/history scope

### Freemium Feature Matrix

| Feature | Free | Premium |
|---|---|---|
| Tenant dashboard summary | Yes | Yes |
| Basic KPI cards | Yes | Yes |
| Create and manage tenant users | Yes | Yes |
| Basic loan account management | Yes | Yes |
| Installment status tracking | Yes | Yes |
| Due this week summary | Yes | Yes |
| Basic borrower watchlist | Yes | Yes |
| Reports page access | Limited preview | Full |
| PDF export | No | Yes |
| Excel export | No | Yes |
| Collection forecast | No | Yes |
| Portfolio aging | No | Yes |
| Risk segmentation | No | Yes |
| Advanced GPS monitoring | No | Yes |
| Stale/offline GPS alerts | No | Yes |
| Premium portfolio insights | No | Yes |
| Priority support access | No | Yes |
| Larger reporting/history scope | No | Yes |

### Product Rule

- `Free` should let a tenant operate the business
- `Premium` should help the tenant optimize, monitor, and report on the business

### Exit Criteria

- tenant admins can request premium
- super admin can approve or reject requests
- UI changes based on tenant plan

### Progress

- tenant admin dashboard now shows current plan state and free vs premium feature sets
- tenant admins can submit premium requests from the sidebar modal
- super admin dashboard can approve or reject premium requests
- tenant plan changes now run through secure SQL functions instead of direct client-side tenant updates
- premium-only gating is active for advanced location monitoring, exports, forecasts, aging, and deeper reports
- free reports now use a shorter preview window while premium unlocks the full reporting scope
- premium support access is now represented in the tenant-admin reports experience

### Status Breakdown

#### Completed

- premium request workflow is implemented
- approval/rejection workflow is implemented
- freemium feature matrix is defined
- premium-only export/report gates are implemented
- larger reporting/history scope is implemented
- priority support access is implemented

#### In Progress

- refining freemium boundaries and polishing premium-only surfaces

#### Remaining

- add more premium-only modules only if stronger differentiation is still needed

## Phase 6: UX, QA, and Hardening

### Goal

Stabilize the platform for final implementation and demonstration.

### Deliverables

- role-based route guards fully tested
- empty-state and unauthorized-state handling
- seed data for:
  - super admin
  - free tenant
  - premium tenant
  - pending-request tenant
- documentation updates
- test checklist for all major flows

### Test Scenarios

- super admin logs in and manages tenants
- tenant admin logs in and manages only their own users
- tenant user cannot access admin routes
- free tenant sees premium upsell
- premium request is submitted and reviewed
- suspended tenant loses restricted access

### Exit Criteria

- all role flows work correctly
- no cross-tenant leakage
- premium request workflow is end-to-end functional

### Progress

- added tenant route hardening so pending, suspended, and inactive tenants are blocked from tenant routes
- added a dedicated QA checklist document for super admin, tenant admin, tenant user, invite flow, premium workflow, and RLS validation
- README now links directly to the QA checklist
- route-level lazy loading and manual vendor chunk splitting are now implemented for frontend optimization

### Status Breakdown

#### Completed

- tenant access blocking by status is implemented
- QA checklist document is in the repo
- roadmap and README documentation are updated
- frontend route-level code splitting is implemented

#### In Progress

- executing the full QA checklist against the live Supabase project
- resolving real-environment issues such as unlinked legacy accounts
- bundle-size and performance polish

#### Remaining

- close out any defects found during QA
- optionally improve bundle size and additional UX polish before final delivery

## Phase 7: Tenant Dashboard Analytics

### Goal

Add dashboard analytics that help tenant admins monitor collections, risk, and portfolio health.

### Deliverables

- top KPI cards for collections and portfolio status
- due and overdue summaries
- monthly collection trend section
- borrower risk/watchlist section
- premium-only analytics expansion for deeper insights

### Analytics Scope

#### Core Analytics

- total receivable
- total collected this month
- overdue amount
- due this week
- active loans
- fully paid loans
- overdue loans
- new loans this month

#### Operational Analytics

- upcoming installment timeline
- overdue trend
- on-time payment rate
- late payment rate
- average days late
- invite acceptance rate

#### Premium Analytics

- delinquency dashboard
- 30/60 day collection forecast
- portfolio aging report
- premium-only risk insights
- exportable reports

### Suggested Implementation Order

1. add KPI summary cards from current tenant loan data
2. add due-this-week and overdue account widgets
3. add monthly collection and payment-performance trends
4. add a borrower risk watchlist
5. expand premium-only analytics beyond the base dashboard

### Progress

- analytics requirements are now documented and prioritized
- first premium dashboard differentiation already exists through locked premium modules
- tenant dashboard now includes KPI cards, collections snapshot, borrower watchlist, and trend analytics
- premium dashboard now includes forecast, aging, and risk-segmentation analytics
- dedicated tenant-admin reports page now exists to reduce dashboard crowding and centralize exports

### Status Breakdown

#### Completed

- analytics phase is defined in the roadmap
- initial premium differentiation exists in the tenant dashboard
- KPI summary cards are implemented
- collections snapshot and borrower watchlist are implemented
- monthly collection trend and due pipeline views are implemented
- premium forecast, aging, and risk segmentation are implemented
- reports navigation is implemented for tenant admins

#### In Progress

- deciding which additional analytics should remain base vs premium
- refining deeper reporting workflows beyond the current PDF and Excel-compatible exports

#### Remaining

- implement KPI cards and supporting calculations
- implement trend and watchlist views
- connect analytics visibility to free vs premium plan access

### Exit Criteria

- tenant admins can see actionable financing analytics on the dashboard
- free vs premium analytics boundaries are clear in the UI
- dashboard analytics support collection monitoring and risk review

## Phase 8: Tenant User Experience

### Goal

Improve the tenant-user experience so borrowers can clearly understand what they owe, when they need to pay, and what actions they should take next.

### Deliverables

- next payment summary card
- installment progress tracker
- payment history timeline
- clearer loan balance and schedule breakdown
- reminder center improvements
- support/contact shortcut
- location permission and last-sync visibility when tracking is enabled

### UX Focus Areas

#### Payment Clarity

- next due date
- amount due
- remaining balance
- current installment status
- maturity date visibility

#### Reminder Experience

- due soon reminders
- overdue alerts
- reminder center with clearer state
- recent payment and reminder activity

#### Loan Visibility

- installment progress
- payment history timeline
- highlighted current installment
- clearer amortization context

#### Confidence and Support

- tenant branding consistency
- support/contact shortcut
- clearer account and loan status chips
- better empty, success, and error states

### Suggested Implementation Order

1. add a next payment card with amount due and due-date status
2. add an installment progress tracker and remaining-balance summary
3. add a payment history timeline with recent installment activity
4. improve the reminder center and overdue messaging
5. add a support/contact shortcut and location-status card where applicable

### Progress

- tenant-user UX improvements are now scoped in the roadmap
- the first recommended implementation slice is defined for payment clarity and reminder visibility
- tenant-user home screen now highlights next payment, loan status, balance, progress, and recent payment activity
- tenant-user loan details now include stronger progress, payment-history timeline, and clearer next-schedule visibility
- reminder center now shows stronger urgency states, upcoming schedule context, and location-status visibility
- support page now includes live account status, clearer contact guidance, and location-monitoring status

### Status Breakdown

#### Completed

- tenant-user UX scope is documented
- implementation order is defined
- next payment summary is implemented
- installment progress and remaining-balance visibility are implemented
- payment history timeline is implemented
- reminder-center improvements are implemented
- support/contact shortcuts are implemented
- location-status visibility is implemented

#### In Progress

- optional tenant-user polish and further mobile refinement

#### Remaining

- add extra tenant-user polish only if the final scope needs it

### Exit Criteria

- tenant users can immediately see what they owe and when it is due
- reminder and overdue states are easy to understand
- loan progress and payment history are easier to review on mobile and desktop

## Implementation Tracker

Use this section to monitor actual progress during development.

| Item | Owner | Status | Notes |
|---|---|---|---|
| Audit current schema and routes | Codex | Completed | Existing tenant base confirmed |
| Define final role model | Team | Completed | `super_admin`, `tenant_admin`, `tenant_user` |
| Redesign Supabase schema | Codex | Completed | Tenant plans, `platform_admins`, `plan_requests`, and invite table are in place |
| Add secure auth flow | Codex | In Progress | Core auth flow exists and legacy activation is implemented; live validation remains |
| Refactor current admin to tenant admin | Codex | Completed | Roles, invites, plan state, and route guards are implemented |
| Build super admin dashboard | Codex | In Progress | Core actions exist; further polish is optional |
| Add premium request workflow | Codex | Completed | Tenant admins can submit and super admins can approve/reject |
| Add feature gating | Codex | In Progress | First premium gate is live; more gates can be added if needed |
| Add QA checklist and seed data | Codex | In Progress | QA checklist added; live execution and optional seed refresh remain |
| Plan tenant dashboard analytics | Codex | Completed | Analytics phase, priorities, and premium split are documented |
| Build tenant dashboard analytics | Codex | In Progress | KPI cards, trends, watchlists, premium insights, reports navigation, and branded PDF/Excel-compatible exports are implemented; deeper export polish remains optional |
| Plan tenant-user UX improvements | Codex | Completed | Phase 8 now defines payment clarity, reminders, history, and support improvements for tenant users |
| Implement tenant-user payment clarity slice | Codex | Completed | Home, loan details, reminders, and support now show next payment, progress, payment history, reminder urgency, support shortcuts, and location status |

## Recommended Next Implementation Step

Start with Phase 1 and Phase 2 together:

1. redesign the schema for roles, plans, and plan requests
2. lock down auth and RLS
3. then refactor routes and dashboards on top of the secure model

This is the correct order because the UI should follow the access model, not define it.
