# Rollout Notes

## Recommended rollout

### Step 1: Spike acceptance

- review the tenant repo schema
- review auth and branding contracts
- review migration blueprint
- confirm the model matches business intent

### Step 2: Internal implementation branch

- port the accepted schema into the real Supabase project
- implement org-aware auth contracts in the production codebase
- add tenant contexts to web and mobile

### Step 3: LoneStar migration

- create tenant `#1`
- backfill current data
- enable org-aware login for LoneStar
- execute the runbook in `docs/lonestar-cutover-checklist.md`

### Step 4: First external tenant onboarding

- create organization
- set branding
- create tenant admins
- verify storage, WhatsApp, and Drive configs
- run isolation and support-access checks

## Storage and integration rollout notes

- each tenant uses storage paths rooted at `organization_id/...`
- signed URL issuance must derive paths from tenant-owned records, not caller-provided raw paths
- Google Drive configuration is one row per tenant in `organization_integrations`
- WhatsApp configuration is one row per tenant in `organization_integrations`
- no background job should run unless its tenant integration row is present and active
- integration secrets remain server-side and are never returned to tenant clients

## Operational guardrails

- no tenant goes live without isolation tests
- no platform operator reads tenant data without a support grant
- all edge functions must require tenant-aware context
- all analytics and export paths must remain tenant-scoped
- production rollout uses a reviewed SQL checklist, not ad-hoc manual queries

## Deferred items

- premium dedicated binaries
- multi-org membership per user
- deeper per-tenant copy or screen customization
- billing and subscription management
